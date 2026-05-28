# Lease Pro Admin Dashboard

Production-ready full-stack internal admin dashboard for a product leasing business.

## Stack

- Frontend: React, Vite, Tailwind CSS, shadcn/ui-style components, Framer Motion
- Backend: Node.js, Express.js REST APIs
- Database/Auth/Storage: Supabase PostgreSQL

## Quick Start

1. Create a Supabase project.
2. Run `supabase/migrations/202605230001_init_lease_pro.sql` in the Supabase SQL editor.
3. Optionally run `supabase/seed.sql` for demo records.
4. Copy `server/.env.example` to `server/.env` and `client/.env.example` to `client/.env`.
4. Install dependencies:

```bash
npm install
```

5. Run the app:

```bash
npm run dev
```

Frontend runs on `http://localhost:5173`.
Backend runs on `http://localhost:4000`.

## Environment

Server:

```env
PORT=4000
CLIENT_ORIGIN=http://localhost:5173
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

Client:

```env
VITE_API_URL=http://localhost:4000/api
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

## Admin Access

Authentication uses Supabase Auth. Role-based access is stored in `public.users.role`.
Supported roles are `owner` and `staff`.

## Structure

- `client/src/pages`: dashboard modules and protected routes
- `client/src/components`: layout, UI, charts, tables
- `server/src/modules`: scalable Express route/service/controller modules
- `server/src/middleware`: auth, roles, errors, validation
- `supabase/migrations`: relational tables, constraints, indexes, RLS, analytics views
- `supabase/seed.sql`: demo customers, products, leases, and payments
