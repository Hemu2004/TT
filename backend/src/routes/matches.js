const express = require("express")
const User = require("../models/User")
const { auth } = require("../middleware/auth")
const { calculateMatches } = require("../services/matchingService")

const router = express.Router()

// Get recommended matches
router.post("/preview", auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id)
    const { limit = 10, excludeIds = [] } = req.body

    // Get potential matches
    const potentialMatches = await User.find({
      _id: { $ne: currentUser._id, $nin: excludeIds },
      "flags.banned": false,
      "flags.availableToTrade": true,
      "skills.0": { $exists: true }, // Has at least one skill
    }).select("-passwordHash -email")

    // Calculate match scores
    const matches = calculateMatches(currentUser, potentialMatches)

    // Sort by score and limit results
    const topMatches = matches.sort((a, b) => b.score - a.score).slice(0, limit)

    res.json(topMatches)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

module.exports = router
