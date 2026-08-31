# CeyCrafts — AI-Powered Handmade Marketplace

Phase 1 implementation of the marketplace described in
`Client_Proposal_Handmade_Bracelet_Marketplace.pdf`: a React + Laravel + MySQL
marketplace for handmade bracelets/bangles, with three AI-powered features
(smart product tagging, personalized recommendations, virtual try-on) running
as independent Python microservices.

## Project layout

```
backend/            Laravel 11 API (auth, products, cart, orders, admin)
frontend/            React 19 + Vite + Tailwind v4 SPA
ai-services/
  tagging-service/       NLP smart tagging  (FastAPI, port 8001)
  recommendation-service/ Personalized ranking (FastAPI, port 8002)
  tryon-service/          Virtual try-on / computer vision (FastAPI, port 8003)
```

The Laravel backend is the single source of truth for data (MySQL). It calls
the three Python services over plain HTTP (`app/Services/*.php`) - the
marketplace itself keeps working even if an AI service is down; only the
smart feature it powers degrades (e.g. recommendations fall back to
recency/popularity, tagging just returns nothing to prefill).

## Running everything locally

You need 5 processes running at once. Each command below is meant to run in
its own terminal.

### 1. Database

By default the backend runs on **SQLite** (zero config, good for trying
things out). `backend/database/database.sqlite` already exists after the
setup steps below.

To use **MySQL** instead (matches the proposal's stack, recommended once
you're building for real): start WAMP, create a database called
`bracelet_marketplace` (e.g. via phpMyAdmin), then in `backend/.env` set:

```
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=bracelet_marketplace
DB_USERNAME=root
DB_PASSWORD=
```

Then re-run the migrate/seed step below.

### 2. Backend (Laravel) - PHP 8.2+ required

WAMP ships several PHP versions; use 8.3+ (`wamp64/bin/php/php8.3.14`), not
the older default on PATH.

```bash
cd backend
composer install
cp .env.example .env      # already done if you're reading this from the repo
php artisan key:generate
php artisan migrate --seed
php artisan storage:link
php artisan serve
```

This seeds 3 demo accounts (all password `password`) and 4 sample listings:

| Role     | Email                  |
|----------|-------------------------|
| Admin    | admin@example.com      |
| Seller   | seller@example.com     |
| Customer | customer@example.com   |

API runs at `http://127.0.0.1:8000/api`.

### 3. AI services (Python 3.11+, FastAPI)

Each service is independent - install and run separately.

```bash
cd ai-services/tagging-service
pip install -r requirements.txt
python -m uvicorn main:app --port 8001

cd ai-services/recommendation-service
pip install -r requirements.txt
python -m uvicorn main:app --port 8002

cd ai-services/tryon-service
pip install -r requirements.txt
# downloads Google's pretrained hand-landmark model (~8MB) once:
mkdir -p models && curl -L -o models/hand_landmarker.task \
  https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task
python -m uvicorn main:app --port 8003
# First startup also downloads rembg's U2Net weights (~176MB, cached to
# ~/.rembg afterwards) and takes ~20s to warm up before it starts serving
# - that's expected, not a hang. See "How the AI features actually work"
# below for why.
```

The URLs Laravel calls are configured in `backend/.env`
(`TAGGING_SERVICE_URL`, `RECOMMENDATION_SERVICE_URL`, `TRYON_SERVICE_URL`) -
change them if you deploy the AI services elsewhere.

### 4. Frontend (React)

```bash
cd frontend
npm install
npm run dev
```

Runs at `http://localhost:5173`. `frontend/.env` points it at the backend
(`VITE_API_BASE_URL`).

## How the AI features actually work (Phase 1 implementation notes)

- **Smart tagging** (`ai-services/tagging-service`) is rule-based keyword
  matching against a curated taxonomy (`taxonomy.py`), not a trained model -
  deliberately, since there's no labelled dataset yet. It's a genuine,
  working NLP pipeline (tokenize → match category/material/colour/style
  keyword lists) and can be swapped for a trained classifier later without
  changing the API contract (`POST /tag`) or anything on the Laravel/React
  side.
- **Recommendations** (`ai-services/recommendation-service`) score every
  candidate product against the customer's stated preferences (colour/
  material/style/budget/occasion overlap, weighted) via `POST /recommend`.
  No preferences saved yet (skipped onboarding, or a guest) → falls back to
  a recency + popularity ranking.
- **Virtual try-on** (`ai-services/tryon-service`) uses Google's pretrained
  MediaPipe HandLandmarker to find the wrist in the uploaded photo, then
  composites the product's image onto it at the right position/scale/angle
  (Pillow). If auto-detection fails (bad lighting, cropped photo, uncommon
  angle), the frontend lets the customer tap both edges of their wrist on
  the photo instead, and the same compositing runs from those two points -
  the feature always completes, it just falls back to manual placement.

  Sellers upload ordinary product photos (bracelet on a card, in a box, on
  fabric) - not pre-cut transparent PNGs - so before compositing, the
  service isolates the product from its background using **rembg (U2Net)**,
  a pretrained neural segmentation model (`background_removal.py`). This
  matters: an earlier classical-CV approach (OpenCV GrabCut) worked for
  simple backgrounds but had no real answer for a busy one (e.g. a product
  photographed on top of a printed magazine) - the trained model handles
  both. The model is loaded once at service startup (~20s, see the
  `startup` event in `main.py`) rather than per request, so it doesn't add
  latency to anyone's first try-on; inference itself is well under a
  second. A seller-supplied cutout with real transparency is detected and
  left alone rather than re-segmented. If the model can't load at all
  (e.g. first run with no internet to fetch its weights), a GrabCut
  fallback keeps the feature working with lower-quality cutouts on hard
  backgrounds rather than failing outright.

## Auth model

Token-based (Sanctum personal access tokens), not cookie/session SPA auth -
the React app stores the token from `/auth/register` or `/auth/login` in
`localStorage` and sends `Authorization: Bearer <token>`. Simpler to reason
about across the two separate dev origins (`:5173` / `:8000`) than
cookie-based CSRF, and works the same way in production behind any domain
setup.

## What's implemented vs. proposal scope

Everything listed under "7.1 Included in Phase 1" in the proposal: seller
registration/listing/management, customer registration + optional
onboarding + browse/search/filter, NLP tagging with seller review before
publish, personalized recommendation feed, virtual try-on, cart, COD/bank
transfer checkout, and a basic admin dashboard (stats + publish/unpublish
any listing).

Not built (explicitly deferred to later phases per proposal 7.2): payment
gateway, categories beyond bracelets/bangles/anklets, native mobile app,
in-app chat, Sinhala/Tamil UI.
