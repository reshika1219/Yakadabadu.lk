# Yakadabadu.lk

Waste pickup management: customers schedule metal/plastic/wood pickups, drivers see and complete their assigned pickups, and an admin view assigns drivers and plans routes.

## Stack
- **Backend:** Node.js, Express, MongoDB (Mongoose), JWT auth, Google Maps Directions
- **Frontend:** React 19, Vite, Bootstrap

## Setup
```bash
# backend (http://localhost:5000)
cd backend
cp .env.example .env   # fill in MONGODB_URI, JWT_SECRET, GOOGLE_MAPS_API_KEY
npm install
npm run dev

# frontend (http://localhost:5173)
cd frontend
cp .env.example .env   # VITE_GOOGLE_MAPS_API_KEY
npm install
npm run dev
```

## Roles
- **Customer** – register/login on `/login` (Customer tab), then schedule pickups at `/schedule-pickup`.
- **Driver** – login on `/login`; `/home`, `/driver-dashboard`, `/driver-profile`, `/admin-dashboard`.

Driver and admin API endpoints reject customer tokens.
