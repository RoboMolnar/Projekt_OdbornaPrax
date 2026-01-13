Project Split: Frontend + Backend

Overview
- Backend: Laravel app (this repository root)
- Frontend: React SPA under `frontend/`

Run
1) Backend (Laravel)
   - `cd backend`
   - Configure `.env` (ensure `APP_KEY` is set: `php artisan key:generate`)
   - Ensure `FRONTEND_URL=http://localhost:5173` in `.env`
   - Start server: `php artisan serve` (http://localhost:8081)

2) Frontend
   - `cd frontend`
   - `cp .env.example .env` and adjust `VITE_API_URL=http://localhost:8081`
   - `npm install`
   - `npm run dev` (http://localhost:5173)

API
- Health check at `GET /api/health`

Notes
- CORS is enabled for the frontend origin with credentials.
- Further steps: move Laravel app into `backend/` subfolder and migrate Inertia pages to the SPA incrementally.
