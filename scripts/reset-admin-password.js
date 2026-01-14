import bcrypt from "bcryptjs"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL)

async function resetPassword() {
  const newEmail = "emmanuele.benatti@gmail.com"
  const password = "Gargarozbello!"
  const hash = await bcrypt.hash(password, 10)

  console.log("Setting up user:", newEmail)
  console.log("Generated hash:", hash)

  // First, try to update existing user
  let result = await sql`
    UPDATE users 
    SET password_hash = ${hash}, email = ${newEmail}
    WHERE id = (SELECT id FROM users LIMIT 1)
    RETURNING email
  `

  if (result.length === 0) {
    // No user exists, create one
    result = await sql`
      INSERT INTO users (email, password_hash, name)
      VALUES (${newEmail}, ${hash}, 'Emmanuele')
      RETURNING email
    `
    console.log("Created new user:", result[0])
  } else {
    console.log("Updated user:", result[0])
  }

  // Test the hash
  const testResult = await bcrypt.compare(password, hash)
  console.log("Hash test passed:", testResult)
}

resetPassword().catch(console.error)
