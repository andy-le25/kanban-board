'use client'

import Link from 'next/link'
import { useAuthenticationStatus, useSignOut } from '@nhost/react'

export default function Navbar() {
  const { isAuthenticated } = useAuthenticationStatus()
  const { signOut } = useSignOut()

  return (
    <header className="w-full p-4 bg-slate-900 border-b border-slate-800">
      <nav className="mx-auto flex max-w-4xl justify-between items-center px-4 py-3">
        <Link href="/" className="font-bold text-lg">
          Kanban Board
        </Link>

        <div className="flex gap-4 text-sm items-center">
          <Link href="/" className="hover:underline">
            Home
          </Link>

          <Link href="/boards" className="hover:underline">
            Boards
          </Link>

          {!isAuthenticated && (
            <Link href="/login" className="hover:underline">
              Login
            </Link>
          )}

          {isAuthenticated && (
            <button
              onClick={() => signOut()}
              className="px-3 py-1 border rounded hover:bg-slate-800"
            >
              Sign out
            </button>
          )}
        </div>
      </nav>
    </header>
  )
}
