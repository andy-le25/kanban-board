'use client'

import { PropsWithChildren } from 'react'
import { ApolloNextAppProvider } from '@apollo/client-integration-nextjs'
import { makeClient } from './apollo-client'

export default function Providers({ children }: PropsWithChildren) {
  return (
    <ApolloNextAppProvider makeClient={makeClient}>
      {children}
    </ApolloNextAppProvider>
  )
}
