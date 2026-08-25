# Basa Lagbe — বাসা লাগবে

> **Bangladesh's home rental marketplace.** Find and list homes for rent, filter by location, and connect landlords with renters.

---

## Overview

**Basa Lagbe** ("Need a House" in Bengali) is a full-stack rental marketplace tailored for the Bangladesh market. Renters can discover listings on an interactive map or a paginated list view; landlords can post and manage properties with a guided multi-step flow; admins can moderate content and users through a dedicated dashboard.

Key product decisions reflect local rental culture — currency in **BDT**, listing categories of **Family / Bachelor / Both**, phone verification, and a minimum of 3 photos per listing.

---

## Features

| Feature | Details |
|---|---|
| 🗺️ **Map + List Discovery** | Interactive Google Maps view with marker clustering alongside an infinite-scroll list |
| 🔍 **Rich Filtering** | Filter by title, category, price range, bedrooms, bathrooms, area, location, and amenities |
| 🏠 **Listing Creation** | Multi-step guided flow at `/list-your-house` with ImageKit photo uploads (min. 3 images) |
| 📅 **Bookings** | Guests request stays; landlords manage requests from their dashboard |
| 🛡️ **Admin Moderation** | Listing and user moderation panel with impression analytics |
| 📱 **Phone Verification** | Twilio Verify for dashboard phone number flows (optional) |
| 🔐 **Auth** | Supabase email auth with SSR session refresh via middleware |
| 📊 **Analytics** | Listing impression tracking via `listing_impressions` table |

---

## Tech Stack

| Layer | Choice |
|---|---|
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router), [React 19](https://react.dev/) |
| **Language** | TypeScript (strict mode) |
| **Styling** | Tailwind CSS v4, design tokens in `app/globals.css`, Geist fonts |
| **UI Components** | Custom primitives in `components/UI/` — no shadcn/Radix. Lucide icons, Floating UI |
| **Database & Auth** | [Supabase](https://supabase.com/) (PostgreSQL + Auth), `@supabase/ssr` cookie sessions |
| **Images** | [ImageKit](https://imagekit.io/) — client uploads via `/api/imagekit/auth` |
| **Maps** | [Google Maps JavaScript API](https://developers.google.com/maps/documentation/javascript) + `@googlemaps/markerclusterer` |
| **Phone Verification** | [Twilio Verify](https://www.twilio.com/docs/verify/api) (optional) |
| **Data Mutations** | Server Components for reads, Server Actions in `app/actions/`, REST routes under `app/api/` |

---

## User Roles

| Role | Capabilities |
|---|---|
| **Renter / Guest** | Browse and filter listings, view map, request bookings, manage account |
| **Landlord / Owner** | Create and manage listings (`/list-your-house`, `/dashboard`), respond to booking requests |
| **Admin** | Moderate listings and users (`/admin`), view impression analytics |

Roles are stored on the `profiles` table (`user` / `landlord` / `admin`).

---

## Database Schema

Migrations live in `supabase/migrations/`. Core tables:

| Table | Purpose |
|---|---|
| `profiles` | 1:1 with `auth.users`; display name, phone, role, moderation fields |
| `listings` | Owner-owned rental properties; lat/lng, price, photos, status, expiry |
| `bookings` | Guest stay requests against a listing (dates, status, guest details) |
| `listing_impressions` | Analytics events (inserted via service role key) |

Row Level Security (RLS) is enabled on all tables with policies covering owner access, guest profile visibility for booking owners, and admin flows.

---

## Getting Started

### Prerequisites

- Node.js ≥ 20
- A [Supabase](https://supabase.com/) project
- An [ImageKit](https://imagekit.io/) account
- A [Google Maps](https://console.cloud.google.com/) API key (Maps JavaScript API enabled)
- *(Optional)* A [Twilio](https://www.twilio.com/) account for phone verification

### 1. Clone & Install

```bash
git clone <repo-url>
cd basa-lagbe
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env.local
```

Fill in the values in `.env.local`:

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key (browser / RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only; admin API & impressions insert |
| `NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY` | Client-side ImageKit uploads |
| `IMAGEKIT_PRIVATE_KEY` | Server auth for ImageKit upload tokens |
| `IMAGEKIT_UPLOAD_FOLDER` | *(Optional)* Folder for listing uploads in ImageKit |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Maps + location picker |
| `TWILIO_ACCOUNT_SID` | *(Optional)* Twilio Verify |
| `TWILIO_AUTH_TOKEN` | *(Optional)* Twilio Verify |
| `TWILIO_VERIFY_SERVICE_SID` | *(Optional)* Twilio Verify service |

> The app degrades gracefully when optional services (Supabase, Twilio) are not configured in local/dev.

### 3. Apply Database Migrations

Apply migrations through the Supabase CLI or the Supabase dashboard SQL editor using the files in `supabase/migrations/`.

### 4. Run the Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start the Next.js development server |
| `npm run build` | Build the production bundle |
| `npm start` | Start the production server |
| `npm run lint` | Run ESLint |

---

## Documentation

Internal docs live in the [`docs/`](./docs/) folder:

- [Project Overview](./docs/project-overview.md)
- [Coding Guidelines](./docs/coding-guidelines.md)
- [Design System](./docs/design-system.md)
- [Agent Guidelines](./docs/agent-guidelines.md)

---

## License

Private project — all rights reserved.
