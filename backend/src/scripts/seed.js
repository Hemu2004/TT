const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")
require("dotenv").config()

const User = require("../models/User")
const Exchange = require("../models/Exchange")

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI)
    console.log("MongoDB Connected for seeding")
  } catch (error) {
    console.error("Database connection error:", error)
    process.exit(1)
  }
}

const seedData = async () => {
  try {
    // Clear existing data
    await User.deleteMany({})
    await Exchange.deleteMany({})

    console.log("Cleared existing data")

    // Create demo users
    const users = [
      {
        name: "Alice Johnson",
        email: "alice@example.com",
        passwordHash: "password123",
        bio: "Full-stack developer passionate about teaching and learning new technologies.",
        location: { city: "San Francisco", country: "USA", lat: 37.7749, lng: -122.4194 },
        skills: [
          { name: "React", category: "Frontend", level: 5, tags: ["javascript", "web"] },
          { name: "Node.js", category: "Backend", level: 4, tags: ["javascript", "server"] },
          { name: "Python", category: "Programming", level: 3, tags: ["programming", "data"] },
        ],
        interests: ["Machine Learning", "UI/UX Design", "Mobile Development"],
        availability: {
          days: ["monday", "wednesday", "friday"],
          timeslots: ["morning", "evening"],
        },
      },
      {
        name: "Bob Smith",
        email: "bob@example.com",
        passwordHash: "password123",
        bio: "Data scientist and machine learning enthusiast. Love sharing knowledge about AI.",
        location: { city: "New York", country: "USA", lat: 40.7128, lng: -74.006 },
        skills: [
          { name: "Machine Learning", category: "AI", level: 5, tags: ["python", "ai", "data"] },
          { name: "Python", category: "Programming", level: 5, tags: ["programming", "data"] },
          { name: "Data Analysis", category: "Analytics", level: 4, tags: ["data", "statistics"] },
        ],
        interests: ["React", "Mobile Development", "Cloud Computing"],
        availability: {
          days: ["tuesday", "thursday", "saturday"],
          timeslots: ["afternoon", "evening"],
        },
      },
      {
        name: "Carol Davis",
        email: "carol@example.com",
        passwordHash: "password123",
        bio: "UI/UX designer with a passion for creating beautiful and functional interfaces.",
        location: { city: "Los Angeles", country: "USA", lat: 34.0522, lng: -118.2437 },
        skills: [
          { name: "UI/UX Design", category: "Design", level: 5, tags: ["design", "user-experience"] },
          { name: "Figma", category: "Design Tools", level: 4, tags: ["design", "prototyping"] },
          { name: "Adobe Creative Suite", category: "Design Tools", level: 4, tags: ["design", "graphics"] },
        ],
        interests: ["Frontend Development", "Animation", "Branding"],
        availability: {
          days: ["monday", "tuesday", "wednesday", "thursday"],
          timeslots: ["morning", "afternoon"],
        },
      },
      {
        name: "David Wilson",
        email: "david@example.com",
        passwordHash: "password123",
        bio: "Mobile app developer specializing in React Native and Flutter.",
        location: { city: "Austin", country: "USA", lat: 30.2672, lng: -97.7431 },
        skills: [
          { name: "React Native", category: "Mobile", level: 5, tags: ["mobile", "react", "javascript"] },
          { name: "Flutter", category: "Mobile", level: 4, tags: ["mobile", "dart"] },
          { name: "Mobile Development", category: "Mobile", level: 5, tags: ["mobile", "apps"] },
        ],
        interests: ["Backend Development", "Cloud Computing", "DevOps"],
        availability: {
          days: ["wednesday", "friday", "saturday", "sunday"],
          timeslots: ["morning", "evening"],
        },
      },
      {
        name: "Admin User",
        email: "admin@talenttrade.com",
        passwordHash: "admin123",
        bio: "Platform administrator",
        role: "admin",
        skills: [],
        interests: [],
        availability: { days: [], timeslots: [] },
      },
    ]

    const createdUsers = []
    for (const userData of users) {
      const user = new User(userData)
      await user.save()
      createdUsers.push(user)
    }

    console.log("Created demo users")

    // Create a sample exchange
    const exchange = new Exchange({
      userA: createdUsers[0]._id, // Alice
      userB: createdUsers[1]._id, // Bob
      aOffers: [
        { skillName: "React", category: "Frontend", level: 5 },
        { skillName: "Node.js", category: "Backend", level: 4 },
      ],
      bOffers: [
        { skillName: "Machine Learning", category: "AI", level: 5 },
        { skillName: "Python", category: "Programming", level: 5 },
      ],
      status: "active",
    })

    await exchange.save()
    console.log("Created sample exchange")

    console.log("\n=== SEED DATA CREATED ===")
    console.log("Demo Users:")
    createdUsers.forEach((user) => {
      console.log(`- ${user.name} (${user.email}) - Role: ${user.role}`)
    })
    console.log("\nDemo Exchange:")
    console.log(`- Alice ↔ Bob (Active exchange)`)
    console.log("\nDefault password for all users: password123")
    console.log("Admin password: admin123")
  } catch (error) {
    console.error("Seeding error:", error)
  } finally {
    mongoose.connection.close()
  }
}

const run = async () => {
  await connectDB()
  await seedData()
}

run()
