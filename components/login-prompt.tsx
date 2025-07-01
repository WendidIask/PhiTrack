"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Music, LogIn, UserIcon, Mail, Lock, Loader2, UserPlus, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export type User = {
  id: string
  username: string
  email: string
}

interface LoginPromptProps {
  onLogin: (user: User) => void
}

export function LoginPrompt({ onLogin }: LoginPromptProps) {
  const [loginIdentifier, setLoginIdentifier] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [registerUsername, setRegisterUsername] = useState("")
  const [registerEmail, setRegisterEmail] = useState("")
  const [registerPassword, setRegisterPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle")

  // Check username availability with debounce
  useEffect(() => {
    if (!registerUsername || registerUsername.length < 3) {
      setUsernameStatus("idle")
      return
    }

    // Validate username format
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/
    if (!usernameRegex.test(registerUsername)) {
      setUsernameStatus("invalid")
      return
    }

    setUsernameStatus("checking")

    const timeoutId = setTimeout(async () => {
      try {
        const response = await fetch("/api/auth/check-username", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username: registerUsername }),
        })

        if (response.ok) {
          // Parse JSON only when the response is OK (2xx)
          const data = (await response.json()) as { available: boolean }
          setUsernameStatus(data.available ? "available" : "taken")
        } else {
          // Read the raw body for logging/debugging purposes
          const text = await response.text()
          console.warn("Username check failed:", text)
          setUsernameStatus("error")
        }
      } catch (error) {
        console.error("Username check error:", error)
        setUsernameStatus("error")
      }
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [registerUsername])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!loginIdentifier.trim() || !loginPassword.trim()) return

    try {
      setIsLoading(true)
      setError(null)
      setSuccess(null)

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          identifier: loginIdentifier.trim(),
          password: loginPassword.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Login failed")
      }

      // Store user in localStorage for persistence
      localStorage.setItem("phigros-user", JSON.stringify(data.user))
      onLogin(data.user)
    } catch (err) {
      console.error("Login error:", err)
      setError(err instanceof Error ? err.message : "Failed to login. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!registerUsername.trim() || !registerEmail.trim() || !registerPassword.trim()) return

    if (registerPassword !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (registerPassword.length < 6) {
      setError("Password must be at least 6 characters long")
      return
    }

    if (usernameStatus !== "available") {
      setError("Please choose a valid and available username")
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      setSuccess(null)

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: registerEmail.trim(),
          password: registerPassword.trim(),
          username: registerUsername.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Registration failed")
      }

      setSuccess("Account created successfully! You can now login.")
      // Clear registration form
      setRegisterUsername("")
      setRegisterEmail("")
      setRegisterPassword("")
      setConfirmPassword("")
      setUsernameStatus("idle")
    } catch (err) {
      console.error("Registration error:", err)
      setError(err instanceof Error ? err.message : "Failed to register. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const getUsernameStatusIcon = () => {
    switch (usernameStatus) {
      case "checking":
        return <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
      case "available":
        return <Check className="h-4 w-4 text-green-400" />
      case "taken":
        return <X className="h-4 w-4 text-red-400" />
      case "invalid":
        return <X className="h-4 w-4 text-red-400" />
      default:
        return null
    }
  }

  const getUsernameStatusMessage = () => {
    switch (usernameStatus) {
      case "checking":
        return "Checking availability..."
      case "available":
        return "Username is available!"
      case "taken":
        return "Username is already taken"
      case "invalid":
        return "Username must be 3-20 characters, letters, numbers, and underscores only"
      default:
        return ""
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gray-800 border-gray-700">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Music className="h-8 w-8 text-purple-600" />
            <CardTitle className="text-2xl text-purple-400">Phigros Tracker</CardTitle>
          </div>
          <CardDescription className="text-gray-300">Sign in or create an account to track your scores</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive" className="bg-red-900/50 border-red-500/50 text-red-200">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-500/50 bg-green-900/50">
              <AlertDescription className="text-green-200">{success}</AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-gray-700 border-gray-600">
              <TabsTrigger value="login" className="data-[state=active]:bg-gray-600 data-[state=active]:text-white">
                Sign In
              </TabsTrigger>
              <TabsTrigger value="register" className="data-[state=active]:bg-gray-600 data-[state=active]:text-white">
                Register
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-identifier" className="text-gray-200">
                    Username or Email
                  </Label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="login-identifier"
                      type="text"
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      placeholder="username or email@example.com"
                      className="pl-10 bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 focus:border-purple-500"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password" className="text-gray-200">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="login-password"
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="pl-10 bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 focus:border-purple-500"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Signing In...
                    </>
                  ) : (
                    <>
                      <LogIn className="h-4 w-4 mr-2" />
                      Sign In
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register" className="space-y-4">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-username" className="text-gray-200">
                    Username
                  </Label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="register-username"
                      type="text"
                      value={registerUsername}
                      onChange={(e) => setRegisterUsername(e.target.value)}
                      placeholder="Choose a unique username"
                      className="pl-10 pr-10 bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 focus:border-purple-500"
                      required
                      disabled={isLoading}
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">{getUsernameStatusIcon()}</div>
                  </div>
                  {usernameStatus !== "idle" && (
                    <p
                      className={`text-xs ${
                        usernameStatus === "available"
                          ? "text-green-400"
                          : usernameStatus === "checking"
                            ? "text-gray-400"
                            : "text-red-400"
                      }`}
                    >
                      {getUsernameStatusMessage()}
                    </p>
                  )}
                  <p className="text-xs text-gray-400">This will be your display name and login username</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-email" className="text-gray-200">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="register-email"
                      type="email"
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="pl-10 bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 focus:border-purple-500"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-password" className="text-gray-200">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="register-password"
                      type="password"
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      placeholder="Create a password (min 6 characters)"
                      className="pl-10 bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 focus:border-purple-500"
                      required
                      disabled={isLoading}
                      minLength={6}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="text-gray-200">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your password"
                      className="pl-10 bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 focus:border-purple-500"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  disabled={isLoading || usernameStatus !== "available"}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Create Account
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
