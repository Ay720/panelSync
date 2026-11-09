# PanelSync – Smart Multi-Panel Interview Scheduling System

> A production-ready, full-stack MERN SaaS platform for high-velocity HR and Talent Acquisition teams to seamlessly coordinate multi-interviewer loops across executive calendars, global time zones, working hours, buffer windows, and urgent rescheduling requests.

---

## 🌟 Key Features

### 1. Smart Scheduling Engine (Core Innovation)
- **Multi-Panel Free Interval Intersection**: Computes common free time windows across 2, 3, or more interviewers simultaneously.
- **Global Timezone Normalization**: Automatically converts all candidate and interviewer local times into standard UTC Date intervals for conflict-free comparison, and translates slots back to each participant's local timezone.
- **Double-Booking & Conflict Detection**: Scans both internal interviews and synced calendar events (daily standups, sprint reviews, 1-on-1s) to prevent double booking.
- **Intelligent Ranking & Heuristic Scoring (0–100)**:
  - Higher scores for slots falling inside the interviewer prime energy window (10:00 AM – 4:00 PM local time).
  - Matches candidate time-of-day preferences (morning, afternoon, evening).
  - Penalizes early-morning or late-evening fatigue.
- **Near-Miss Alternative Recommender**: When no slot works for all panel members, the engine discovers slots where $N-1$ interviewers are available and pinpoints who has the conflict.

### 2. Multi-Panel & Predefined Loops
- Group interviewers into standardized hiring loops (e.g., *Full-Stack Technical Loop*, *Executive & Bar Raiser Panel*).
- Define panelist roles (*Lead Evaluator*, *Bar Raiser*, *System Design Expert*).

### 3. Interview Rescheduling Assistant
- Detects new conflicts on assigned interviewers' calendars.
- Automatically computes available alternative slots with 1-click selection.
- Dispatches update notifications and updated `.ics` calendar invites to all attendees.

### 4. Calendar Management (Daily, Weekly, Monthly)
- Interactive calendar views with status badges (Scheduled, Completed, Rescheduled, Cancelled).
- **Mock Calendar Simulator**: Generates realistic recurring team meetings, 1-on-1s, and standups for each panelist.
- Pluggable Google Calendar and Microsoft Outlook integration hooks.

### 5. Automated Email & In-App Notifications
- Generates RFC 5545 compliant `.ics` iCalendar attachments.
- Dispatches invitation, rescheduling, and cancellation emails via Nodemailer (with Ethereal test account fallback).
- In-app notification center with unread badges and instant read status updates.

### 6. Role-Based Access Control (RBAC) & Audit Logs
- Three built-in roles: `admin`, `hr`, `interviewer`.
- JWT authentication with secure HTTP Authorization headers and bcrypt password hashing.
- Complete system audit log tracking every schedule creation, cancellation, and sync event.

---

## 🏗️ Technology Stack

| Tier | Technologies |
|---|---|
| **Frontend** | React 18, Vite 5, Tailwind CSS, Lucide React, Axios, React Router DOM v6 |
| **Backend** | Node.js, Express.js, REST APIs, JWT, bcryptjs, Nodemailer, date-fns, date-fns-tz |
| **Database** | MongoDB, Mongoose 8 (Indexes, Compound Queries, Schemas) |
| **Integrations** | Google Calendar API / Outlook Calendar API (Mock Simulator + Live hooks), iCalendar (.ics) |

---

## 📂 Project Architecture

```
panelSync/
├── client/                     # Vite + React Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── calendar/       # Day/Week/Month Interactive Calendar
│   │   │   ├── layout/         # Sidebar, Navbar, Layout
│   │   │   ├── scheduler/      # SlotCard, ConflictAlert, RescheduleModal
│   │   │   └── ui/             # Button, Badge, Modal, Input, Select, Skeleton, Tabs
│   │   ├── context/            # AuthContext, NotificationContext
│   │   ├── pages/              # Dashboard, Scheduler, Calendar, Candidates, Interviewers, Panels, Notifications, Analytics, Settings
│   │   ├── services/           # Axios API Client with JWT Interceptors
│   │   ├── App.jsx             # React Router routing
│   │   └── main.jsx
│   ├── tailwind.config.js
│   └── vite.config.js
├── server/                     # Express.js REST API
│   ├── src/
│   │   ├── config/             # MongoDB connection & Nodemailer configuration
│   │   ├── controllers/        # Auth, Candidates, Interviewers, Interviews, Panels, Calendar, Analytics, Notifications
│   │   ├── middleware/         # JWT Auth, RBAC, Validation, Centralized Error Handling
│   │   ├── models/             # 9 Mongoose Schemas (User, Candidate, Interviewer, Interview, Panel, Availability, CalendarEvent, Notification, AuditLog)
│   │   ├── routes/             # Modular Express route definitions
│   │   ├── scripts/            # Database Seeder (seed.js)
│   │   ├── services/           # SmartSchedulingEngine, CalendarSyncService, NotificationService, ReschedulingService
│   │   ├── utils/              # Timezone normalizer, ICS Generator, Audit Logger
│   │   ├── app.js
│   │   └── server.js
│   └── .env.example
└── package.json
```

---

## ⚡ Quick Start & Installation

### Prerequisites
- **Node.js**: v18+ (tested on v26)
- **MongoDB**: v6+ (running on `mongodb://127.0.0.1:27017`)
- **npm** or **yarn**

### 1. Clone & Install Dependencies

```bash
# Clone the repository
cd panelSync

# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### 2. Configure Environment Variables

Create `.env` inside `server/` (or copy from `.env.example`):

```ini
PORT=5001
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/panelsync
JWT_SECRET=panelsync_super_secret_jwt_key_2026_dev_prod
JWT_EXPIRES_IN=7d

# Email / SMTP Configuration (Ethereal test mode is auto-configured if left blank)
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
EMAIL_FROM="PanelSync Notifications <noreply@panelsync.io>"

# Calendar API Mock & Integration Keys
ENABLE_MOCK_CALENDARS=true
CLIENT_URL=http://localhost:5173
```

### 3. Seed Database with Realistic Data

Populates sample candidates, multi-timezone interviewers, availability schedules, mock calendar busy events, and predefined interview loops:

```bash
cd server
npm run seed
```

### 4. Run Application

In two terminal windows:

```bash
# Terminal 1: Backend Server (runs on http://localhost:5001)
cd server
npm run dev

# Terminal 2: Frontend Client (runs on http://localhost:5173)
cd client
npm run dev
```

Visit **http://localhost:5173** in your browser.

---

## 🔑 Test Credentials (1-Click Demo Logins Available)

The login screen includes instant 1-click persona switch buttons, or you can sign in manually:

| Persona | Email | Password | Role | Timezone |
|---|---|---|---|---|
| **HR / Recruiter** | `hr@panelsync.io` | `Password123!` | `hr` | America/New_York |
| **System Admin** | `admin@panelsync.io` | `Password123!` | `admin` | America/New_York |
| **Interviewer** | `sarah.chen@panelsync.io` | `Password123!` | `interviewer` | America/Los_Angeles |

---

## 📡 REST API Documentation

### Authentication (`/api/auth`)
- `POST /api/auth/register` - Create new user account.
- `POST /api/auth/login` - Authenticate and return JWT token.
- `GET /api/auth/me` - Get current authenticated user profile.
- `PUT /api/auth/profile` - Update user details and timezone.

### Smart Scheduling Engine & Interviews (`/api/interviews`)
- `POST /api/interviews/find-slots` - Compute ranked conflict-free multi-panel slots.
  ```json
  {
    "candidateId": "6af15633...",
    "interviewerIds": ["6af15633...", "6af15633..."],
    "durationMinutes": 60,
    "startDate": "2026-11-10",
    "endDate": "2026-11-16",
    "candidateTimezone": "America/New_York",
    "bufferMinutes": 15
  }
  ```
- `POST /api/interviews` - Book interview, create calendar blocks, dispatch emails & `.ics`.
- `GET /api/interviews` - List interviews with pagination, status, and candidate filters.
- `GET /api/interviews/:id` - Get single interview details.
- `POST /api/interviews/:id/cancel` - Cancel interview and release calendar blocks.
- `GET /api/interviews/:id/conflicts` - Check if any interviewer has calendar overlap.
- `GET /api/interviews/:id/reschedule-options` - Compute alternative slots for rescheduling.
- `POST /api/interviews/:id/reschedule` - Commit new slot and notify attendees.

### Candidates (`/api/candidates`)
- `GET /api/candidates` - List candidates with search and pipeline filter.
- `POST /api/candidates` - Create candidate profile.
- `GET /api/candidates/:id` - Get candidate with full interview history.
- `PUT /api/candidates/:id` - Update candidate profile.
- `DELETE /api/candidates/:id` - Delete candidate.

### Interviewers (`/api/interviewers`)
- `GET /api/interviewers` - List interviewers with department and skill filter.
- `POST /api/interviewers` - Create interviewer and initialize default availability.
- `POST /api/interviewers/:id/sync-calendar` - Trigger mock/live calendar synchronization.

### Availability (`/api/availability`)
- `GET /api/availability/interviewer/:id` - Get weekly schedule and overrides.
- `PUT /api/availability/interviewer/:id` - Update weekly working hours.
- `POST /api/availability/interviewer/:id/overrides` - Add PTO or date blockage.
- `DELETE /api/availability/interviewer/:id/overrides/:date` - Remove date blockage.

### Calendar (`/api/calendar`)
- `GET /api/calendar/feed` - Aggregated calendar feed (interviews + busy events).
- `POST /api/calendar/sync-all` - Synchronize all mock calendars.

### Analytics & Notifications
- `GET /api/analytics/dashboard` - Top-level KPI counts, pipeline breakdown, activity log.
- `GET /api/analytics/detailed` - Interviewer workload distribution and round metrics.
- `GET /api/notifications` - In-app notification center.
- `PUT /api/notifications/:id/read` - Mark single notification as read.
- `PUT /api/notifications/read-all` - Mark all notifications as read.
- `POST /api/seed` - One-click database reload.

---

## 🔒 Security & Performance Features
- **JWT Authentication** with expiration checks.
- **bcrypt.js** salt hashing for all passwords.
- **Role-Based Authorization** (`admin`, `hr`, `interviewer`).
- **Compound Mongoose Indexes** on `(interviewer, startTime, endTime)` for sub-millisecond range overlap queries.
- **CORS & Centralized Error Handling** with detailed validation messages.
- **Timezone Safety**: All calendar operations convert wall-clock time into UTC before interval intersection.

