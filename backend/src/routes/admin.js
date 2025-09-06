const express = require("express")
const User = require("../models/User")
const Exchange = require("../models/Exchange")
const CallSession = require("../models/CallSession")
const { adminAuth } = require("../middleware/auth")

const router = express.Router()

// Get metrics
router.get("/metrics", adminAuth, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments()
    const activeUsers = await User.countDocuments({
      lastActive: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    })
    const totalExchanges = await Exchange.countDocuments()
    const activeExchanges = await Exchange.countDocuments({ status: "active" })
    const totalCalls = await CallSession.countDocuments()
    const completedCalls = await CallSession.countDocuments({ status: "ended" })

    res.json({
      users: { total: totalUsers, active: activeUsers },
      exchanges: { total: totalExchanges, active: activeExchanges },
      calls: { total: totalCalls, completed: completedCalls },
    })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Get users
router.get("/users", adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query
    let query = {}

    if (search) {
      query = {
        $or: [{ name: { $regex: search, $options: "i" } }, { email: { $regex: search, $options: "i" } }],
      }
    }

    const users = await User.find(query)
      .select("-passwordHash")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)

    const total = await User.countDocuments(query)

    res.json({ users, total, pages: Math.ceil(total / limit) })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Ban/Unban user
router.put("/users/:id/:action", adminAuth, async (req, res) => {
  try {
    const { id, action } = req.params

    if (!["ban", "unban"].includes(action)) {
      return res.status(400).json({ message: "Invalid action" })
    }

    const user = await User.findByIdAndUpdate(id, { "flags.banned": action === "ban" }, { new: true }).select(
      "-passwordHash",
    )

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    res.json(user)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

module.exports = router
