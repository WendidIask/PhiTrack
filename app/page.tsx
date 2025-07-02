"use client"

import { useState, useEffect } from "react"
import { Plus, Trophy, TrendingUp, Music, Music2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AddScoreDialog } from "@/components/add-score-dialog"
import { ScoresList } from "@/components/scores-list"
import { StatsOverview } from "@/components/stats-overview"
import { AuthButton } from "@/components/auth-button"
import { LoginPrompt, type User } from "@/components/login-prompt"
import { SongsPage } from "@/components/songs-page"

// Correct RKS Calculation function for Phigros
const calculateRKS = (accuracy: number, difficulty: number): number => {
  if (accuracy < 70) return 0 // Below 70% gives 0 RKS
  return difficulty * Math.pow((accuracy - 55) / 45, 2)
}

// Calculate overall RKS from top 27 + top 3 100% accuracy songs
const calculateOverallRKS = (scores: Score[]): number => {
  if (scores.length === 0) return 0

  const bestScores = new Map<string, Score>()
  for (const score of scores) {
    const key = `${score.songName}-${score.difficulty}`
    const existing = bestScores.get(key)
    if (!existing || score.accuracy >= existing.accuracy) bestScores.set(key, score)
  }

  const rksScores = [...bestScores.values()]
    .map(s => ({ ...s, rks: calculateRKS(s.accuracy, s.difficultyRating) }))
    .sort((a, b) => b.rks - a.rks)
  
  const perfectScores = rksScores.filter(s => s.accuracy === 100).slice(0, 3)
  const top27 = rksScores.slice(0, 27)
  console.log(top27)

  const finalKeys = new Set<string>()
  const scoresToAverage: number[] = []

  for (const s of perfectScores) {
    const key = `${s.songName}-${s.difficulty}`
    finalKeys.add(key)
    scoresToAverage.push(s.rks)
  }

  for (const s of top27) {
    const key = `${s.songName}-${s.difficulty}`
    finalKeys.add(key)
    scoresToAverage.push(s.rks)
  }

  while (scoresToAverage.length < 30) {
    scoresToAverage.push(0)
  }
  console.log(scoresToAverage)
  const totalRKS = scoresToAverage.reduce((sum, rks) => sum + rks, 0)
  return totalRKS / 30
}

export interface Score {
  id: string
  songName: string
  difficulty: "EZ" | "HD" | "IN" | "AT"
  difficultyRating?: number
  score: number
  accuracy: number
  goods?: number
  badsMisses?: number
  date: string
}

export default function PhigrosTracker() {
  const [scores, setScores] = useState<Score[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [userRank, setUserRank] = useState<number | undefined>(undefined)
  const [totalUsers, setTotalUsers] = useState<number | undefined>(undefined)

  // Load user and scores on mount
  useEffect(() => {
    const loadUserAndScores = async () => {
      try {
        // Try to get user from localStorage
        const storedUser = localStorage.getItem("phigros-user")
        if (storedUser) {
          const userData = JSON.parse(storedUser)
          setUser(userData)

          // Fetch scores from API
          const response = await fetch(`/api/scores?userId=${userData.id}`)
          if (response.ok) {
            const userScores = await response.json()
            setScores(userScores)
          }

          // Fetch user rank
          const rankResponse = await fetch(`/api/rank?userId=${userData.id}`)
          if (rankResponse.ok) {
            const rankData = await rankResponse.json()
            setUserRank(rankData.rank)
            setTotalUsers(rankData.totalUsers)
          }
        }
      } catch (error) {
        console.error("Error loading user or scores:", error)
      } finally {
        setLoading(false)
      }
    }

    loadUserAndScores()
  }, [])

  const handleLogin = async (userData: User) => {
    setUser(userData)

    // Fetch scores for the user
    try {
      const response = await fetch(`/api/scores?userId=${userData.id}`)
      if (response.ok) {
        const userScores = await response.json()
        setScores(userScores)
      }

      // Fetch user rank
      const rankResponse = await fetch(`/api/rank?userId=${userData.id}`)
      if (rankResponse.ok) {
        const rankData = await rankResponse.json()
        setUserRank(rankData.rank)
        setTotalUsers(rankData.totalUsers)
      }
    } catch (error) {
      console.error("Error fetching scores:", error)
    }
  }

  const handleLogout = () => {
    setUser(null)
    setScores([])
    setUserRank(undefined)
    setTotalUsers(undefined)
    localStorage.removeItem("phigros-user")
  }

  const addScore = async (newScoreData: Omit<Score, "id" | "date">) => {
    if (!user) return

    try {
      const response = await fetch("/api/scores", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          ...newScoreData,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to add score")
      }

      const newScore = await response.json()
      setScores((prev) => [newScore, ...prev])

      // Refresh rank after adding score
      try {
        const rankResponse = await fetch(`/api/rank?userId=${user.id}`)
        if (rankResponse.ok) {
          const rankData = await rankResponse.json()
          setUserRank(rankData.rank)
          setTotalUsers(rankData.totalUsers)
        }
      } catch (error) {
        console.error("Error refreshing rank:", error)
      }
    } catch (error) {
      console.error("Error adding score:", error)
      alert("Failed to add score. Please try again.")
    }
  }

  const deleteScore = async (id: string) => {
    if (!user) return

    try {
      const response = await fetch(`/api/scores/${id}?userId=${user.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete score")
      }

      setScores((prev) => prev.filter((score) => score.id !== id))

      // Refresh rank after deleting score
      try {
        const rankResponse = await fetch(`/api/rank?userId=${user.id}`)
        if (rankResponse.ok) {
          const rankData = await rankResponse.json()
          setUserRank(rankData.rank)
          setTotalUsers(rankData.totalUsers)
        }
      } catch (error) {
        console.error("Error refreshing rank:", error)
      }
    } catch (error) {
      console.error("Error deleting score:", error)
      alert("Failed to delete score. Please try again.")
    }
  }

  const getHighScores = () => {
    const best = new Map<string, Score>()            // key = song‑difficulty

    scores.forEach((s) => {
      const key = `${s.songName}-${s.difficulty}`
      const existing = best.get(key)

      // keep the play with the highest accuracy
      if (!existing || s.accuracy > existing.accuracy) {
        best.set(key, s)
      }
    })

    // sort by accuracy (desc) just for nicer ordering in the list
    return [...best.values()].sort((a, b) => b.accuracy - a.accuracy)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Music className="h-12 w-12 text-purple-400 animate-pulse mx-auto mb-4" />
          <p className="text-gray-400">Loading your scores...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <LoginPrompt onLogin={handleLogin} />
  }

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="text-center flex-1">
            <div className="flex items-center justify-center gap-2">
              <Music className="h-8 w-8 text-purple-400" />
              <h1 className="text-4xl font-bold text-purple-400">Phigros Score Tracker</h1>
            </div>
            <p className="text-gray-400">Track your high scores and monitor your progress</p>
          </div>

          <AuthButton user={user} onLogout={handleLogout} />
        </div>

        {/* Quick Stats */}
        <StatsOverview
          scores={scores}
          calculateRKS={calculateRKS}
          calculateOverallRKS={calculateOverallRKS}
          userRank={userRank}
          totalUsers={totalUsers}
        />

        {/* Main Content */}
        <Tabs defaultValue="high-scores" className="space-y-4">
          <div className="flex items-center justify-between">
            <TabsList className="grid w-full max-w-lg grid-cols-4 bg-gray-800 border-gray-700">
              <TabsTrigger value="high-scores" className="flex items-center gap-2 data-[state=active]:bg-gray-700">
                <Trophy className="h-4 w-4" />
                High Scores
              </TabsTrigger>
              <TabsTrigger value="all-scores" className="flex items-center gap-2 data-[state=active]:bg-gray-700">
                <Music className="h-4 w-4" />
                All Scores
              </TabsTrigger>
              <TabsTrigger value="songs" className="flex items-center gap-2 data-[state=active]:bg-gray-700">
                <Music2 className="h-4 w-4" />
                Songs
              </TabsTrigger>
              <TabsTrigger value="progress" className="flex items-center gap-2 data-[state=active]:bg-gray-700">
                <TrendingUp className="h-4 w-4" />
                Progress
              </TabsTrigger>
            </TabsList>

            <Button
              onClick={() => setIsAddDialogOpen(true)}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="h-4 w-4" />
              Add Score
            </Button>
          </div>

          <TabsContent value="high-scores">
            <Card className="bg-gray-900/50 border-gray-700/50">
              <CardHeader>
                <CardTitle className="text-gray-200">Personal Best Scores</CardTitle>
                <CardDescription className="text-gray-400">
                  Your highest score for each song and difficulty
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScoresList scores={getHighScores()} onDelete={deleteScore} showHighScoreOnly />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="all-scores">
            <Card className="bg-gray-900/50 border-gray-700/50">
              <CardHeader>
                <CardTitle className="text-gray-200">All Recorded Scores</CardTitle>
                <CardDescription className="text-gray-400">Complete history of your plays</CardDescription>
              </CardHeader>
              <CardContent>
                <ScoresList scores={scores} onDelete={deleteScore} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="songs">
            <SongsPage userScores={scores} />
          </TabsContent>

          <TabsContent value="progress">
            <div className="grid gap-4">
              <Card className="bg-gray-900/50 border-gray-700/50">
                <CardHeader>
                  <CardTitle className="text-gray-200">Progress Overview</CardTitle>
                  <CardDescription className="text-gray-400">Your improvement over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-gray-400">
                    <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Progress tracking coming soon!</p>
                    <p className="text-sm">Keep adding scores to see your improvement over time.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <AddScoreDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} onAddScore={addScore} />
      </div>
    </div>
  )
}
