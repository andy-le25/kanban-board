'use client'

import {
  gql,
  useSubscription,
  useMutation,
} from '@apollo/client'
import { useParams } from 'next/navigation'
import { useAuthenticationStatus } from '@nhost/react'
import { useState, useEffect, FormEvent } from 'react'
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from '@hello-pangea/dnd'
import CardDetailsModal from '@/components/CardDetailsModal'

type Column = {
  id: string
  name: string
  position: number
}

type Card = {
  id: string
  title: string
  position: number
  column_id: string
}

/* ===========================
   Subscriptions
=========================== */

const BOARD = gql`
  subscription BoardById($id: uuid!) {
    boards_by_pk(id: $id) {
      id
      name
    }
  }
`

const COLUMNS = gql`
  subscription ColumnsByBoard($id: uuid!) {
    columns(
      where: { board_id: { _eq: $id } }
      order_by: { position: asc }
    ) {
      id
      name
      position
    }
  }
`

const CARDS = gql`
  subscription CardsByBoard($id: uuid!) {
    cards(
      where: { column: { board_id: { _eq: $id } } }
      order_by: { position: asc }
    ) {
      id
      title
      position
      column_id
    }
  }
`

/* ===========================
   Mutations
=========================== */

const INSERT_COLUMN = gql`
  mutation InsertColumn(
    $boardId: uuid!
    $name: String!
    $position: float8!
  ) {
    insert_columns_one(
      object: { board_id: $boardId, name: $name, position: $position }
    ) {
      id
      name
      position
    }
  }
`

const INSERT_CARD = gql`
  mutation InsertCard(
    $columnId: uuid!
    $title: String!
    $position: float8!
  ) {
    insert_cards_one(
      object: {
        column_id: $columnId
        title: $title
        position: $position
      }
    ) {
      id
      title
      position
      column_id
    }
  }
`

const UPDATE_COLUMN_POSITIONS = gql`
  mutation UpdateColumnPosition($id: uuid!, $position: float8!) {
    update_columns_by_pk(
      pk_columns: { id: $id }
      _set: { position: $position }
    ) {
      id
      position
    }
  }
`

const UPDATE_CARD_POSITIONS = gql`
  mutation UpdateCardPosition(
    $id: uuid!
    $columnId: uuid!
    $position: float8!
  ) {
    update_cards_by_pk(
      pk_columns: { id: $id }
      _set: { column_id: $columnId, position: $position }
    ) {
      id
      position
      column_id
    }
  }
`

const DELETE_CARD = gql`
  mutation DeleteCard($id: uuid!) {
    delete_cards_by_pk(id: $id) {
      id
    }
  }
`

const DELETE_COLUMN = gql`
  mutation DeleteColumn($id: uuid!) {
    delete_columns_by_pk(id: $id) {
      id
    }
  }
`

const UPDATE_BOARD = gql`
  mutation UpdateBoard($id: uuid!, $name: String!) {
    update_boards_by_pk(
      pk_columns: { id: $id }
      _set: { name: $name }
    ) {
      id
      name
    }
  }
`

const UPDATE_COLUMN = gql`
  mutation UpdateColumn($id: uuid!, $name: String!) {
    update_columns_by_pk(
      pk_columns: { id: $id }
      _set: { name: $name }
    ) {
      id
      name
    }
  }
`

const UPDATE_CARD = gql`
  mutation UpdateCard($id: uuid!, $title: String!) {
    update_cards_by_pk(
      pk_columns: { id: $id }
      _set: { title: $title }
    ) {
      id
      title
    }
  }
`

/* ===========================
   Component
=========================== */

export default function BoardPage() {
  const params = useParams()
  const id = params.id as string
  const { isAuthenticated } = useAuthenticationStatus()

  const { data: boardData } = useSubscription(BOARD, {
    variables: { id },
    skip: !isAuthenticated,
  })

  const { data: columnsData } = useSubscription(COLUMNS, {
    variables: { id },
    skip: !isAuthenticated,
  })

  const { data: cardsData } = useSubscription(CARDS, {
    variables: { id },
    skip: !isAuthenticated,
  })

  const [insertColumn] = useMutation(INSERT_COLUMN)
  const [insertCard] = useMutation(INSERT_CARD)
  const [updateColumnPos] = useMutation(UPDATE_COLUMN_POSITIONS)
  const [updateCardPos] = useMutation(UPDATE_CARD_POSITIONS)
  const [deleteCard] = useMutation(DELETE_CARD)
  const [deleteColumn] = useMutation(DELETE_COLUMN)
  const [updateBoard] = useMutation(UPDATE_BOARD)
  const [updateColumnName] = useMutation(UPDATE_COLUMN)
  const [updateCardTitle] = useMutation(UPDATE_CARD)

  const [colName, setColName] = useState('')
  const [cardTitle, setCardTitle] = useState<Record<string, string>>({})

  const [columnMenuOpenId, setColumnMenuOpenId] =
    useState<string | null>(null)
  const [cardMenuOpenId, setCardMenuOpenId] =
    useState<string | null>(null)

  const [editingColumnId, setEditingColumnId] =
    useState<string | null>(null)
  const [editingColumnName, setEditingColumnName] = useState('')

  const [editingCardId, setEditingCardId] =
    useState<string | null>(null)
  const [editingCardTitle, setEditingCardTitle] = useState('')

  const [columns, setColumns] = useState<Column[]>([])
  const [cards, setCards] = useState<Card[]>([])
  const [isDragging, setIsDragging] = useState(false)

  const board = boardData?.boards_by_pk

  // keep columns in sync with server
  useEffect(() => {
    if (columnsData?.columns) {
      setColumns(columnsData.columns)
    }
  }, [columnsData])

  // keep cards in sync when not dragging
  useEffect(() => {
    if (!isDragging && cardsData?.cards) {
      setCards(cardsData.cards)
    }
  }, [cardsData, isDragging])

  if (!isAuthenticated) return <p className="p-6">Please sign in</p>
  if (!board) return <p className="p-6">Loading board...</p>

  /* ===========================
     Create Column
  ============================ */

  async function handleCreateColumn(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!colName.trim()) return

    const position = (columns[columns.length - 1]?.position || 0) + 1

    await insertColumn({
      variables: { boardId: id, name: colName.trim(), position },
    })

    setColName('')
  }

  /* ===========================
     Create Card
  ============================ */

  async function handleCreateCard(e: FormEvent, columnId: string) {
    e.preventDefault()

    const title = cardTitle[columnId]?.trim()
    if (!title) return

    const columnCards = cards
      .filter(c => c.column_id === columnId)
      .sort((a, b) => a.position - b.position)

    const position =
      (columnCards[columnCards.length - 1]?.position || 0) + 1

    await insertCard({
      variables: { columnId, title, position },
    })

    setCardTitle({ ...cardTitle, [columnId]: '' })
  }

  /* ===========================
     Drag Handling - smooth
  ============================ */

  function handleDragEnd(result: DropResult) {
    const destination = result.destination
    if (!destination) {
      setIsDragging(false)
      return
    }

    const { source, type } = result

    // Columns
    if (type === 'COLUMN') {
      if (
        destination.droppableId === source.droppableId &&
        destination.index === source.index
      ) {
        setIsDragging(false)
        return
      }

      setColumns(prev => {
        const reordered = Array.from(prev)
        const [moved] = reordered.splice(source.index, 1)
        reordered.splice(destination.index, 0, moved)

        const updates: Promise<unknown>[] = []

        reordered.forEach((col, index) => {
          const newPos = index + 1
          if (col.position !== newPos) {
            updates.push(
              updateColumnPos({
                variables: { id: col.id, position: newPos },
              })
            )
          }
        })

        if (updates.length) {
          Promise.all(updates).catch(err => {
            console.error('Failed to update column positions', err)
          })
        }

        // return new array with updated positions
        return reordered.map((col, index) => ({
          ...col,
          position: index + 1,
        }))
      })

      setIsDragging(false)
      return
    }

    // Cards
    if (type === 'CARD') {
      const startColId = source.droppableId
      const endColId = destination.droppableId

      if (
        startColId === endColId &&
        source.index === destination.index
      ) {
        setIsDragging(false)
        return
      }

      setCards(prev => {
        // group cards by column
        const byColumn: Record<string, Card[]> = {}
        prev.forEach(card => {
          if (!byColumn[card.column_id]) byColumn[card.column_id] = []
          byColumn[card.column_id].push(card)
        })

        Object.values(byColumn).forEach(list =>
          list.sort((a, b) => a.position - b.position)
        )

        const sourceList = byColumn[startColId] ?? []
        const destList =
          byColumn[endColId] ?? (byColumn[endColId] = [])

        if (!sourceList[source.index]) {
          return prev
        }

        const movedOriginal = sourceList[source.index]

        // remove from source, insert into dest - references only
        sourceList.splice(source.index, 1)
        destList.splice(destination.index, 0, movedOriginal)

        const updates: Promise<unknown>[] = []
        const nextCards: Card[] = []

        // rebuild flat list with new positions and columns
        Object.entries(byColumn).forEach(([colId, list]) => {
          list.forEach((card, idx) => {
            const newPos = idx + 1
            const changed =
              card.column_id !== colId || card.position !== newPos

            const newCard: Card = {
              ...card,
              column_id: colId,
              position: newPos,
            }

            nextCards.push(newCard)

            if (changed) {
              updates.push(
                updateCardPos({
                  variables: {
                    id: card.id,
                    columnId: colId,
                    position: newPos,
                  },
                })
              )
            }
          })
        })

        if (updates.length) {
          Promise.all(updates).catch(err => {
            console.error('Failed to update card positions', err)
          })
        }

        return nextCards
      })

      setIsDragging(false)
      return
    }

    setIsDragging(false)
  }

  /* ===========================
     Inline Renames
  ============================ */

  async function commitColumnRename(col: Column) {
    const name = editingColumnName.trim() || 'Untitled column'
    if (name !== col.name) {
      await updateColumnName({ variables: { id: col.id, name } })
    }
    setEditingColumnId(null)
  }

  async function commitCardRename(card: Card) {
    const title = editingCardTitle.trim() || 'Untitled card'
    if (title !== card.title) {
      await updateCardTitle({ variables: { id: card.id, title } })
    }
    setEditingCardId(null)
  }

  /* ===========================
     Render
  ============================ */

  return (
    <div className="p-6 space-y-6">
      <input
        type="text"
        defaultValue={board.name}
        onBlur={e => {
          const value = e.target.value.trim() || 'Untitled board'
          if (value !== board.name) {
            updateBoard({ variables: { id, name: value } })
          }
        }}
        className="text-2xl font-semibold bg-transparent outline-none"
      />

      <DragDropContext
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
      >
        <Droppable
          droppableId="columns"
          direction="horizontal"
          type="COLUMN"
        >
          {provided => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="flex gap-6 overflow-x-auto pb-4"
            >
              {columns.map((col, colIndex) => (
                <Draggable
                  key={col.id}
                  draggableId={col.id}
                  index={colIndex}
                >
                  {dragProvided => (
                    <div
                      ref={dragProvided.innerRef}
                      {...dragProvided.draggableProps}
                      className="w-72 bg-slate-900 border border-slate-700 rounded p-4 flex-shrink-0"
                    >
                      <div className="relative flex items-center gap-2 mb-3">
                        <div
                          {...dragProvided.dragHandleProps}
                          className="cursor-grab text-slate-400 select-none"
                        >
                          ::
                        </div>

                        {editingColumnId === col.id ? (
                          <form
                            className="flex-1"
                            onSubmit={e => {
                              e.preventDefault()
                              commitColumnRename(col)
                            }}
                          >
                            <input
                              autoFocus
                              value={editingColumnName}
                              onChange={e =>
                                setEditingColumnName(e.target.value)
                              }
                              onBlur={() => commitColumnRename(col)}
                              className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm outline-none"
                            />
                          </form>
                        ) : (
                          <div className="font-semibold flex-1">
                            {col.name}
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() =>
                            setColumnMenuOpenId(
                              columnMenuOpenId === col.id ? null : col.id
                            )
                          }
                          className="px-1 text-slate-400 hover:text-slate-100"
                        >
                          ⋯
                        </button>

                        {columnMenuOpenId === col.id && (
                          <div className="absolute right-0 top-7 z-10 w-32 rounded bg-slate-800 border border-slate-700 shadow">
                            <button
                              type="button"
                              className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-700"
                              onClick={() => {
                                setEditingColumnId(col.id)
                                setEditingColumnName(col.name)
                                setColumnMenuOpenId(null)
                              }}
                            >
                              Rename
                            </button>
                            <button
                              type="button"
                              className="block w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-slate-700"
                              onClick={() => {
                                deleteColumn({ variables: { id: col.id } })
                                setColumnMenuOpenId(null)
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>

                      <Droppable droppableId={col.id} type="CARD">
                        {dropProvided => (
                          <div
                            ref={dropProvided.innerRef}
                            {...dropProvided.droppableProps}
                            className="space-y-2"
                          >
                            {cards
                              .filter(c => c.column_id === col.id)
                              .sort((a, b) => a.position - b.position)
                              .map((card, index) => (
                                <Draggable
                                  key={card.id}
                                  draggableId={card.id}
                                  index={index}
                                >
                                  {cardProvided => (
                                    <div
                                      ref={cardProvided.innerRef}
                                      {...cardProvided.draggableProps}
                                      className="relative p-3 rounded bg-slate-800 border border-slate-700 flex items-center gap-2 cursor-pointer"
                                    >
                                      <div
                                        {...cardProvided.dragHandleProps}
                                        className="px-1 cursor-grab text-slate-400 select-none"
                                      >
                                        ::
                                      </div>

                                      <div className="flex-1">
                                        {editingCardId === card.id ? (
                                          <form
                                            onSubmit={e => {
                                              e.preventDefault()
                                              commitCardRename(card)
                                            }}
                                          >
                                            <input
                                              autoFocus
                                              value={editingCardTitle}
                                              onChange={e =>
                                                setEditingCardTitle(
                                                  e.target.value
                                                )
                                              }
                                              onBlur={() =>
                                                commitCardRename(card)
                                              }
                                              className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm outline-none"
                                            />
                                          </form>
                                        ) : (
                                          <CardDetailsModal cardId={card.id}>
                                            <button
                                              type="button"
                                              className="w-full text-left text-sm"
                                            >
                                              {card.title}
                                            </button>
                                          </CardDetailsModal>
                                        )}
                                      </div>

                                      <button
                                        type="button"
                                        onClick={e => {
                                          e.stopPropagation()
                                          setCardMenuOpenId(
                                            cardMenuOpenId === card.id
                                              ? null
                                              : card.id
                                          )
                                        }}
                                        className="px-1 text-slate-400 hover:text-slate-100 relative z-10"
                                      >
                                        ⋯
                                      </button>

                                      {cardMenuOpenId === card.id && (
                                        <div className="absolute right-0 top-8 z-20 w-32 rounded bg-slate-800 border border-slate-700 shadow">
                                          <button
                                            type="button"
                                            className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-700"
                                            onClick={() => {
                                              setEditingCardId(card.id)
                                              setEditingCardTitle(card.title)
                                              setCardMenuOpenId(null)
                                            }}
                                          >
                                            Rename
                                          </button>
                                          <button
                                            type="button"
                                            className="block w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-slate-700"
                                            onClick={() => {
                                              deleteCard({
                                                variables: { id: card.id },
                                              })
                                              setCardMenuOpenId(null)
                                            }}
                                          >
                                            Delete
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </Draggable>
                              ))}

                            {dropProvided.placeholder}
                          </div>
                        )}
                      </Droppable>

                      <form
                        onSubmit={e => handleCreateCard(e, col.id)}
                        className="mt-4 flex flex-col gap-2"
                      >
                        <input
                          type="text"
                          placeholder="New card title"
                          value={cardTitle[col.id] || ''}
                          onChange={e =>
                            setCardTitle({
                              ...cardTitle,
                              [col.id]: e.target.value,
                            })
                          }
                          className="border px-3 py-2 rounded bg-slate-800 border-slate-700 text-slate-200"
                        />

                        <button
                          type="submit"
                          className="px-3 py-2 border rounded bg-slate-800 hover:bg-slate-700"
                        >
                          Add Card
                        </button>
                      </form>
                    </div>
                  )}
                </Draggable>
              ))}

              {provided.placeholder}

              <div className="w-72 bg-slate-900 border border-slate-700 rounded p-4 flex-shrink-0">
                <form
                  onSubmit={handleCreateColumn}
                  className="flex flex-col gap-2"
                >
                  <input
                    type="text"
                    placeholder="New column name"
                    value={colName}
                    onChange={e => setColName(e.target.value)}
                    className="border px-3 py-2 rounded bg-slate-800 border-slate-700 text-slate-200"
                  />
                  <button
                    type="submit"
                    className="px-3 py-2 border rounded bg-slate-800 hover:bg-slate-700"
                  >
                    Add Column
                  </button>
                </form>
              </div>
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  )
}
