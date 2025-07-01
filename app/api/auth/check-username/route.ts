import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json()

    if (!username) {
      return NextResponse.json({ error: "Username is required" }, { status: 400 })
    }

    // Check if username exists
    const { data: existingUsers, error: fetchError } = await supabase
      .from("users")
      .select("username")
      .eq("username", username)
      .limit(1)

    if (fetchError) {
      console.error("Database error:", fetchError)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    const isAvailable = !existingUsers || existingUsers.length === 0

    return NextResponse.json({ available: isAvailable })
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
