# BookMyShow Replica

A controlled full-stack movie-booking demonstration built with Next.js App Router, TypeScript, Express, and file-backed SQLite. It demonstrates a fixed journey: mobile entry, OTP `1234`, backend-seeded movie/theatre discovery, fixed seats `A1`, `A2`, `A3` for Rs. 450, a display-only Card or UPI choice, a measured two-second processing state, and a persisted canonical confirmation.

## Scope

This is not a production cinema marketplace. It does not provide SMS delivery, mobile-number validation, token authorization/refresh policy, showtimes, seat inventory, payment validation or gateway calls, refunds, cancellations, ticket delivery, or tax calculations. Card and UPI fields are presentation-only and are never sent to the backend.

## Local development

### Prerequisites
- Node.js 22+
- A C/C++ build toolchain for `better-sqlite3`

### Backend

```bash
cd backend
npm install
cp .env.example .env
node node_modules/typescript/bin/tsc
node dist/index.js
```

The API listens on `http://127.0.0.1:4000` and exposes `GET /api/health`.

### Frontend

In another terminal:

```bash
cd frontend
npm install
cp .env.example .env.local
NODE_ENV=production node node_modules/next/dist/bin/next build
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:4000 node node_modules/next/dist/bin/next dev -p 3000
```

Open `http://127.0.0.1:3000`, select **Start access**, enter any mobile identifier, and enter OTP `1234`.

## Tests

Commands avoid `npx` because sandboxed installs disable package bin links.

```bash
cd backend && node node_modules/vitest/vitest.mjs run
cd frontend && node node_modules/vitest/vitest.mjs run
cd backend && node node_modules/vitest/vitest.mjs run test/journey.integration.test.ts
cd frontend && node node_modules/@playwright/test/cli.js test --config playwright.config.ts
```

Playwright uses a temporary SQLite database under `/tmp` for its live browser run. Its tests start both services themselves.

## Containers

```bash
docker compose up --build -d
```

The frontend is available on port 3000 and the API on port 4000. Compose persists the local demonstration database in the `cinema_data` named volume. A deployed multi-task ECS configuration must replace local SQLite with the durable external storage strategy identified in the architecture documents.

## API highlights

- `POST /api/auth/login`
- `POST /api/auth/verify` (fixed OTP `1234`)
- `GET /api/movies`
- `GET /api/theatres`
- `POST /api/bookings`
- `GET /api/bookings/:id`
- `GET /api/health`

All success payloads use `{ "data": ... }`. Errors use `{ "error": { "code", "message", "correlationId" } }`.

## License

Private and proprietary. All rights reserved.
