const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
      minlength: 6,
    },
    avatarUrl: {
      type: String,
      default: "",
    },
    bio: {
      type: String,
      maxlength: 500,
      default: "",
    },
    location: {
      city: String,
      country: String,
      lat: Number,
      lng: Number,
    },
    skills: [
      {
        name: { type: String, required: true },
        category: { type: String, required: true },
        level: { type: Number, min: 1, max: 5, required: true },
        tags: [String],
      },
    ],
    interests: [String],
    availability: {
      days: [{ type: String, enum: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] }],
      timeslots: [String],
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    flags: {
      banned: { type: Boolean, default: false },
      availableToTrade: { type: Boolean, default: true },
    },
    lastActive: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
)

userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.passwordHash)
}

userSchema.pre("save", async function (next) {
  if (!this.isModified("passwordHash")) return next()

  const salt = await bcrypt.genSalt(10)
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt)
  next()
})

// Remove sensitive fields from JSON output
userSchema.methods.toJSON = function () {
  const user = this.toObject()
  delete user.passwordHash
  return user
}

module.exports = mongoose.model("User", userSchema)
