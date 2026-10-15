# StayHub Frontend

Modern responsive React/Vite frontend for the existing StayHub Express + PostgreSQL API.

## Run locally

1. Keep your current backend running on port 3000.
2. Open a terminal in this `frontend` directory.
3. Run `npm install`.
4. Run `npm run dev`.
5. Open the local URL Vite prints (normally http://localhost:5173).

Optional: copy `.env.example` to `.env` and set `VITE_API_URL` if your backend uses another address.

## Expected API routes

- `GET /rooms` returns an array of rooms with `id`, `name`, and `price`.
- `POST /users/register` accepts `{ name, email, password }`.
- `POST /users/login` accepts `{ email, password }` and returns `{ token, userId }`.
- `POST /bookings` accepts `{ roomId, checkIn, checkOut }` and uses `Authorization: Bearer <token>`.

The homepage includes sample room cards if the API is unavailable. Live room data replaces them when `GET /rooms` succeeds. Sample room photos and room descriptions are presentation fallbacks; your database remains the source of room names and prices.

## CORS

Because Vite usually runs on port 5173 and Express on port 3000, the backend must allow requests from `http://localhost:5173`. If the browser console reports a CORS error, install `cors` in the backend (`npm install cors`) and add this before your routes:

```js
const cors = require('cors');
app.use(cors({ origin: 'http://localhost:5173' }));
```

Do not replace or delete your existing backend. This folder is the separate frontend.

## Notes

- Authentication tokens are stored in browser localStorage for this learning project.
- Room availability is not calculated in the frontend; the existing backend checks booking conflicts when a reservation is submitted.
- Displayed ratings and room descriptions are demo presentation content, not database-backed facts.
