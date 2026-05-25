# Himalaya Yatra Mate — n8n AI Chatbot Flow (Complete Guide)

> **Goal:** Build an n8n workflow that receives a user message, uses an AI Agent to classify intent, calls the appropriate backend API, and returns a natural-language reply. For generic/unknown questions, the agent searches the web.

---

## Architecture Overview

```
User Messageo
     │
     ▼
┌──────────────┐
│   Webhook    │  POST /webhook/chardham-chat
└──────┬───────┘
       ▼
┌──────────────┐
│  AI Agent    │  Gemini / OpenAI — classifies intent, picks tool
│  (Tool Agent)│
└──────┬───────┘
       │ calls one of ▼
  ┌────┴─────────────────────────────────┐
  │  Tools (n8n HTTP Request nodes)      │
  │  ─────────────────────────────────── │
  │  1. get_parking_areas                │
  │  2. get_parking_slots                │
  │  3. get_hotels                       │
  │  4. get_taxis                        │
  │  5. get_checkpoints                  │
  │  6. get_hourly_pass_slots            │
  │  7. get_crowd_live                   │
  │  8. get_crowd_predict                │
  │  9. get_dashboard_live               │
  │  10. get_dham_status                 │
  │  11. get_nearby_attractions          │
  │  12. web_search (SerpAPI / Google)   │
  │  13. get_my_parking_bookings         │
  │  14. book_parking                    │
  │  15. get_my_hotel_bookings           │
  │  16. book_hotel                      │
  │  17. get_my_taxi_bookings            │
  │  18. book_taxi                       │
  │  19. get_my_hourly_passes            │
  │  20. book_hourly_pass                │
  └────┬─────────────────────────────────┘
       ▼
┌──────────────────┐
│ Respond Webhook  │  Returns { reply, intent, data? }
└──────────────────┘
```

---

## Prerequisites

| Item | Details |
|------|---------|
| n8n | `npx n8n` or Docker — v1.40+ recommended |
| Backend | Running on `http://localhost:5000` |
| LLM credential | Gemini API key **or** OpenAI API key (set in n8n credentials) |
| Web search (optional) | SerpAPI key for generic questions |

---

## Step-by-Step: Building the Flow in n8n

### STEP 1 — Webhook (Entry Point)

| Setting | Value |
|---------|-------|
| **Node** | Webhook |
| **HTTP Method** | POST |
| **Path** | `chardham-chat` |
| **Response Mode** | `Using 'Respond to Webhook' node` |

Incoming body from backend:

```json
{
  "message": "Are there parking spots near Kedarnath?",
  "userId": "optional-user-id",
  "userToken": "jwt-token-if-logged-in",
  "intent": "parking",
  "location": "kedarnath",
  "language": "en"
}
```

---

### STEP 2 — AI Agent (Brain)

| Setting | Value |
|---------|-------|
| **Node** | AI Agent (Tools Agent) |
| **Model** | Gemini 1.5 Flash **or** GPT-4o-mini |
| **Input** | `{{ $json.message }}` |

#### System Prompt

Paste this as the Agent's **System Message**:

```
You are "Yatra Buddy", the official AI assistant for Himalaya Yatra Mate — a Chardham pilgrimage management platform.

You help users with:
- Parking availability, booking, and viewing their parking bookings
- Hotel search, booking, and viewing their hotel bookings
- Taxi availability, booking, and viewing their taxi bookings
- Hourly checkpoint passes: slot availability, booking, and viewing their passes
- Live crowd status at the four Dhams (Yamunotri, Gangotri, Kedarnath, Badrinath)
- Crowd predictions for future dates
- Dham opening/closing status and itinerary info
- Nearby attractions around each Dham
- Live dashboard data (weather, crowd, passes issued)

RULES:
1. Always use the appropriate tool to fetch real data before answering.
2. Summarize API responses in a friendly, concise way.
3. Include specific numbers (prices, availability counts, temperatures).
4. If the Dham name is mentioned, normalize it to lowercase: yamunotri, gangotri, kedarnath, badrinath.
5. For dates, use YYYY-MM-DD format.
6. If the question is generic (history, culture, travel tips, etc.) and no tool fits, use the web_search tool.
7. Reply in the same language the user writes in (Hindi or English).
8. Keep replies under 200 words.
9. The backend base URL is: http://localhost:5000/api
10. For booking actions, ALWAYS confirm details with the user before calling the book tool.
11. The user's JWT token is passed in the webhook body as "userToken". Use it for authenticated routes.
12. When showing bookings, format them nicely with booking ID, status, dates, and amounts.
```

---

### STEP 3 — Define Tools (HTTP Request Nodes)

Create each tool below as an **HTTP Request** node and attach it to the AI Agent.

---

#### Tool 1: `get_parking_areas`

> "List all parking areas and their availability"

| Field | Value |
|-------|-------|
| **Name** | `get_parking_areas` |
| **Description** | `Get all parking areas with slot availability. Use when user asks about parking.` |
| **Method** | GET |
| **URL** | `http://localhost:5000/api/parking/areas` |

No parameters needed.

**Response shape:**
```json
{
  "success": true,
  "count": 3,
  "areas": [
    { "_id": "...", "name": "Kedarnath Base Parking", "location": "Gaurikund", "totalSlots": 50, "availableSlots": 23 }
  ]
}
```

---

#### Tool 2: `get_parking_slots`

> "Get specific slot details for a parking area"

| Field | Value |
|-------|-------|
| **Name** | `get_parking_slots` |
| **Description** | `Get available slots for a specific parking area by ID. Use after get_parking_areas to drill down.` |
| **Method** | GET |
| **URL** | `http://localhost:5000/api/parking/areas/{{ $fromAI('areaId') }}/slots` |

| Parameter | Type | Description |
|-----------|------|-------------|
| `areaId` | string | The parking area ID from get_parking_areas |

---

#### Tool 3: `get_hotels`

> "Search hotels with optional filters"

| Field | Value |
|-------|-------|
| **Name** | `get_hotels` |
| **Description** | `Get all available hotels. Optional filters: location, minPrice, maxPrice, rating, available=true. Use when user asks about hotels or accommodation.` |
| **Method** | GET |
| **URL** | `http://localhost:5000/api/hotels` |

| Query Param | Type | Required | Description |
|-------------|------|----------|-------------|
| `location` | string | no | Filter by location (e.g. kedarnath) |
| `minPrice` | number | no | Minimum price per night |
| `maxPrice` | number | no | Maximum price per night |
| `rating` | number | no | Minimum rating |
| `available` | string | no | Set to "true" for available only |

Set these as **Query Parameters** using `$fromAI()`:
```
location = {{ $fromAI('location', 'optional location filter') }}
available = true
```

---

#### Tool 4: `get_taxis`

> "Search available taxis"

| Field | Value |
|-------|-------|
| **Name** | `get_taxis` |
| **Description** | `Get available taxis. Optional filters: location, vehicleType, minSeats, maxPrice. Use when user asks about taxis or cab booking.` |
| **Method** | GET |
| **URL** | `http://localhost:5000/api/taxis` |

| Query Param | Type | Required | Description |
|-------------|------|----------|-------------|
| `location` | string | no | Filter by location |
| `vehicleType` | string | no | e.g. SUV, sedan |
| `minSeats` | integer | no | Minimum seats needed |
| `maxPrice` | number | no | Max rate per km |

---

#### Tool 5: `get_checkpoints`

> "List checkpoints for hourly passes"

| Field | Value |
|-------|-------|
| **Name** | `get_checkpoints` |
| **Description** | `Get all active checkpoints where hourly passes can be booked. Use when user asks about hourly passes or checkpoints.` |
| **Method** | GET |
| **URL** | `http://localhost:5000/api/checkpoints` |

No parameters needed.

---

#### Tool 6: `get_hourly_pass_slots`

> "Check hourly pass slot availability for a checkpoint"

| Field | Value |
|-------|-------|
| **Name** | `get_hourly_pass_slots` |
| **Description** | `Get available hourly pass time slots for a specific checkpoint on a date. Use after get_checkpoints.` |
| **Method** | GET |
| **URL** | `http://localhost:5000/api/hourly-passes/checkpoints/{{ $fromAI('checkpointId') }}/slots` |

| Query Param | Type | Required | Description |
|-------------|------|----------|-------------|
| `date` | string | no | Date in YYYY-MM-DD format (defaults to today) |

| Path Param | Description |
|------------|-------------|
| `checkpointId` | Checkpoint ID from get_checkpoints |

---

#### Tool 7: `get_crowd_live`

> "Get live crowd status for all Dhams or a specific Dham"

| Field | Value |
|-------|-------|
| **Name** | `get_crowd_live` |
| **Description** | `Get live crowd data for all four Dhams or a specific one. Use when user asks about crowd, rush, or how busy a Dham is. Requires auth token.` |
| **Method** | GET |
| **URL** | `http://localhost:5000/api/crowd/live/{{ $fromAI('dhamName', 'optional: yamunotri, gangotri, kedarnath, or badrinath') }}` |

**Note:** This route requires Bearer auth. You have two options:
1. Create a service account JWT and add as Header: `Authorization: Bearer <token>`
2. Use the public dashboard endpoint instead (Tool 9)

---

#### Tool 8: `get_crowd_predict`

> "Predict crowd level for a Dham on a future date"

| Field | Value |
|-------|-------|
| **Name** | `get_crowd_predict` |
| **Description** | `Predict crowd level for a specific Dham on a future date. Use when user asks about expected crowd on a particular date.` |
| **Method** | POST |
| **URL** | `http://localhost:5000/api/crowd/predict` |
| **Headers** | `Authorization: Bearer <service-token>` |

**Body (JSON):**
```json
{
  "dham": "{{ $fromAI('dham', 'one of: yamunotri, gangotri, kedarnath, badrinath') }}",
  "date": "{{ $fromAI('date', 'YYYY-MM-DD format') }}"
}
```

---

#### Tool 9: `get_dashboard_live`

> "Get live dashboard — crowd, weather, passes, wait times (PUBLIC, no auth)"

| Field | Value |
|-------|-------|
| **Name** | `get_dashboard_live` |
| **Description** | `Get live dashboard data for all Dhams including crowd level, temperature, passes issued today, wait time, and road status. NO AUTH REQUIRED. Use for crowd status, weather, or general Dham conditions.` |
| **Method** | GET |
| **URL** | `http://localhost:5000/api/dashboard/live` |

**Response shape:**
```json
{
  "lastUpdated": "2026-05-20T...",
  "cards": [
    {
      "dham": "Kedarnath",
      "crowd": { "level": "High", "pct": 90, "color": "#DC2626" },
      "passesToday": 1250,
      "temperatureC": 8.5,
      "waitTimeMins": 120,
      "roadStatus": "caution"
    }
  ]
}
```

**This is the best tool for crowd + weather questions since it requires no auth.**

---

#### Tool 10: `get_dham_status`

> "Check which Dhams are open/closed and their season dates"

| Field | Value |
|-------|-------|
| **Name** | `get_dham_status` |
| **Description** | `Get opening/closing status of all four Dhams including dates and days until opening. Requires auth.` |
| **Method** | GET |
| **URL** | `http://localhost:5000/api/itinerary/dham-status` |
| **Headers** | `Authorization: Bearer <service-token>` |

**Response shape:**
```json
{
  "kedarnath": {
    "isOpen": true,
    "openingDate": "2026-05-07",
    "closingDate": "2026-11-15",
    "daysUntilOpen": 0
  }
}
```

---

#### Tool 11: `get_nearby_attractions`

> "Find nearby attractions around a Dham"

| Field | Value |
|-------|-------|
| **Name** | `get_nearby_attractions` |
| **Description** | `Get nearby attractions and alternatives for a specific Dham. Use when user asks what to see near a Dham.` |
| **Method** | GET |
| **URL** | `http://localhost:5000/api/itinerary/nearby/{{ $fromAI('dhamName') }}` |
| **Headers** | `Authorization: Bearer <service-token>` |

---

#### Tool 12: `web_search` (Generic Questions)

> "Search the web for general travel, history, culture questions"

**Option A — Using SerpAPI (recommended):**

| Field | Value |
|-------|-------|
| **Name** | `web_search` |
| **Description** | `Search the web for general questions about Chardham, travel tips, history, culture, packing lists, or anything not covered by other tools.` |
| **Method** | GET |
| **URL** | `https://serpapi.com/search.json` |

| Query Param | Value |
|-------------|-------|
| `q` | `{{ $fromAI('query', 'search query') }} Chardham Yatra` |
| `api_key` | `YOUR_SERPAPI_KEY` |
| `num` | `3` |

**Option B — Using n8n's built-in Wikipedia or Google node** if you prefer no API key.

---

#### Tool 13: `get_my_parking_bookings`

> "View user's own parking bookings"

| Field | Value |
|-------|-------|
| **Name** | `get_my_parking_bookings` |
| **Description** | `Get the logged-in user's parking bookings. Use when user asks "show my parking bookings" or "do I have any parking reservations".` |
| **Method** | GET |
| **URL** | `http://localhost:5000/api/parking/my-bookings` |
| **Headers** | `Authorization: Bearer {{ $('Webhook').item.json.userToken }}` |

---

#### Tool 14: `book_parking`

> "Book a parking slot for the user"

| Field | Value |
|-------|-------|
| **Name** | `book_parking` |
| **Description** | `Book a parking slot for the user. Requires areaId, slotId, and vehicleNumber. Use get_parking_areas then get_parking_slots first to find available slots. Always confirm with user before booking.` |
| **Method** | POST |
| **URL** | `http://localhost:5000/api/parking/book` |
| **Headers** | `Authorization: Bearer {{ $('Webhook').item.json.userToken }}` |

**Body (JSON):**
```json
{
  "areaId": "{{ $fromAI('areaId', 'parking area ID') }}",
  "slotId": "{{ $fromAI('slotId', 'specific slot ID') }}",
  "vehicleNumber": "{{ $fromAI('vehicleNumber', 'e.g. UK07AB1234') }}"
}
```

---

#### Tool 15: `get_my_hotel_bookings`

> "View user's own hotel bookings"

| Field | Value |
|-------|-------|
| **Name** | `get_my_hotel_bookings` |
| **Description** | `Get the logged-in user's hotel bookings. Use when user asks "show my hotel bookings" or "my reservations".` |
| **Method** | GET |
| **URL** | `http://localhost:5000/api/hotels/my-bookings` |
| **Headers** | `Authorization: Bearer {{ $('Webhook').item.json.userToken }}` |

---

#### Tool 16: `book_hotel`

> "Book a hotel room for the user"

| Field | Value |
|-------|-------|
| **Name** | `book_hotel` |
| **Description** | `Book a hotel room. Requires hotelId, checkIn, checkOut, guests, rooms. Use get_hotels first. Always confirm with user before booking.` |
| **Method** | POST |
| **URL** | `http://localhost:5000/api/hotels/book` |
| **Headers** | `Authorization: Bearer {{ $('Webhook').item.json.userToken }}` |

**Body (JSON):**
```json
{
  "hotelId": "{{ $fromAI('hotelId', 'hotel ID from get_hotels') }}",
  "checkIn": "{{ $fromAI('checkIn', 'ISO date e.g. 2026-06-01') }}",
  "checkOut": "{{ $fromAI('checkOut', 'ISO date e.g. 2026-06-03') }}",
  "guests": {{ $fromAI('guests', 'number of guests, min 1') }},
  "rooms": {{ $fromAI('rooms', 'number of rooms, min 1') }}
}
```

---

#### Tool 17: `get_my_taxi_bookings`

> "View user's own taxi bookings"

| Field | Value |
|-------|-------|
| **Name** | `get_my_taxi_bookings` |
| **Description** | `Get the logged-in user's taxi bookings. Use when user asks "show my taxi bookings" or "my cab rides".` |
| **Method** | GET |
| **URL** | `http://localhost:5000/api/taxis/my-bookings` |
| **Headers** | `Authorization: Bearer {{ $('Webhook').item.json.userToken }}` |

---

#### Tool 18: `book_taxi`

> "Book a taxi for the user"

| Field | Value |
|-------|-------|
| **Name** | `book_taxi` |
| **Description** | `Book a taxi. Requires taxiId, pickupLocation, dropoffLocation, pickupTime, distance. Use get_taxis first. Always confirm with user before booking.` |
| **Method** | POST |
| **URL** | `http://localhost:5000/api/taxis/book` |
| **Headers** | `Authorization: Bearer {{ $('Webhook').item.json.userToken }}` |

**Body (JSON):**
```json
{
  "taxiId": "{{ $fromAI('taxiId', 'taxi ID from get_taxis') }}",
  "pickupLocation": "{{ $fromAI('pickupLocation', 'e.g. Rishikesh') }}",
  "dropoffLocation": "{{ $fromAI('dropoffLocation', 'e.g. Kedarnath') }}",
  "pickupTime": "{{ $fromAI('pickupTime', 'ISO datetime e.g. 2026-06-01T08:00:00Z') }}",
  "distance": {{ $fromAI('distance', 'distance in km') }}
}
```

---

#### Tool 19: `get_my_hourly_passes`

> "View user's own hourly passes"

| Field | Value |
|-------|-------|
| **Name** | `get_my_hourly_passes` |
| **Description** | `Get the logged-in user's hourly checkpoint passes. Use when user asks "show my passes" or "my hourly pass bookings".` |
| **Method** | GET |
| **URL** | `http://localhost:5000/api/hourly-passes/my-passes` |
| **Headers** | `Authorization: Bearer {{ $('Webhook').item.json.userToken }}` |

---

#### Tool 20: `book_hourly_pass`

> "Book an hourly checkpoint pass for the user"

| Field | Value |
|-------|-------|
| **Name** | `book_hourly_pass` |
| **Description** | `Book an hourly checkpoint pass. Requires checkpointId, date, hour, vehicleOwnerName, vehicleOwnerPhone, vehicleNumber. Use get_checkpoints and get_hourly_pass_slots first. Always confirm with user before booking.` |
| **Method** | POST |
| **URL** | `http://localhost:5000/api/hourly-passes/book` |
| **Headers** | `Authorization: Bearer {{ $('Webhook').item.json.userToken }}` |

**Body (JSON):**
```json
{
  "checkpointId": "{{ $fromAI('checkpointId', 'checkpoint ID') }}",
  "date": "{{ $fromAI('date', 'YYYY-MM-DD') }}",
  "hour": {{ $fromAI('hour', '0-23 integer') }},
  "vehicleOwnerName": "{{ $fromAI('vehicleOwnerName', 'owner full name') }}",
  "vehicleOwnerPhone": "{{ $fromAI('vehicleOwnerPhone', 'phone number') }}",
  "vehicleNumber": "{{ $fromAI('vehicleNumber', 'e.g. UK07AB1234') }}",
  "numberOfPeople": {{ $fromAI('numberOfPeople', 'default 1') }}
}
```

---

### STEP 4 — Respond to Webhook

| Setting | Value |
|---------|-------|
| **Node** | Respond to Webhook |
| **Respond With** | JSON |
| **Response Body** | Expression (see below) |

```json
{
  "reply": "{{ $json.output }}",
  "intent": "ai_agent",
  "source": "n8n"
}
```

---

## Auth Strategy for Protected Routes

Several tools need `Authorization: Bearer <token>`. Create a **service account**:

1. Register an admin user via your backend:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"N8N Bot","email":"n8n-bot@system.local","password":"SecurePass123!","role":"admin"}'
```

2. Login to get a JWT:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"n8n-bot@system.local","password":"SecurePass123!"}'
```

3. Copy the `token` from the response.

4. In n8n, create a **Header Auth** credential:
   - Name: `Yatra Backend Auth`
   - Header Name: `Authorization`
   - Header Value: `Bearer <your-jwt-token>`

5. Attach this credential to tools 7, 8, 10, 11.

**For user-specific tools (13–20):** These use the user's own JWT passed as `userToken` in the webhook body. Update your backend `chatbot.routes.js` to forward the user's token:

```js
// In chatbot.routes.js — pass userToken to n8n
const n8nPayload = { message, userId, userToken: req.headers.authorization?.split(' ')[1] || '' };
```

> **Tip:** Set `JWT_EXPIRE=365d` in `.env` for the bot token so it doesn't expire frequently.

---

## Connection Map (n8n Canvas Wiring)

```
Webhook ──► AI Agent ──► Respond to Webhook
               │
               ├── get_parking_areas
               ├── get_parking_slots
               ├── get_hotels
               ├── get_taxis
               ├── get_checkpoints
               ├── get_hourly_pass_slots
               ├── get_crowd_live
               ├── get_crowd_predict
               ├── get_dashboard_live
               ├── get_dham_status
               ├── get_nearby_attractions
               ├── web_search
               ├── get_my_parking_bookings
               ├── book_parking
               ├── get_my_hotel_bookings
               ├── book_hotel
               ├── get_my_taxi_bookings
               ├── book_taxi
               ├── get_my_hourly_passes
               └── book_hourly_pass
```

All HTTP Request tool nodes connect **into** the AI Agent as tools. The AI Agent's output connects to the Respond to Webhook node.

---

## Backend `.env` Update

Ensure your backend `.env` has:

```env
N8N_WEBHOOK_URL=http://localhost:5678/webhook/chardham-chat
```

---

## Testing

### 1. Direct n8n Webhook Test

```powershell
# Parking question
Invoke-RestMethod -Method POST -Uri "http://localhost:5678/webhook/chardham-chat" `
  -ContentType "application/json" `
  -Body '{"message":"Is parking available near Kedarnath?","language":"en"}'

# Hotel question
Invoke-RestMethod -Method POST -Uri "http://localhost:5678/webhook/chardham-chat" `
  -ContentType "application/json" `
  -Body '{"message":"Show me hotels in Badrinath under 3000 rupees","language":"en"}'

# Taxi question
Invoke-RestMethod -Method POST -Uri "http://localhost:5678/webhook/chardham-chat" `
  -ContentType "application/json" `
  -Body '{"message":"I need a taxi from Rishikesh to Kedarnath","language":"en"}'

# Hourly pass question
Invoke-RestMethod -Method POST -Uri "http://localhost:5678/webhook/chardham-chat" `
  -ContentType "application/json" `
  -Body '{"message":"What hourly pass slots are available today?","language":"en"}'

# Crowd status
Invoke-RestMethod -Method POST -Uri "http://localhost:5678/webhook/chardham-chat" `
  -ContentType "application/json" `
  -Body '{"message":"How crowded is Kedarnath right now?","language":"en"}'

# Itinerary / Dham status
Invoke-RestMethod -Method POST -Uri "http://localhost:5678/webhook/chardham-chat" `
  -ContentType "application/json" `
  -Body '{"message":"Is Yamunotri temple open right now?","language":"en"}'

# Generic question (web search)
Invoke-RestMethod -Method POST -Uri "http://localhost:5678/webhook/chardham-chat" `
  -ContentType "application/json" `
  -Body '{"message":"What is the history of Kedarnath temple?","language":"en"}'
```

### 2. Full Chain Test (Backend → n8n)

```powershell
Invoke-RestMethod -Method POST -Uri "http://localhost:5000/api/chatbot" `
  -ContentType "application/json" `
  -Body '{"message":"Show me available parking near Kedarnath","userId":"test1"}'
```

---

## Sample Conversations

| User Message | Tool Used | What Happens |
|---|---|---|
| "Is there parking near Kedarnath?" | `get_parking_areas` | Lists areas + available slots |
| "Show my parking bookings" | `get_my_parking_bookings` | Returns user's parking reservations |
| "Book parking slot A3 for UK07AB1234" | `book_parking` | Books the slot after confirmation |
| "Show hotels in Badrinath under ₹2000" | `get_hotels` | Queries with location=badrinath, maxPrice=2000 |
| "Show my hotel reservations" | `get_my_hotel_bookings` | Returns user's hotel bookings |
| "Book a room at Hotel XYZ for June 1-3" | `book_hotel` | Books hotel after confirmation |
| "I need a cab from Rishikesh" | `get_taxis` | Queries with location=rishikesh |
| "Show my taxi bookings" | `get_my_taxi_bookings` | Returns user's taxi rides |
| "Book that SUV for tomorrow 8am" | `book_taxi` | Books taxi after confirmation |
| "What hourly pass slots are free tomorrow?" | `get_checkpoints` → `get_hourly_pass_slots` | Agent chains: first gets checkpoint IDs, then slots |
| "Show my hourly passes" | `get_my_hourly_passes` | Returns user's checkpoint passes |
| "Book the 10am slot at Sonprayag" | `book_hourly_pass` | Books pass after confirmation |
| "How crowded is Kedarnath?" | `get_dashboard_live` | Returns crowd level, wait time, temp |
| "Will it be crowded on June 15?" | `get_crowd_predict` | Posts prediction request |
| "Is Badrinath open?" | `get_dham_status` | Returns open/close dates |
| "What to see near Gangotri?" | `get_nearby_attractions` | Returns attractions list |
| "What should I pack for Chardham?" | `web_search` | Searches web, summarizes |
| "केदारनाथ में मौसम कैसा है?" | `get_dashboard_live` | Hindi reply with weather data |

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| n8n returns empty | Check AI Agent has tools attached and model credential is set |
| Auth errors on crowd/itinerary | Verify service JWT is valid and not expired |
| Backend ignores n8n | Check `N8N_WEBHOOK_URL` in `.env` matches n8n's webhook URL |
| Slow responses | Reduce AI model to Gemini Flash or GPT-4o-mini; set HTTP timeout to 10s |
| Agent picks wrong tool | Improve tool descriptions to be more specific |
| Web search fails | Verify SerpAPI key or switch to built-in Wikipedia node |

---

## Production Checklist

- [ ] Replace `localhost:5000` with production backend URL in all tool URLs
- [ ] Replace `localhost:5678` with production n8n URL in backend `.env`
- [ ] Use long-lived service JWT for bot authentication
- [ ] Set n8n workflow to **Active**
- [ ] Add rate limiting on the webhook
- [ ] Monitor n8n execution logs for errors
- [ ] Consider adding a Memory node to the AI Agent for multi-turn conversations
