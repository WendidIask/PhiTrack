import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { createHash } from "crypto"

// Simple password hashing function
function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex")
}

// Validate username format
function isValidUsername(username: string): boolean {
  // Username must be 3-20 characters, alphanumeric and underscores only
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/
  return usernameRegex.test(username)
}

export async function POST(request: NextRequest) {
  try {
    const { email, password, username } = await request.json()

    if (!email || !password || !username) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters long" }, { status: 400 })
    }

    if (!isValidUsername(username)) {
      return NextResponse.json(
        {
          error: "Username must be 3-20 characters long and contain only letters, numbers, and underscores",
        },
        { status: 400 },
      )
    }

    const hashedPassword = hashPassword(password)

    // Check if user already exists by email or username
    const { data: existingUsers, error: fetchError } = await supabase
      .from("users")
      .select("email, username")
      .or(`email.eq.${email.toLowerCase()},username.eq.${username}`)
      .limit(1)

    if (fetchError) {
      console.error("Database error:", fetchError)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    if (existingUsers && existingUsers.length > 0) {
      const existingUser = existingUsers[0]
      if (existingUser.email.toLowerCase() === email.toLowerCase()) {
        return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 })
      }
      if (existingUser.username === username) {
        return NextResponse.json({ error: "This username is already taken" }, { status: 409 })
      }
    }

    // Create new user
    const { data: newUser, error: insertError } = await supabase
      .from("users")
      .insert([
        {
          email: email.toLowerCase(),
          username: username,
          password_hash: hashedPassword,
        },
      ])
      .select()
      .single()

    if (insertError) {
      console.error("Insert error:", insertError)
      if (insertError.code === "23505") {
        // Unique constraint violation
        if (insertError.message.includes("username")) {
          return NextResponse.json({ error: "This username is already taken" }, { status: 409 })
        }
        if (insertError.message.includes("email")) {
          return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 })
        }
      }
      return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
    }

    return NextResponse.json({
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
      },
    })
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
