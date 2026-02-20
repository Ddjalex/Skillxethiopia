# Replit Agent Guide

## Overview

This is **SkillxEthiopia**, a modern course learning platform similar to Udemy. Users can browse courses, purchase individual seasons or episodes, and watch video content. The platform supports three user roles: visitors (public browsing), registered users (purchasing and watching content), and admins (full platform management). The content model is hierarchical: Categories → Courses → Seasons → Episodes, with granular purchasing at the season or episode level.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Monorepo Structure
The project uses a single-repo architecture with three top-level directories:
- `client/` — React SPA frontend
- `server/` — Express.js backend API
- `shared/` — Shared TypeScript types, schemas, and route definitions used by both client and server

### Frontend (client/)
- **Framework**: React 18 with TypeScript (no SSR, purely client-side SPA)
- **Routing**: Wouter (lightweight alternative to React Router)
- **State Management**: TanStack React Query for server state; React Context for auth state
- **UI Components**: shadcn/ui (new-york style) built on Radix UI primitives with Tailwind CSS
- **Styling**: Tailwind CSS with CSS variables for theming (supports dark mode). The font stack uses Lexend as the primary sans-serif font
- **Forms**: React Hook Form with Zod resolvers for validation
- **Animations**: Framer Motion for page transitions
- **Video Playback**: react-player for Vimeo/YouTube video embedding
- **Icons**: Lucide React
- **Build Tool**: Vite with path aliases (`@/` → `client/src/`, `@shared/` → `shared/`)

### Backend (server/)
- **Runtime**: Node.js with TypeScript (using tsx for dev, esbuild for production build)
- **Framework**: Express.js
- **Authentication**: Session-based auth using Passport.js with the local strategy (email/password). Passwords are hashed with bcrypt. Sessions are stored in PostgreSQL via `connect-pg-simple`
- **API Pattern**: RESTful JSON API under `/api` prefix. Route definitions and Zod schemas are shared between client and server through `shared/routes.ts`
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Management**: `drizzle-kit push` for applying schema changes (no migration files workflow — uses `db:push` command)

### Database Schema (shared/schema.ts)
PostgreSQL with these core tables:
- **users** — id, name, email, passwordHash, role (USER/ADMIN), createdAt
- **categories** — id, name, slug (unique)
- **courses** — id, categoryId, title, slug (unique), description, thumbnailUrl, instructorName, priceStrategy (FREE/PAID), createdAt
- **seasons** — id, courseId, title, seasonNumber, price, createdAt
- **episodes** — id, seasonId, title, episodeNumber, description, durationSec, isPreview, price, videoProvider (VIMEO default), createdAt
- **purchases** — tracks user purchases of seasons/episodes
- **accessGrants** — tracks user access to specific content

Validation schemas are generated using `drizzle-zod` and extended with custom Zod schemas in `shared/schema.ts`.

### Protected Routes
- Client-side route protection via `ProtectedRoute` component that checks auth state and redirects to `/auth` if not logged in
- Admin routes check for `role === "ADMIN"` and redirect non-admins to home
- Server-side auth is enforced via Passport.js session middleware

### Build & Deployment
- **Dev**: `tsx server/index.ts` with Vite dev server middleware for HMR
- **Build**: Custom build script (`script/build.ts`) that runs Vite build for client and esbuild for server, outputting to `dist/`
- **Production**: `node dist/index.cjs` serves both the API and the static client bundle
- The server in production serves the built client files from `dist/public/` with SPA fallback to `index.html`

### Key Design Decisions
1. **Session-based auth over JWT**: Simpler for this use case; all fetch requests use `credentials: "include"`
2. **Shared schema/routes**: The `shared/` directory ensures type safety between frontend and backend. Route definitions include Zod response schemas for runtime validation on both sides
3. **Granular content purchasing**: Users can buy individual seasons or episodes rather than entire courses, giving flexible pricing
4. **Storage abstraction**: The `IStorage` interface in `server/storage.ts` abstracts all data access, making it possible to swap implementations

## External Dependencies

### Database
- **PostgreSQL** — Primary database, required. Connection via `DATABASE_URL` environment variable
- Used for both application data (Drizzle ORM) and session storage (`connect-pg-simple`)

### Environment Variables
- `DATABASE_URL` — PostgreSQL connection string (required)
- `SESSION_SECRET` — Secret for express-session (falls back to "fallback-secret-key" in dev)

### Key npm Packages
- `drizzle-orm` + `drizzle-kit` — ORM and schema management
- `express` + `express-session` — Web server and session handling
- `passport` + `passport-local` — Authentication
- `bcrypt` — Password hashing
- `connect-pg-simple` — PostgreSQL session store
- `zod` + `drizzle-zod` — Schema validation
- `react-player` — Video playback (Vimeo/YouTube)
- `framer-motion` — Animations
- `@tanstack/react-query` — Server state management
- Full shadcn/ui component library (Radix UI primitives)

### Replit-specific
- `@replit/vite-plugin-runtime-error-modal` — Runtime error overlay in dev
- `@replit/vite-plugin-cartographer` — Dev tooling (dev only)
- `@replit/vite-plugin-dev-banner` — Dev banner (dev only)