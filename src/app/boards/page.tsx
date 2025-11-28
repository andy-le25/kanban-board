'use client'

import {
  gql,
  useSubscription,
  useMutation,
} from '@apollo/client'
import { useAuthenticationStatus } from '@nhost/react'
import { useState, useEffect, FormEvent } from 'react'
import Link from 'next/link'
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from '@hello-pangea/dnd'

/* ===========================
   TYPES
=========================== */

type Board = {
  id: string
  name: string
  position: number
}

/* ===========================
   GRAPHQL
=========================== */

const BOARDS = gql`
  subscription GetBoards {
    boards(order_by: { position: asc }) {
      id
      name
      position
    }
  }
`

const INSERT_BOARD = gql`
  mutation InsertBoard($name: String!, $position: float8!) {
    insert_boards_one(
      object: { name: $name, position: $position }
    ) {
      id
      name
      position
    }
  }
`

const UPDATE_BOARD_POS = gql`
  mutation UpdateBoardPos($id: uuid!, $position: float8!) {
    update_boards_by_pk(
      pk_columns: { id: $id }
      _set: { position: $position }
    ) {
      id
      position
    }
  }
`

const UPDATE_BOARD_NAME = gql`
  mutation UpdateBoardName($id: uuid!, $name: String!) {
    update_boards_by_pk(
      pk_columns: { id: $id }
      _set: { name: $name }
    ) {
      id
      name
    }
  }
`

const DELETE_BOARD = gql`
  mutation DeleteBoard($id: uuid!) {
    delete_boards_by_pk(id: $id) {
      id
    }
  }
`

/* ===========================
   COMPONENT
=========================== */

export default function BoardsPage() {
  const { isAuthenticated } = useAuthenticationStatus()

  const [newBoardName, setNewBoardName] = useState('')
  const [boardMenuOpenId, setBoardMenuOpenId] = useState<string | null>(null)
  const [editingBoardId, setEditingBoardId] = useState<string | null>(null)
  const [editingBoardName, setEditingBoardName] = useState('')

  const { data } = useSubscription<{ boards: Board[] }>(BOARDS, {
    skip: !isAuthenticated,
  })

  // local state for smooth, optimistic drag and drop
  const [boards, setBoards] = useState<Board[]>([])

  useEffect(() => {
    if (data?.boards) {
      setBoards(data.boards)
    }
  }, [data])

  const [insertBoard] = useMutation(INSERT_BOARD)
  const [updateBoardPos] = useMutation(UPDATE_BOARD_POS)
  const [updateBoardName] = useMutation(UPDATE_BOARD_NAME)
  const [deleteBoard] = useMutation(DELETE_BOARD)

  if (!isAuthenticated) return <p className="p-6">Please sign in</p>

  /* ===========================
     CREATE BOARD
  =========================== */

  async function handleCreateBoard(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const name = newBoardName.trim()
    if (!name) return

    const lastPosition = boards[boards.length - 1]?.position ?? 0
    const position = lastPosition + 1

    await insertBoard({
      variables: { name, position },
    })

    setNewBoardName('')
  }

  /* ===========================
     DRAG AND DROP
  =========================== */

  function handleDragEnd(result: DropResult) {
    if (!result.destination) return

    const { source, destination } = result

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return
    }

    setBoards(prevBoards => {
      const reordered = Array.from(prevBoards)
      const [moved] = reordered.splice(source.index, 1)
      reordered.splice(destination.index, 0, moved)

      const updates: Promise<unknown>[] = []

      // reindex only changed boards, send mutations in background
      reordered.forEach((board, index) => {
        const newPosition = index + 1
        if (board.position !== newPosition) {
          const updatedBoard = { ...board, position: newPosition }
          reordered[index] = updatedBoard

          updates.push(
            updateBoardPos({
              variables: {
                id: updatedBoard.id,
                position: newPosition,
              },
            })
          )
        }
      })

      if (updates.length > 0) {
        Promise.all(updates).catch(err => {
          console.error('Failed to update board positions', err)
        })
      }

      return reordered
    })
  }

  /* ===========================
     INLINE RENAME
  =========================== */

  async function commitBoardRename(board: Board) {
    const name = editingBoardName.trim() || 'Untitled board'
    if (name !== board.name) {
      await updateBoardName({
        variables: { id: board.id, name },
      })
    }
    setEditingBoardId(null)
  }

  /* ===========================
     RENDER
  =========================== */

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-semibold mb-6">Your Boards</h1>

      {/* New board form */}
      <form
        onSubmit={handleCreateBoard}
        className="flex gap-3"
      >
        <input
          type="text"
          placeholder="New board name"
          value={newBoardName}
          onChange={(e) => setNewBoardName(e.target.value)}
          className="flex-1 px-4 py-2 rounded bg-slate-900 border border-slate-700"
        />
        <button
          type="submit"
          className="px-4 py-2 rounded bg-slate-800 border border-slate-700 hover:bg-slate-700"
        >
          Add
        </button>
      </form>

      {/* Board list */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="boards">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="space-y-4"
            >
              {boards.map((board, index) => (
                <Draggable
                  key={board.id}
                  draggableId={board.id}
                  index={index}
                >
                  {(dragProvided) => (
                    <div
                      ref={dragProvided.innerRef}
                      {...dragProvided.draggableProps}
                      className="bg-slate-900 border border-slate-700 rounded p-4 flex items-center justify-between"
                    >
                      {/* Drag handle */}
                      <span
                        {...dragProvided.dragHandleProps}
                        className="cursor-grab mr-4 select-none text-slate-400"
                      >
                        ::
                      </span>

                      {/* Name / inline edit */}
                      {editingBoardId === board.id ? (
                        <form
                          className="flex-1"
                          onSubmit={(e) => {
                            e.preventDefault()
                            commitBoardRename(board)
                          }}
                        >
                          <input
                            autoFocus
                            value={editingBoardName}
                            onChange={(e) =>
                              setEditingBoardName(e.target.value)
                            }
                            onBlur={() => commitBoardRename(board)}
                            className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-lg outline-none"
                          />
                        </form>
                      ) : (
                        <Link
                          href={`/boards/${board.id}`}
                          className="text-lg flex-1 hover:underline"
                        >
                          {board.name}
                        </Link>
                      )}

                      {/* Menu */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() =>
                            setBoardMenuOpenId(
                              boardMenuOpenId === board.id ? null : board.id
                            )
                          }
                          className="px-3 py-1 rounded border border-slate-600 hover:bg-slate-700"
                        >
                          ⋯
                        </button>

                        {boardMenuOpenId === board.id && (
                          <div className="absolute right-0 mt-2 w-32 rounded bg-slate-800 border border-slate-700 shadow z-10">
                            <button
                              type="button"
                              className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-700"
                              onClick={() => {
                                setEditingBoardId(board.id)
                                setEditingBoardName(board.name)
                                setBoardMenuOpenId(null)
                              }}
                            >
                              Rename
                            </button>
                            <button
                              type="button"
                              className="block w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-slate-700"
                              onClick={() => {
                                deleteBoard({ variables: { id: board.id } })
                                setBoardMenuOpenId(null)
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}

              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  )
}
