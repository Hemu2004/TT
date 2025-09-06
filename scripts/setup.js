import fs from "fs"

console.log("🚀 Setting up TalentTrade platform...\n")

// Check if required directories exist
const requiredDirs = ["backend", "frontend", "backend/src", "frontend/src"]
const missingDirs = requiredDirs.filter((dir) => !fs.existsSync(dir))

if (missingDirs.length > 0) {
  console.log("❌ Missing directories:", missingDirs.join(", "))
  console.log("Please ensure you have the complete project structure.\n")
} else {
  console.log("✅ All required directories found\n")
}

// Check for package.json files
const packageFiles = ["package.json", "backend/package.json", "frontend/package.json"]
const existingPackages = packageFiles.filter((file) => fs.existsSync(file))

console.log("📦 Package files found:", existingPackages.length, "/", packageFiles.length)
existingPackages.forEach((file) => console.log("  ✅", file))

// Environment setup instructions
console.log("\n🔧 Environment Setup Required:")
console.log("1. Create backend/.env with:")
console.log("   PORT=5000")
console.log("   MONGO_URI=mongodb://localhost:27017/talenttrade")
console.log("   JWT_SECRET=your_jwt_secret_here")
console.log("   OPENAI_API_KEY=your_openai_key_here")
console.log("   CORS_ORIGIN=http://localhost:3000")

console.log("\n2. Create frontend/.env with:")
console.log("   VITE_API_URL=http://localhost:5000/api")
console.log("   VITE_SOCKET_URL=http://localhost:5000")

console.log("\n🚀 To run the application:")
console.log("1. Install dependencies: npm install")
console.log("2. Start development: npm run dev")
console.log("3. Frontend: http://localhost:3000")
console.log("4. Backend: http://localhost:5000")

console.log("\n✨ TalentTrade setup complete!")
