# Kanban Board - Nhost + Next.js

A Trello-style Kanban board built with:

- Next.js App Router
- Nhost (Auth + Postgres + GraphQL)
- Apollo Client
- GraphQL subscriptions for realtime sync
- Drag and drop with `@hello-pangea/dnd`
- Tailwind CSS and Shadcn style tokens

This project is the capstone Kanban board clone for the MyCritters onboarding.

---

## Tech Stack

- **Frontend**: Next.js, React, TypeScript
- **Styling**: Tailwind CSS, CSS variables compatible with Shadcn/ui
- **Backend**: Nhost (Postgres, Hasura GraphQL)
- **Auth**: Nhost email and password
- **Data**:
  - `boards` table
  - `columns` table
  - `cards` table
  - all ordered by a `position` column of type `double precision`
- **Realtime**:
  - GraphQL subscriptions on boards, columns and cards
- **DnD**:
  - `@hello-pangea/dnd` for drag and drop of boards, columns and cards

---

## Data Model (simplified)

```sql
boards:  id uuid primary key
         name text
         position double precision
         owner uuid (user id)

columns: id uuid primary key
         board_id uuid references boards(id)
         name text
         position double precision

cards:   id uuid primary key
         column_id uuid references columns(id)
         title text
         description text
         position double precision
         assignee uuid null
