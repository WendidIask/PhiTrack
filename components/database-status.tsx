"use client"

import { useState, useEffect } from "react"
import { Database, CheckCircle, XCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { getScores } from "@/lib/scores"

export function DatabaseStatus() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null)
  const [totalScores, setTotalScores] = useState<number>(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkDatabaseStatus()
  }, [])

  const checkDatabaseStatus = async () => {
    try {
      const scores = await getScores()
      setIsConnected(true)
      setTotalScores(scores.length)
      setError(null)
    } catch (error) {
      console.error("Database check error:", error)
      setIsConnected(false)
      setError("Database connection failed")
    }
  }

  if (isConnected === null) {
    return (
      <Badge variant="outline" className="flex items-center gap-1">
        <Database className="h-3 w-3 animate-pulse" />
        Checking...
      </Badge>
    )
  }

  return (
    <Badge variant={isConnected ? "default" : "destructive"} className="flex items-center gap-1">
      {isConnected ? (
        <>
          <CheckCircle className="h-3 w-3" />
          DB Connected ({totalScores} scores)
        </>
      ) : (
        <>
          <XCircle className="h-3 w-3" />
          {error || "DB Error"}
        </>
      )}
    </Badge>
  )
}
