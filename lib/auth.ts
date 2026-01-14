"use server"

import { cookies } from "next/headers"
import { randomBytes } from "crypto"
import bcrypt from "bcryptjs"
import { getUserByEmail, createSession, getSessionByToken, deleteSession } from "./db"

export async function login(email: string, password: string) {
  try {
    const user = await getUserByEmail(email)

    if (!user) {
      return { success: false, error: "Invalid credentials" }
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash)

    if (!isValidPassword) {
      return { success: false, error: "Invalid credentials" }
    }

    const token = randomBytes(32).toString("hex")
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 days

    await createSession(user.id, token, expiresAt)

    const cookieStore = await cookies()
    cookieStore.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return { success: true }
  } catch (error) {
    console.error("Login error:", error)
    return { success: false, error: "An error occurred during login" }
  }
}

export async function logout() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth-token")?.value

    if (token) {
      await deleteSession(token)
    }

    cookieStore.delete("auth-token")
  } catch (error) {
    console.error("Logout error:", error)
  }
}

export async function isAuthenticated() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth-token")?.value

    if (!token) {
      return false
    }

    // Verify session exists in database and hasn't expired
    const session = await getSessionByToken(token)
    return session !== null
  } catch (error) {
    console.error("Auth check error:", error)
    return false
  }
}

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth-token")?.value

    if (!token) {
      return null
    }

    const session = await getSessionByToken(token)
    return session?.user || null
  } catch (error) {
    console.error("Get user error:", error)
    return null
  }
}
