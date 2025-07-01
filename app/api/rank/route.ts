import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

// Calculate RKS for a user's scores
function calculateUserRKS(scores: any[]): number {
  if (scores.length === 0) return 0

  // Get highest accuracy for each unique song-difficulty combination
  const bestScores = new Map<string, any>()

  scores.forEach((score) => {
    const key = `${score.song_name}-${score.difficulty}`
    const existing = bestScores.get(key)

    if (!existing || score.accuracy > existing.accuracy) {
      bestScores.set(key, score)
    }
  })

  // Calculate RKS for each best score
  const rksScores = Array.from(bestScores.values())
    .map((score) => {
      const difficulty = score.difficulty_rating || getDifficultyRating(score.difficulty)
      const rks = score.accuracy < 55 ? 0 : difficulty * Math.pow((100 * score.accuracy - 55) / 45, 2)
      return { ...score, rks }
    })
    .sort((a, b) => b.rks - a.rks)

  // Get top 3 100% accuracy songs
  const perfectScores = rksScores.filter((score) => score.accuracy === 100).slice(0, 3)

  // Get top 27 overall (including the perfect ones)
  const top27 = rksScores.slice(0, 27)

  // Combine and remove duplicates, prioritizing perfect scores
  const finalScores = new Set<string>()
  const scoresToAverage: number[] = []

  // Add perfect scores first
  perfectScores.forEach((score) => {
    const key = `${score.song_name}-${score.difficulty}`
    if (!finalScores.has(key)) {
      finalScores.add(key)
      scoresToAverage.push(score.rks)
    }
  })

  // Add remaining from top 27
  top27.forEach((score) => {
    const key = `${score.song_name}-${score.difficulty}`
    if (!finalScores.has(key) && scoresToAverage.length < 30) {
      finalScores.add(key)
      scoresToAverage.push(score.rks)
    }
  })

  return scoresToAverage.length > 0 ? scoresToAverage.reduce((sum, rks) => sum + rks, 0) / scoresToAverage.length : 0
}

function getDifficultyRating(difficulty: string): number {
  switch (difficulty) {
    case "EZ":
      return 4.0
    case "HD":
      return 8.0
    case "IN":
      return 12.0
    case "AT":
      return 15.0
    default:
      return 8.0
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Get all users with their scores
    const { data: allUsers, error: usersError } = await supabase.from("users").select("id")

    if (usersError) {
      console.error("Database error:", usersError)
      return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
    }

    // Calculate RKS for each user
    const userRKSList: { userId: string; rks: number }[] = []

    for (const user of allUsers || []) {
      const { data: userScores, error: scoresError } = await supabase.from("scores").select("*").eq("user_id", user.id)

      if (scoresError) {
        console.error("Error fetching scores for user:", user.id, scoresError)
        continue
      }

      const rks = calculateUserRKS(userScores || [])
      userRKSList.push({ userId: user.id, rks })
    }

    // Sort by RKS descending
    userRKSList.sort((a, b) => b.rks - a.rks)

    // Find the user's rank
    const userRank = userRKSList.findIndex((user) => user.userId === userId) + 1
    const totalUsers = userRKSList.length

    return NextResponse.json({
      rank: userRank > 0 ? userRank : null,
      totalUsers,
    })
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
