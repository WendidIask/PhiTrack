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
      description: null, // We'll render this separately
      breakdown: phisByDifficulty,
      icon: Target,
      color: "text-green-400",
    },
    {
      title: "Total Scores",
      value: totalScores.toString(),
      description: null, // We'll render this separately
      breakdown: scoresByDifficulty,
      icon: Calendar,
      color: "text-cyan-400",
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
      {stats.map((stat) => (
        <Card
          key={stat.title}
          className={
            stat.highlight
              ? "ring-2 ring-purple-500/50 bg-purple-900/30 border-purple-500/30"
              : "bg-gray-900/50 border-gray-700/50"
          }
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-200 truncate pr-1">
              {stat.title}
            </CardTitle>
            <stat.icon className={`h-3 w-3 sm:h-4 sm:w-4 ${stat.color} flex-shrink-0`} />
          </CardHeader>
          <CardContent className="pt-0 sm:pt-1">
            <div className={`text-lg sm:text-2xl font-bold ${stat.highlight ? "text-purple-300" : "text-gray-100"}`}>
              {stat.value}
            </div>
            <div className="text-xs text-gray-400 mt-1 leading-tight">
              {stat.description ? (
                <p className="truncate sm:whitespace-normal" title={stat.description}>
                  {stat.description}
                </p>
              ) : stat.breakdown ? (
                <div className="space-y-0.5 sm:space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className={getDifficultyColor("EZ")}>EZ: {stat.breakdown.EZ}</span>
                    <span className={getDifficultyColor("HD")}>HD: {stat.breakdown.HD}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className={getDifficultyColor("IN")}>IN: {stat.breakdown.IN}</span>
                    <span className={getDifficultyColor("AT")}>AT: {stat.breakdown.AT}</span>
                  </div>
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}