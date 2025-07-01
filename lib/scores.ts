import { getSupabase } from "./supabase"
import { getCurrentUser } from "./auth"
import type { Score } from "@/app/page"

// Get all scores for the current user
export const getScores = async (): Promise<Score[]> => {
  const user = await getCurrentUser()
  if (!user) return []

  const supabase = getSupabase()
  const { data, error } = await supabase
    .from("scores")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching scores:", error)
    return []
  }

  // Transform the data to match our frontend interface
  return (data || []).map((score: any) => ({
    id: score.id,
    songName: score.song_name,
    difficulty: score.difficulty,
    difficultyRating: score.difficulty_rating,
    score: score.score,
    accuracy: score.accuracy,
    goods: score.goods,
    badsMisses: score.bads_misses,
    date: score.date,
  }))
}

// Add a new score
export const addScore = async (scoreData: Omit<Score, "id" | "date">): Promise<Score> => {
  const user = await getCurrentUser()
  if (!user) throw new Error("User not authenticated")

  const supabase = getSupabase()
  const { data, error } = await supabase
    .from("scores")
    .insert([
      {
        user_id: user.id,
        song_name: scoreData.songName,
        difficulty: scoreData.difficulty,
        difficulty_rating: scoreData.difficultyRating || null,
        score: scoreData.score,
        accuracy: scoreData.accuracy,
        goods: scoreData.goods || null,
        bads_misses: scoreData.badsMisses || null,
        date: new Date().toISOString().split("T")[0],
      },
    ])
    .select()
    .single()

  if (error) throw new Error(error.message)

  return {
    id: data.id,
    songName: data.song_name,
    difficulty: data.difficulty,
    difficultyRating: data.difficulty_rating,
    score: data.score,
    accuracy: data.accuracy,
    goods: data.goods,
    badsMisses: data.bads_misses,
    date: data.date,
  }
}

// Delete a score
export const deleteScore = async (id: string): Promise<void> => {
  const user = await getCurrentUser()
  if (!user) throw new Error("User not authenticated")

  const supabase = getSupabase()
  const { error } = await supabase.from("scores").delete().eq("id", id).eq("user_id", user.id)

  if (error) throw new Error(error.message)
}

// Export scores to JSON
export const exportScores = async (): Promise<string> => {
  const user = await getCurrentUser()
  const scores = await getScores()

  const exportData = {
    user,
    scores,
    exportDate: new Date().toISOString(),
    version: "1.0",
  }

  return JSON.stringify(exportData, null, 2)
}

// Import scores from JSON
export const importScores = async (jsonData: string): Promise<void> => {
  const user = await getCurrentUser()
  if (!user) throw new Error("User not authenticated")

  try {
    const data = JSON.parse(jsonData)
    if (!data.scores || !Array.isArray(data.scores)) {
      throw new Error("Invalid import data: scores not found or not an array")
    }

    const supabase = getSupabase()

    // Insert all scores
    for (const score of data.scores) {
      await supabase.from("scores").insert([
        {
          user_id: user.id,
          song_name: score.songName,
          difficulty: score.difficulty,
          difficulty_rating: score.difficultyRating || null,
          score: score.score,
          accuracy: score.accuracy,
          goods: score.goods || null,
          bads_misses: score.badsMisses || null,
          date: score.date || new Date().toISOString().split("T")[0],
        },
      ])
    }
  } catch (error) {
    console.error("Import error:", error)
    throw new Error("Failed to import data. Please check the file format.")
  }
}
