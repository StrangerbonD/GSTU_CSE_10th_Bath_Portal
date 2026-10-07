# GSTU CSE 10th Batch Portal — Comprehensive Project Documentation

A full-stack, enterprise-grade academic and community management portal built specifically for the **10th Batch of Computer Science and Engineering (CSE), Gopalganj Science and Technology University (GSTU)**.

---

## 📑 Table of Contents
1. [System Architecture Overview](#system-architecture-overview)
2. [Technology Stack](#technology-stack)
3. [Root Directory Structure](#root-directory-structure)
4. [Backend Deep Dive (`backend/`)](#backend-deep-dive-backend)
   - [Domain Layer (`GstuPortal.Domain`)](#1-domain-layer-gstuportaldomain)
   - [Application Layer (`GstuPortal.Application`)](#2-application-layer-gstuportalapplication)
   - [Infrastructure Layer (`GstuPortal.Infrastructure`)](#3-infrastructure-layer-gstuportalinfrastructure)
   - [Web API Layer (`GstuPortal.WebApi`)](#4-web-api-layer-gstuportalwebapi)
5. [Frontend Deep Dive (`frontend/`)](#frontend-deep-dive-frontend)
   - [App Router & Pages (`src/app/`)](#1-app-router--pages-srcapp)
   - [Components Library (`src/components/`)](#2-components-library-srccomponents)
   - [API Client Services (`src/services/`)](#3-api-client-services-srcservices)
   - [Static Assets (`public/`)](#4-static-assets-public)
6. [Database Schema & PostgreSQL Integration](#database-schema--postgresql-integration)
7. [Security & Authentication Workflow](#security--authentication-workflow)
8. [Configuration & Environment Setup](#configuration--environment-setup)
9. [How to Run the Application](#how-to-run-the-application)

---

## 🏛️ System Architecture Overview

The system is developed following modern **Clean Architecture** and **CQRS (Command Query Responsibility Segregation)** patterns:

```
[ Frontend: Next.js 16 (React 19) + Tailwind CSS ]
                       │
             HTTP / JSON REST API
                       ▼
[ Backend Web API: ASP.NET Core 9 (.NET 9) ]
                       │
       ┌───────────────┴───────────────┐
       ▼                               ▼
[ Application Layer (MediatR CQRS) ] ──► [ Domain Layer (Entities & Rules) ]
       │
       ▼
[ Infrastructure Layer (EF Core 9 + Npgsql) ]
       │
       ▼
[ PostgreSQL 18 Local / Production Database ]
```

---

## 💻 Technology Stack

### Backend
- **Framework**: .NET 9 (ASP.NET Core 9 Web API)
- **Architecture**: Clean Architecture / Onion Architecture with MediatR CQRS
- **Database ORM**: Entity Framework Core 9 (Npgsql PostgreSQL Provider)
- **Authentication**: Short-lived JWT Bearer Tokens (15 min) + HttpOnly Secure Refresh Token Cookies (30 days)
- **Password Security**: BCrypt (Work Factor 11)
- **Email Delivery**: Google SMTP Service (System.Net.Mail) with HTML templating
- **API Documentation**: OpenAPI / Swagger

### Frontend
- **Framework**: Next.js 16 (App Router, Turbopack)
- **UI Library**: React 19
- **Styling**: Tailwind CSS 4 with custom emerald/slate palette
- **Icons**: Clean, modern SVG icons (Facebook-style eye toggles, no unnecessary emojis)
- **State & Storage**: Browser `localStorage` with reactive cross-tab and cross-component custom events (`auth_user_updated`)

### Database & Storage
- **RDBMS**: PostgreSQL 18 (Local instance on port 5432: `gstu_10th_batch_portal`)
- **Assets**: Optimized SVGs, WebP images, and PDFs in `frontend/public/`

---

## 📂 Root Directory Structure

```
E:\Crud\
├── backend\                     # ASP.NET Core 9 Clean Architecture backend solution
│   ├── GstuPortal.sln           # Visual Studio solution file
│   └── src\
│       ├── GstuPortal.Domain/           # Enterprise entities, enums, domain rules
│       ├── GstuPortal.Application/      # CQRS commands, queries, DTOs, interfaces
│       ├── GstuPortal.Infrastructure/   # EF Core DbContext, DB configurations, SMTP
│       └── GstuPortal.WebApi/           # Controllers, middlewares, Program.cs
├── frontend\                    # Next.js 16 frontend application
│   ├── public/                  # Static assets (calendars, icons, photos)
│   ├── src/
│   │   ├── app/                 # Next.js App Router pages and layouts
│   │   ├── components/          # Reusable UI widgets, modals, drawers, and forms
│   │   └── services/            # Client-side API request handlers
│   ├── package.json             # NPM dependencies and run scripts
│   └── next.config.mjs          # Next.js runtime configuration
├── sheets\                      # Raw CSV datasets for all 8 semesters (1-1 to 4-2)
└── *.sql                        # PostgreSQL setup, migration, and inspection scripts
```

---

## ⚙️ Backend Deep Dive (`backend/`)

### 1. Domain Layer (`GstuPortal.Domain`)
Contains core business entities with zero third-party framework dependencies:

- **`Common/BaseEntity.cs`**:
  Base class providing primary key `Id` (GUID), `CreatedAt`, `UpdatedAt`, and the `SetUpdated()` timestamp tracker.
- **`Entities/User.cs`**:
  Represents registered portal accounts. Handles:
  - Account credentials (`Username`, `Email`, `PasswordHash`, `Role`)
  - Verification state (`IsEmailVerified`, `EmailVerificationOtp`, `EmailVerificationOtpExpiresAt`)
  - Cooldown logic: verifies OTP and sets 5-minute expiry
  - Profile metadata (`StudentId`, `AvatarUrl`, `StatusMessage`, `IsVerifiedBatchStudent`)
  - Class Representative claim data (`IsCr`, `CrClaimStatus`, `CrClaimNote`, `CrTenure`, `CrThought`)
  - Session relation: `ICollection<UserSession> Sessions`
- **`Entities/Student.cs`**:
  Official batch student record containing academic attributes (`StudentId`, `Name`, `FatherName`, `MotherName`, `Session`, `CGPA`, `TotalCreditEarned`) linked to `SemesterResults`.
- **`Entities/SemesterResult.cs`**:
  Tracks student GPA per semester (`SemesterId`, `CreditOffered`, `CreditEarned`, `GPA`).
- **`Entities/CourseGrade.cs`**:
  Individual course breakdown for each semester (`CourseCode`, `CourseTitle`, `Credit`, `GradePoint`, `GradeLetter`).
- **`Entities/UserSession.cs`**:
  Tracks multi-device refresh token sessions, client IP, User-Agent, expiration timestamp, and revocation flags.
- **`Entities/BatchThought.cs`**:
  Community feed posts and quotes submitted by batch students (`AuthorName`, `Quote`, `RoleTitle`, `AvatarUrl`, `IsApproved`).
- **`Enums/`**:
  - `UserRole.cs`: Defines roles: `User` and `Admin`.
  - `ClaimStatus.cs`: Defines student verification states: `None`, `Pending`, `Approved`, `Rejected`.

---

### 2. Application Layer (`GstuPortal.Application`)
Encapsulates all application use cases using MediatR CQRS pattern:

#### `Common/Interfaces/`
- **`IApplicationDbContext.cs`**: EF Core abstraction contract exposing `DbSet<User>`, `DbSet<Student>`, `DbSet<SemesterResult>`, `DbSet<CourseGrade>`, `DbSet<UserSession>`, `DbSet<BatchThought>`.
- **`IEmailService.cs`**: Contract for sending OTP dispatch emails.
- **`IJwtTokenGenerator.cs`**: Contract for signing HMAC-SHA256 JWT tokens.
- **`IPasswordHasher.cs`**: Contract for password hashing and constant-time verification using BCrypt (Work Factor 11).
- **`IDateTimeProvider.cs`**: Contract for UTC timestamp generation.

#### `Features/Auth/`
- **`Commands/Register/RegisterCommand.cs`**:
  Validates uniqueness of email/username, hashes password, creates unverified user, generates 6-digit OTP with a 5-minute expiry, and dispatches the verification email.
  *Security guarantee: Does not issue session tokens upon registration.*
- **`Commands/VerifyEmail/VerifyEmailCommand.cs`**:
  Validates the 6-digit OTP against the expiration timestamp. Upon match, sets `IsEmailVerified = true`, clears the OTP, and generates access and refresh tokens.
- **`Commands/ResendOtp/ResendOtpCommand.cs`**:
  Enforces a strict **5-minute cooldown** per email (`user.EmailVerificationOtpExpiresAt > DateTime.UtcNow`). If cooldown has not expired, returns exact remaining wait time (e.g. `4m 30s`). When expired, generates a fresh OTP and emails it.
- **`Commands/Login/LoginCommand.cs`**:
  Validates credentials. Rejects unverified accounts with a clear message guiding them to verify. On success, creates a session and returns auth tokens.
- **`Commands/RefreshToken/RefreshTokenCommand.cs`**:
  Validates refresh token and device metadata, checks if email is verified, rotates refresh token, and issues a fresh access token.
- **`Commands/Logout/LogoutCommand.cs`**:
  Revokes the active user session.

#### `Features/Students/`
- **`Queries/GetTranscript/GetTranscriptQuery.cs`**:
  Queries the database for complete 8-semester academic records, course details, credits, and CGPA calculations for official transcript rendering.
- **`Queries/VerifyStudent/VerifyStudentQuery.cs`**:
  Verifies whether a given student ID is present in the official 10th batch registry.

#### `Features/Claims/`
- **`Commands/SubmitClaim/SubmitClaimCommand.cs`**:
  Allows logged-in users to claim an official student identity.
- **`Commands/SubmitCrClaim/SubmitCrClaimCommand.cs`**:
  Allows students to submit Class Representative verification claims.
- **`Commands/ApproveClaim/ApproveClaimCommand.cs`**:
  Admin handler to approve or reject student identity claims.
- **`Commands/ApproveCrClaim/ApproveCrClaimCommand.cs`**:
  Admin handler to approve or reject CR claims.

#### `Features/Thoughts/`
- **`Commands/CreateBatchThought/CreateBatchThoughtCommand.cs`**:
  Creates a new post in the batch community feed.
- **`Queries/GetBatchThoughts/GetBatchThoughtsQuery.cs`**:
  Fetches approved and pinned thoughts for public batch display.

#### `Features/Representatives/`
- **`Queries/GetClassRepresentatives/GetClassRepresentativesQuery.cs`**:
  Fetches the list of approved Class Representatives, tenures, and thoughts.

#### `Features/Statistics/`
- **`Queries/GetBatchStatistics/GetBatchStatisticsQuery.cs`**:
  Aggregates batch academic metrics: CGPA distribution, student count, honors breakdown.

#### `Features/Admin/`
- **`Queries/GetAdminStatsQuery.cs`**: System summary counts (total users, claims pending, etc.).
- **`Queries/GetAllUsersAdminQuery.cs`**: Full user roster and active session counts.
- **`Queries/GetAllStudentsAdminQuery.cs`**: Complete academic student directory.
- **`Queries/GetAllThoughtsAdminQuery.cs`**: Unmoderated and moderated batch thoughts.
- **`Commands/EditCourseGrade/EditCourseGradeCommand.cs`**: Allows admin to correct course grades, recalculate semester GPA and overall CGPA.
- **`Commands/Users/UserStatusCommands.cs`**: Toggle user activation/ban status.
- **`Commands/Claims/ClaimModerationCommands.cs`**: Batch moderation of student claims.

---

### 3. Infrastructure Layer (`GstuPortal.Infrastructure`)
- **`Persistence/ApplicationDbContext.cs`**:
  EF Core context configuring tables, relationships, constraints, and audit timestamps.
- **`Persistence/Configurations/`**:
  Fluent API configurations mapping Domain entities to PostgreSQL tables (`Users`, `Students`, `SemesterResults`, `CourseGrades`, `UserSessions`, `BatchThoughts`).
- **`Authentication/JwtTokenGenerator.cs`**:
  Generates JWT tokens signed with SHA-256 HMAC containing claims (`sub`, `name`, `email`, `role`, `studentId`).
- **`Authentication/PasswordHasher.cs`**:
  Secure PBKDF2/BCrypt hashing and constant-time password verification.
- **`Services/EmailService.cs`**:
  Automated SMTP client configured for Google Gmail SMTP (`smtp.gmail.com:587`). Dispatches custom HTML formatted emails featuring:
  - Welcome greeting: *"Welcome to GSTU CSE 10th Batch Portal"*
  - Prominent 6-digit verification code block
  - Warning banner: *"Don't share this code with anyone."*
  - Expiration notification (5 minutes)
  - Signature: *"Best regards, Bondhon"*
- **`Seed/DatabaseSeeder.cs`**:
  Initializes required database tables and provisions default admin accounts upon startup.

---

### 4. Web API Layer (`GstuPortal.WebApi`)
- **`Program.cs`**:
  Application bootstrapping, service registration, CORS policies, JWT authentication middleware, Swagger configuration, and pipeline order.
- **`Controllers/`**:
  - `AuthController.cs`: Endpoints for `/api/auth/register`, `/api/auth/login`, `/api/verify-email`, `/api/resend-otp`, `/api/refresh-token`, `/api/logout`.
  - `StudentsController.cs`: Endpoints for `/api/students/{studentId}/transcript` and `/api/students/verify`.
  - `ClaimsController.cs`: Endpoints for `/api/claims/submit` and `/api/claims/cr/submit`.
  - `ThoughtsController.cs`: Endpoints for `/api/thoughts` (GET, POST).
  - `RepresentativesController.cs`: Endpoints for `/api/representatives`.
  - `StatisticsController.cs`: Endpoints for `/api/statistics/batch`.
  - `UsersController.cs`: Endpoints for `/api/users/profile`, `/api/users/cr-profile`, `/api/users/status`.
  - `AdminController.cs`: Endpoints for `/api/admin/*` (stats, users, results, claims, thoughts moderation).
- **`Middlewares/ExceptionHandlingMiddleware.cs`**:
  Global exception interceptor translating unhandled exceptions to standardized HTTP responses (400, 401, 403, 404, 500) formatted as JSON without server stack trace leaks.
- **`appsettings.json`**:
  Database connection strings, JWT secret tokens, and SMTP email configuration.

---

## 🎨 Frontend Deep Dive (`frontend/`)

### 1. App Router & Pages (`src/app/`)
- **`layout.js`**:
  Root HTML shell with metadata, responsive viewport settings, and global font configuration.
- **`globals.css`**:
  Tailwind CSS styles, custom scrollbar rules, animation keyframes, and color variables.
- **`page.js` (Home Page)**:
  Hero landing page featuring:
  - Batch title and welcome headline
  - Group photograph of the 10th Batch
  - Batch overview and statistics counters
  - Quick action buttons (Academics, Resources, Student Login)
- **`(auth)/layout.js`**:
  Clean, focused authentication wrapper layout.
- **`(auth)/login/page.js`**:
  Renders `LoginForm.jsx`.
- **`(auth)/register/page.js`**:
  Renders `RegisterForm.jsx`.
- **`(auth)/verify-email/page.js`**:
  Renders `VerifyEmailForm.jsx`.
- **`academics/page.js`**:
  Renders `AcademicsSection.jsx` featuring:
  - Academic calendar viewer (2022 to 2026) with full preview modals
  - Course curriculum across all semesters
  - Direct syllabus download link pointing to official Google Drive syllabus
- **`resources/page.js`**:
  Renders `ResourcesSection.jsx` displaying a clean "Under Development" placeholder for upcoming semester routines and files.
- **`dashboard/page.js`**:
  Personal student portal displaying student verification status, transcript viewer, academic summary, batch feed, and profile editor.
- **`admin/page.js`**:
  Admin control panel for student result management, claim approval, and user administration.

---

### 2. Components Library (`src/components/`)

#### Global & Navigation
- **`Navbar.jsx`**:
  Main sticky top navbar:
  - Links to Home, Academics, and Resources
  - Hamburger toggle for mobile sidebar
  - Dynamic user auth state: shows Login/Register buttons when unauthenticated; shows Avatar, Full Name, and Logout button when verified
  - Listens to `auth_user_updated` window events for instant UI synchronization
- **`LeftSidebarDrawer.jsx`**:
  Slide-out navigation drawer for mobile and desktop quick links.
- **`ProfileSettingsDrawer.jsx`**:
  Slide-out profile management drawer allowing students to update their name, avatar URL, bio message, and initiate student ID claims.

#### Authentication Components
- **`auth/LoginForm.jsx`**:
  - Handles user authentication via email/username and password
  - Includes Facebook-style SVG toggle for show/hide password
  - Detects unverified email responses and provides an inline direct link to the verification page
- **`auth/RegisterForm.jsx`**:
  - Validates full name, email, password, and password confirmation
  - SVG eye toggle on password fields; no unnecessary emojis
  - On submission: saves target 5-minute expiry in `localStorage` (`otp_expires_at_<email>`) and redirects directly to `/verify-email?email=...`
- **`auth/VerifyEmailForm.jsx`**:
  - Production-grade email verification screen
  - **Readonly Email Field**: registered email address is fixed and non-editable
  - **Persistent Cooldown Timer**: computes remaining time based on `otp_expires_at_<email>` timestamp; refreshing the page (F5) maintains the exact remaining time rather than resetting to 5:00
  - **Disabled Resend Cooldown**: "Resend OTP Code" button is completely disabled during the 5 minutes with a live countdown label (e.g. `Resend Code in 4:15`)
  - **Error Handling**: displays clean in-card message upon wrong OTP without triggering Next.js dev error overlays
  - **Auto Redirect**: upon successful verification, updates local authentication tokens and redirects user to their dashboard

#### Academic & Portal Modals
- **`AcademicsSection.jsx`**:
  Academic calendar viewer (2022–2026) with modal view, and official syllabus download link pointing to Google Drive with custom syllabus icon (`/images/syllabus_Icon.png`).
- **`ResourcesSection.jsx`**:
  Minimal, clean placeholder for upcoming semester routines and academic resources.
- **`TranscriptModal.jsx`**:
  Modal rendering comprehensive academic transcript with 8-semester course list, credit weights, grades, and cumulative GPA.
- **`CertificateModal.jsx`**:
  Modal displaying verifiable digital batch certificate.
- **`ClaimModal.jsx`**:
  Modal allowing logged-in students to submit their student ID verification request.
- **`StatisticsModal.jsx`**:
  Modal presenting batch GPA distribution, top performers, and academic metrics.
- **`StatusModal.jsx`**:
  Modal for posting thoughts and updating personal status.

#### Admin Components
- **`admin/AdminHeader.jsx`**: Header bar for admin workspace.
- **`admin/UserDashboard.jsx`**: Table of all registered accounts with ban/unban controls.
- **`admin/StudentResultDashboard.jsx`**: Full directory of students with GPA scores and edit actions.
- **`admin/CourseEditModal.jsx`**: Modal allowing admins to edit individual course marks and grade letters.
- **`admin/ControlDashboard.jsx`**: Container for moderation tabs.
- **`admin/control/ClaimRequestsTab.jsx`**: Student ID identity verification approval queue.
- **`admin/control/CrRequestsTab.jsx`**: Class Representative claim approval queue.
- **`admin/control/UserThoughtsTab.jsx`**: Batch thoughts approval and moderation.
- **`admin/control/CrThoughtsTab.jsx`**: Class Representative thoughts moderation.

---

### 3. API Client Services (`src/services/`)
- **`authService.js`**:
  Handles `/api/auth/*` and `/api/*` authentication endpoints. Structured to return `{ success, message, ...data }` instead of throwing unhandled exceptions, eliminating development overlay crashes.
- **`portalService.js`**:
  Handles student verification, transcripts, claims submission, and batch thoughts endpoints.
- **`adminService.js`**:
  Handles administrative data fetching, user status modifications, grade edits, and claim approvals.

---

## 🗄️ Database Schema & PostgreSQL Integration

The portal connects to a local **PostgreSQL 18** database named **`gstu_10th_batch_portal`**:

### Tables Summary:
1. **`Users`**: Portal accounts, password hashes, roles, email verification status, OTP codes, OTP expiry timestamps, and CR status.
2. **`Students`**: Batch students (e.g. `20CSE016`), names, parental information, session, and cumulative GPA.
3. **`SemesterResults`**: Semester-wise student GPA, credits offered, and credits earned (1st sem to 8th sem).
4. **`CourseGrades`**: Individual course records (Course Code, Title, Credit, Grade Point, Letter Grade).
5. **`UserSessions`**: Refresh token tracking, IP addresses, user agents, expiration, and revocation flags.
6. **`BatchThoughts`**: Community quotes, author names, role titles, and admin approval flags.

---

## 🛡️ Security & Authentication Hardening

The portal implements enterprise-grade defense-in-depth protections:

### 1. Cryptographic OTP & Brute-Force Lockout
- **SHA-256 Hashing**: 6-digit OTP codes are hashed with SHA-256 before being stored in PostgreSQL. Raw OTP codes never reside in the database.
- **Max 5 Attempt Lockout**: Failed OTP attempts are tracked in `EmailVerificationOtpAttempts`. After 5 incorrect tries, the OTP is permanently invalidated and destroyed from the database.
- **Timing Attack Defense**: Comparisons utilize `CryptographicOperations.FixedTimeEquals` for constant-time evaluation.
- **5-Minute Persistent Cooldown**: Resend requests are rate-limited with an unskippable 5-minute cooldown. Refreshing the browser preserves the exact countdown.

### 2. Anti-IDOR (Insecure Direct Object Reference) Protection
- `/api/students/{studentId}/transcript` is protected with `[Authorize]`.
- Students can **only** inspect their own verified transcript matching their claim/identity.
- Admins (`Role = Admin`) possess elevated permissions to inspect batch records.
- Cross-student and unauthenticated scraping attempts receive `403 Forbidden` and `401 Unauthorized`.

### 3. Built-In ASP.NET Core Rate Limiting
- **`auth-policy`**: Protects `/api/auth/login`, `/api/auth/register`, `/api/resend-otp`, and `/api/verify-email` with a fixed window limit of 10 requests per minute per IP. Excess requests receive HTTP `429 Too Many Requests`.
- **`api-policy`**: General sliding window limiter capping standard API routes at 100 requests per minute.

### 4. Session Security & Short-Lived JWT Tokens
- **Short-Lived Access Token**: Access tokens expire in **15 minutes**, reducing window of exposure.
- **Immediate Ban Enactment**: When an Admin deactivates an account, all active `UserSessions` are immediately revoked in the database, and token refresh is rejected.
- **Secrets via Environment Variables**: Supports `JWT_SECRET`, `SMTP_PASS`, `SMTP_USER`, and `ADMIN_DEFAULT_PASSWORD` environment variables.

### 5. Server-Side Route Protection (`middleware.js`)
- Next.js server-side Edge middleware intercepts all requests to `/admin` and `/dashboard`.
- Unauthenticated traffic is redirected with HTTP 307 to `/login?redirect=...` prior to rendering any client component.
- Non-admin authenticated accounts attempting to reach `/admin` are redirected to `/dashboard`.

---

## 🚀 How to Run the Application

### Prerequisites
- **.NET 9 SDK**
- **Node.js 18+** & **npm**
- **PostgreSQL 18** running on `localhost:5432` with database `gstu_10th_batch_portal`

### 1. Run Backend (.NET 9 Web API)
```bash
cd E:\Crud\backend
dotnet run --project src/GstuPortal.WebApi/GstuPortal.WebApi.csproj
```
*Backend will start on `http://localhost:5001` (Swagger available at `http://localhost:5001/swagger`).*

### 2. Run Frontend (Next.js 16)
```bash
cd E:\Crud\frontend
npm run dev
```
*Frontend will start on `http://localhost:3000`.*
