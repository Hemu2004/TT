const jwt = require("jsonwebtoken")
const User = require("../models/User")
const Message = require("../models/Message")
const Exchange = require("../models/Exchange")
const CallSession = require("../models/CallSession")
const { processMessage } = require("../services/chatbotService")

const connectedUsers = new Map()

const setupSocket = (io) => {
  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token
      if (!token) {
        return next(new Error("Authentication error"))
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      const user = await User.findById(decoded.userId).select("-passwordHash")

      if (!user || user.flags.banned) {
        return next(new Error("Authentication error"))
      }

      socket.userId = user._id.toString()
      socket.user = user
      next()
    } catch (error) {
      next(new Error("Authentication error"))
    }
  })

  io.on("connection", (socket) => {
    console.log(`User ${socket.user.name} connected`)

    // Store user connection
    connectedUsers.set(socket.userId, {
      socketId: socket.id,
      user: socket.user,
      lastSeen: new Date(),
    })

    // Join user to their personal room
    socket.join(`user_${socket.userId}`)

    // Broadcast user online status
    socket.broadcast.emit("user:online", {
      userId: socket.userId,
      name: socket.user.name,
    })

    // Handle presence
    socket.on("presence:join", (data) => {
      const { exchangeId } = data
      socket.join(`exchange_${exchangeId}`)
      socket.to(`exchange_${exchangeId}`).emit("presence:user_joined", {
        userId: socket.userId,
        name: socket.user.name,
      })
    })

    socket.on("presence:leave", (data) => {
      const { exchangeId } = data
      socket.leave(`exchange_${exchangeId}`)
      socket.to(`exchange_${exchangeId}`).emit("presence:user_left", {
        userId: socket.userId,
      })
    })

    // Handle messaging
    socket.on("message:send", async (data) => {
      try {
        const { exchangeId, body } = data

        // Verify exchange access
        const exchange = await Exchange.findById(exchangeId)
        if (!exchange || (!exchange.userA.equals(socket.userId) && !exchange.userB.equals(socket.userId))) {
          return socket.emit("error", { message: "Access denied" })
        }

        const toUserId = exchange.userA.equals(socket.userId) ? exchange.userB : exchange.userA

        const message = new Message({
          exchangeId,
          fromUser: socket.userId,
          toUser: toUserId,
          body,
        })

        await message.save()
        await message.populate("fromUser", "name avatarUrl")

        // Update exchange
        exchange.messagesCount += 1
        exchange.lastActivityAt = new Date()
        await exchange.save()

        // Emit to exchange room
        io.to(`exchange_${exchangeId}`).emit("message:new", message)

        // Notify recipient if online
        io.to(`user_${toUserId}`).emit("notification:new", {
          type: "message",
          exchangeId,
          fromUser: socket.user.name,
          preview: body.substring(0, 50),
        })
      } catch (error) {
        socket.emit("error", { message: "Failed to send message" })
      }
    })

    // Handle typing indicators
    socket.on("typing:start", (data) => {
      const { exchangeId } = data
      socket.to(`exchange_${exchangeId}`).emit("typing:user_typing", {
        userId: socket.userId,
        name: socket.user.name,
      })
    })

    socket.on("typing:stop", (data) => {
      const { exchangeId } = data
      socket.to(`exchange_${exchangeId}`).emit("typing:user_stopped", {
        userId: socket.userId,
      })
    })

    // Handle WebRTC signaling
    socket.on("call:initiate", async (data) => {
      try {
        const { exchangeId, targetUserId } = data

        // Verify exchange
        const exchange = await Exchange.findById(exchangeId)
        if (!exchange || exchange.status !== "active") {
          return socket.emit("call:error", { message: "Invalid exchange" })
        }

        // Create call session
        const callSession = new CallSession({
          exchangeId,
          callerId: socket.userId,
          calleeId: targetUserId,
        })
        await callSession.save()

        // Notify target user
        io.to(`user_${targetUserId}`).emit("call:incoming", {
          callId: callSession._id,
          exchangeId,
          caller: {
            id: socket.userId,
            name: socket.user.name,
            avatarUrl: socket.user.avatarUrl,
          },
        })

        socket.emit("call:initiated", { callId: callSession._id })
      } catch (error) {
        socket.emit("call:error", { message: "Failed to initiate call" })
      }
    })

    socket.on("call:accept", async (data) => {
      const { callId } = data

      try {
        const callSession = await CallSession.findById(callId)
        if (!callSession) {
          return socket.emit("call:error", { message: "Call not found" })
        }

        callSession.status = "in_progress"
        await callSession.save()

        // Notify caller
        io.to(`user_${callSession.callerId}`).emit("call:accepted", {
          callId,
          callee: {
            id: socket.userId,
            name: socket.user.name,
          },
        })
      } catch (error) {
        socket.emit("call:error", { message: "Failed to accept call" })
      }
    })

    socket.on("call:decline", async (data) => {
      const { callId } = data

      try {
        const callSession = await CallSession.findByIdAndUpdate(callId, {
          status: "failed",
          endedAt: new Date(),
        })

        if (callSession) {
          io.to(`user_${callSession.callerId}`).emit("call:declined", { callId })
        }
      } catch (error) {
        socket.emit("call:error", { message: "Failed to decline call" })
      }
    })

    // WebRTC signaling events
    socket.on("call:offer", (data) => {
      const { callId, targetUserId, sdp } = data
      io.to(`user_${targetUserId}`).emit("call:offer", { callId, sdp, fromUserId: socket.userId })
    })

    socket.on("call:answer", (data) => {
      const { callId, targetUserId, sdp } = data
      io.to(`user_${targetUserId}`).emit("call:answer", { callId, sdp, fromUserId: socket.userId })
    })

    socket.on("call:ice", (data) => {
      const { callId, targetUserId, candidate } = data
      io.to(`user_${targetUserId}`).emit("call:ice", { callId, candidate, fromUserId: socket.userId })
    })

    socket.on("call:end", async (data) => {
      const { callId, reason = "ended" } = data

      try {
        const callSession = await CallSession.findById(callId)
        if (callSession && callSession.status === "in_progress") {
          const duration = Math.floor((new Date() - callSession.startedAt) / 1000)

          await CallSession.findByIdAndUpdate(callId, {
            status: "ended",
            endedAt: new Date(),
            durationSec: duration,
          })

          // Notify other participant
          const otherUserId = callSession.callerId.equals(socket.userId) ? callSession.calleeId : callSession.callerId

          io.to(`user_${otherUserId}`).emit("call:ended", { callId, reason })
        }
      } catch (error) {
        console.error("Error ending call:", error)
      }
    })

    // Handle chatbot messages
    socket.on("chatbot:message", async (data) => {
      try {
        const { message } = data
        const response = await processMessage(message, socket.userId)

        socket.emit("chatbot:response", {
          message: response.response,
          intent: response.intent,
          confidence: response.confidence,
          timestamp: new Date(),
        })
      } catch (error) {
        socket.emit("chatbot:response", {
          message: "I'm having trouble processing that right now. Please try again later.",
          intent: "error",
          confidence: 0.1,
          timestamp: new Date(),
        })
      }
    })

    // Handle disconnect
    socket.on("disconnect", () => {
      console.log(`User ${socket.user.name} disconnected`)

      connectedUsers.delete(socket.userId)

      // Broadcast user offline status
      socket.broadcast.emit("user:offline", {
        userId: socket.userId,
      })
    })
  })
}

module.exports = setupSocket
