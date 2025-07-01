"use client"

import { Button } from "@/components/ui/button"
import { LogOut, UserIcon } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { User } from "@/components/login-prompt"

interface AuthButtonProps {
  user: User | null
  onLogout: () => void
}

export function AuthButton({ user, onLogout }: AuthButtonProps) {
  if (!user) {
    return <Button onClick={() => alert("Please use the login form!")}>Sign In</Button>
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2 text-sm text-gray-300">
        <UserIcon className="h-4 w-4" />
        <span className="font-medium">{user.username}</span>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="border-gray-600 text-gray-200 hover:bg-gray-700 bg-transparent"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Account
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 bg-gray-800 border-gray-700">
          <DropdownMenuItem onClick={onLogout} className="text-gray-200 hover:bg-gray-700">
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
