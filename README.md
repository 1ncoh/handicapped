# handicapped

Production-ready Next.js app for two fixed players (`randall`, `jaden`) to track golf rounds, course data, stats, and Handicap Index over time.

## Stack
- Next.js App Router + TypeScript
- Tailwind CSS + shadcn-style UI components
- Recharts for index charts
- Supabase Postgres (server-side access only)
- Zod input validation
- Vitest unit tests for handicap logic

## Security Model
- No login/auth by design.
- Client never uses Supabase directly.
- All DB access goes through Next.js API route handlers.
- `SUPABASE_SERVICE_ROLE_KEY` is used only in server code (`src/lib/supabaseAdmin.ts`).
- Mutation endpoints apply lightweight in-memory per-IP token-bucket rate limiting.
  - This is best-effort on serverless because memory is not shared across instances.

## Local Setup
1. Install dependencies:
```bash
npm install
```

2. Set env vars (in `.env.local` or equivalent):
```bash
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
# optional (used only if you later add protected import flows)
SITE_ADMIN_TOKEN=...
```

3. Create schema in Supabase SQL Editor:
- Paste and run `supabase/schema.sql`.

4. Seed demo data:
```bash
npm run seed
```

5. Start dev server:
```bash
npm run dev
```

6. Run tests:
```bash
npm run test
```

## Import Existing Excel Data
You can import historical rounds from Excel by exporting to `.csv` (or `.tsv`) and running:

```bash
npm run import:rounds -- ./path/to/rounds.csv
```

Expected headers:
- `Player`
- `Date` (`M/D/YYYY` or `YYYY-MM-DD`)
- `Course`
- `Rating`
- `Slope`
- `Holes` (9 or 18)
- `Total` (score)
- optional: `Tee`, `Par`, `PCC`, `Notes`

Behavior:
- `Player` must be `Randall` or `Jaden` (case-insensitive).
- Missing courses are auto-created locally in `courses`.
- `Tee` defaults to `Standard` if omitted.
- `Par` defaults to `72` (18 holes) or `36` (9 holes) if omitted.
- Duplicate rounds (same player/date/course/holes/score) are skipped.

## Supabase SQL Migration Snippet
Use `supabase/schema.sql`. It includes:
- `players`, `courses`, `rounds` tables
- indexes
- `updated_at` trigger function + triggers
- RLS enabled with no anon policies
- seed upsert for `randall` and `jaden`

## API Endpoints
- `GET /api/players`
- `GET /api/player/{playerId}/dashboard`
- `GET /api/player/{playerId}/rounds?limit=&courseId=`
- `POST /api/player/{playerId}/rounds`
- `PUT /api/rounds/{roundId}`
- `DELETE /api/rounds/{roundId}`
- `GET /api/courses`
- `POST /api/courses`
- `PUT /api/courses/{courseId}`
- `DELETE /api/courses/{courseId}`
- `GET /api/course-search?query=` (mock provider)
- `GET /api/export`

## Routes
- `/` home with two dashboard cards (Randall, Jaden)
- `/player/[playerId]` player dashboard + charts + stats
- `/player/[playerId]/rounds` rounds management (filters + CRUD)
- `/courses` course CRUD + search panel (mock provider)
- `/export` backup download JSON

## Handicap Rules Implemented
- Differential: `(113 / slope) * (score - courseRating - pcc)`
- 9-hole pairing:
  - Pair chronological 9-hole rounds by player
  - Combined differential = average of two 9-hole differentials
  - Unpaired 9-hole leftover ignored
- Current index:
  - Build effective differentials (18-hole + paired 9-hole)
  - Use last 20 effective
  - Select best 8 lowest
  - `index = average(best8) * 0.96`
  - truncate to 1 decimal (not round)
- Provisional shown if fewer than 8 effective differentials
- Index-over-time series is computed as-of each effective differential date

## Vercel Deployment
1. Push repo to Git provider.
2. Import project in Vercel.
3. Add environment variables in Vercel project settings:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - optional `SITE_ADMIN_TOKEN`
4. Deploy.

## Notes on Public Write Access
Current behavior allows anyone with site access to add/edit/delete rounds and courses. To lock this down later:
- add auth (Supabase Auth, Clerk, or NextAuth)
- enforce user-based authorization in API routes
- add stricter RLS policies and avoid service-role writes for user flows
