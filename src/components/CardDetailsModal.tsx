'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog'
import { gql, useSubscription, useMutation } from '@apollo/client'
import { useState, useEffect, FormEvent } from 'react'

/* ============================================
   GraphQL
============================================ */

const CARD_SUB = gql`
  subscription CardById($id: uuid!) {
    cards_by_pk(id: $id) {
      id
      title
      description
    }
  }
`

const UPDATE_CARD = gql`
  mutation UpdateCard(
    $id: uuid!
    $title: String!
    $description: String!
  ) {
    update_cards_by_pk(
      pk_columns: { id: $id }
      _set: {
        title: $title
        description: $description
      }
    ) {
      id
      title
      description
    }
  }
`

/* ============================================
   Component
============================================ */

export default function CardDetailsModal({
  cardId,
  children,
}: {
  cardId: string
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  const { data, loading } = useSubscription(CARD_SUB, {
    variables: { id: cardId },
    skip: !open,
  })

  const [updateCard, { loading: saving }] = useMutation(UPDATE_CARD)

  /* Sync local fields when modal opens OR subscription updates */
  useEffect(() => {
    if (!open) return
    const card = data?.cards_by_pk
    if (card) {
      setTitle(card.title ?? '')
      setDescription(card.description ?? '')
    }
  }, [open, data])

  /* Submit */
  async function handleSubmit(e: FormEvent) {
    e.preventDefault()

    const trimmed = title.trim() || 'Untitled card'

    await updateCard({
      variables: {
        id: cardId,
        title: trimmed,
        description: description.trim(),
      },
    })

    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {/* children = transparent button over card */}
        {children}
      </DialogTrigger>

      <DialogContent className="bg-slate-950 border border-slate-800 text-slate-50">

        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            Edit card
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Update this card’s title and description.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <p className="text-sm text-slate-400 mt-4">Loading…</p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">

            {/* Title */}
            <div className="space-y-1">
              <label className="block text-xs uppercase tracking-wide text-slate-400">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/40"
              />
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="block text-xs uppercase tracking-wide text-slate-400">
                Description
              </label>
              <textarea
                rows={5}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Add a detailed description…"
                className="w-full resize-none rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/40"
              />
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="rounded bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-400 disabled:opacity-60"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
