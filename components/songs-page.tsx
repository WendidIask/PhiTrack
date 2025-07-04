"use client"

import {
  useState,
  useEffect,
  useRef,
  useMemo,
  type RefObject,
} from "react"
import {
  Search,
  Filter,
  Trophy,
  User,
  Music2,
  Palette,
  Calendar,
  BarChart3,
  Target,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import songsData from "@/data/songs.json"
import type { Score } from "@/app/page"

/* ---------- types ---------- */

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

interface SongStats {
  songName: string
  difficulty: string
  numberOfPhis: number
  averageAccuracy: number
  averageScore: number
  totalScores: number
}

interface SongsPageProps {
  userScores: Score[]
}

/* ---------- component ---------- */

export function SongsPage({ userScores }: SongsPageProps) {
  /* --- filters & remote data --- */
  const [searchTerm, setSearchTerm] = useState("")
  const [packFilter, setPackFilter] = useState<string>("all")
  const [songStats, setSongStats] = useState<
    Record<string, SongStats[]>
  >({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /* --- incremental‑render state --- */
  const [visibleCount, setVisibleCount] = useState(30) // first batch = 30 cards
  const loaderRef = useRef<HTMLDivElement | null>(null)

  const songs = songsData as Record<string, SongData>

  /* packs list memoised so it doesn't recalc on every render */
  const packs = useMemo(
    () => [...new Set(Object.values(songs).map((song) => song.pack))],
    [songs]
  )

  /* ---------- remote stats fetch ---------- */
  useEffect(() => {
    fetchSongStats()
  }, [])

  const fetchSongStats = async () => {
    try {
      setError(null)
      const response = await fetch("/api/song-stats")
      if (response.ok) {
        const data = await response.json()
        setSongStats(data)
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to load song statistics")
      }
    } catch (err) {
      console.error("Error fetching song stats:", err)
      setError("Failed to connect to server")
    } finally {
      setLoading(false)
    }
  }

  /* ---------- helper utilities ---------- */
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case "ez":
        return "text-green-400"
      case "hd":
        return "text-blue-400"
      case "in":
        return "text-red-400"
      case "at":
        return "text-gray-400"
      default:
        return "text-white-400"
    }
  }

  const getDifficultyBadgeColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case "ez":
        return "bg-green-800 text-green-200 hover:bg-green-700"
      case "hd":
        return "bg-blue-800 text-blue-200 hover:bg-blue-700"
      case "in":
        return "bg-red-800 text-red-200 hover:bg-red-700"
      case "at":
        return "bg-gray-700 text-gray-200 hover:bg-gray-600"
      default:
        return "bg-white-700 text-white-200 hover:bg-white-600"
    }
  }

  /* ---------- filtering ---------- */
  const filteredSongs = useMemo(
    () =>
      Object.entries(songs).filter(([songName, songData]) => {
        const matchesSearch =
          songName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          songData.artist.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesPack =
          packFilter === "all" || songData.pack === packFilter
        return matchesSearch && matchesPack
      }),
    [songs, searchTerm, packFilter]
  )

  /* ---------- reset visible batch when filters change ---------- */
  useEffect(() => {
    setVisibleCount(30)
  }, [searchTerm, packFilter])

  /* ---------- intersection‑observer for "load more" ---------- */
  useEffect(() => {
    if (!loaderRef.current) return

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setVisibleCount((c) =>
          Math.min(c + 30, filteredSongs.length)
        )
      }
    })

    observer.observe(loaderRef.current)
    return () => observer.disconnect()
  }, [filteredSongs.length])

  /* ---------- render ---------- */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-purple-400 mb-2">
          Song Database
        </h2>
        <p className="text-gray-400">
          Explore all songs with detailed information and statistics
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search songs or artists..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
          />
        </div>
        <Select value={packFilter} onValueChange={setPackFilter}>
          <SelectTrigger className="w-40 bg-gray-700 border-gray-600 text-gray-200">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-700">
            <SelectItem
              value="all"
              className="text-gray-200 hover:bg-gray-700"
            >
              All Packs
            </SelectItem>
            {packs.map((pack) => (
              <SelectItem
                key={pack}
                value={pack}
                className="text-gray-200 hover:bg-gray-700 capitalize"
              >
                {pack}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Songs List */}
      <div className="grid gap-4">
        {filteredSongs
          .slice(0, visibleCount) /* <- only render what's visible */
          .map(([songName, songData]) => (
            <Card
              key={songName}
              className="bg-gray-900/50 border-gray-700/50"
            >
              {/* -------- card header -------- */}
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-gray-200 text-xl">
                      {songName}
                    </CardTitle>
                    <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {songData.artist}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        v{songData.version}
                      </div>
                      <div className="flex items-center gap-1">
                        <Music2 className="h-3 w-3" />
                        {songData.pack}
                      </div>
                    </div>
                  </div>
                  {songData.original && (
                    <Badge className="bg-green-800 text-green-200">
                      Original
                    </Badge>
                  )}
                </div>
              </CardHeader>

              {/* -------- card body -------- */}
              <CardContent>
                <Tabs defaultValue="difficulties" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 bg-gray-800 border-gray-700">
                    <TabsTrigger
                      value="difficulties"
                      className="data-[state=active]:bg-gray-700"
                    >
                      Difficulties
                    </TabsTrigger>
                    <TabsTrigger
                      value="credits"
                      className="data-[state=active]:bg-gray-700"
                    >
                      Credits
                    </TabsTrigger>
                    <TabsTrigger
                      value="stats"
                      className="data-[state=active]:bg-gray-700"
                    >
                      Stats
                    </TabsTrigger>
                  </TabsList>

                  {/* --- difficulties tab --- */}
                  <TabsContent value="difficulties" className="mt-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {["ez", "hd", "in", "at"].map((diff) => {
                        const diffData =
                          songData[diff as keyof SongData] as
                            | { level: number; notes: number; charter: string }
                            | undefined
                        if (!diffData) return null

                        return (
                          <div
                            key={diff}
                            className="p-3 bg-gray-800/50 rounded-lg border border-gray-700"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <Badge
                                className={getDifficultyBadgeColor(diff)}
                              >
                                {diff.toUpperCase()}
                              </Badge>
                              <span
                                className={`font-bold ${getDifficultyColor(
                                  diff
                                )}`}
                              >
                                {diffData.level}
                              </span>
                            </div>
                            <div className="text-xs text-gray-400">
                              <div>Notes: {diffData.notes}</div>
                              <div className="mt-1">
                                Charter: {diffData.charter}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </TabsContent>

                  {/* --- credits tab --- */}
                  <TabsContent value="credits" className="mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Music2 className="h-4 w-4 text-purple-400" />
                          <span className="text-gray-400">Artist:</span>
                          <span className="text-gray-200">
                            {songData.artist}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Palette className="h-4 w-4 text-green-400" />
                          <span className="text-gray-400">Illustration:</span>
                          <span className="text-gray-200">
                            {songData.illustration}
                          </span>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* --- stats tab --- */}
                  <TabsContent value="stats" className="mt-4">
                    {loading ? (
                      <div className="text-center py-4 text-gray-400">
                        Loading statistics...
                      </div>
                    ) : error ? (
                      <div className="text-center py-4">
                        <p className="text-red-400 mb-2">⚠️ {error}</p>
                        <button
                          onClick={fetchSongStats}
                          className="text-purple-400 hover:text-purple-300 text-sm underline"
                        >
                          Try again
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {["EZ", "HD", "IN", "AT"].map((diff) => {
                          const diffKey = `${songName}-${diff}`
                          const stats = songStats[diffKey]?.[0]

                          if (
                            !songData[
                              diff.toLowerCase() as keyof SongData
                            ]
                          )
                            return null

                          return (
                            <div
                              key={diff}
                              className="p-3 bg-gray-800/30 rounded-lg border border-gray-700/50"
                            >
                              <div className="flex items-center gap-2 mb-3">
                                <Badge
                                  className={getDifficultyBadgeColor(
                                    diff.toLowerCase()
                                  )}
                                >
                                  {diff}
                                </Badge>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                                {/* number of phis */}
                                <div>
                                  <div className="flex items-center gap-1 text-yellow-400 mb-1">
                                    <Trophy className="h-3 w-3" />
                                    Phis (100%)
                                  </div>
                                  <div className="text-gray-300 font-medium">
                                    {stats?.numberOfPhis ?? 0}
                                  </div>
                                </div>

                                {/* average accuracy */}
                                <div>
                                  <div className="flex items-center gap-1 text-green-400 mb-1">
                                    <Target className="h-3 w-3" />
                                    Avg Accuracy
                                  </div>
                                  <div className="text-gray-300 font-medium">
                                    {stats?.averageAccuracy 
                                      ? `${stats.averageAccuracy.toFixed(2)}%`
                                      : "N/A"}
                                  </div>
                                </div>

                                {/* average score */}
                                <div>
                                  <div className="flex items-center gap-1 text-blue-400 mb-1">
                                    <BarChart3 className="h-3 w-3" />
                                    Avg Score
                                  </div>
                                  <div className="text-gray-300 font-medium">
                                    {stats?.averageScore 
                                      ? stats.averageScore.toLocaleString()
                                      : "N/A"}
                                  </div>
                                </div>

                                {/* total scores */}
                                <div>
                                  <div className="flex items-center gap-1 text-purple-400 mb-1">
                                    <User className="h-3 w-3" />
                                    Total Scores
                                  </div>
                                  <div className="text-gray-300 font-medium">
                                    {stats?.totalScores ?? 0}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ))}

        {/* sentinel for IntersectionObserver */}
        {visibleCount < filteredSongs.length && (
          <div ref={loaderRef} className="h-1" />
        )}
      </div>

      {/* empty state */}
      {filteredSongs.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <Music2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No songs match your current filters.</p>
          <p className="text-sm">
            Try adjusting your search or filter criteria.
          </p>
        </div>
      )}
    </div>
  )
}