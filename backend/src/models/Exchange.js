const mongoose = require("mongoose")

const exchangeSchema = new mongoose.Schema(
  {
    userA: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userB: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    aOffers: [
      {
        skillName: String,
        category: String,
        level: Number,
      },
    ],
    bOffers: [
      {
        skillName: String,
        category: String,
        level: Number,
      },
    ],
    status: {
      type: String,
      enum: ["pending", "active", "completed", "declined"],
      default: "pending",
    },
    messagesCount: {
      type: Number,
      default: 0,
    },
    lastActivityAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
)

module.exports = mongoose.model("Exchange", exchangeSchema)
