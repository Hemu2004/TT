const express = require("express")
const { body, validationResult } = require("express-validator")
const bcrypt = require("bcryptjs")
const User = require("../models/User")
const { auth } = require("../middleware/auth")

const router = express.Router()

// Get current user
router.get("/me", auth, (req, res) => {
  res.json(req.user)
})

// Update profile
router.put(
  "/me",
  auth,
  [
    body("name").optional().trim().isLength({ min: 2, max: 100 }),
    body("bio").optional().isLength({ max: 500 }),
    body("location.city").optional().trim(),
    body("location.country").optional().trim(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const updates = req.body
      const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true })

      res.json(user)
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message })
    }
  },
)

// Change password
router.put(
  "/password",
  auth,
  [body("currentPassword").exists(), body("newPassword").isLength({ min: 6 })],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const { currentPassword, newPassword } = req.body
      const user = await User.findById(req.user._id)

      const isMatch = await user.comparePassword(currentPassword)
      if (!isMatch) {
        return res.status(400).json({ message: "Current password is incorrect" })
      }

      user.passwordHash = newPassword
      await user.save()

      res.json({ message: "Password updated successfully" })
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message })
    }
  },
)

// Get public profile
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-passwordHash -email -flags")
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }
    res.json(user)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

module.exports = router
