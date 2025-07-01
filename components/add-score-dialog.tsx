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

  /* ───────── normal add‑single‑score state ───────── */
  const [selectedSong, setSelectedSong]   = useState("")
  const [difficulty, setDifficulty]       = useState<"EZ" | "HD" | "IN" | "AT">("EZ")
  const [score, setScore]                 = useState("")
  const [goods, setGoods]                 = useState("")
  const [badsMisses, setBadsMisses]       = useState("")
  const [availableDifficulties, setAvailableDifficulties] = useState<string[]>([])

  /* ───────── import mode state ───────── */
  const [importMode, setImportMode] = useState(false)
  const [importText, setImportText] = useState("")

  /* update available difficulties when song changes */
  useEffect(() => {
    if (selectedSong && songs[selectedSong]) {
      const d: string[] = []
      if (songs[selectedSong].ez) d.push("EZ")
      if (songs[selectedSong].hd) d.push("HD")
      if (songs[selectedSong].in) d.push("IN")
      if (songs[selectedSong].at) d.push("AT")
      setAvailableDifficulties(d)
      if (d.length && !d.includes(difficulty)) setDifficulty(d[0] as any)
    } else {
      setAvailableDifficulties([])
      setDifficulty("EZ")
    }
  }, [selectedSong])

  /* ───────── helper fns ───────── */
  const getNotes = (song: string, diff: string) =>
    (songs[song]?.[diff.toLowerCase() as keyof SongData] as any)?.notes ?? 0

  const calcAcc = (song: string, g: number, bm: number) => {
    const notes = getNotes(song, difficulty)
    const perfect = Math.max(notes - g - bm, 0)
    return Math.min(100, Math.max(0, ((perfect + g * 0.65) / notes) * 100))
  }

  const getDiffRating = (song: string, diff: string) =>
    (songs[song]?.[diff.toLowerCase() as keyof SongData] as any)?.level ?? 8

  /* ───────── add single score ───────── */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSong || !score || goods === "" || badsMisses === "") return

    onAddScore({
      songName: selectedSong,
      difficulty,
      difficultyRating: getDiffRating(selectedSong, difficulty),
      score: Number(score),
      accuracy: calcAcc(selectedSong, +goods, +badsMisses),
      goods: +goods,
      badsMisses: +badsMisses,
    })

    resetAndClose()
  }

  /* ───────── import parser ───────── */
  const handleImport = () => {
    const rows = importText.split(/\r?\n/).filter((l) => l.trim())
    rows.forEach((raw) => {
      const cells = raw.split("|").map((c) => c.trim())
      // expecting at least 8 columns (rank | grade | acc | rks | score | diff | diffRating | song)
      if (cells.length < 8) return
      const [
        /* rank */, /* grade */, accStr, /* rks */, scoreStr, diffStr, diffRatingStr, ...songParts
      ] = cells
      const songName = songParts.join(" | ").replace(/\s+/g, " ").trim()
      const difficulty   = diffStr as "EZ" | "HD" | "IN" | "AT" | ""
      const accuracy     = parseFloat(accStr.replace("%", ""))
      const scoreVal     = parseInt(scoreStr.replace(/[^0-9]/g, ""), 10)
      const diffRating   = parseFloat(diffRatingStr)

      if (!songName || !difficulty || Number.isNaN(scoreVal) || Number.isNaN(accuracy)) return

      onAddScore({
        songName,
        difficulty: difficulty as any,
        difficultyRating: Number.isNaN(diffRating) ? getDiffRating(songName, difficulty) : diffRating,
        score: scoreVal,
        accuracy,
        goods: 0,
        badsMisses: 0,
      })
    })

    resetAndClose()
  }

  const resetAndClose = () => {
    setSelectedSong("")
    setDifficulty("EZ")
    setScore("")
    setGoods("")
    setBadsMisses("")
    setImportText("")
    setImportMode(false)
    onOpenChange(false)
  }

  /* ───────── styles helper ───────── */
  const diffColor = (d: string) =>
    ({ EZ: "text-green-400", HD: "text-blue-400", IN: "text-red-400", AT: "text-gray-400" } as any)[d] ?? "text-white"

  /* ───────── render ───────── */
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-gray-800 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-gray-200">
            {importMode ? "Import Scores" : "Add New Score"}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            {importMode
              ? "Paste rows in the format you provided; each valid line will be added."
              : "Record a new high score for your Phigros collection"}
          </DialogDescription>
        </DialogHeader>

        {importMode ? (
          /* ───────── IMPORT UI ───────── */
          <>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              rows={6}
              placeholder="#4 | S | 99.14% | …"
              className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-gray-200 placeholder:text-gray-400"
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setImportMode(false)}
                className="border-gray-600 text-gray-200 hover:bg-gray-700 bg-gray-600">
                Back
              </Button>
              <Button
                onClick={handleImport}
                className="bg-purple-600 hover:bg-purple-700 text-white"
                disabled={!importText.trim()}
              >
                Import
              </Button>
            </DialogFooter>
          </>
        ) : (
          /* ───────── NORMAL ADD‑ONE UI ───────── */
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* song select */}
            <div className="space-y-2">
              <Label className="text-gray-200">Song</Label>
              <ReactSelect
                options={songNames.map((s) => ({ value: s, label: s }))}
                value={selectedSong ? { value: selectedSong, label: selectedSong } : null}
                onChange={(o) => setSelectedSong(o ? o.value : "")}
                isClearable
                placeholder="Select a song..."
                classNamePrefix="react-select"
                styles={{
                  menu:  (p) => ({ ...p, backgroundColor: "#1f2937", color: "#d1d5db" }),
                  option:(p,s)=>({ ...p, backgroundColor:s.isFocused?"#374151":"#1f2937",
                                    color:s.isSelected?"#a78bfa":"#d1d5db"}),
                  control:(p)=>({ ...p, backgroundColor:"#374151", borderColor:"#4b5563", color:"#d1d5db"}),
                  input:(p)=>({ ...p, color:"#d1d5db" }),
                  singleValue:(p)=>({ ...p, color:"#d1d5db" }),
                }}
              />
            </div>

            {/* difficulty */}
            <div className="space-y-2">
              <Label className="text-gray-200">Difficulty</Label>
              <Select
                value={difficulty}
                onValueChange={(v: any) => setDifficulty(v)}
                disabled={!selectedSong}
              >
                <SelectTrigger className="bg-gray-700 border-gray-600 text-gray-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {availableDifficulties.map((d) => (
                    <SelectItem key={d} value={d} className={`${diffColor(d)} hover:bg-gray-700`}>
                      {d}
                      {selectedSong && (
                        <span className="text-gray-400 ml-2">
                          ({(songs[selectedSong][d.toLowerCase() as keyof SongData] as any)?.level})
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* score / goods / bads */}
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label className="text-gray-200">Score</Label>
                <Input
                  type="number" min="0" max="1000000" value={score}
                  onChange={(e) => setScore(e.target.value)}
                  placeholder="1000000"
                  className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {["Goods", "Bads + Misses"].map((lbl, i) => {
                  const val   = i ? badsMisses : goods
                  const setter= i ? setBadsMisses : setGoods
                  return (
                    <div key={lbl} className="space-y-2">
                      <Label className="text-gray-200">{lbl}</Label>
                      <Input
                        type="number" min="0" value={val}
                        onChange={(e) => setter(e.target.value)}
                        placeholder="0"
                        className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
                        required
                      />
                    </div>
                  )
                })}
              </div>

              {score && (goods !== "" || badsMisses !== "") && (
                <div className="text-sm text-gray-300 bg-gray-700/50 p-2 rounded border border-gray-600">
                  Calculated Accuracy:{" "}
                  {calcAcc(selectedSong, +goods || 0, +badsMisses || 0).toFixed(2)}%
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}
                className="border-gray-600 text-gray-200 hover:bg-gray-700 bg-gray-600">
                Cancel
              </Button>
              <Button type="button" variant="secondary"
                onClick={() => setImportMode(true)}
                className="bg-gray-600 hover:bg-gray-700 text-gray-200">
                Import
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
        )}
      </DialogContent>
    </Dialog>
  )
}
