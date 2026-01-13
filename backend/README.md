Backend (Laravel)

Run
- `cd backend`
- `composer install`
- Copy `.env.example` to `.env`
- `php artisan key:generate`
- Ensure `FRONTEND_URL=http://localhost:5173`, `SESSION_DOMAIN=localhost`, `SANCTUM_STATEFUL_DOMAINS=localhost,localhost:5173`
- `php artisan serve` (http://localhost:8000)

Notes
- API routes in `routes/api.php` (e.g., `GET /api/health`, `GET /api/user`)
- CORS config at `config/cors.php`
