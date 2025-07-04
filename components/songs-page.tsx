"use client"

import {
  useState,
  useEffect,
  useRef,
  useMemo,
} from "react"
import {
  Search,
  Filter,
  Trophy,
  Clock,
  Music2,
  Palette,
  Calendar,
  BarChart3,
  Target,
  User,
  ArrowDownAZ,
  ArrowDownUp,   // ← NEW for reverse toggle
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
  duration: string
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

/* ---------- utils ---------- */
const parseDuration = (d: string) => {
  const [m, s] = d.split(":").map(Number)
  return s === undefined ? m : m * 60 + s
}
const compareVersions = (a: string, b: string) => {
  const seg = (v: string) => v.replace(/^v/i, "").split(".").map(Number)
  const x = seg(a), y = seg(b)
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    const diff = (x[i] || 0) - (y[i] || 0)
    if (diff) return diff
  }
  return 0
}

/* ---------- component ---------- */
export function SongsPage({ userScores }: SongsPageProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [packFilter, setPackFilter] = useState("all")
  const [sortKey, setSortKey]       = useState("name")
  const [sortReverse, setSortReverse] = useState(false)      // ← NEW

  const [songStats, setSongStats] = useState<Record<string, SongStats[]>>({})
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)

  const [visibleCount, setVisibleCount] = useState(30)
  const loaderRef = useRef<HTMLDivElement | null>(null)

  const songs = songsData as Record<string, SongData>
  const packs = useMemo(
    () => [...new Set(Object.values(songs).map((s) => s.pack))],
    [songs]
  )

  /* fetch stats once */
  useEffect(() => {
    (async () => {
      try {
        setError(null)
        const r = await fetch("/api/song-stats")
        r.ok ? setSongStats(await r.json())
             : setError("Failed to load song statistics")
      } catch { setError("Failed to connect to server") }
      finally { setLoading(false) }
    })()
  }, [])

  /* filter + sort + optional reverse */
  const filteredSongs = useMemo(() => {
    const list = Object.entries(songs).filter(([n, d]) =>
      (n.toLowerCase().includes(searchTerm.toLowerCase()) ||
       d.artist.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (packFilter === "all" || d.pack === packFilter)
    )

    list.sort(([aName, a], [bName, b]) => {
      switch (sortKey) {
        case "duration":
          return parseDuration(a.duration) - parseDuration(b.duration)
        case "difficulty":
          return (a.at?.level ?? a.in?.level ?? 0) - (b.at?.level ?? b.in?.level ?? 0)
        case "version":
          return compareVersions(a.version, b.version)
        default:
          return aName.localeCompare(bName)
      }
    })

    return sortReverse ? list.reverse() : list   // ← NEW
  }, [songs, searchTerm, packFilter, sortKey, sortReverse])

  useEffect(() => setVisibleCount(30), [searchTerm, packFilter, sortKey, sortReverse])
  useEffect(() => {
    if (!loaderRef.current) return
    const io = new IntersectionObserver((e) => {
      if (e[0].isIntersecting)
        setVisibleCount((c) => Math.min(c + 30, filteredSongs.length))
    })
    io.observe(loaderRef.current)
    return () => io.disconnect()
  }, [filteredSongs.length])

  /* colours */
  const badgeColour = (d: string) => ({
    ez: "bg-green-800 text-green-200 hover:bg-green-700",
    hd: "bg-blue-800 text-blue-200 hover:bg-blue-700",
    in: "bg-red-800 text-red-200 hover:bg-red-700",
    at: "bg-gray-700 text-gray-200 hover:bg-gray-600",
  } as Record<string, string>)[d] ?? ""
  const diffColour = (d: string) => ({
    ez: "text-green-400",
    hd: "text-blue-400",
    in: "text-red-400",
    at: "text-gray-400",
  } as Record<string, string>)[d] ?? ""

  /* ---------- render ---------- */
  return (
    <div className="space-y-6">
      {/* header */}
      <div className="text-center">
        <h2 className="mb-2 text-3xl font-bold text-purple-400">Song Database</h2>
        <p className="text-gray-400">Explore all songs with detailed information and statistics</p>
      </div>

      {/* filter bar */}
      <div className="flex flex-wrap items-center gap-4">
        {/* search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search songs or artists..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border-gray-600 bg-gray-700 pl-10 text-white placeholder:text-gray-400"
          />
        </div>

        {/* pack */}
        <Select value={packFilter} onValueChange={setPackFilter}>
          <SelectTrigger className="w-40 border-gray-600 bg-gray-700 text-gray-200">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Pack" />
          </SelectTrigger>
          <SelectContent className="border-gray-700 bg-gray-800">
            <SelectItem value="all" className="text-gray-200 hover:bg-gray-700">All Packs</SelectItem>
            {packs.map((p) => (
              <SelectItem key={p} value={p} className="capitalize text-gray-200 hover:bg-gray-700">{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* sort */}
        <Select value={sortKey} onValueChange={setSortKey}>
          <SelectTrigger className="w-48 border-gray-600 bg-gray-700 text-gray-200">
            <ArrowDownAZ className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent className="border-gray-700 bg-gray-800">
            <SelectItem value="name"       className="text-gray-200 hover:bg-gray-700">Alphabetical</SelectItem>
            <SelectItem value="duration"   className="text-gray-200 hover:bg-gray-700">Duration</SelectItem>
            <SelectItem value="difficulty" className="text-gray-200 hover:bg-gray-700">Difficulty (AT/IN)</SelectItem>
            <SelectItem value="version"    className="text-gray-200 hover:bg-gray-700">Version</SelectItem>
          </SelectContent>
        </Select>

        {/* reverse toggle */}
          <button
            onClick={() => setSortReverse((p) => !p)}
            className="h-10 flex items-center gap-2 rounded-md border border-gray-600 bg-gray-700 px-3 text-gray-200 hover:bg-gray-600 transition"
            title="Toggle ascending / descending"
          >
            <ArrowDownUp
              className={`h-4 w-4 transition-transform ${sortReverse ? "rotate-180" : ""}`}
            />
            {sortReverse ? "Desc" : "Asc"}
          </button>

      </div>

      {/* Songs List */}
      <div className="grid gap-4">
        {filteredSongs.slice(0, visibleCount).map(([songName, songData]) => (
          <Card key={songName} className="border-gray-700/50 bg-gray-900/50">
            {/* header */}
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl text-gray-200">
                    {songName}
                  </CardTitle>
                  <div className="mt-1 flex items-center gap-4 text-sm text-gray-400">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {songData.duration}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      v{songData.version}
                    </div>
                    <div className="flex items-center gap-1 capitalize">
                      <Music2 className="h-3 w-3" />
                      {songData.pack}
                    </div>
                  </div>
                </div>
                {songData.original && (
                  <Badge className="bg-green-800 text-green-200">Original</Badge>
                )}
              </div>
            </CardHeader>

            {/* body */}
            <CardContent>
              <Tabs defaultValue="charts" className="w-full">
                <TabsList className="grid w-full grid-cols-3 border-gray-700 bg-gray-800">
                  <TabsTrigger value="charts" className="data-[state=active]:bg-gray-700">
                    Charts
                  </TabsTrigger>
                  <TabsTrigger value="credits" className="data-[state=active]:bg-gray-700">
                    Credits
                  </TabsTrigger>
                  <TabsTrigger value="stats" className="data-[state=active]:bg-gray-700">
                    Stats
                  </TabsTrigger>
                </TabsList>

                {/* charts */}
                <TabsContent value="charts" className="mt-4">
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    {(["ez", "hd", "in", "at"] as const).map((d) => {
                      const diffData = songData[d]
                      if (!diffData) return null
                      return (
                        <div
                          key={d}
                          className="rounded-lg border border-gray-700 bg-gray-800/50 p-3"
                        >
                          <div className="mb-2 flex items-center justify-between">
                            <Badge className={badgeColour(d)}>{d.toUpperCase()}</Badge>
                            <span className={`font-bold ${diffColour(d)}`}>{diffData.level}</span>
                          </div>
                          <div className="text-xs text-gray-400">
                            <div>Notes: {diffData.notes}</div>
                            <div className="mt-1">Charter: {diffData.charter}</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </TabsContent>

                {/* credits */}
                <TabsContent value="credits" className="mt-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Music2 className="h-4 w-4 text-purple-400" />
                        <span className="text-gray-400">Artist:</span>
                        <span className="text-gray-200">{songData.artist}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Palette className="h-4 w-4 text-green-400" />
                        <span className="text-gray-400">Illustration:</span>
                        <span className="text-gray-200">{songData.illustration}</span>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* stats */}
                <TabsContent value="stats" className="mt-4">
                  {loading ? (
                    <div className="py-4 text-center text-gray-400">Loading statistics...</div>
                  ) : error ? (
                    <div className="py-4 text-center">
                      <p className="mb-2 text-red-400">⚠️ {error}</p>
                      <button onClick={() => setLoading(true) || setError(null)} className="text-sm text-purple-400 underline hover:text-purple-300">
                        Try again
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {(["EZ", "HD", "IN", "AT"] as const).map((d) => {
                        const diffKey = `${songName}-${d}`
                        const stats = songStats[diffKey]?.[0]
                        if (!songData[d.toLowerCase() as keyof SongData]) return null
                        return (
                          <div
                            key={d}
                            className="rounded-lg border border-gray-700/50 bg-gray-800/30 p-3"
                          >
                            <div className="mb-3 flex items-center gap-2">
                              <Badge className={badgeColour(d.toLowerCase())}>{d}</Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-xs md:grid-cols-4">
                              {/* phis */}
                              <div>
                                <div className="mb-1 flex items-center gap-1 text-yellow-400">
                                  <Trophy className="h-3 w-3" />
                                  Phis (100%)
                                </div>
                                <div className="font-medium text-gray-300">{stats?.numberOfPhis ?? 0}</div>
                              </div>
                              {/* acc */}
                              <div>
                                <div className="mb-1 flex items-center gap-1 text-green-400">
                                  <Target className="h-3 w-3" />
                                  Avg Accuracy
                                </div>
                                <div className="font-medium text-gray-300">
                                  {stats?.averageAccuracy ? `${stats.averageAccuracy.toFixed(2)}%` : "N/A"}
                                </div>
                              </div>
                              {/* score */}
                              <div>
                                <div className="mb-1 flex items-center gap-1 text-blue-400">
                                  <BarChart3 className="h-3 w-3" />
                                  Avg Score
                                </div>
                                <div className="font-medium text-gray-300">
                                  {stats?.averageScore ? stats.averageScore.toLocaleString() : "N/A"}
                                </div>
                              </div>
                              {/* total */}
                              <div>
                                <div className="mb-1 flex items-center gap-1 text-purple-400">
                                  <User className="h-3 w-3" />
                                  Total Scores
                                </div>
                                <div className="font-medium text-gray-300">{stats?.totalScores ?? 0}</div>
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

        {/* sentinel */}
        {visibleCount < filteredSongs.length && <div ref={loaderRef} className="h-1" />}
      </div>

      {/* empty state */}
      {filteredSongs.length === 0 && (
        <div className="py-8 text-center text-gray-400">
          <Music2 className="mx-auto mb-4 h-12 w-12 opacity-50" />
          <p>No songs match your current filters.</p>
          <p className="text-sm">Try adjusting your search or filter criteria.</p>
        </div>
      )}
    </div>
  )
}
