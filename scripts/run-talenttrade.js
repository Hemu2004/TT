import { execSync } from "child_process"

console.log("Executing TalentTrade startup script...\n")

try {
  // Run the application startup script
  execSync("node scripts/run-app.js", { stdio: "inherit" })
} catch (error) {
  console.error("Error running startup script:", error.message)
}
