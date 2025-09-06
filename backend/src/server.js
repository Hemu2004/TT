const express = require("express")
const http = require("http")
const socketIo = require("socket.io")
const cors = require("cors")
const helmet = require("helmet")
const morgan = require("morgan")
const cookieParser = require("cookie-parser")
const rateLimit = require("express-rate-limit")
require("dotenv").config()

const connectDB = require("./config/database")
const errorHandler = require("./middleware/errorHandler")
const authRoutes = require("./routes/auth")
const userRoutes = require("./routes/users")
const skillRoutes = require("./routes/skills")
const exchangeRoutes = require("./routes/exchanges")
const matchRoutes = require("./routes/matches")
const notificationRoutes = require("./routes/notifications")
const adminRoutes = require("./routes/admin")
const setupSocket = require("./sockets")

const app = express()
const server = http.createServer(app)

// Connect to MongoDB
connectDB()

// Middleware
app.use(helmet())
app.use(morgan("combined"))
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
  }),
)
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
})
app.use("/api/auth", limiter)

// Routes
app.use("/api/auth", authRoutes)
app.use("/api/users", userRoutes)
app.use("/api/skills", skillRoutes)
app.use("/api/exchanges", exchangeRoutes)
app.use("/api/matches", matchRoutes)
app.use("/api/notifications", notificationRoutes)
app.use("/api/admin", adminRoutes)

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() })
})

// Setup Socket.io
const io = socketIo(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    methods: ["GET", "POST"],
  },
})

setupSocket(io)

// Error handling
app.use(errorHandler)

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ message: "Route not found" })
})

const PORT = process.env.PORT || 5000

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

module.exports = { app, server }
