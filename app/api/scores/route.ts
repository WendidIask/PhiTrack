import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("scores")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to fetch scores" }, { status: 500 })
    }

    // Transform the data to match our frontend interface
    const transformedData = (data || []).map((score: any) => ({
      id: score.id,
      songName: score.song_name,
      difficulty: score.difficulty,
      difficultyRating: score.difficulty_rating,
      score: score.score,
      accuracy: score.accuracy,
      goods: score.goods,
      badsMisses: score.bads_misses,
      date: score.created_at,
    }))

    return NextResponse.json(transformedData)
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, songName, difficulty, difficultyRating, score, accuracy, goods, badsMisses } = body

    if (!userId || !songName || !difficulty || score === undefined || accuracy === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const scoreData = {
      user_id: userId,
      song_name: songName,
      difficulty: difficulty,
      difficulty_rating: difficultyRating || null,
      score: score,
      accuracy: accuracy,
      goods: goods || null,
      bads_misses: badsMisses || null,
      created_at: new Date().toISOString().split("T")[0],
    }

    const { data, error } = await supabase.from("scores").insert([scoreData]).select().single()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to add score" }, { status: 500 })
    }

    // Transform the response to match our frontend interface
    const transformedData = {
      id: data.id,
      songName: data.song_name,
      difficulty: data.difficulty,
      difficultyRating: data.difficulty_rating,
      score: data.score,
      accuracy: data.accuracy,
      goods: data.goods,
      badsMisses: data.bads_misses,
      date: data.created_at,
    }

    return NextResponse.json(transformedData)
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
