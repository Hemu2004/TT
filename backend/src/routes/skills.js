const express = require("express")
const { body, validationResult } = require("express-validator")
const User = require("../models/User")
const { auth } = require("../middleware/auth")

const router = express.Router()

// Get skills (with filters)
router.get("/", async (req, res) => {
  try {
    const { userId, name, category, level, tags } = req.query
    const query = {}

    if (userId) {
      const user = await User.findById(userId).select("skills")
      return res.json(user ? user.skills : [])
    }

    // Build aggregation pipeline for skill search
    const pipeline = [{ $unwind: "$skills" }, { $match: { "flags.banned": false } }]

    if (name) {
      pipeline.push({
        $match: { "skills.name": { $regex: name, $options: "i" } },
      })
    }

    if (category) {
      pipeline.push({
        $match: { "skills.category": category },
      })
    }

    if (level) {
      pipeline.push({
        $match: { "skills.level": Number.parseInt(level) },
      })
    }

    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags]
      pipeline.push({
        $match: { "skills.tags": { $in: tagArray } },
      })
    }

    pipeline.push({
      $project: {
        skill: "$skills",
        user: {
          _id: "$_id",
          name: "$name",
          avatarUrl: "$avatarUrl",
          location: "$location",
        },
      },
    })

    const results = await User.aggregate(pipeline)
    res.json(results)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Add skill
router.post(
  "/",
  auth,
  [
    body("name").trim().isLength({ min: 1, max: 100 }),
    body("category").trim().isLength({ min: 1, max: 50 }),
    body("level").isInt({ min: 1, max: 5 }),
    body("tags").optional().isArray(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const { name, category, level, tags = [] } = req.body

      const user = await User.findById(req.user._id)

      // Check if skill already exists
      const existingSkill = user.skills.find((skill) => skill.name.toLowerCase() === name.toLowerCase())

      if (existingSkill) {
        return res.status(400).json({ message: "Skill already exists" })
      }

      user.skills.push({ name, category, level, tags })
      await user.save()

      res.status(201).json(user.skills[user.skills.length - 1])
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message })
    }
  },
)

// Update skill
router.put(
  "/:skillId",
  auth,
  [
    body("name").optional().trim().isLength({ min: 1, max: 100 }),
    body("category").optional().trim().isLength({ min: 1, max: 50 }),
    body("level").optional().isInt({ min: 1, max: 5 }),
    body("tags").optional().isArray(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const user = await User.findById(req.user._id)
      const skill = user.skills.id(req.params.skillId)

      if (!skill) {
        return res.status(404).json({ message: "Skill not found" })
      }

      Object.assign(skill, req.body)
      await user.save()

      res.json(skill)
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message })
    }
  },
)

// Delete skill
router.delete("/:skillId", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
    const skill = user.skills.id(req.params.skillId)

    if (!skill) {
      return res.status(404).json({ message: "Skill not found" })
    }

    skill.deleteOne()
    await user.save()

    res.json({ message: "Skill deleted successfully" })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

module.exports = router
