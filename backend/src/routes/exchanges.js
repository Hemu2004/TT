const express = require("express")
const { body, validationResult } = require("express-validator")
const Exchange = require("../models/Exchange")
const Message = require("../models/Message")
const Notification = require("../models/Notification")
const { auth } = require("../middleware/auth")

const router = express.Router()

// Get user's exchanges
router.get("/", auth, async (req, res) => {
  try {
    const exchanges = await Exchange.find({
      $or: [{ userA: req.user._id }, { userB: req.user._id }],
    })
      .populate("userA", "name avatarUrl")
      .populate("userB", "name avatarUrl")
      .sort({ lastActivityAt: -1 })

    res.json(exchanges)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Get specific exchange
router.get("/:id", auth, async (req, res) => {
  try {
    const exchange = await Exchange.findById(req.params.id)
      .populate("userA", "name avatarUrl")
      .populate("userB", "name avatarUrl")

    if (!exchange) {
      return res.status(404).json({ message: "Exchange not found" })
    }

    // Check if user is part of this exchange
    if (!exchange.userA._id.equals(req.user._id) && !exchange.userB._id.equals(req.user._id)) {
      return res.status(403).json({ message: "Access denied" })
    }

    res.json(exchange)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Create exchange request
router.post(
  "/",
  auth,
  [body("targetUserId").isMongoId(), body("aOffers").isArray(), body("bOffers").isArray()],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const { targetUserId, aOffers, bOffers } = req.body

      if (targetUserId === req.user._id.toString()) {
        return res.status(400).json({ message: "Cannot create exchange with yourself" })
      }

      // Check if exchange already exists
      const existingExchange = await Exchange.findOne({
        $or: [
          { userA: req.user._id, userB: targetUserId },
          { userA: targetUserId, userB: req.user._id },
        ],
        status: { $in: ["pending", "active"] },
      })

      if (existingExchange) {
        return res.status(400).json({ message: "Exchange already exists with this user" })
      }

      const exchange = new Exchange({
        userA: req.user._id,
        userB: targetUserId,
        aOffers,
        bOffers,
      })

      await exchange.save()

      // Create notification for target user
      const notification = new Notification({
        userId: targetUserId,
        type: "request",
        payload: {
          exchangeId: exchange._id,
          fromUser: req.user._id,
          fromUserName: req.user.name,
        },
      })

      await notification.save()

      await exchange.populate("userA userB", "name avatarUrl")
      res.status(201).json(exchange)
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message })
    }
  },
)

// Accept/Decline exchange
router.put("/:id/:action", auth, async (req, res) => {
  try {
    const { id, action } = req.params

    if (!["accept", "decline"].includes(action)) {
      return res.status(400).json({ message: "Invalid action" })
    }

    const exchange = await Exchange.findById(id)
    if (!exchange) {
      return res.status(404).json({ message: "Exchange not found" })
    }

    // Only userB can accept/decline
    if (!exchange.userB.equals(req.user._id)) {
      return res.status(403).json({ message: "Only the recipient can accept or decline" })
    }

    if (exchange.status !== "pending") {
      return res.status(400).json({ message: "Exchange is not pending" })
    }

    exchange.status = action === "accept" ? "active" : "declined"
    exchange.lastActivityAt = new Date()
    await exchange.save()

    // Create notification for userA
    const notification = new Notification({
      userId: exchange.userA,
      type: "accept",
      payload: {
        exchangeId: exchange._id,
        action,
        fromUser: req.user._id,
        fromUserName: req.user.name,
      },
    })

    await notification.save()

    await exchange.populate("userA userB", "name avatarUrl")
    res.json(exchange)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Get exchange messages
router.get("/:id/messages", auth, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query
    const exchange = await Exchange.findById(req.params.id)

    if (!exchange) {
      return res.status(404).json({ message: "Exchange not found" })
    }

    // Check access
    if (!exchange.userA.equals(req.user._id) && !exchange.userB.equals(req.user._id)) {
      return res.status(403).json({ message: "Access denied" })
    }

    const messages = await Message.find({ exchangeId: req.params.id })
      .populate("fromUser", "name avatarUrl")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)

    res.json(messages.reverse())
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Send message
router.post("/:id/messages", auth, [body("body").trim().isLength({ min: 1, max: 1000 })], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const exchange = await Exchange.findById(req.params.id)
    if (!exchange) {
      return res.status(404).json({ message: "Exchange not found" })
    }

    // Check access
    if (!exchange.userA.equals(req.user._id) && !exchange.userB.equals(req.user._id)) {
      return res.status(403).json({ message: "Access denied" })
    }

    if (exchange.status !== "active") {
      return res.status(400).json({ message: "Exchange is not active" })
    }

    const toUser = exchange.userA.equals(req.user._id) ? exchange.userB : exchange.userA

    const message = new Message({
      exchangeId: req.params.id,
      fromUser: req.user._id,
      toUser,
      body: req.body.body,
    })

    await message.save()

    // Update exchange
    exchange.messagesCount += 1
    exchange.lastActivityAt = new Date()
    await exchange.save()

    // Create notification
    const notification = new Notification({
      userId: toUser,
      type: "message",
      payload: {
        exchangeId: req.params.id,
        messageId: message._id,
        fromUser: req.user._id,
        fromUserName: req.user.name,
        preview: req.body.body.substring(0, 100),
      },
    })

    await notification.save()

    await message.populate("fromUser", "name avatarUrl")
    res.status(201).json(message)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

module.exports = router
