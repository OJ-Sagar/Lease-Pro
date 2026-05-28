# Supabase Setup

## Option 1: Hosted Supabase

1. Create a Supabase project.
2. Open **SQL Editor**.
3. Run `supabase/migrations/202605230001_init_lease_pro.sql`.
4. Optionally run `supabase/seed.sql` for demo data.
5. Copy your project settings into env files:

Server:

```env
PORT=4000
CLIENT_ORIGIN=http://localhost:5173
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Client:

```env
VITE_API_URL=http://localhost:4000/api
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Option 2: Local Supabase CLI

Install and login to Supabase CLI, then run:

```bash
npm run supabase:start
npm run supabase:reset
```

The CLI prints local API URL, anon key, and service role key after startup.

## Auth Later

Login is currently disabled in the React/Express app for demo use.
Search for `AUTH SETUP LATER` to re-enable protected routes and API middleware.

When auth is enabled, create an admin user in Supabase Auth and insert a matching row in `public.users`:

```sql
insert into public.users (id, email, full_name, role, status)
values ('AUTH_USER_UUID', 'owner@example.com', 'Business Owner', 'owner', 'active');
```
