'use client'

import { gql, useSubscription } from '@apollo/client'
import { useAuthenticationStatus } from '@nhost/react'

const BOARDS = gql`
  subscription Boards {
    boards(order_by: { created_at: desc }) {
      id
      name
    }
  }
`

export default function BoardsPage() {
  const { isAuthenticated } = useAuthenticationStatus()
  const { data, loading, error } = useSubscription(BOARDS, {
    skip: !isAuthenticated,
  })

  if (!isAuthenticated) return <p className="p-6">Please sign in</p>
  if (loading) return <p className="p-6">Loading…</p>
  if (error) return <p className="p-6">Error: {error.message}</p>

  return (
    <ul className="p-6 list-disc pl-6">
      {data.boards.map((b: { id: string; name: string }) => (
        <li key={b.id}>{b.name}</li>
      ))}
    </ul>
  )
}
