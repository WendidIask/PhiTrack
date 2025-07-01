import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { createHash } from "crypto"

// Simple password hashing function
function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex")
}

export async function POST(request: NextRequest) {
  try {
    const { identifier, password } = await request.json()

    if (!identifier || !password) {
      return NextResponse.json({ error: "Username/email and password are required" }, { status: 400 })
    }

    const hashedPassword = hashPassword(password)

    // Check if user exists by username or email
    const { data: existingUsers, error: fetchError } = await supabase
      .from("users")
      .select("*")
      .or(`username.eq.${identifier},email.eq.${identifier.toLowerCase()}`)
      .limit(1)

    if (fetchError) {
      console.error("Database error:", fetchError)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    if (existingUsers && existingUsers.length > 0) {
      // User exists, verify password
      const user = existingUsers[0]
      if (user.password_hash !== hashedPassword) {
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
      }

      return NextResponse.json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
        },
      })
    } else {
      return NextResponse.json({ error: "User not found. Please register first." }, { status: 404 })
    }
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
