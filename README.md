# E-Learning Platform

A modern e-learning platform built with React, TypeScript, Vite, Tailwind CSS, Flask, and Supabase.

## Project Structure

```
frontend/          # React + Vite + TypeScript + Tailwind + shadcn/ui
backend/           # Flask REST API
supabase/          # Supabase migrations
.env.example         # Environment variables template
README.md
```

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.11+
- Supabase project

### Setup

1. **Copy environment variables:**
   ```bash
   cp .env.example backend/.env
   ```
   Fill in your Supabase credentials in `backend/.env`.

2. **Install frontend dependencies:**
   ```bash
   cd frontend
   npm install
   ```

3. **Install backend dependencies:**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

4. **Set up Supabase:**
   - Run the migration in `supabase/migrations/001_initial_schema.sql`
   - Enable email/password authentication in Supabase

5. **Run the backend:**
   ```bash
   cd backend
   python run.py
   ```

6. **Run the frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

## API Endpoints

All API routes are prefixed with `/api`.

- `GET /api/auth/me` - Get current user
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register
- `GET /api/classes` - Get classes (filtered by role)
- `POST /api/classes` - Create class (teacher only)
- `GET /api/classes/:id/students` - Get class students
- `POST /api/classes/:id/students` - Add student
- `GET /api/sessions` - Get sessions
- `POST /api/sessions` - Create session (teacher only)
- `GET /api/materials` - Get materials
- `POST /api/materials` - Upload material (teacher only)
- `GET /api/assignments` - Get assignments
- `POST /api/assignments` - Create assignment (teacher only)
- `POST /api/assignments/:id/submit` - Submit assignment
- `GET /api/submissions` - Get submissions (teacher)
- `PUT /api/submissions/:id/grade` - Grade submission (teacher)
- `GET /api/attendance` - Get attendance
- `POST /api/attendance` - Mark attendance (teacher)
- `GET /api/announcements` - Get announcements
- `POST /api/announcements` - Create announcement (teacher)

## Phase 1: Authentication + Database + Basic Layouts

- ✅ Supabase authentication (login/register)
- ✅ Role-based routing (teacher/student)
- ✅ Protected routes
- ✅ Full database schema with RLS policies
- ✅ Flask REST API with all blueprints
- ✅ React frontend with sidebar navigation
- ✅ Dashboard pages for teacher and student
- ✅ Responsive design with Tailwind CSS
