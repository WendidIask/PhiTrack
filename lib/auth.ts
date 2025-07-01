import { getSupabase } from "./supabase"

export type User = {
  id: string
  username: string
  email: string
}

// Store the current user in memory
let currentUser: User | null = null

// Get the current user from memory or localStorage
export const getCurrentUser = async (): Promise<User | null> => {
  if (currentUser) return currentUser

  // Try to get from localStorage
  const storedUser = localStorage.getItem("phigros-user")
  if (storedUser) {
    try {
      currentUser = JSON.parse(storedUser)
      return currentUser
    } catch (e) {
      console.error("Failed to parse stored user", e)
    }
  }

  return null
}

// Set the current user in memory and localStorage
export const setCurrentUser = (user: User | null) => {
  currentUser = user
  if (user) {
    localStorage.setItem("phigros-user", JSON.stringify(user))
  } else {
    localStorage.removeItem("phigros-user")
  }
}

// Login or register a user
export const loginOrRegister = async (email: string, username: string): Promise<User> => {
  const supabase = getSupabase()

  // Check if user exists
  const { data: existingUsers } = await supabase.from("users").select("*").eq("email", email).limit(1)

  if (existingUsers && existingUsers.length > 0) {
    // User exists, update username if needed
    const user = existingUsers[0]
    if (user.username !== username) {
      await supabase.from("users").update({ username }).eq("id", user.id)
    }

    const loggedInUser = {
      id: user.id,
      username: username || user.username,
      email: user.email,
    }

    setCurrentUser(loggedInUser)
    return loggedInUser
  } else {
    // Create new user
    const { data: newUser, error } = await supabase.from("users").insert([{ email, username }]).select().single()

    if (error) throw new Error(error.message)

    const loggedInUser = {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
    }

    setCurrentUser(loggedInUser)
    return loggedInUser
  }
}

// Logout the current user
export const logout = () => {
  setCurrentUser(null)
}
