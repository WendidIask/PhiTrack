"use client"

import ReactSelect from "react-select"
import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import songsData from "@/data/songs.json"
import type { Score } from "@/app/page"

interface AddScoreDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddScore: (score: Omit<Score, "id" | "date">) => void
}

interface SongData {
  pack: string
  ez?: { level: number; notes: number; charter: string }
  hd?: { level: number; notes: number; charter: string }
  in?: { level: number; notes: number; charter: string }
  at?: { level: number; notes: number; charter: string }
  artist: string
  illustration: string
  original: boolean
  version: string
}

export function AddScoreDialog({ open, onOpenChange, onAddScore }: AddScoreDialogProps) {
  const songs = songsData as Record<string, SongData>
  const songNames = Object.keys(songs).sort()

  const [selectedSong, setSelectedSong] = useState("")
  const [difficulty, setDifficulty] = useState<"EZ" | "HD" | "IN" | "AT">("EZ")
  const [score, setScore] = useState("")
  const [goods, setGoods] = useState("")
  const [badsMisses, setBadsMisses] = useState("")
  const [availableDifficulties, setAvailableDifficulties] = useState<string[]>([])

  // Update available difficulties when song changes
  useEffect(() => {
    if (selectedSong && songs[selectedSong]) {
      const songData = songs[selectedSong]
      const difficulties = []

      if (songData.ez) difficulties.push("EZ")
      if (songData.hd) difficulties.push("HD")
      if (songData.in) difficulties.push("IN")
      if (songData.at) difficulties.push("AT")

      setAvailableDifficulties(difficulties)

      // Reset difficulty to first available if current not included
      if (difficulties.length > 0 && !difficulties.includes(difficulty)) {
        setDifficulty(difficulties[0] as "EZ" | "HD" | "IN" | "AT")
      }
    } else {
      setAvailableDifficulties([])
      setDifficulty("EZ")
    }
  }, [selectedSong])

  const calculateAccuracy = (song: string, goods: number, badsMisses: number): number => {
    const totalNotes = getNotes(song, difficulty)
    const perfects = Math.max(totalNotes - goods - badsMisses, 0)
    const accuracy = ((perfects * 1.0 + goods * 0.65) / totalNotes) * 100
    return Math.min(100, Math.max(0, accuracy))
  }

  const getDifficultyRating = (songName: string, difficulty: string): number => {
    const songData = songs[songName]
    if (!songData) return 8.0

    const diffData = songData[difficulty.toLowerCase() as keyof SongData] as any
    return diffData?.level || 8.0
  }

  const getNotes = (songName: string, difficulty: string): number => {
    const songData = songs[songName]
    if (!songData) return 8.0

    const diffData = songData[difficulty.toLowerCase() as keyof SongData] as any
    return diffData?.notes || 8.0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedSong || !score || goods === "" || badsMisses === "") return

    const calculatedAccuracy = calculateAccuracy(
      selectedSong,
      Number.parseInt(goods || "0"),
      Number.parseInt(badsMisses || "0"),
    )

    const difficultyRating = getDifficultyRating(selectedSong, difficulty)

    onAddScore({
      songName: selectedSong,
      difficulty,
      difficultyRating,
      score: Number.parseInt(score),
      accuracy: calculatedAccuracy,
      goods: Number.parseInt(goods || "0"),
      badsMisses: Number.parseInt(badsMisses || "0"),
    })

    // Reset form
    setSelectedSong("")
    setDifficulty("EZ")
    setScore("")
    setGoods("")
    setBadsMisses("")
    onOpenChange(false)
  }

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-gray-800 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-gray-200">Add New Score</DialogTitle>
          <DialogDescription className="text-gray-400">
            Record a new high score for your Phigros collection
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* SONG SELECT (using react-select) */}
          <div className="space-y-2">
            <Label htmlFor="song-select" className="text-gray-200">
              Song
            </Label>
            <ReactSelect
              options={songNames.map((songName) => ({ value: songName, label: songName }))}
              value={selectedSong ? { value: selectedSong, label: selectedSong } : null}
              onChange={(option) => setSelectedSong(option ? option.value : "")}
              isClearable
              placeholder="Select a song..."
              classNamePrefix="react-select"
              styles={{
                menu: (provided) => ({ ...provided, backgroundColor: "#1f2937", color: "#d1d5db" }),
                option: (provided, state) => ({
                  ...provided,
                  backgroundColor: state.isFocused ? "#374151" : "#1f2937",
                  color: state.isSelected ? "#a78bfa" : "#d1d5db",
                }),
                singleValue: (provided) => ({ ...provided, color: "#d1d5db" }),
                control: (provided) => ({
                  ...provided,
                  backgroundColor: "#374151",
                  borderColor: "#4b5563",
                  color: "#d1d5db",
                }),
                input: (provided) => ({ ...provided, color: "#d1d5db" }),
              }}
            />
          </div>

          {/* DIFFICULTY SELECT */}
          <div className="space-y-2">
            <Label htmlFor="difficulty" className="text-gray-200">
              Difficulty
            </Label>
            <Select
              value={difficulty}
              onValueChange={(value: "EZ" | "HD" | "IN" | "AT") => setDifficulty(value)}
              disabled={!selectedSong}
            >
              <SelectTrigger className="bg-gray-700 border-gray-600 text-gray-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                {availableDifficulties.map((diff) => (
                  <SelectItem key={diff} value={diff} className={`${getDifficultyColor(diff)} hover:bg-gray-700`}>
                    {diff}{" "}
                    {selectedSong && songs[selectedSong] && (
                      <span className="text-gray-400 ml-2">
                        ({(songs[selectedSong][diff.toLowerCase() as keyof SongData] as any)?.level})
                      </span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* SCORE, GOODS, BADS+MISSES INPUTS */}
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="score" className="text-gray-200">
                Score
              </Label>
              <Input
                id="score"
                type="number"
                value={score}
                onChange={(e) => setScore(e.target.value)}
                placeholder="1000000"
                min="0"
                max="1000000"
                className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="goods" className="text-gray-200">
                  Goods
                </Label>
                <Input
                  id="goods"
                  type="number"
                  value={goods}
                  onChange={(e) => setGoods(e.target.value)}
                  placeholder="0"
                  min="0"
                  className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bads-misses" className="text-gray-200">
                  Bads + Misses
                </Label>
                <Input
                  id="bads-misses"
                  type="number"
                  value={badsMisses}
                  onChange={(e) => setBadsMisses(e.target.value)}
                  placeholder="0"
                  min="0"
                  className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
                  required
                />
              </div>
            </div>

            {score && (goods !== "" || badsMisses !== "") && (
              <div className="text-sm text-gray-300 bg-gray-700/50 p-2 rounded border border-gray-600">
                Calculated Accuracy:{" "}
                {calculateAccuracy(
                  selectedSong,
                  Number.parseInt(goods || "0"),
                  Number.parseInt(badsMisses || "0"),
                ).toFixed(2)}
                %
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-gray-600 text-gray-200 hover:bg-gray-700 bg-gray-600"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-purple-600 hover:bg-purple-700 text-white"
              disabled={!selectedSong || !availableDifficulties.includes(difficulty)}
            >
              Add Score
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
