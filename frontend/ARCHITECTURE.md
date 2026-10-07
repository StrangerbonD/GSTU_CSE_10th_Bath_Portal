# GSTU CSE 10th Batch Portal - Frontend Architecture

> **Engineering Guide for Developers & Technical Reviewers**  
> This document details the architectural layout, directory organization, state management patterns, and module navigation for the Next.js frontend of the GSTU CSE 10th Batch Portal.

---

## 1. High-Level Architecture & Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **UI Library**: React 19 & [Tailwind CSS](https://tailwindcss.com/)
- **Icons & Graphics**: [Lucide React](https://lucide.dev/), Recharts (GPA progression analytics)
- **Network & Auth Layer**: Centralized `authFetch` with **in-memory Access Tokens**, **Refresh Token Rotation**, and **Single-Flight Concurrency Control**
- **Edge Routing**: `src/middleware.js` for role-based route protection (`/admin`, `/dashboard`, `/login`)

---

## 2. Directory Structure

```
frontend/src/
├── app/                      # Next.js App Router (pages & server boundaries)
│   ├── (auth)/               # Authentication route group
│   │   ├── login/            # /login
│   │   ├── register/         # /register
│   │   └── verify-email/     # /verify-email (OTP verification)
│   ├── academics/            # /academics (Syllabus & Academic Calendar)
│   ├── admin/                # /admin (Admin console & control dashboard)
│   ├── certificate/          # /certificate (Provisional Degree Certificate view)
│   ├── dashboard/            # /dashboard (Authenticated Student profile)
│   ├── resources/            # /resources (Semester drives & resources)
│   ├── statistics/           # /statistics (Instant batch-wide CGPA statistics)
│   ├── transcript/           # /transcript (8-semester academic transcript)
│   ├── layout.js             # Root layout with persistent navbar & font loading
│   └── page.js               # Landing page with dynamic carousel & thoughts
│
├── components/               # Domain-Driven Modular Components
│   ├── academics/            # Academics syllabus & interactive calendar
│   ├── admin/                # Admin panels, student result editors, moderation tabs
│   │   └── control/          # Granular moderation tabs (claims, CR roles, thoughts)
│   ├── auth/                 # Login, Registration, OTP Verification forms
│   ├── Certificate/          # Official provisional certificate template & skeleton
│   ├── home/                 # Landing page interactive widgets & CR experience
│   ├── layout/               # Global shell (Navbar, LeftSidebarDrawer, ProfileDrawer)
│   ├── modals/               # Reusable action modals (Claim, Status, Previews)
│   ├── resources/            # Resource repository cards & downloads
│   ├── Statistics/           # Batch statistics charts & skeleton loaders
│   └── Transcript/           # 8-Semester cards, GPA progression chart, summary
│
├── services/                 # Unified Network & API Client Layer
│   ├── authFetch.js          # Resilient fetch client with auto silent-refresh
│   ├── authService.js        # Auth lifecycle, user state, sync, password management
│   ├── portalService.js      # Student public & academic data APIs (cached stats)
│   └── adminService.js       # Admin moderation, student results, landing photos
│
├── lib/                      # Shared Utilities & Helpers
│   └── avatar.js             # Unified avatar URL builder & fallback resolver
│
└── middleware.js             # Edge route protection & role redirection
```

---

## 3. Developer Navigation Map: "Where do I find..."

| Feature / Task | Relevant Files | Purpose |
| :--- | :--- | :--- |
| **Authentication & OTP** | `src/components/auth/`<br>`src/services/authService.js`<br>`src/app/(auth)/` | User login, sign-up, email OTP verification, password updates. |
| **API Requests & Auth Interceptor** | `src/services/authFetch.js` | Manages 401 interceptors, silent token refresh, and prevents race conditions with a single-flight promise. |
| **Global Navigation & Shell** | `src/components/layout/`<br>`src/app/layout.js` | Persistent Header (`Navbar`), Sidebar (`LeftSidebarDrawer`), and User Settings (`ProfileSettingsDrawer`). |
| **Modal Dialogs** | `src/components/modals/` | All modal popups (`ClaimModal`, `CrClaimModal`, `StatusModal`, `TranscriptModal`, `CertificateModal`, `StatisticsModal`). |
| **Academic Transcript** | `src/components/Transcript/`<br>`src/app/transcript/page.js` | 8-semester marksheet grid, semester GPA cards, cumulative CGPA progression chart, print styles. |
| **Provisional Certificate** | `src/components/Certificate/`<br>`src/app/certificate/page.js` | Official degree certificate document preview, print layout, and metadata customizer. |
| **Batch Statistics & Zero-Flicker** | `src/components/Statistics/`<br>`src/app/statistics/page.js`<br>`src/services/portalService.js` | Real-time CGPA distribution, grade breakdown, and in-memory/session revalidation cache. |
| **Admin & Moderation** | `src/components/admin/`<br>`src/services/adminService.js`<br>`src/app/admin/page.js` | Result editing, student claim moderation, CR applications, thought approval, landing photo carousel. |
| **Shared Helpers & Avatars** | `src/lib/avatar.js` | Generates student/user profile images with cache-busting queries and dynamic SVG fallbacks. |

---

## 4. Key Architectural Patterns

### 1. In-Memory Access Token with Single-Flight Refresh (`authFetch.js`)
- Access tokens expire every 15 minutes and are kept **in memory** (not localStorage) to defend against XSS.
- When multiple parallel requests receive `401 Unauthorized`, `authFetch` queues them into a single-flight refresh call. Only **one** refresh request hits the server, preserving token rotation consistency.
- Refresh tokens reside safely in `HttpOnly, Secure` cookies.

### 2. Zero-Flicker Public Caching (SWR Pattern)
- Statistics and public endpoints implement a **Stale-While-Revalidate** model:
  1. Instant retrieval from memory / `sessionStorage` (`portalService.getCachedStatistics()`).
  2. UI displays cached metrics instantly upon navigation or browser refresh (0ms perceived latency).
  3. Background revalidation fetches fresh data without unmounting existing elements.

### 3. Component Modularity & Clean Barrel Exports
- Loose root files have been eliminated. Each functional domain features its own folder (`layout/`, `modals/`, `academics/`, `resources/`, `Transcript/`, etc.).
- Folder barrel files (`index.js`) allow clean named or default imports without tight coupling to internal filenames.

---

## 5. Running & Testing

```bash
# Install dependencies
npm install

# Start local Next.js development server
npm run dev

# Run frontend unit tests (authFetch & refresh queue verification)
npm test

# Production build check
npm run build
```
