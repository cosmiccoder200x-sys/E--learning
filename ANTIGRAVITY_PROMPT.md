# Prompt for Antigravity — Continue E-Learning Platform

## Context
We're building an E-Learning Platform (React + TypeScript + Vite + Tailwind + shadcn/ui frontend, Flask + Supabase Python backend).

Working directory: `C:\Users\Sreerang\Documents\GitHub\E-Learning Platform\`
- Frontend: `frontend/`
- Backend: `backend/`
- Supabase migrations: `supabase/migrations/001_initial_schema.sql`
- Live dev server: `http://localhost:5173` (frontend)
- Live backend: `http://localhost:5000`

IMPORTANT: On Windows PowerShell, paths contain spaces. Use `workdir` parameter, not `cd` inside commands. Python: full path `C:\Users\Sreerang\AppData\Local\Programs\Python\Python314\python.exe` (plain `python` points to a 3.11 without Flask). Node: `npx` works from the `frontend/` directory.

## Phase 3 — COMPLETED ✅
Sessions (create/edit/delete), Google Meet links, both teacher/student views.

## Phase 4 — COMPLETED ✅
Materials (teacher upload/delete, student open), Assignments (teacher create/grade, student submit), Submissions backend (GET/POST/PUT/DELETE, fix `class_id` filter bug by joining through `assignments` table), upsert for resubmission.

## Phase 5 (current) — REDESIGN ✅
Full visual redesign done: Tailwind config with brand palette (`brand-600` indigo), `index.css` with CSS variables, `button.tsx` variants (`primary/secondary/outline/ghost/subtle/destructive`), `card.tsx`, `input.tsx`, `label.tsx`, `badge.tsx`, `icons.tsx` (inline SVGs), `Layout.tsx` (dark sidebar `#0f172a`, glass header, mobile drawer), redesigned `Home.tsx` (hero + feature cards + guest demo), `Login.tsx` / `Register.tsx` (split panels), `TeacherDashboard.tsx` / `StudentDashboard.tsx` (gradient hero + stat tiles + quick actions), `Classes.tsx` (cards + create + add-student), `Sessions.tsx` / `Materials.tsx` / `Assignments.tsx` / `Announcements.tsx` / `Profile.tsx` (consistent styling, empty states, badges). `App.tsx` ProtectedRoute improved with loading/access-denied states. `index.css` fixed: `@apply border-border` replaced with `border-color: hsl(var(--border))` on `*` plus `.border-border` in `@layer components`.

## NEXT STEPS TO DO

### A. Backend Supabase setup (HIGHEST PRIORITY — blocks everything real)
1. **Explain to the user** they need a Supabase project. Run `supabase init` or just tell them to go to https://supabase.com, create a project, and run the migration in `supabase/migrations/001_initial_schema.sql`.
2. Once they have credentials, update `backend/.env`:
   - `VITE_SUPABASE_URL=https://xxx.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY=eyJ...` (service_role key from Supabase dashboard > Settings > API)
3. Test `python -c "from app import create_app; app = create_app(); print('OK')"` and `python run.py`.
4. Test the full auth flow: `POST /api/auth/register` → `POST /api/auth/login` → `GET /api/auth/me`.
5. Verify the `profiles` table has a row after register — the backend `register()` inserts into `profiles` table, so register must succeed. Check that the `auth.users` row exists and `profiles` insert works.
6. Test class/student/session/material/assignment/submission CRUD end-to-end.

### B. Frontend toast fix
- `frontend/src/components/ui/use-toast.tsx`: `useToast()` returns `{ toast }` where `toast` is a sync function. Pages call `toast({ title, description })`. It currently just `console.log`/`console.error`. 
- Fix: render `<Toaster>` component from `sonner` in `App.tsx` or `main.tsx`. Update `useToast()` to return a proper `sonner.toast()` call (e.g., `toast(title, { description, ... })`).
- Update `Login.tsx` / `Register.tsx` to use `toast()` instead of `alert()`.

### C. Missing backend endpoints
1. `backend/app/routes/announcements.py`: only has GET — add `POST /api/announcements` (teacher_required) to create announcements. Check the schema: `announcements` table has `class_id`, `teacher_id`, `title`, `message`, `created_at`.
2. `backend/app/routes/attendance.py`: check what exists — `attendance` table has `session_id`, `student_id`, `status`, `marked_at`. Add endpoints if missing (mark attendance, get attendance).
3. `backend/app/routes/submissions.py`: `get_submissions` for non-class-id path (teacher) should scope to teacher's classes — fix if needed.

### D. Frontend route mapping fixes
- `App.tsx` maps `/teacher/attendance`, `/student/attendance`, `/student/progress` all to `Assignments.tsx`. These should either:
  - Point to real attendance/progress pages (stub with placeholder content acceptable for now), OR
  - At minimum have a note that attendance/progress are coming soon.

### E. Backend edge cases & bugs to fix
1. `backend/app/routes/auth.py`: `get_supabase()` reads env on every call. Fine for now.
2. `POST /api/auth/register`: creates `auth.users` via Supabase, then inserts `profiles`. Need to ensure `profiles` `auth_user_id` matches `auth.users.id`. The `register()` function calls `sb.auth.sign_up()` and gets `response.user.id`. Make sure the profile insert uses that same ID.
3. `POST /api/auth/login`: returns `session.access_token`. The frontend stores this in localStorage. Make sure the token is a valid Supabase JWT that `GET /api/auth/me` can verify via `sb.auth.get_user(token)`.
4. `POST /api/auth/me`: calls `sb.auth.get_user(token)` which validates the JWT signature. With the service-role key this should work. Verify it returns the user profile joined with `profiles`.
5. RLS: the migration has RLS policies, but the backend uses service-role key which bypasses RLS. If the user switches to anon key on the frontend, RLS will block. Document this.
6. `classes` table `teacher_id` references `profiles(id)`, not `auth.users(id)`. So when creating a class, the teacher's `profile.id` must be used, not `auth.uid()`. In `create_class()`, `user.id` is the `auth.users.id` from `get_auth_user()`. But `classes.teacher_id` references `profiles(id)` (a UUID from `gen_random_uuid()`). **This is a mismatch** — need to map `auth.users.id` → `profiles.id` via `auth_user_id`. Fix `get_auth_user()` or class creation to use the profile's `id`.

   Same issue for `profiles.id` being referenced by `class_students.student_id`, `materials.uploaded_by`, `assignments.created_by`, `sessions.teacher_id`, `attendance.student_id`. All reference `profiles(id)`, not `auth.users(id)`.
   
   **Fix approach**: Add a helper `get_profile_id(user_id)` that queries `profiles` where `auth_user_id = user.id`. Update all places that use `user.id` as a foreign key to use the profile ID instead. Update `get_auth_user` to also return the profile ID, or add `get_profile_id()` helper.

### F. Optional polish (low priority)
- Add `.gitignore` for `frontend/node_modules/`, `frontend/dist/`, `backend/__pycache__/`, `backend/.env`, `*.log`.
- Add `frontend/.env.example` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- Fix `postcss.config.js` module warning (add `"type": "module"` to frontend package.json, or rename to `.cjs`).
- Add error boundaries in React.
- Add proper loading skeletons.
- Add `react-query` (already in package.json as `@tanstack/react-query`) for data fetching.

## NOTES
- The `lib/supabase.ts` file exists but is NOT imported by any component (it throws on missing env vars). It's safe to leave or delete.
- `useAuth.tsx` no longer imports `@/lib/supabase` — it talks directly to `/api/auth/*` endpoints.
- The frontend `.env` file doesn't exist (no Vite env vars needed since `lib/supabase.ts` is unused).
- Backend `.env` has placeholder values — this is the main blocker for real functionality.
- The migration file `supabase/migrations/001_initial_schema.sql` has proper FKs and RLS policies.

## OUTPUT FORMAT
For each step, show:
1. What you changed (file paths)
2. How to verify it works (curl commands or browser test)
3. Any errors you hit and how you fixed them

Start with the Supabase setup explanation and the `profiles.id` foreign key mismatch fix, then toast fix, then announcements endpoint, then the auth flow end-to-end test.
