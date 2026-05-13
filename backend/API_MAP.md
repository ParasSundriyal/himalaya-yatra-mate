# Himalaya Yatra Mate — API map

Reference for **Express** backend (`server.js`), how **mobile** and **web** clients call it, and **environment / auth** requirements.

**Default server:** `http://<host>:5000` — REST routes live under **`/api/...`**. Health check: `GET /`.

---

## 1. How callers reach the API

| Key | Meaning |
|-----|---------|
| **Base URL (HTTP)** | `http://<host>:5000` for `GET /` only. All REST APIs: **`/api/...`**. |
| **Mobile base** | `API_BASE_URL` = `http://<host>:5000/api` — from `EXPO_PUBLIC_API_URL` or `expo.extra.apiBaseUrl` in `himalaya-yatra-mobile/app.json`, else Expo host IP `:5000/api`, else Android emulator `http://10.0.2.2:5000/api`. See `himalaya-yatra-mobile/src/api/client.ts` (`buildApiBaseUrl`). |
| **Web base** | `VITE_API_URL` or default `http://localhost:5000/api` in `himalaya-yatra-mate/src/services/api.ts`. |
| **Maps download (mobile)** | Uses origin **without** `/api`, then `/api/maps/...` — see `himalaya-yatra-mobile/src/services/mapDownloadService.js` (same host, port **5000**). |
| **JSON** | `Content-Type: application/json` on JSON bodies. |
| **User auth (JWT)** | From `POST /api/auth/login` or `/api/auth/register`, store `token`. Protected routes: **`Authorization: Bearer <token>`**. Roles are embedded in the JWT (`user`, `group`, `admin`). |

There is **no separate API key** for mobile/web users—only **JWT** (and public routes where noted).

---

## 2. Endpoints by mount

### Root

| Method | Path | Auth | Used by |
|--------|------|------|---------|
| GET | `/` | None | Health / discovery |

---

### `/api/auth` — `routes/auth.routes.js`

| Method | Path | Auth | Typical client |
|--------|------|------|----------------|
| POST | `/api/auth/register` | None | Mobile `api.auth.register`, web `api.auth.register` |
| POST | `/api/auth/login` | None | Mobile `api.auth.login`, web `api.auth.login` |
| GET | `/api/auth/me` | Bearer | Mobile `api.auth.getProfile`, web `api.auth.getProfile` |
| PUT | `/api/auth/profile` | Bearer | Web `api.auth.updateProfile` |

**Bodies (examples):** login `{ "email", "password", "role"? }`; register `{ "name", "email", "password", "phone", ... }`.

---

### `/api/parking` — `routes/parking.routes.js`

| Method | Path | Auth | Typical client |
|--------|------|------|----------------|
| GET | `/api/parking/areas` | None | Mobile + web |
| GET | `/api/parking/areas/:areaId/slots` | None | Mobile + web |
| POST | `/api/parking/book` | Bearer (user) | Mobile + web |
| GET | `/api/parking/my-bookings` | Bearer | Mobile + web |
| POST | `/api/parking/cancel/:bookingId` | Bearer | Mobile + web |
| POST | `/api/parking/admin/areas` | Bearer **admin** | Mobile `AdminParkingScreen` |
| PUT | `/api/parking/admin/areas/:areaId` | Bearer admin | Mobile admin |
| DELETE | `/api/parking/admin/areas/:areaId` | Bearer admin | Mobile admin |
| POST | `/api/parking/admin/areas/:areaId/slots` | Bearer admin | Mobile admin |
| PUT | `/api/parking/admin/areas/:areaId/slots/:slotId` | Bearer admin | Mobile admin |
| DELETE | `/api/parking/admin/areas/:areaId/slots/:slotId` | Bearer admin | Mobile admin |

---

### `/api/hotels` — `routes/hotel.routes.js`

| Method | Path | Auth | Typical client |
|--------|------|------|----------------|
| GET | `/api/hotels` | Optional Bearer | Mobile + web |
| GET | `/api/hotels/:id` | None | Mobile + web |
| POST | `/api/hotels/book` | Bearer | Mobile + web |
| GET | `/api/hotels/my-bookings` | Bearer | Mobile + web |
| POST | `/api/hotels/cancel/:bookingId` | Bearer | Mobile + web |

---

### `/api/taxis` — `routes/taxi.routes.js`

| Method | Path | Auth | Typical client |
|--------|------|------|----------------|
| GET | `/api/taxis` | Optional Bearer | Mobile + web |
| GET | `/api/taxis/:id` | None | Mobile + web |
| POST | `/api/taxis/book` | Bearer | Mobile + web |
| GET | `/api/taxis/my-bookings` | Bearer | Mobile + web |
| POST | `/api/taxis/cancel/:bookingId` | Bearer | Mobile + web |

---

### `/api/bookings` — `routes/booking.routes.js`

| Method | Path | Auth | Typical client |
|--------|------|------|----------------|
| GET | `/api/bookings` | Bearer | Mobile `BookingsScreen`, web |
| GET | `/api/bookings/:id` | Bearer | Web |

---

### `/api/groups` — `routes/group.routes.js`

| Method | Path | Auth | Typical client |
|--------|------|------|----------------|
| POST | `/api/groups` | Bearer **group or admin** | Mobile `GroupPortalScreen` |
| GET | `/api/groups/my-group` | Bearer group/admin | Mobile |
| POST | `/api/groups/add-member` | Bearer group/admin | Mobile |
| DELETE | `/api/groups/remove-member/:memberId` | Bearer group/admin | Mobile |
| GET | `/api/groups/member-bookings` | Bearer group/admin | Mobile |
| GET | `/api/groups/:groupId` | Bearer **admin only** | Admin |

---

### `/api/ai-detection` — `routes/aiDetection.routes.js`

| Method | Path | Auth | Typical client |
|--------|------|------|----------------|
| POST | `/api/ai-detection/log` | None (public) | External / AI pipeline |
| GET | `/api/ai-detection` | Optional Bearer | Admin-style listing |
| GET | `/api/ai-detection/stats` | None | Dashboards |
| PUT | `/api/ai-detection/:id/process` | Bearer **admin** | Admin |

---

### `/api/admin` — `routes/admin.routes.js`

All routes use **`authenticate` + `authorize('admin')`** — **Bearer + role admin**.

| Method | Path | Typical client |
|--------|------|----------------|
| GET | `/api/admin/stats` | Mobile `AdminScreen` |
| GET | `/api/admin/users` | Mobile admin |
| PUT | `/api/admin/users/:id/status` | Mobile admin |
| GET | `/api/admin/bookings` | Mobile admin |
| GET | `/api/admin/activities` | Mobile admin |

---

### `/api/checkpoints` — `routes/checkpoint.routes.js`

| Method | Path | Auth | Typical client |
|--------|------|------|----------------|
| GET | `/api/checkpoints` | Optional Bearer | Mobile hourly-pass flow |
| POST | `/api/checkpoints` | Bearer admin | Admin |
| PUT | `/api/checkpoints/:checkpointId` | Bearer admin | Admin |
| DELETE | `/api/checkpoints/:checkpointId` | Bearer admin | Admin |

---

### `/api/hourly-passes` — `routes/hourlyPass.routes.js`

| Method | Path | Auth | Typical client |
|--------|------|------|----------------|
| GET | `/api/hourly-passes/checkpoints/:checkpointId/slots` | None | Mobile booking |
| POST | `/api/hourly-passes/book` | **optionalAuth** | Mobile |
| GET | `/api/hourly-passes/my-passes` | **optionalAuth** | Mobile |
| POST | `/api/hourly-passes/scan/:passId` | Bearer **admin** | Mobile admin scan |
| GET | `/api/hourly-passes/admin/all-passes` | Bearer admin | Mobile `AdminHourlyPassScreen` |
| POST | `/api/hourly-passes/admin/slots` | Bearer admin | Mobile admin |
| GET | `/api/hourly-passes/admin/slots` | Bearer admin | Mobile admin |

---

### `/api/chatbot` — `routes/chatbot.routes.js`

| Method | Path | Auth | Typical client |
|--------|------|------|----------------|
| POST | `/api/chatbot` | None | Mobile `ChatbotScreen` — body e.g. `{ "message", "userId"? }` |

Server calls **n8n** via env; clients do **not** send an n8n secret.

---

### `/api/passes` — `routes/passes.routes.js`

| Method | Path | Auth | Typical client |
|--------|------|------|----------------|
| POST | `/api/passes` | Bearer | Mobile `DhamPassScreen` |
| GET | `/api/passes/my-passes` | Bearer | Mobile |
| GET | `/api/passes/quota/:dham` | None (public) | Mobile quota UI |
| GET | `/api/passes/:passId` | Bearer | Pass detail |
| PUT | `/api/passes/:passId/use` | Bearer | Mark pass used |

---

### `/api/registration` — `routes/registration.routes.js`

| Method | Path | Auth | Typical client |
|--------|------|------|----------------|
| POST | `/api/registration/profile` | Bearer | Mobile `RegistrationWizardScreen` |

---

### `/api/itinerary` — `routes/itinerary.routes.js`

| Method | Path | Auth | Typical client |
|--------|------|------|----------------|
| GET | `/api/itinerary/dham-status` | Bearer | Mobile `api.itinerary.dhamStatus` |
| GET | `/api/itinerary/nearby/:dhamName` | Bearer | Mobile `api.itinerary.nearby` |
| POST | `/api/itinerary/generate` | Bearer | Mobile `api.itinerary.generate` |
| GET | `/api/itinerary/mine` | Bearer | Mobile `api.itinerary.mine` |

Backend may call the **ML service** (env); clients only send JWT + JSON for `generate`.

---

### `/api/dashboard` — `routes/dashboard.routes.js`

| Method | Path | Auth | Typical client |
|--------|------|------|----------------|
| GET | `/api/dashboard/live` | **None required** (public) | Mobile `LiveDhamDashboardScreen` |

Uses Mongo + optional Firestore + OpenWeather on the **server**.

---

### `/api/location` — `routes/location.routes.js`

| Method | Path | Auth | Typical client |
|--------|------|------|----------------|
| POST | `/api/location/update` | Bearer | Mobile `api.location.updateActiveLocation` / `locationService` |
| POST | `/api/location/ping` | Bearer | Mobile `api.location.ping` / `locationPing` |

---

### `/api/crowd` — `routes/crowd.routes.js`

| Method | Path | Auth | Typical client |
|--------|------|------|----------------|
| GET | `/api/crowd/live` | Bearer | Available for tools / future UI (not in mobile `api` helper) |
| GET | `/api/crowd/live/:dhamName` | Bearer | Same |
| POST | `/api/crowd/predict` | Bearer | Same |
| POST | `/api/crowd/predict-range` | Bearer | Same |

These forward to **`ML_SERVICE_URL`** / **`CROWD_ML_URL`** on the server.

---

### `/api/maps` — `routes/maps.js`

| Method | Path | Auth | Typical client |
|--------|------|------|----------------|
| GET | `/api/maps/info` | Bearer | Mobile `mapDownloadService.getMapPackageInfo` |
| GET | `/api/maps/tiles.zip` | Bearer (optional `Range`) | Mobile offline map download |

Serves `backend/assets/tiles_extracted.zip` when present.

---

## 3. Client configuration (key / value)

### Mobile or web HTTP client

| Key | Value / usage |
|-----|----------------|
| **Base URL** | `http://<LAN-ip>:5000/api` for dev on a physical phone (same Wi‑Fi as PC). Production: your deployed API origin + `/api`. |
| **Mobile env** | `EXPO_PUBLIC_API_URL` **or** `expo.extra.apiBaseUrl` in `himalaya-yatra-mobile/app.json`. |
| **Web env** | `VITE_API_URL` in Vite env files. |
| **Authorization** | `Bearer <jwt>` from login/register. Omit on public routes. |
| **Content-Type** | `application/json` for JSON POST/PUT. |

### Backend `.env` (server only — never embed in apps)

| Variable | Purpose |
|----------|---------|
| `PORT` | Listen port (default `5000`). |
| `MONGODB_URI` | MongoDB connection string. |
| `JWT_SECRET` | Signs and verifies JWTs (use a strong secret in production). |
| `JWT_EXPIRE` | Token lifetime (e.g. `7d`). |
| `FRONTEND_URL` | CORS allowlist for the web app. |
| `NODE_ENV` | `development` allows broader CORS behavior in `server.js`. |
| `FIREBASE_SERVICE_ACCOUNT_JSON` or `FIREBASE_SERVICE_ACCOUNT_BASE64` or `FIREBASE_SERVICE_ACCOUNT_PATH` or `GOOGLE_APPLICATION_CREDENTIALS` | Firebase Admin / Firestore (crowd, location, dashboard). |
| `OPENWEATHER_API_KEY` or `OPENWEATHERMAP_API_KEY` | Weather for `/api/dashboard/live`. |
| `ML_SERVICE_URL` or `CROWD_ML_URL` | ML service for `/api/crowd/*` and itinerary batch predictions. |
| `N8N_WEBHOOK_URL` | Chatbot integration for `POST /api/chatbot`. |

---

## 4. Mobile screen → API (quick index)

| Screen / module | Main `/api` prefixes |
|-----------------|----------------------|
| `AuthContext` | `/auth/login`, `/auth/register`, `/auth/me` |
| `RegistrationWizardScreen` | `/registration/profile` |
| `ParkingScreen`, `AdminParkingScreen` | `/parking/...` |
| `HotelBookingScreen` | `/hotels/...` |
| `TaxiBookingScreen` | `/taxis/...` |
| `BookingsScreen` | `/bookings` |
| `HourlyPassBookingScreen`, `AdminHourlyPassScreen` | `/hourly-passes/...`, `/checkpoints` |
| `GroupPortalScreen` | `/groups/...` |
| `AdminScreen` | `/admin/...` |
| `ChatbotScreen` | `/chatbot` |
| `DhamPassScreen` | `/passes/...` |
| Itinerary flows / `itineraryAPI` | `/itinerary/...` |
| `LiveDhamDashboardScreen` | `/dashboard/live` |
| `locationService` / `locationPing` | `/location/update`, `/location/ping` |
| `mapDownloadService` | `/maps/info`, `/maps/tiles.zip` |

---

## 5. Related files

| Area | Path |
|------|------|
| Route registration | `himalaya-yatra-mate/backend/server.js` |
| Mobile HTTP client | `himalaya-yatra-mobile/src/api/client.ts` |
| Mobile map downloads | `himalaya-yatra-mobile/src/services/mapDownloadService.js` |
| Web HTTP client | `himalaya-yatra-mate/src/services/api.ts` |
| Auth middleware | `himalaya-yatra-mate/backend/middleware/auth.middleware.js` |

---

## 6. Test users (after seed)

See `README.md` in this folder — e.g. admin / instructor / user accounts from `scripts/seed.js`.
