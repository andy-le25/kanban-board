'use client'

import { useState, FormEvent } from 'react'
import {
  useSignInEmailPassword,
  useAuthenticationStatus,
  useSignOut,
} from '@nhost/react'

export default function LoginPage() {
  const { isAuthenticated } = useAuthenticationStatus()
  const { signOut } = useSignOut()
  const { signInEmailPassword, isLoading, isError, error } =
    useSignInEmailPassword()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    await signInEmailPassword(email, password)
  }

  if (isAuthenticated) {
    return (
      <div className="p-6 space-y-4">
        <p className="text-lg">You are signed in.</p>
        <button
          type="button"
          onClick={() => signOut()}
          className="bg-white text-black px-3 py-2 rounded"
        >
          Sign out
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4 max-w-sm">
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        className="border px-3 py-2 rounded text-black placeholder-gray-500"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        className="border px-3 py-2 rounded text-black placeholder-gray-500"
      />
      <button
        type="submit"
        disabled={isLoading}
        className="bg-white text-black px-3 py-2 rounded"
      >
        {isLoading ? 'Signing in…' : 'Sign in'}
      </button>

      {isError && (
        <p className="text-red-500 text-sm">
          {error?.message ?? 'Sign in failed'}
        </p>
      )}
    </form>
  )
}
