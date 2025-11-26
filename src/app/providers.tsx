'use client'

import { PropsWithChildren } from 'react'
import { NhostProvider } from '@nhost/react'
import { NhostApolloProvider } from '@nhost/react-apollo'
import { nhost } from '@/lib/nhost'

export default function Providers({ children }: PropsWithChildren) {
  return (
    <NhostProvider nhost={nhost}>
      <NhostApolloProvider nhost={nhost as any}>
        {children}
      </NhostApolloProvider>
    </NhostProvider>
  )
}
