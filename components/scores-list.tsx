"use client"

import {
  useState,
  useEffect,
  useRef,
  useMemo,
} from "react"
import { Trash2, Search, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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

/* ---------- helpers ---------- */

const calculateRKS = (accuracy: number, difficultyRating: number) => {
  if (accuracy < 55) return 0
  return difficultyRating * Math.pow((accuracy - 55) / 45, 2)
}

const getDifficultyRating = (difficulty: string) => {
  const ratings = { EZ: 1, HD: 4, IN: 7, AT: 10 }
  return ratings[difficulty as keyof typeof ratings] || 5
}

/* ---------- component ---------- */

interface ScoresListProps {
  scores: Score[]
  onDelete: (id: string) => void
  showHighScoreOnly?: boolean
}

const CHUNK_SIZE = 20

export function ScoresList({
  scores,
  onDelete,
  showHighScoreOnly = false,
}: ScoresListProps) {
  /* --- local state --- */
  const [searchTerm, setSearchTerm] = useState("")
  const [difficultyFilter, setDifficultyFilter] = useState("all")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [visibleCount, setVisibleCount] = useState(CHUNK_SIZE)

  const loaderRef = useRef<HTMLDivElement | null>(null)

  /* --- utils --- */
  const getDifficultyColor = (d: string) =>
    ({
      EZ: "bg-green-800 text-green-200 hover:bg-green-700",
      HD: "bg-blue-800 text-blue-200 hover:bg-blue-700",
      IN: "bg-red-800 text-red-200 hover:bg-red-700",
      AT: "bg-gray-700 text-gray-200 hover:bg-gray-600",
    }[d] ?? "bg-white-700 text-white-200")

  const formatScore = (n: number) => n.toLocaleString()
  const formatAccuracy = (n: number) => `${n.toFixed(2)}%`

  /* --- filtered + sorted list (memoised) --- */
  const filteredScores = useMemo(() => {
    const filtered = scores.filter((s) => {
      const matchText = s.songName.toLowerCase().includes(searchTerm.toLowerCase())
      const matchDiff = difficultyFilter === "all" || s.difficulty === difficultyFilter
      return matchText && matchDiff
    })

    return filtered.slice().sort((a, b) => {
      const rksA = calculateRKS(a.accuracy, a.difficultyRating)
      const rksB = calculateRKS(b.accuracy, b.difficultyRating)

      if (rksB !== rksA) return rksB - rksA
      return b.accuracy - a.accuracy
    })
  }, [scores, searchTerm, difficultyFilter])

  /* --- reset visible chunk when list changes --- */
  useEffect(() => setVisibleCount(CHUNK_SIZE), [searchTerm, difficultyFilter, scores])

  /* --- keep selection only for visible IDs --- */
  useEffect(() => {
    setSelectedIds((prev) => {
      const current = new Set(filteredScores.map((s) => s.id))
      const next = new Set(Array.from(prev).filter((id) => current.has(id)))
      return next
    })
  }, [filteredScores])

  /* --- infinite scroll sentinel --- */
  useEffect(() => {
    if (!loaderRef.current) return
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setVisibleCount((c) => Math.min(c + CHUNK_SIZE, filteredScores.length))
      }
    })
    io.observe(loaderRef.current)
    return () => io.disconnect()
  }, [filteredScores.length])

  /* --- bulk selection helpers --- */
  const toggleSelectAll = () =>
    setSelectedIds(
      selectedIds.size === filteredScores.length
        ? new Set()
        : new Set(filteredScores.map((s) => s.id)),
    )

  const toggleSelectOne = (id: string) =>
    setSelectedIds((prev) => {
      const set = new Set(prev)
      set.has(id) ? set.delete(id) : set.add(id)
      return set
    })

  const handleDeleteSelected = () => {
    selectedIds.forEach(onDelete)
    setSelectedIds(new Set())
    setShowDeleteConfirm(false)
  }

  /* ---------- render ---------- */

  if (!scores.length)
    return (
      <div className="text-center py-8 text-gray-400">
        <p>No scores recorded yet.</p>
        <p className="text-sm">Add your first score to get started!</p>
      </div>
    )

  return (
    <div className="space-y-6">
      {/* --- filters section --- */}
      <div className="space-y-4">
        {/* Search and Filter Row */}
        <div className="flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search songs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 
                         focus:border-purple-500 focus:ring-purple-500/20"
            />
          </div>

          <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
            <SelectTrigger className="w-48 bg-gray-700 border-gray-600 text-gray-200 
                                      hover:bg-gray-600 focus:border-purple-500 focus:ring-purple-500/20">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              {["all", "EZ", "HD", "IN", "AT"].map((d) => (
                <SelectItem key={d} value={d} className="text-gray-200 hover:bg-gray-700 focus:bg-gray-700">
                  {d === "all" ? "All Difficulties" : d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Selection Controls Row - Responsive design */}
        {!showHighScoreOnly && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-6 p-3 sm:p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
            <div className="flex items-center gap-3 sm:gap-6">
              {/* Custom styled checkbox */}
              <label className="flex items-center cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === filteredScores.length && filteredScores.length > 0}
                    onChange={toggleSelectAll}
                    className="sr-only"
                  />
                  <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded border-2 flex items-center justify-center transition-all duration-200 
                                  ${selectedIds.size === filteredScores.length && filteredScores.length > 0
                                    ? 'bg-purple-600 border-purple-600' 
                                    : 'border-gray-500 bg-gray-700 group-hover:border-purple-500'
                                  }`}>
                    {selectedIds.size === filteredScores.length && filteredScores.length > 0 && (
                      <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
                <span className="ml-2 sm:ml-3 text-sm sm:text-base text-gray-200 font-medium select-none group-hover:text-purple-200 transition-colors">
                  <span>Select All</span>
                </span>
              </label>
              
              <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 bg-gray-700 rounded-full">
                <span className="text-xs sm:text-sm text-gray-300">
                  {selectedIds.size > 0 ? (
                    <>
                      <span className="font-semibold text-purple-400">{selectedIds.size}</span>
                      <span className="text-gray-400 hidden sm:inline"> of {filteredScores.length} selected</span>
                      <span className="text-gray-400 sm:hidden">/{filteredScores.length}</span>
                    </>
                  ) : (
                    <span className="text-gray-400">
                      <span className="sm:hidden">0</span>
                      <span className="hidden sm:inline">No items selected</span>
                    </span>
                  )}
                </span>
              </div>
            </div>

            <Button
              variant="destructive"
              size="sm"
              disabled={!selectedIds.size}
              onClick={() => setShowDeleteConfirm(true)}
              className="bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed
                         transition-all duration-200 shadow-lg hover:shadow-xl text-xs sm:text-sm"
            >
              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="sm:hidden">Delete ({selectedIds.size})</span>
              <span className="hidden sm:inline">Delete Selected ({selectedIds.size})</span>
            </Button>
          </div>
        )}
      </div>

      {/* --- score list --- */}
      <div className="space-y-2">
        {filteredScores.slice(0, visibleCount).map((score, idx) => (
          <div
            key={score.id}
            className="flex items-center justify-between p-4 border border-gray-700 rounded-lg
                       hover:bg-gray-800/50 hover:border-gray-600 transition-all duration-200"
          >
            {/* left segment */}
            <div className="flex items-center gap-4 flex-1 min-w-0">
              {!showHighScoreOnly && (
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(score.id)}
                    onChange={() => toggleSelectOne(score.id)}
                    className="sr-only"
                  />
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all duration-200 cursor-pointer
                                  ${selectedIds.has(score.id)
                                    ? 'bg-purple-600 border-purple-600' 
                                    : 'border-gray-500 bg-gray-700 hover:border-purple-500'
                                  }`}
                       onClick={() => toggleSelectOne(score.id)}>
                    {selectedIds.has(score.id) && (
                      <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-sm text-muted-foreground font-mono w-8 text-right">
                  #{idx + 1}
                </span>
                <Badge className={`${getDifficultyColor(score.difficulty)} text-xs font-semibold`}>
                  {score.difficulty}
                </Badge>
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-200 text-base mb-1 truncate">
                  {score.songName}
                </h3>
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                  <span className="font-medium">Score: <span className="text-gray-300">{formatScore(score.score)}</span></span>
                  <span className="font-medium">Accuracy: <span className="text-gray-300">{formatAccuracy(score.accuracy)}</span></span>

                  {(score.goods !== undefined || score.badsMisses !== undefined) && (
                    <span className="text-xs bg-gray-800 px-2 py-1 rounded">
                      G:{score.goods ?? 0} B+M:{score.badsMisses ?? 0}
                    </span>
                  )}

                  <span className="text-xs bg-gray-800 px-2 py-1 rounded">
                    Diff: {score.difficultyRating ?? getDifficultyRating(score.difficulty)}
                  </span>

                  <span className="font-semibold text-purple-400 bg-purple-900/30 px-2 py-1 rounded text-sm">
                    RKS: {calculateRKS(
                      score.accuracy,
                      score.difficultyRating ?? getDifficultyRating(score.difficulty),
                    ).toFixed(2)}
                  </span>
                  <span className="text-xs text-gray-500">Date: {score.date}</span>
                </div>
              </div>
            </div>

            {/* delete single */}
            {!showHighScoreOnly && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" 
                          className="text-red-400 hover:text-red-300 hover:bg-red-900/20 flex-shrink-0 ml-4">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Score</AlertDialogTitle>
                    <AlertDialogDescription>
                      Delete "{score.songName}" ({score.difficulty})? This cannot be undone.
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

      {/* sentinel */}
      {visibleCount < filteredScores.length && <div ref={loaderRef} className="h-1" />}

      {/* empty after filter */}
      {!filteredScores.length && !!scores.length && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg mb-2">No scores match your current filters.</p>
          <p className="text-sm">Try adjusting your search or filter criteria.</p>
        </div>
      )}

      {/* bulk delete confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Selected Scores</AlertDialogTitle>
            <AlertDialogDescription>
              Delete {selectedIds.size} selected scores? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSelected}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}