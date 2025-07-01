import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    // Get all scores first
    const { data: scores, error: scoresError } = await supabase
      .from("scores")
      .select("*")
      .order("score", { ascending: false })

    if (scoresError) {
      console.error("Database error fetching scores:", scoresError)
      return NextResponse.json({ error: "Failed to fetch scores" }, { status: 500 })
    }

    // Get all users separately
    const { data: users, error: usersError } = await supabase.from("users").select("id, username")

    if (usersError) {
      console.error("Database error fetching users:", usersError)
      return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
    }

    // Create a user lookup map
    const userMap = new Map<string, string>()
    users?.forEach((user) => {
      userMap.set(user.id, user.username)
    })

    // Group scores by song-difficulty combination
    const leaderboards: Record<string, any> = {}

    scores?.forEach((score: any) => {
      const key = `${score.song_name}-${score.difficulty}`
      const userName = userMap.get(score.user_id) || "Unknown User"

      if (!leaderboards[key]) {
        leaderboards[key] = []
      }

      // Find existing entry for this song-difficulty
      let existingEntry = leaderboards[key].find((entry: any) => entry.songName === score.song_name)

      if (!existingEntry) {
        existingEntry = {
          songName: score.song_name,
          difficulty: score.difficulty,
          highestScore: null,
          highestAccuracy: null,
        }
        leaderboards[key].push(existingEntry)
      }

      // Update highest score
      if (!existingEntry.highestScore || score.score > existingEntry.highestScore.score) {
        existingEntry.highestScore = {
          score: score.score,
          accuracy: score.accuracy,
          userName: userName,
          userId: score.user_id,
        }
      }

      // Update highest accuracy
      if (!existingEntry.highestAccuracy || score.accuracy > existingEntry.highestAccuracy.accuracy) {
        existingEntry.highestAccuracy = {
          score: score.score,
          accuracy: score.accuracy,
          userName: userName,
          userId: score.user_id,
        }
      }
    })

    return NextResponse.json(leaderboards)
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
