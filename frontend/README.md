# GSTU CSE 10th Batch Portal - Frontend

The modern frontend application for the GSTU CSE 10th Batch Academic & Community Portal, built with **Next.js 16**, **React 19**, and **Tailwind CSS**.

---

## 📖 Architecture & Codebase Guide

For a detailed breakdown of the directory organization, component domains, token refresh security, and feature map, please refer to:
👉 **[ARCHITECTURE.md](./ARCHITECTURE.md)**

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env.local` file in the frontend root if running on a custom backend host:
```env
NEXT_PUBLIC_API_URL=http://localhost:5001
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Run Automated Tests
```bash
npm test
```

---

## 📂 Core Directory Overview

- `src/app/` - Next.js App Router pages (`(auth)`, `academics`, `resources`, `statistics`, `transcript`, `certificate`, `dashboard`, `admin`)
- `src/components/` - Clean, domain-organized components:
  - `layout/` - Global navigation (`Navbar`, `LeftSidebarDrawer`, `ProfileSettingsDrawer`)
  - `modals/` - All action modals (`ClaimModal`, `CrClaimModal`, `StatusModal`, `TranscriptModal`, `CertificateModal`, `StatisticsModal`)
  - `admin/` - Administrative control panels and moderation tabs
  - `auth/` - Sign in, registration, and OTP email verification
  - `Transcript/` - 8-semester marksheet grid, semester cards, GPA chart
  - `Certificate/` - Provisional degree certificate generator
  - `Statistics/` - Batch analytics and CGPA distribution
  - `academics/` - Academic calendar and syllabus explorer
  - `resources/` - Semester resources repository
  - `home/` - Landing page modules
- `src/services/` - Network layer (`authFetch`, `authService`, `portalService`, `adminService`)
- `src/lib/` - Shared utilities (`avatar.js`)
- `src/middleware.js` - Edge route protection and authentication guards
