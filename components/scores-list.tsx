"use client"

import { useState } from "react"
import { Trash2, Search, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import type { Score } from "@/app/page"

const calculateRKS = (accuracy: number, difficultyRating: number): number => {
  if (accuracy < 55) return 0
  return difficultyRating * Math.pow((accuracy - 55) / 45, 2)
}

const getDifficultyRating = (difficulty: "EZ" | "HD" | "IN" | "AT"): number => {
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

interface ScoresListProps {
  scores: Score[]
  onDelete: (id: string) => void
  showHighScoreOnly?: boolean
}

export function ScoresList({ scores, onDelete, showHighScoreOnly = false }: ScoresListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all")

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "EZ":
        return "bg-green-800 text-green-200 hover:bg-green-700"
      case "HD":
        return "bg-blue-800 text-blue-200 hover:bg-blue-700"
      case "IN":
        return "bg-red-800 text-red-200 hover:bg-red-700"
      case "AT":
        return "bg-gray-700 text-gray-200 hover:bg-gray-600"
      default:
        return "bg-white-700 text-white-200 hover:bg-white-600"
    }
  }

  const formatScore = (score: number) => {
    return score.toLocaleString()
  }

  const formatAccuracy = (accuracy: number) => {
    return `${accuracy.toFixed(2)}%`
  }

  const filteredScores = scores.filter((score) => {
    const matchesSearch = score.songName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDifficulty = difficultyFilter === "all" || score.difficulty === difficultyFilter
    return matchesSearch && matchesDifficulty
  })

  if (scores.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <p>No scores recorded yet.</p>
        <p className="text-sm">Add your first score to get started!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search songs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
          />
        </div>
        <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
          <SelectTrigger className="w-40 bg-gray-700 border-gray-600 text-gray-200">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-700">
            <SelectItem value="all" className="text-gray-200 hover:bg-gray-700">
              All Difficulties
            </SelectItem>
            <SelectItem value="EZ" className="text-gray-200 hover:bg-gray-700">
              EZ
            </SelectItem>
            <SelectItem value="HD" className="text-gray-200 hover:bg-gray-700">
              HD
            </SelectItem>
            <SelectItem value="IN" className="text-gray-200 hover:bg-gray-700">
              IN
            </SelectItem>
            <SelectItem value="AT" className="text-gray-200 hover:bg-gray-700">
              AT
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Scores List */}
      <div className="space-y-2">
        {filteredScores.map((score, index) => (
          <div
            key={score.id}
            className="flex items-center justify-between p-4 border border-gray-700 rounded-lg hover:bg-gray-800/50 transition-colors"
          >
            <div className="flex items-center gap-4 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground font-mono w-8">#{index + 1}</span>
                <Badge className={getDifficultyColor(score.difficulty)}>{score.difficulty}</Badge>
              </div>

              <div className="flex-1">
                <h3 className="font-medium text-gray-200">{score.songName}</h3>
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <span>Score: {formatScore(score.score)}</span>
                  <span>Accuracy: {formatAccuracy(score.accuracy)}</span>
                  {(score.goods !== undefined || score.badsMisses !== undefined) && (
                    <span className="text-xs">
                      G:{score.goods || 0} B+M:{score.badsMisses || 0}
                    </span>
                  )}
                  <span className="text-xs">
                    Diff: {score.difficultyRating || getDifficultyRating(score.difficulty)}
                  </span>
                  <span className="font-medium text-purple-400">
                    RKS:{" "}
                    {calculateRKS(
                      score.accuracy,
                      score.difficultyRating || getDifficultyRating(score.difficulty),
                    ).toFixed(2)}
                  </span>
                  <span>Date: {score.date}</span>
                </div>
              </div>
            </div>

            {!showHighScoreOnly && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Score</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this score for "{score.songName}" ({score.difficulty})? This
                      action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => onDelete(score.id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        ))}
      </div>

      {filteredScores.length === 0 && scores.length > 0 && (
        <div className="text-center py-8 text-gray-400">
          <p>No scores match your current filters.</p>
          <p className="text-sm">Try adjusting your search or filter criteria.</p>
        </div>
      )}
    </div>
  )
}
