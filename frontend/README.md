Frontend (React + Vite)

Scripts
- `npm install`
- `npm run dev` (http://localhost:5173)

Env
- Copy `.env.example` to `.env`
- `VITE_API_URL` should point to the Laravel backend (e.g. http://localhost:8000)

Notes
- Uses Axios with `withCredentials` enabled.
- Expects backend CORS to allow the frontend origin and credentials.

