import { neon, type NeonQueryFunction } from "@neondatabase/serverless"

// Lazy initialize SQL client to ensure env vars are loaded
let sqlClient: NeonQueryFunction<false, false> | null = null

function getSql(): NeonQueryFunction<false, false> {
  if (!sqlClient) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is not set")
    }
    sqlClient = neon(process.env.DATABASE_URL)
  }
  return sqlClient
}

// User types
export interface User {
  id: string
  email: string
  name: string | null
  created_at: string
}

export interface Session {
  id: string
  user_id: string
  token: string
  expires_at: string
}


// Auth functions
export async function getUserByEmail(email: string): Promise<(User & { password_hash: string }) | null> {
  const sql = getSql()
  const result = await sql`
    SELECT id, email, name, password_hash, created_at
    FROM users
    WHERE email = ${email}
    LIMIT 1
  `
  return result[0] as (User & { password_hash: string }) | null
}

export async function createSession(userId: string, token: string, expiresAt: Date): Promise<Session> {
  const sql = getSql()
  const result = await sql`
    INSERT INTO sessions (user_id, token, expires_at)
    VALUES (${userId}, ${token}, ${expiresAt.toISOString()})
    RETURNING id, user_id, token, expires_at
  `
  return result[0] as Session
}

export async function getSessionByToken(token: string): Promise<(Session & { user: User }) | null> {
  const sql = getSql()
  const result = await sql`
    SELECT 
      s.id,
      s.user_id,
      s.token,
      s.expires_at,
      u.email,
      u.name
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.token = ${token}
      AND s.expires_at > NOW()
    LIMIT 1
  `

  if (!result[0]) return null

  const row = result[0] as any
  return {
    id: row.id,
    user_id: row.user_id,
    token: row.token,
    expires_at: row.expires_at,
    user: {
      id: row.user_id,
      email: row.email,
      name: row.name,
      created_at: row.created_at,
    },
  }
}

export async function deleteSession(token: string): Promise<void> {
  const sql = getSql()
  await sql`DELETE FROM sessions WHERE token = ${token}`
}

// Clean up expired sessions
export async function cleanupExpiredSessions(): Promise<void> {
  const sql = getSql()
  await sql`DELETE FROM sessions WHERE expires_at < NOW()`
}
