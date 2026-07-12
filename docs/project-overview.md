# Project Overview — Basa Lagbe

**Basa Lagbe** is a Bangladesh-focused home rental marketplace. Renters discover listings on a map + list UI, landlords post and manage properties, and admins moderate content and users.

Currency and product copy assume **BDT** and local rental patterns (family / bachelor / both, phone verification, etc.).

---

## User roles

| Role                 | Capabilities                                                                               |
| -------------------- | ------------------------------------------------------------------------------------------ |
| **Renter / guest**   | Browse and filter listings, view map, request bookings, manage account                     |
| **Landlord / owner** | Create and manage listings (`/list-your-house`, `/dashboard`), respond to booking requests |
| **Admin**            | Moderate listings and users (`/admin`), view impressions/analytics                         |

Roles live on `profiles` (e.g. `user` / `landlord` / `admin`).

---

## Tech stack

| Layer              | Choice                                                                                     |
| ------------------ | ------------------------------------------------------------------------------------------ |
| Framework          | Next.js 16 (App Router), React 19                                                          |
| Language           | TypeScript (strict)                                                                        |
| Styling            | Tailwind CSS v4, design tokens in `app/globals.css`, Geist fonts                           |
| UI                 | Custom primitives under `components/UI/` (no shadcn/Radix), Lucide icons, Floating UI      |
| Database & Auth    | Supabase (PostgreSQL + Auth), `@supabase/ssr` cookie sessions                              |
| Phone verification | Twilio Verify (optional)                                                                   |
| Images             | ImageKit (client uploads via `/api/imagekit/auth`)                                         |
| Maps               | Google Maps JavaScript API + marker clustering                                             |
| Mutations / data   | Server Components for reads, Server Actions in `app/actions/`, API routes under `app/api/` |

---

## Directory map

```
basa-lagbe/
├── app/                    # App Router pages, layouts, API routes, Server Actions
│   ├── page.tsx            # Home (map + listings)
│   ├── account/            # Account settings
│   ├── auth/login/         # Auth
│   ├── admin/              # Admin dashboard
│   ├── dashboard/          # Owner dashboard
│   ├── list-your-house/    # Create listing flow
│   ├── contact/
│   ├── actions/            # Server Actions (e.g. listings)
│   └── api/                # REST routes (listings, bookings, admin, phone, imagekit)
├── components/
│   ├── UI/                 # Shared primitives (input, label, dropdown, etc.)
│   ├── header/, layout/, home/
│   ├── filters/, map/, listings-list/
│   ├── listing-detail-sidebar/, location-picker/
│   ├── list-your-house/, account/, dashboard/
├── lib/                    # Business logic, Supabase clients, mappers, hooks, env
├── types/                  # Shared TS types (listing, booking, filters)
├── hooks/                  # Thin / legacy hook space (prefer lib/hooks)
├── supabase/migrations/    # SQL migrations
├── public/                 # Static assets (e.g. geo)
├── assets/                 # Icons, logo
├── proxy.ts                # Session middleware (auth cookie refresh)
└── docs/                   # Project documentation (this folder)
```

Path alias: `@/*` → project root (`tsconfig.json`).

---

## Key features

- **Discovery**: Home page combines map + list; filters include bathroom, bedrooms, area, price, location, amenities, description, title, category
- **Listing creation**: Multi-step flow under `/list-your-house`; photos via ImageKit (minimum 3 images required by product rules)
- **Bookings**: Guests request stays; owners manage requests from the dashboard
- **Admin moderation**: Listing/user moderation and impression tracking
- **Phone verification**: Twilio Verify for dashboard phone flows (optional env)
- **Auth**: Supabase email auth with SSR session refresh via `proxy.ts` → `lib/supabase/middleware.ts`

---

## Environment variables

Copy from `.env.example` and `.env.local.example` into local env files. Do not commit secrets.

| Variable                          | Purpose                                      |
| --------------------------------- | -------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`        | Supabase project URL                         |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`   | Public anon key (browser / RLS)              |
| `SUPABASE_SERVICE_ROLE_KEY`       | Server-only; admin API & impressions insert  |
| `NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY` | Client-side ImageKit uploads                 |
| `IMAGEKIT_PRIVATE_KEY`            | Server auth for ImageKit upload tokens       |
| `IMAGEKIT_UPLOAD_FOLDER`          | Optional folder for listing uploads          |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Maps + location picker (Maps JavaScript API) |
| `TWILIO_ACCOUNT_SID`              | Twilio Verify (optional)                     |
| `TWILIO_AUTH_TOKEN`               | Twilio Verify (optional)                     |
| `TWILIO_VERIFY_SERVICE_SID`       | Twilio Verify service (optional)             |

The app should degrade gracefully when optional services (e.g. Supabase) are misconfigured in local/dev.

---

## Database (at a glance)

Migrations live in `supabase/migrations/`. Core tables:

| Table                 | Role                                                                |
| --------------------- | ------------------------------------------------------------------- |
| `profiles`            | 1:1 with `auth.users`; display name, phone, role, moderation fields |
| `listings`            | Owner-owned rentals; lat/lng, price, photos, status, moderation     |
| `bookings`            | Guest requests against a listing (dates, status, guest details)     |
| `listing_impressions` | Analytics events (typically inserted via service role)              |

RLS is enabled; policies cover owner access, guest profile visibility for booking owners, admin flows, etc.

---

## Related docs

- [Coding guidelines](./coding-guidelines.md)
- [Design system](./design-system.md)
- [Agent guidelines](./agent-guidelines.md)
