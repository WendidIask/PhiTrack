// app/api/song-stats/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    // Get all scores first
    const { data: scores, error: scoresError } = await supabase
      .from("scores")
      .select("*")
      .order("song_name", { ascending: true })

    if (scoresError) {
      console.error("Database error fetching scores:", scoresError)
      return NextResponse.json({ error: "Failed to fetch scores" }, { status: 500 })
    }

    // Get all users separately
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, username")

    if (usersError) {
      console.error("Database error fetching users:", usersError)
      return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
    }

    // Create a user lookup map
    const userMap = new Map<string, string>()
    users?.forEach((user) => {
      userMap.set(user.id, user.username)
    })

    // Group scores by song-difficulty combination and calculate stats
    const songStats: Record<string, any> = {}

    scores?.forEach((score: any) => {
      const key = `${score.song_name}-${score.difficulty}`

      if (!songStats[key]) {
        songStats[key] = []
      }

      // Find existing entry for this song-difficulty
      let existingEntry = songStats[key].find((entry: any) => entry.songName === score.song_name)

      if (!existingEntry) {
        existingEntry = {
          songName: score.song_name,
          difficulty: score.difficulty,
          numberOfPhis: 0,
          averageAccuracy: 0,
          averageScore: 0,
          totalScores: 0,
          _tempScores: [], // Temporary array to store all scores for calculation
        }
        songStats[key].push(existingEntry)
      }

      // Add score to temporary array for calculations
      existingEntry._tempScores.push({
        score: score.score,
        accuracy: score.accuracy,
        userName: userMap.get(score.user_id) || "Unknown User",
        userId: score.user_id,
      })
    })

    // Calculate final statistics for each song-difficulty combination
    Object.values(songStats).forEach((entries: any[]) => {
      entries.forEach((entry: any) => {
        const tempScores = entry._tempScores
        
        if (tempScores.length === 0) return

        // Calculate statistics
        entry.totalScores = tempScores.length
        entry.numberOfPhis = tempScores.filter((s: any) => s.accuracy === 100).length
        
        const totalAccuracy = tempScores.reduce((sum: number, s: any) => sum + s.accuracy, 0)
        entry.averageAccuracy = Math.round((totalAccuracy / tempScores.length) * 100) / 100
        
        const totalScore = tempScores.reduce((sum: number, s: any) => sum + s.score, 0)
        entry.averageScore = Math.round(totalScore / tempScores.length)

        // Remove temporary scores array as it's not needed in the response
        delete entry._tempScores
      })
    })

    return NextResponse.json(songStats)
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}