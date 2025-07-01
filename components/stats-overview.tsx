"use client"

import { Trophy, Target, Calendar, Zap } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Score } from "@/app/page"

interface StatsOverviewProps {
  scores: Score[]
  calculateRKS: (accuracy: number, difficultyRating: number) => number
  calculateOverallRKS: (scores: Score[]) => number
  userRank?: number
  totalUsers?: number
}

export function StatsOverview({ scores, calculateRKS, calculateOverallRKS, userRank, totalUsers }: StatsOverviewProps) {
  const totalScores = scores.length

  // Calculate highest phi (hardest song with 100% accuracy)
  const perfectScores = scores.filter((score) => score.accuracy === 100)
  const highestPhi =
    perfectScores.length > 0
      ? Math.max(...perfectScores.map((score) => score.difficultyRating || getDifficultyRating(score.difficulty)))
      : 0

  // Get the song name for the highest phi
  const highestPhiSong = perfectScores.find(
    (score) => (score.difficultyRating || getDifficultyRating(score.difficulty)) === highestPhi,
  )

  // Count phis (100% accuracy scores) by difficulty
  const phisByDifficulty = {
    EZ: perfectScores.filter((score) => score.difficulty === "EZ").length,
    HD: perfectScores.filter((score) => score.difficulty === "HD").length,
    IN: perfectScores.filter((score) => score.difficulty === "IN").length,
    AT: perfectScores.filter((score) => score.difficulty === "AT").length,
  }

  const totalPhis = Object.values(phisByDifficulty).reduce((sum, count) => sum + count, 0)

  // Count total scores by difficulty
  const scoresByDifficulty = {
    EZ: scores.filter((score) => score.difficulty === "EZ").length,
    HD: scores.filter((score) => score.difficulty === "HD").length,
    IN: scores.filter((score) => score.difficulty === "IN").length,
    AT: scores.filter((score) => score.difficulty === "AT").length,
  }

  const overallRKS = calculateOverallRKS(scores)

  // Helper function to get default difficulty rating
  function getDifficultyRating(difficulty: "EZ" | "HD" | "IN" | "AT"): number {
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

  // Helper function to get difficulty colors (dark mode friendly)
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "EZ":
        return "text-green-400"
      case "HD":
        return "text-blue-400"
      case "IN":
        return "text-red-400"
      case "AT":
        return "text-gray-400"
      default:
        return "text-white-400"
    }
  }

  const stats = [
    {
      title: "Current RKS",
      value: overallRKS.toFixed(2),
      description: userRank && totalUsers ? `Rank #${userRank} of ${totalUsers}` : "Top 27 + Top 3 φ (100%)",
      icon: Trophy,
      color: "text-purple-400",
      highlight: true,
    },
    {
      title: "Highest φ",
      value: highestPhi > 0 ? highestPhi.toFixed(1) : "0.0",
      description: highestPhiSong
        ? `${highestPhiSong.songName} (${highestPhiSong.difficulty})`
        : "No perfect scores yet",
      icon: Zap,
      color: "text-yellow-400",
    },
    {
      title: "Total φ (100%)",
      value: totalPhis.toString(),
      description: (
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className={getDifficultyColor("EZ")}>EZ: {phisByDifficulty.EZ}</span>
            <span className={getDifficultyColor("HD")}>HD: {phisByDifficulty.HD}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className={getDifficultyColor("IN")}>IN: {phisByDifficulty.IN}</span>
            <span className={getDifficultyColor("AT")}>AT: {phisByDifficulty.AT}</span>
          </div>
        </div>
      ),
      icon: Target,
      color: "text-green-400",
    },
    {
      title: "Total Scores",
      value: totalScores.toString(),
      description: (
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className={getDifficultyColor("EZ")}>EZ: {scoresByDifficulty.EZ}</span>
            <span className={getDifficultyColor("HD")}>HD: {scoresByDifficulty.HD}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className={getDifficultyColor("IN")}>IN: {scoresByDifficulty.IN}</span>
            <span className={getDifficultyColor("AT")}>AT: {scoresByDifficulty.AT}</span>
          </div>
        </div>
      ),
      icon: Calendar,
      color: "text-cyan-400",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card
          key={stat.title}
          className={
            stat.highlight
              ? "ring-2 ring-purple-500/50 bg-purple-900/30 border-purple-500/30"
              : "bg-gray-900/50 border-gray-700/50"
          }
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-200">{stat.title}</CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stat.highlight ? "text-purple-300" : "text-gray-100"}`}>
              {stat.value}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {typeof stat.description === "string" ? <p>{stat.description}</p> : stat.description}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
