# 🏛️ GSTU CSE 10th Batch Portal — Complete Project Documentation

**Project Name**: GSTU CSE 10th Batch Official Portal  
**Target Batch**: Department of Computer Science & Engineering, Gopalganj Science and Technology University (Session 2020-2021)  
**Architecture Type**: Clean Architecture (.NET 9 Web API) + Next.js 16.3.8 (App Router) + PostgreSQL Local DB  

---

## 📑 Table of Contents
1. [Executive Summary & High-Level Architecture](#1-executive-summary--high-level-architecture)
2. [Technology Stack](#2-technology-stack)
3. [Repository & Directory Structure](#3-repository--directory-structure)
4. [Backend Security & Architecture (.NET 9 Web API)](#4-backend-security--architecture-net-9-web-api)
   - [Secure by Default: Fallback Authorization Policy](#secure-by-default-fallback-authorization-policy)
   - [Domain Layer (`GstuPortal.Domain`)](#domain-layer-gstuportaldomain)
   - [Application Layer (`GstuPortal.Application`)](#application-layer-gstuportalapplication)
   - [Infrastructure Layer (`GstuPortal.Infrastructure`)](#infrastructure-layer-gstuportalinfrastructure)
   - [Web API Layer (`GstuPortal.WebApi`)](#web-api-layer-gstuportalwebapi)
   - [Complete REST API Endpoints & Access Control Matrix](#complete-rest-api-endpoints--access-control-matrix)
   - [IDOR & Ownership Enforcement Details](#idor--ownership-enforcement-details)
5. [Frontend Architecture & Security (Next.js 16)](#5-frontend-architecture--security-nextjs-16)
   - [App Router Structure (`src/app`)](#app-router-structure-srcapp)
   - [Middleware Guard (`src/middleware.js`)](#middleware-guard-srcmiddlewarejs)
   - [Shared & Navigation Components (`src/components`)](#shared--navigation-components-srccomponents)
   - [Admin Dashboard Suite (`src/components/admin`)](#admin-dashboard-suite-srccomponentsadmin)
   - [Frontend Cache Isolation & Data Leak Prevention](#frontend-cache-isolation--data-leak-prevention)
6. [Core Business Workflows & Systems](#6-core-business-workflows--systems)
   - [1. Authentication & Persistent Login (Zero-Flicker)](#workflow-1-authentication--persistent-login-zero-flicker)
   - [2. User Avatar & Profile Management](#workflow-2-user-avatar--profile-management)
   - [3. Batchmate Verification / Claim Workflow](#workflow-3-batchmate-verification--claim-workflow)
   - [4. Class Representative (CR) Journey & Showcase](#workflow-4-class-representative-cr-journey--showcase)
   - [5. Landing Page "Memories Forever" Photo Carousel](#workflow-5-landing-page-memories-forever-photo-carousel)
   - [6. Academic Calendars & Syllabus](#workflow-6-academic-calendars--syllabus)
   - [7. Transcript, Results & Provisional Certificate](#workflow-7-transcript-results--provisional-certificate)
   - [8. Batch Analytics & Statistics](#workflow-8-batch-analytics--statistics)
   - [9. Admin Control Suite](#workflow-9-admin-control-suite)
7. [Database Schema & PostgreSQL Tables](#7-database-schema--postgresql-tables)
8. [Automated Verification & Security Test Matrix](#8-automated-verification--security-test-matrix)
9. [Performance & UX Optimizations](#9-performance--ux-optimizations)
10. [Running & Deployment Instructions](#10-running--deployment-instructions)

---

## 1. Executive Summary & High-Level Architecture

The **GSTU CSE 10th Batch Portal** is a centralized full-stack web application designed for students and administrators of the 10th Batch (Session 2020-2021) of the Computer Science & Engineering department. It provides:
- Complete academic records: official course grades for all 8 semesters, real-time GPA and CGPA calculations, and transcript generation.
- Batch identity claims: users sign up, request to claim their student roll/ID, and receive verified batchmate status upon admin approval.
- Class Representative (CR) journey & showcase: recognized CRs submit tenure duration and experience quotes, moderated by admins, and presented on the landing page.
- "Memories Forever" dynamic photo carousel: real-time rotating memories powered by an admin-managed database collection.
- Provisional graduation certificates: verified printable certificates with instant verification.
- Batch analytics: merit leaderboards, GPA distribution brackets, and statistics.
- Hardened multi-layer security: **Secure by Default** architecture, strict ownership authorization checks (IDOR immune), per-user isolated caching, and brute-force protection.

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js 16.3.8 Frontend                  │
│        (Port 3000 | App Router | Tailwind CSS)              │
└──────────────┬───────────────────────────────▲──────────────┘
               │ HTTP / JSON API (Bearer Token)│ HttpOnly Refresh Cookie
               ▼                               │
┌──────────────────────────────────────────────┴──────────────┐
│             ASP.NET Core 9 Web API (Backend)                │
│                   Clean Architecture                        │
│   ┌─────────────────────────────────────────────────────┐   │
│   │ FallbackPolicy: RequireAuthenticatedUser()          │   │
│   ├─────────────────────────────────────────────────────┤   │
│   │ WebApi (Controllers, Rate Limiting, CORS, JWT)      │   │
│   ├─────────────────────────────────────────────────────┤   │
│   │ Application (MediatR CQRS, DTOs, Ownership Rules)   │   │
│   ├─────────────────────────────────────────────────────┤   │
│   │ Infrastructure (EF Core, Npgsql, BCrypt, Token Gen) │   │
│   ├─────────────────────────────────────────────────────┤   │
│   │ Domain (Entities: User, Student, CourseGrade, etc.) │   │
│   └─────────────────────────────────────────────────────┘   │
└──────────────────────────────┬──────────────────────────────┘
                               │ Npgsql / EF Core
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 PostgreSQL Local Database                   │
│          (Port 5432 | db: gstu_10th_batch_portal)           │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Technology Stack

### Backend
- **Framework**: .NET 9.0 (C# 13) Web API
- **Design Pattern**: Clean Architecture with MediatR CQRS (Command Query Responsibility Segregation)
- **Database**: PostgreSQL 18
- **ORM**: Entity Framework Core 9 (`Npgsql.EntityFrameworkCore.PostgreSQL`)
- **Authentication**: JWT (JSON Web Tokens) with symmetric SHA-256 signatures, HttpOnly Refresh Token Cookies, BCrypt Password Hasher (Work Factor: 11)
- **Authorization**: **Secure by Default** via `FallbackPolicy` requiring authenticated user. Explicit `[AllowAnonymous]` on public routes, role-based `[Authorize(Roles = "Admin")]` on management endpoints, and strict resource-level ownership validation.
- **Security & Resilience**: Built-in ASP.NET Core Rate Limiting (`auth-policy` fixed-window partition of 10 req/min and `api-policy` sliding-window partition of 100 req/min), CORS policy with `AllowCredentials()`, global exception handler middleware.

### Frontend
- **Framework**: Next.js 16.3.8 with React 19
- **Routing**: App Router (`src/app`) with Next.js Edge Middleware (`src/middleware.js`)
- **Styling**: Tailwind CSS 4, custom utility classes, responsive grid/flexbox layouts
- **State & Caching**: Server Component cookie reading for instant layout hydration, client-only user-isolated in-memory cache, background pre-fetching scoped by user permissions
- **Media**: Lightweight WebP images, SVG calendar vectors, lazy loading

---

## 3. Repository & Directory Structure

```
E:\Crud
├── backend/
│   ├── GstuPortal.sln
│   └── src/
│       ├── GstuPortal.Domain/               # Pure Domain Entities & Enums
│       │   ├── Entities/                    # User, Student, SemesterResult, CourseGrade, LandingPhoto
│       │   └── Enums/                       # UserRole, ClaimStatus, CrClaimStatus
│       ├── GstuPortal.Application/          # CQRS Handlers, DTOs, Interfaces
│       │   ├── Common/Interfaces/           # IApplicationDbContext, IJwtTokenGenerator, IPasswordHasher
│       │   └── Features/                    # Auth, Users, Students, Claims, LandingPhotos, Admin
│       ├── GstuPortal.Infrastructure/       # DbContext, Repositories, Migrations, Seeds
│       │   ├── Authentication/              # JwtTokenGenerator, PasswordHasher (BCrypt)
│       │   ├── Persistence/                 # ApplicationDbContext, Configurations
│       │   └── Seed/                        # DatabaseSeeder
│       └── GstuPortal.WebApi/               # Controllers, Middlewares, Program.cs
│           ├── Controllers/                 # AuthController, StudentsController, UsersController, etc.
│           ├── Middlewares/                 # ExceptionHandlingMiddleware
│           └── Program.cs                   # Fallback Authorization Policy, Rate Limiters, CORS
│
├── frontend/
│   ├── public/
│   │   └── images/                          # Static assets (calendars, icons, photos)
│   ├── src/
│   │   ├── middleware.js                    # Edge routing middleware (admin route protection)
│   │   ├── app/                             # Next.js App Router Pages
│   │   │   ├── (auth)/                      # Login, Register, Verify-Email
│   │   │   ├── academics/                   # Academic Calendar & Syllabus
│   │   │   ├── admin/                       # Admin Master Control Panel
│   │   │   ├── certificate/                 # Printable Provisional Certificate
│   │   │   ├── dashboard/                   # User Profile & CR Story Experience
│   │   │   ├── resources/                   # Semester Resources
│   │   │   ├── statistics/                  # Merit Analytics & Batch Stats
│   │   │   ├── transcript/                  # Official Semester-by-Semester Transcript
│   │   │   ├── layout.js                    # Global Root Layout (Zero-flicker SSR)
│   │   │   └── page.js                      # Main Landing Page
│   │   ├── components/                      # Modular UI Components
│   │   │   ├── admin/                       # Admin Tab Panels & Modals
│   │   │   ├── home/                        # Landing page modules
│   │   │   ├── Navbar.jsx                   # Sticky Header with Scoped Prefetching
│   │   │   ├── LeftSidebarDrawer.jsx        # Slide-out Drawer Menu
│   │   │   ├── ProfileSettingsDrawer.jsx    # Photo & Password Update Modal
│   │   │   ├── ClaimModal.jsx               # Student ID Verification Modal
│   │   │   ├── CrClaimModal.jsx             # CR Recognition Modal
│   │   │   └── ...
│   │   └── services/                        # API Client Services
│   │       ├── authService.js               # Auth, Refresh Tokens, Persistent Cookie Sync, Cache Clearing
│   │       ├── portalService.js             # User-Scoped Cache, SSR Guard, Clean Fallbacks
│   │       └── adminService.js              # Admin Actions & Management
│
├── test_matrix.js                           # Automated security & authorization regression suite
└── PROJECT_DOCUMENTATION.md                 # Complete project documentation
```

---

## 4. Backend Security & Architecture (.NET 9 Web API)

### Secure by Default: Fallback Authorization Policy

To eliminate accidental authorization bypasses, the backend uses ASP.NET Core's **FallbackPolicy**. In `Program.cs`:

```csharp
builder.Services.AddAuthorization(options =>
{
    // Secure by default: every endpoint requires authentication unless decorated with [AllowAnonymous]
    options.FallbackPolicy = new AuthorizationPolicyBuilder()
        .RequireAuthenticatedUser()
        .Build();
});
```

With this policy active:
- Any new endpoint automatically defaults to **HTTP 401 Unauthorized** for unauthenticated callers.
- Only endpoints explicitly tagged with `[AllowAnonymous]` can be accessed without a token.
- Admin endpoints require explicit `[Authorize(Roles = "Admin")]`.

### Domain Layer (`GstuPortal.Domain`)
Contains core business entities with encapsulated domain logic:
1. **`User`**:
   - Credentials: `Username`, `Email`, `PasswordHash`, `Role` (`User` | `Student` | `Admin`).
   - Verification: `IsEmailVerified`, `EmailVerificationOtp`, `EmailVerificationOtpExpiresAt`.
   - Batch Claims: `StudentId`, `IsVerifiedBatchStudent`, `ClaimStatus` (Pending=1, Approved=2, Rejected=3), `ClaimNote`.
   - CR Status: `IsCr`, `CrClaimStatus`, `CrTenure`, `CrThought`, `PendingCrTenure`, `PendingCrThought`, `CrThoughtStatus`.
   - Profile: `FullName`, `AvatarUrl`, `AvatarBytes`, `AvatarContentType`, `AvatarVersion`, `StatusMessage`.
2. **`Student`**:
   - `StudentId`, `StudentName`, `Session`, `TotalCredits`, `Cgpa`, `MeritRank`, `IsDistinction`.
3. **`SemesterResult`**:
   - Aggregates semester performance (1st to 8th Semester) with GPA, total credits, and semester letter grade.
4. **`CourseGrade`**:
   - Individual course records (Course Code, Title, Credits, Grade Point, Letter Grade).
5. **`LandingPhoto`**:
   - Dynamic landing page memory carousel photos (`ImageUrl`, `Title`, `Subtitle`, `BadgeText`, `DisplayOrder`, `IsActive`).
6. **`UserSession`**:
   - Tracks active refresh tokens, device info, IP addresses, and token expiry.

### Complete REST API Endpoints & Access Control Matrix

| Method | Endpoint | Access Level | Expected Status (Unauth / Student / Admin) | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Public (`[AllowAnonymous]`) | `200` / `200` / `200` | Authenticates user, issues JWT and sets HttpOnly Refresh Token cookie |
| `POST` | `/api/auth/register` | Public (`[AllowAnonymous]`) | `200` / `200` / `200` | Creates pending user account and sends 6-digit OTP |
| `POST` | `/api/auth/verify-email` | Public (`[AllowAnonymous]`) | `200` / `200` / `200` | Verifies OTP code and activates user account |
| `POST` | `/api/auth/resend-otp` | Public (`[AllowAnonymous]`) | `200` / `200` / `200` | Resends OTP with rate-limiting guard |
| `POST` | `/api/auth/refresh` | Public (`[AllowAnonymous]`) | `200` / `200` / `200` | Silent token refresh using HttpOnly cookie |
| `POST` | `/api/auth/logout` | Public (`[AllowAnonymous]`) | `200` / `200` / `200` | Revokes refresh token and clears auth cookies |
| `GET` | `/api/auth/me` | Authenticated | `401` / `200` / `200` | Retrieves current logged-in user profile from claims |
| `GET` | `/api/landing-photos` | Public (`[AllowAnonymous]`) | `200` / `200` / `200` | Retrieves active photos for home page carousel |
| `GET` | `/api/representatives` | Public (`[AllowAnonymous]`) | `200` / `200` / `200` | Retrieves approved class representatives for showcase |
| `GET` | `/api/students/verify/{id}` | Public (`[AllowAnonymous]`) | `200` / `200` / `200` | Verifies student graduation info for Provisional Certificate |
| `GET` | `/api/thoughts` | Public (`[AllowAnonymous]`) | `200` / `200` / `200` | Retrieves public batch thoughts quote ticker |
| `GET` | `/api/students/{id}/transcript` | **Owner or Admin Only** | `401` / `200 (Own) | 403 (Other)` / `200` | 8-semester transcript with strict ownership verification |
| `GET` | `/api/statistics` | **Verified Student or Admin** | `401` / `200 (Verified) | 403 (Unverified)` / `200` | Returns batch merit analytics and CGPA distribution |
| `PUT` | `/api/users/{id}/profile` | **Owner or Admin Only** | `401` / `200 (Own) | 403 (Other)` / `200` | Updates name, avatar photo, or password (IDOR protected) |
| `PUT` | `/api/users/{id}/status` | **Owner or Admin Only** | `401` / `200 (Own) | 403 (Other)` / `200` | Sets user status message (IDOR protected) |
| `POST` | `/api/users/{id}/cr-thought` | **Owner or Admin Only** | `401` / `200 (Own) | 403 (Other)` / `200` | CR submits tenure & 50-word story for admin approval (IDOR protected) |
| `POST` | `/api/claims` | Authenticated | `401` / `200` / `200` | Submits batch student ID verification claim |
| `POST` | `/api/claims/cr` | Authenticated | `401` / `200` / `200` | Submits Class Representative claim |
| `GET` | `/api/admin/stats` | **Admin Only** | `401` / `403` / `200` | Summary counts (Students, Users, Claims, Stories) |
| `GET` | `/api/admin/students` | **Admin Only** | `401` / `403` / `200` | Full list of 33 batch students with CGPAs |
| `PUT` | `/api/admin/students/{id}/course-grade` | **Admin Only** | `401` / `403` / `200` | Edits grade and recalculates CGPA instantly |
| `GET` | `/api/admin/users` | **Admin Only** | `401` / `403` / `200` | Lists all user accounts with roles & status |
| `PUT` | `/api/admin/users/{id}/toggle-status` | **Admin Only** | `401` / `403` / `200` | Blocks or unblocks user access |
| `PUT` | `/api/admin/users/{id}/role` | **Admin Only** | `401` / `403` / `200` | Changes user role |
| `DELETE` | `/api/admin/users/{id}` | **Admin Only** | `401` / `403` / `200` | Deletes user account |
| `GET` | `/api/admin/claims` | **Admin Only** | `401` / `403` / `200` | Lists batchmate verification claims |
| `PUT` | `/api/admin/claims/{id}/approve` | **Admin Only** | `401` / `403` / `200` | Approves batchmate claim |
| `PUT` | `/api/admin/claims/{id}/reject` | **Admin Only** | `401` / `403` / `200` | Rejects batchmate claim |
| `GET` | `/api/admin/claims/cr` | **Admin Only** | `401` / `403` / `200` | Lists CR recognition claims |
| `PUT` | `/api/admin/claims/cr/{id}/approve` | **Admin Only** | `401` / `403` / `200` | Approves CR recognition claim |
| `PUT` | `/api/admin/claims/cr/{id}/reject` | **Admin Only** | `401` / `403` / `200` | Rejects CR recognition claim |
| `GET` | `/api/admin/cr-thoughts` | **Admin Only** | `401` / `403` / `200` | Lists submitted CR stories for review |
| `PUT` | `/api/admin/cr-thoughts/{id}/approve` | **Admin Only** | `401` / `403` / `200` | Approves CR story to go live on Home Page |
| `PUT` | `/api/admin/cr-thoughts/{id}/reject` | **Admin Only** | `401` / `403` / `200` | Rejects CR story submission |
| `GET` | `/api/admin/landing-photos` | **Admin Only** | `401` / `403` / `200` | Gets all carousel photos (active + inactive) |
| `POST` | `/api/admin/landing-photos` | **Admin Only** | `401` / `403` / `200` | Adds new carousel photo |
| `PUT` | `/api/admin/landing-photos/{id}` | **Admin Only** | `401` / `403` / `200` | Updates carousel photo title, order, or visibility |
| `DELETE` | `/api/admin/landing-photos/{id}` | **Admin Only** | `401` / `403` / `200` | Deletes carousel photo from database |

### IDOR & Ownership Enforcement Details

#### 1. Transcript Ownership Enforcement (`StudentsController.cs`)
```csharp
[HttpGet("{studentId}/transcript")]
public async Task<IActionResult> GetTranscript(string studentId)
{
    if (!User.IsInRole("Admin"))
    {
        var callerUserIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(callerUserIdStr) || !Guid.TryParse(callerUserIdStr, out var callerUserId))
            return Unauthorized();

        var me = await _context.Users.AsNoTracking()
            .Where(u => u.Id == callerUserId)
            .Select(u => new { u.StudentId, u.IsVerifiedBatchStudent })
            .FirstOrDefaultAsync();

        if (me == null || !me.IsVerifiedBatchStudent ||
            !string.Equals(me.StudentId, studentId, StringComparison.OrdinalIgnoreCase))
        {
            return StatusCode(403, new { message = "Access denied. You can only view your own transcript." });
        }
    }

    return Ok(await Mediator.Send(new GetTranscriptQuery(studentId)));
}
```

#### 2. User Resource Ownership Enforcement (`UsersController.cs`)
```csharp
private bool IsCallerAuthorizedForUser(Guid targetUserId)
{
    if (User.IsInRole("Admin")) return true;

    var callerUserIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
    if (Guid.TryParse(callerUserIdStr, out var callerUserId))
    {
        return callerUserId == targetUserId;
    }

    return false;
}
```
All state-modifying endpoints (`UpdateProfile`, `SetStatus`, `UpdateCrProfile`, `SubmitCrThought`) verify `IsCallerAuthorizedForUser(id)`. If an unauthorized student attempts to modify another user's record, the backend responds with **HTTP 403 Forbidden**.

---

## 5. Frontend Architecture & Security (Next.js 16)

### App Router Structure (`src/app`)

- **`layout.js`**: Global root layout. Reads the lightweight server-side cookie `auth_user_min` asynchronously via `await cookies()` and passes `initialUser` directly to `Navbar.jsx`. This eliminates client-side hydration flicker and prevents unauthenticated flashing on page reload.
- **`src/middleware.js`**: Next.js Edge Middleware protecting administrative paths. Prevents client-side routing into `/admin` unless the session indicates an administrator role.
- **`page.js` (Home Page)**:
  - Hero Section with batch highlights.
  - "Memories Forever" auto-crossfade photo slideshow (rotates every 5s).
  - Batch Thoughts quote ticker (rotates every 60s).
  - Class Representatives showcase (live verified CRs with tenure & story quotes).
- **`academics/page.js`**: 2022–2026 Academic Calendars with double-click fullscreen zoom, and direct link to the official 2020–2021 syllabus.
- **`resources/page.js`**: Semester syllabus, lecture slides, and question bank hub.
- **`statistics/page.js`**: Real-time batch merit rankings, CGPA bracket distribution, credit progress, and summary counts.
- **`transcript/page.js`**: Complete 8-semester academic transcript for the verified student with print stylesheet formatting.
- **`certificate/page.js`**: Official Provisional Certificate verification generator with print styling.
- **`dashboard/page.js`**: User account center with profile details and `CrShipExperienceModule` for verified CRs.

### Frontend Cache Isolation & Data Leak Prevention

To protect user confidentiality and prevent cross-user data leakage:

1. **Client-Only Cache Enforcement (`portalService.js`)**:
   ```javascript
   // Module-level caches are guarded against SSR
   if (typeof window === "undefined") return null;
   ```
   Ensures cache variables are never executed or shared on the Next.js server instance across requests from different users.

2. **User-Scoped Cache Keys**:
   ```javascript
   const cacheKey = `transcript_${userId || 'anon'}_${studentId}`;
   ```
   Transcripts and sensitive resources are partitioned per authenticated user ID.

3. **Explicit Logout Wipe**:
   `portalService.clearPortalCache()` is exported and called directly inside `authService.logout()`. When a user logs out, all cached academic data and statistics are immediately purged from memory.

4. **Zero Fallback Leaks**:
   Hardcoded fallback student IDs (`20CSE016` / `19CSE024`) were removed from service defaults to prevent displaying other students' records when no student ID is associated with an account.

5. **Permission-Scoped Navigation Prefetching (`Navbar.jsx`)**:
   Instead of blanket-prefetching all routes (which could trigger unnecessary 403 network responses for unauthorized routes), prefetching is scoped by user role:
   - `/admin` is only prefetched if `user?.role === "Admin"`.
   - `/transcript` is only prefetched if `user?.isVerifiedBatchStudent === true`.

---

## 6. Core Business Workflows & Systems

### Workflow 1: Authentication & Persistent Login (Zero-Flicker)
1. **Login**: User submits username and password.
2. The backend verifies credentials using BCrypt, generates a 15-minute JWT Access Token, and sets a 30-day HttpOnly `refreshToken` cookie.
3. The frontend stores the access token in `localStorage` and saves a sanitized user summary in the `auth_user_min` cookie (excluding heavy base64 avatar images).
4. **On Page Refresh**:
   - The Next.js Root Layout reads `auth_user_min` on the server before rendering HTML.
   - The Navbar and Dashboard hydrate immediately with the correct user data (0ms flicker).
   - In the background, `authService.syncCurrentUser()` synchronizes fresh verification/CR statuses from the database.

### Workflow 2: User Avatar & Profile Management
- Users can upload custom images from `ProfileSettingsDrawer.jsx`.
- When an avatar is uploaded, it is saved in PostgreSQL as both a URL and raw binary bytes in the `User` table.
- Avatars are rendered via `/api/users/{id}/avatar`, which responds with HTTP caching headers (`Cache-Control: public, max-age=86400`).
- This design prevents storing heavy base64 strings in cookies, avoiding the HTTP 431 "Request Header Fields Too Large" error.

### Workflow 3: Batchmate Verification / Claim Workflow
1. A newly registered user is an unverified user.
2. The user clicks "Claim" from the menu and enters their 10th batch Student ID (e.g., `20CSE016`) along with a recognition note.
3. The claim is queued with status `Pending` (`1`).
4. The Admin reviews the claim in `ControlDashboard` -> `Claim Requests` and clicks "Approve".
5. The user's account is marked as `isVerifiedBatchStudent = true`, granting access to official transcript and provisional certificate.

### Workflow 4: Class Representative (CR) Journey & Showcase
1. A student applies for CR status via `CrClaimModal.jsx`.
2. Upon Admin approval, the student receives the verified `IsCr = true` badge.
3. Inside their account dashboard (`/dashboard`), the `CrShipExperienceModule` unlocks.
4. The CR selects their tenure (e.g., "1st Year 1st Semester", "2nd Year", "4th Year") and writes a 50-word story about their experience.
5. Once submitted, the Admin reviews the story in `ControlDashboard` -> `CR Stories`.
6. Upon approval, the CR's story and tenure appear in the public Class Representatives showcase on the home page.

### Workflow 5: Landing Page "Memories Forever" Photo Carousel
- Displays memories of the 10th batch with an automatic 5-second cross-fade animation.
- Admins manage the collection via `LandingPhotosDashboard`:
  - Add photos with title, subtitle, badge, and display order.
  - Edit or delete items.
  - Deactivate items without deleting them.
- Public users automatically receive the updated photos from `/api/landing-photos`.

---

## 7. Database Schema & PostgreSQL Tables

Database Name: `gstu_10th_batch_portal`

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│     Users       │       │    Students     │       │ SemesterResults │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ Id (UUID, PK)   │       │ StudentId (PK)  │◄──────┤ Id (UUID, PK)   │
│ Username        │       │ StudentName     │       │ StudentId (FK)  │
│ Email           │       │ Session         │       │ SemesterNo      │
│ PasswordHash    │       │ TotalCredits    │       │ Gpa             │
│ Role            │       │ Cgpa            │       │ TotalCredits    │
│ StudentId       │       │ MeritRank       │       └────────┬────────┘
│ IsVerifiedBatch │       └────────┬────────┘                │
│ ClaimStatus     │                │                         ▼
│ IsCr            │                │                ┌─────────────────┐
│ CrTenure        │                │                │  CourseGrades   │
│ CrThought       │                │                ├─────────────────┤
│ AvatarUrl       │                │                │ Id (UUID, PK)   │
│ AvatarBytes     │                │                │ SemesterResultId│
│ AvatarType      │                │                │ CourseCode      │
└─────────────────┘                │                │ CourseTitle     │
                                   │                │ Credits         │
┌─────────────────┐                │                │ GradePoint      │
│  UserSessions   │                │                │ LetterGrade     │
├─────────────────┤                │                └─────────────────┘
│ Id (UUID, PK)   │                │
│ UserId (FK)     │                │                ┌─────────────────┐
│ RefreshToken    │                │                │  LandingPhotos  │
│ ExpiresAt       │                │                ├─────────────────┤
│ IsRevoked       │                │                │ Id (UUID, PK)   │
└─────────────────┘                │                │ ImageUrl        │
                                   │                │ Title           │
                                   │                │ Subtitle        │
                                   │                │ BadgeText       │
                                   │                │ DisplayOrder    │
                                   │                │ IsActive        │
                                   │                └─────────────────┘
```

---

## 8. Automated Verification & Security Test Matrix

The portal includes an automated integration test script (`test_matrix.js`) that verifies all HTTP status codes against live backend routes.

### Test Results Summary (100% Pass Rate Across All Suites)

#### 1. xUnit Architecture & Reflection Tests (`GstuPortal.IntegrationTests`)
- `Only_expected_endpoints_are_anonymous()`: **PASSED** (Verifies exact whitelist of `[AllowAnonymous]` routes; fails build if unauthorized route is exposed).
- `All_admin_endpoints_require_admin_role()`: **PASSED** (Asserts all `api/admin/*` endpoints strictly require `Admin` role).

#### 2. Live HTTP Integration Matrix (`test_matrix.js`)

| Test Suite | Target Request | Caller State | Expected | Actual Status | Result |
| :--- | :--- | :--- | :---: | :---: | :---: |
| **Suite 1: Unauthenticated** | `GET /api/students/20CSE016/transcript` | Anonymous | `401` | `401 Unauthorized` | ✅ PASS |
| | `GET /api/admin/stats` | Anonymous | `401` | `401 Unauthorized` | ✅ PASS |
| | `GET /api/statistics` | Anonymous | `401` | `401 Unauthorized` | ✅ PASS |
| | `DELETE /api/admin/users/{id}` | Anonymous | `401` | `401 Unauthorized` | ✅ PASS |
| | `GET /api/landing-photos` | Anonymous | `200` | `200 OK` | ✅ PASS |
| | `GET /api/representatives` | Anonymous | `200` | `200 OK` | ✅ PASS |
| | `GET /api/students/verify/20CSE016` | Anonymous | `200` | `200 OK` | ✅ PASS |
| | `GET /api/thoughts` | Anonymous | `200` | `200 OK` | ✅ PASS |
| **Suite 2: Student Blocked from Admin Mutations** | `PUT /api/admin/users/{id}/toggle-status` | Student Token | `403` | `403 Forbidden` | ✅ PASS |
| | `PUT /api/admin/users/{id}/role` | Student Token | `403` | `403 Forbidden` | ✅ PASS |
| | `DELETE /api/admin/users/{id}` | Student Token | `403` | `403 Forbidden` | ✅ PASS |
| | `PUT /api/admin/students/{id}/course-grade` | Student Token | `403` | `403 Forbidden` | ✅ PASS |
| | `PUT /api/admin/claims/{id}/approve` | Student Token | `403` | `403 Forbidden` | ✅ PASS |
| | `GET /api/students/20CSE008/transcript` | Student Token (Other Student) | `403` | `403 Forbidden` | ✅ PASS |
| | `GET /api/students/20CSE016/transcript` | Student Token (Own Transcript) | `200` | `200 OK` | ✅ PASS |
| | `GET /api/statistics` | Student Token (Verified Student) | `200` | `200 OK` | ✅ PASS |
| | `PUT /api/users/{adminId}/profile` | Student Token (IDOR attack) | `403` | `403 Forbidden` | ✅ PASS |
| **Suite 3: Password Guard & Mass Assignment** | Password Change with Invalid Current Password | Student Token | `401` | `401 Unauthorized` | ✅ PASS |
| | Mass Assignment Attempt (injecting Role/StudentId) | Student Token | Ignored | Ignored by Model Binder | ✅ PASS |
| **Suite 4: Unverified User Restrictions** | `GET /api/students/20CSE016/transcript` | Unverified User Token | `403` | `403 Forbidden` | ✅ PASS |
| | `GET /api/statistics` | Unverified User Token | `403` | `403 Forbidden` | ✅ PASS |
| **Suite 5: Real-Time Banned User Invalidation** | Request after Admin Toggles User Inactive | Banned User Token | `401` | `401 Unauthorized` | ✅ PASS |

---

## 9. Performance & UX Optimizations

1. **Permission-Scoped Prefetching**:
   - `Navbar.jsx` prefetches only authenticated/permitted routes, avoiding speculative 403 API calls.
2. **In-Memory Service Caching with Instant Invalidation**:
   - `portalService.js` caches responses for statistics and transcripts using per-user scoped keys. Cleared completely upon logout.
3. **Asset Size Reduction**:
   - Static images and icons compressed for ultra-fast loading over mobile connections.
   - Calendars loaded as lazy WebP images.
4. **Zero-Flicker Layout Hydration**:
   - Server-side cookie `auth_user_min` allows `layout.js` and `Navbar.jsx` to render the user state immediately during SSR without UI flash.
5. **Cookie Header Size Guard**:
   - Avatars are excluded from cookies and served via `/api/users/{id}/avatar`, preventing HTTP 431 errors.

---

## 10. Running & Deployment Instructions

### Prerequisites
- .NET 9.0 SDK
- Node.js 18+ & npm
- PostgreSQL 15+ running on `localhost:5432`

### Backend Setup
```bash
# Navigate to backend WebApi directory
cd E:\Crud\backend\src\GstuPortal.WebApi

# Restore and run backend
dotnet restore
dotnet run
# Runs on http://localhost:5001
```

### Frontend Setup
```bash
# Navigate to frontend directory
cd E:\Crud\frontend

# Install dependencies and run development server
npm install
npm run dev
# Runs on http://localhost:3000
```

### Running Security Regression Tests
```bash
# In project root:
node test_matrix.js
```
