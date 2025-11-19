'use client'

import { gql } from '@apollo/client'
import { useQuery } from '@apollo/client/react'

const GET_COUNTRIES = gql`
  query GetCountries {
    countries { code name }
  }
`

type CountriesResult = {
  countries: { code: string; name: string }[]
}

export default function CountriesPage() {
  const { data, loading, error } = useQuery<CountriesResult>(GET_COUNTRIES)

  if (loading) return <p>Loading…</p>
  if (error) return <p>Error: {error.message}</p>

  return (
    <main className="p-6 space-y-2">
      <h1 className="text-2xl font-semibold">Countries</h1>
      <ul className="list-disc pl-6">
        {data?.countries.map((c: { code: string; name: string }) => (
          <li key={c.code}>{c.name}</li>
        ))}
      </ul>
    </main>
  )
}
