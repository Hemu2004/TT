const mongoose = require("mongoose")

const callSessionSchema = new mongoose.Schema(
  {
    exchangeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exchange",
      required: true,
    },
    callerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    calleeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    endedAt: Date,
    durationSec: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["initiated", "in_progress", "ended", "failed"],
      default: "initiated",
    },
  },
  {
    timestamps: true,
  },
)

module.exports = mongoose.model("CallSession", callSessionSchema)
