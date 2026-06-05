# Petzy — Clinic Owner Dashboard

A professional, feature-rich frontend for clinic owners and admins on the **Petzy** veterinary clinic management platform. This dashboard enables clinic owners to manage everything from appointments and medical records to live video consultations and real-time client messaging — all in one place.

---

## Table of Contents

1. [Overview](#overview)
2. [Key Features](#key-features)
3. [Tech Stack](#tech-stack)
4. [Project Structure](#project-structure)
5. [Installation](#installation)
6. [Environment Variables](#environment-variables)
7. [Running Locally](#running-locally)
8. [Main App Flow](#main-app-flow)
9. [API Integration Overview](#api-integration-overview)
10. [Feature Modules](#feature-modules)
11. [Backend Dependencies](#backend-dependencies)
12. [Screenshots](#screenshots)
13. [Future Improvements](#future-improvements)
14. [Contributing](#contributing)

---

## Overview

The Petzy Clinic Owner Dashboard is the admin-facing React application for Petzy, a full-stack veterinary clinic management platform. It provides clinic owners with tools to:

- Manage one or more clinic profiles through an approval-gated selection flow
- Handle appointment bookings, reschedules, confirmations, and cancellations
- Conduct online video consultations powered by Azure Communication Services
- Chat with clients in real time via SignalR
- Record and review visit summaries and pet medical histories
- Configure clinic availability, settings, and team access

The application is built with React + Vite, uses Zustand for global state, and communicates with a RESTful backend over Axios.

---

## Key Features

- **Multi-clinic support** — Owners can manage multiple clinics and switch between them seamlessly
- **Approval-gated clinic access** — Only approved clinics are accessible; pending/under-review clinics are shown but locked
- **Appointment management** — Full lifecycle support: pending → confirmed → completed/cancelled, with reschedule negotiation
- **Video calls** — Azure Communication Services integration with local/remote video, mic/camera controls, and post-call visit summary
- **Real-time messaging** — SignalR-powered inbox with unread badge, message grouping, and seen receipts
- **Medical history** — Per-appointment and full pet-level medical records with structured visit summary forms
- **Clinic settings** — Edit clinic profile, manage gallery images, configure weekly availability schedule
- **Persistent clinic selection** — Selected clinic is stored in `localStorage` under `petzy_selected_clinic`

---

## Tech Stack

| Category | Technology |
|---|---|
| Framework | React 18 + Vite |
| Language | JavaScript / JSX |
| Styling | Tailwind CSS + DaisyUI-style utilities |
| State Management | Zustand |
| Routing | React Router v6 |
| HTTP Client | Axios |
| Notifications | React Hot Toast |
| Icons | Lucide React |
| Video Calls | Azure Communication Services (ACS) |
| Real-time Chat | SignalR (`@microsoft/signalr`) |

---

## Project Structure

```
src/
├── assets/               # Static assets (images, icons)
├── components/           # Shared/reusable UI components
│   ├── modals/           # Confirmation, reschedule, cancel modals
│   ├── sidebar/          # Sidebar navigation + unread badge
│   └── ...
├── features/             # Feature-specific modules
│   ├── appointments/     # Booking list, filters, appointment cards
│   ├── auth/             # Login, protected route wrapper
│   ├── clinics/          # Clinic selection, creation form
│   ├── clients/          # Clients list and detail views
│   ├── dashboard/        # Dashboard overview
│   ├── medicalHistory/   # Visit summary form, history viewer
│   ├── messages/         # Chat inbox, message window, SignalR hooks
│   ├── settings/         # Clinic profile, availability, account
│   └── videoCalls/       # ACS video call room, controls, preview
├── lib/
│   └── axios.js          # Axios instance with base URL + interceptors
├── pages/                # Route-level page components
├── stores/               # Zustand global stores
│   ├── authStore.js      # Auth state (user, token, login/logout)
│   └── clinicStore.js    # Clinic list, selected clinic, CRUD actions
├── App.jsx               # Root component with router setup
└── main.jsx              # Vite entry point
```

> Folder names and structure above reflect the intended architecture. Individual feature folders may contain subfolders for hooks, components, and utilities local to that feature.

---

## Installation

**Prerequisites:** Node.js ≥ 18, npm or yarn

```bash
# 1. Clone the repository
git clone https://github.com/your-org/petzy-clinic-dashboard.git
cd petzy-clinic-dashboard

# 2. Install dependencies
npm install
# or
yarn install
```

---

## Environment Variables

Create a `.env` file in the project root. The following variables are required:

```env
# Backend API base URL
VITE_API_BASE_URL=https://your-backend-api.com

# Azure Communication Services
VITE_ACS_ENDPOINT=https://your-acs-resource.communication.azure.com

# SignalR hub URL (if different from API base)
VITE_SIGNALR_HUB_URL=https://your-backend-api.com/hubs/chat
```

> All environment variables must be prefixed with `VITE_` to be accessible in the Vite build.

---

## Running Locally

```bash
# Development server (hot reload)
npm run dev

# Production build
npm run build

# Preview production build locally
npm run preview
```

The dev server runs on `http://localhost:5173` by default.

---

## Main App Flow

```
Login
  └─► Clinic Selection Page
        ├─► [Approved clinic] → Select → Enter Dashboard
        ├─► [Under review] → Visible, not clickable
        └─► [Pending request] → Can be removed via confirmation modal

Dashboard (selected clinic context)
  ├─► Bookings / Appointments
  │     ├─► View/filter appointments
  │     ├─► Confirm / Cancel / Reschedule
  │     ├─► Start Video Call (online appointments)
  │     └─► Complete visit → Fill Visit Summary → Save Medical History
  ├─► Video Calls
  │     └─► ACS room: local preview, remote video, mic/camera controls
  ├─► Messages
  │     └─► SignalR inbox: conversations, real-time updates, seen receipts
  ├─► Clients
  │     └─► List and detail view per clinic client
  └─► Settings
        ├─► Edit clinic profile & images
        ├─► Manage weekly availability schedule
        └─► Logout / Delete clinic
```

**Clinic persistence:** The selected clinic ID is stored in `localStorage` as `petzy_selected_clinic` and rehydrated on page load via `useClinicStore`.

---

## API Integration Overview

### Axios Configuration

Axios is configured in `src/lib/axios.js` with:
- `baseURL` from `VITE_API_BASE_URL`
- Auth token injected via request interceptor (from Zustand auth store)
- Response interceptor for global error handling (e.g., 401 redirect)

### Key Endpoint Groups

| Domain | Example Endpoints |
|---|---|
| Auth | `POST /api/auth/login` |
| Clinics | `GET /api/clinic`, `POST /api/clinic`, `PUT /api/clinic/{id}`, `DELETE /api/clinic/{id}` |
| Appointments | `GET /api/appointment/clinic/{clinicId}`, `PUT /api/appointment/{id}/status` |
| Reschedule | `PUT /api/appointment/{id}/request-reschedule`, `PUT /api/appointment/{id}/respond-reschedule?accept=true` |
| Medical History | `POST /api/medical-history`, `GET /api/medical-history/appointment/{id}`, `GET /api/medical-history/pet/{petId}` |
| Video Calls | Start / Join / End call endpoints (return ACS room ID + token) |
| Messages | `POST /api/messages`, `POST /api/messages/seen` |
| Clients/Pets | `GET /api/clinic/{clinicId}/clients`, pet detail endpoints |
| Schedule | `GET /api/clinic/{clinicId}/schedule`, `PUT /api/clinic/{clinicId}/schedule` |

> Exact endpoint paths are determined by the backend contract. Do not modify these without coordinating with the backend team.

---

## Feature Modules

### 1. Authentication & Clinic Selection

- Login flow sets user token in Zustand `authStore` and persists it
- Post-login redirect lands on the clinic selection page
- `useClinicStore` fetches the owner's clinic list
- **Approval status** is derived from clinic detail data returned by the backend:
  - ✅ `approved` → clickable, enters dashboard
  - 🔄 `under_review` → visible, non-interactive
  - ⏳ `pending` → visible with a remove option (confirmation modal)
- Selecting a clinic stores it in `localStorage` as `petzy_selected_clinic`

---

### 2. Clinic Creation Request

- Owners submit a new clinic request via a multi-field form
- Form fields: clinic name, address, phone, description, verification document, clinic images
- Submitted as `multipart/form-data`
- The new clinic is **not immediately active** — it enters a pending/review state until approved by a backend admin
- Validation is handled on the frontend before submission

---

### 3. Sidebar Navigation

- Displays selected clinic name with a switch option
- Navigation links: Dashboard, Bookings, Video Calls, Messages, Clients, Settings
- **Unread message badge** appears beside Messages, updated when inbox changes or messages are marked seen
- Clinic owner profile info shown at the bottom

---

### 4. Dashboard

- Overview of clinic activity using real backend data where endpoints are available
- Displays counts/summaries for: today's appointments, video calls, messages, and clients
- All data is scoped to `selectedClinic`

---

### 5. Bookings / Appointments

Appointments are fetched and enriched with client and pet data from separate endpoints.

**Filters:**

| Filter Type | Options |
|---|---|
| Search | Client name, pet name, appointment ID |
| Status | Pending, Confirmed, Cancelled, Completed, Reschedule Requested |
| Type | Physical, Online |
| Timeline | Active, Today, Upcoming, Past, All |

**Sorting:** Today's appointments appear first, followed by upcoming, then past.

**Appointment Statuses:**

| Code | Status |
|---|---|
| 0 | Pending |
| 1 | Confirmed |
| 2 | Cancelled |
| 3 | Completed |
| 4 | Reschedule Requested |

**Supported Actions:**
- Confirm pending appointment
- Cancel appointment
- Propose reschedule (sends new time to client for review)
- Accept client's reschedule request
- Start / join video call (online appointments only)
- Complete physical visit → triggers visit summary form

> ⚠️ **Important:** Proposing a reschedule via `request-reschedule` does **not** update the original appointment time. The original time is only updated after the backend processes the reschedule response.

---

### 6. Appointment Details Modal

- Shows full client and pet information
- Displays appointment start/end time, type, status, and video room link (if online)
- Shows proposed reschedule times when a reschedule is in progress
- Action buttons to view:
  - Medical history for this specific appointment
  - Full pet medical history

---

### 7. Visit Summary / Medical History

A structured form is presented after completing an online call or physical visit.

**Form Fields:**

| Field | Description |
|---|---|
| Reason for visit | Main presenting complaint |
| Diagnosis status | e.g., confirmed, suspected, ruled out |
| Diagnosis | Diagnostic text |
| Treatment given | Procedures performed |
| Medicines given | Prescribed medications |
| Follow-up instructions | Next steps for the owner |
| Additional notes | Free-text notes |

- Medical history **must be saved successfully** before the appointment is marked as completed
- If saving medical history fails, the completion action is blocked
- History is viewable per appointment and as a full pet timeline
- The viewer is styled for document-style reading, suitable for printing or PDF export

---

### 8. Video Calls

Online appointments use **Azure Communication Services (ACS)**.

**Flow:**
1. Clinic clicks "Start Video Call" on a confirmed online appointment
2. Backend returns an ACS room ID and participant token
3. ACS SDK is initialized; clinic joins the room
4. Client joins independently using their own token

**In-call features:**
- Local camera preview
- Remote participant video area
- Mute / unmute microphone
- Camera on / off toggle
- Visual indicators for mic and camera state
- End call with confirmation modal
- Visit summary form is presented automatically after ending the call

**Cleanup:** ACS call objects and local video streams are properly disposed on call end or component unmount.

---

### 9. Messages / Chat

**Architecture:**
- Inbox is fetched via REST on load
- New messages and updates are received in real time over SignalR (`/hubs/chat`)
- SignalR event: `ReceiveMessage`
- Sending a message uses `POST /api/messages`
- Marking messages seen uses `POST /api/messages/seen`

**Chat UI:**
- Conversation list sidebar with search
- Message window with day dividers
- Avatar/profile placeholder for clients
- Message grouping — avatar is not repeated for consecutive messages from the same sender
- Unread count in sidebar badge, cleared when conversation is opened and messages are marked seen

> Conversations with clients who are no longer associated with the clinic are hidden from the inbox.

---

### 10. Clients Page

- Lists all clients associated with the selected clinic
- Fetches data from clinic client endpoints
- Includes pet information where available
- Supports viewing client details

---

### 11. Settings Page

- **Account details** — displays logged-in owner information
- **Clinic profile** — edit clinic name, address, phone, description
- **Clinic gallery** — view and manage uploaded clinic images
- **Availability schedule** — configure weekly open hours per day

  - Fetched via `GET /api/clinic/{clinicId}/schedule`
  - Updated via `PUT /api/clinic/{clinicId}/schedule`

- **Danger zone** — logout and delete clinic actions, both gated by confirmation modals

---

### 12. State Architecture

**Zustand Stores:**

| Store | Responsibilities |
|---|---|
| `authStore` | User object, auth token, login, logout |
| `clinicStore` | Clinic list, selected clinic, create/update/delete clinic, clear selection |

- `useClinicStore` exposes the selected clinic to all pages and components
- Selected clinic is persisted to and rehydrated from `localStorage`
- All API calls that require a clinic context read from `selectedClinic`

---

## Backend Dependencies

The following behaviors depend entirely on backend implementation and are not controlled by this frontend:

- Clinic approval status and transitions (`pending` → `under_review` → `approved`)
- ACS room creation and token generation
- SignalR hub configuration and message routing
- Reschedule flow — the original appointment time is not changed until the backend confirms the response
- Medical history save validation — if the save fails, the frontend blocks appointment completion
- Filtering active clinic clients from the messages inbox

---

## Screenshots

> Replace each placeholder below with the actual screenshot once the UI is finalized.

**Clinic Selection**
```
<!-- Screenshot: Clinic selection screen showing approved, pending, and under-review clinic cards -->
![Clinic Selection](./screenshots/clinic-selection.png)
```

**Dashboard**
```
<!-- Screenshot: Dashboard overview with appointment/client/message stats -->
![Dashboard](./screenshots/dashboard.png)
```

**Bookings**
```
<!-- Screenshot: Appointments list with filters, timeline tabs, and status badges -->
![Bookings](./screenshots/bookings.png)
```

**Appointment Details**
```
<!-- Screenshot: Appointment details modal with client/pet info and action buttons -->
![Appointment Details](./screenshots/appointment-details.png)
```

**Video Call Room**
```
<!-- Screenshot: Active video call with local preview, remote video, and control bar -->
![Video Call Room](./screenshots/video-call.png)
```

**Visit Summary Form**
```
<!-- Screenshot: Post-call visit summary form with all medical history fields -->
![Visit Summary](./screenshots/visit-summary.png)
```

**Messages**
```
<!-- Screenshot: Chat inbox with conversation list, message window, and real-time updates -->
![Messages](./screenshots/messages.png)
```

**Settings / Availability**
```
<!-- Screenshot: Settings page showing clinic profile editor and weekly schedule grid -->
![Settings](./screenshots/settings.png)
```

---

## Future Improvements

- [ ] Role-based access control for multi-staff clinics (vets, receptionists)
- [ ] Push notifications for new appointments and messages
- [ ] Appointment analytics and revenue reporting on the dashboard
- [ ] Offline support / PWA capabilities
- [ ] Pagination and infinite scroll for large appointment/message lists
- [ ] Dark mode support
- [ ] Localization / i18n (Arabic RTL support in particular)
- [ ] End-to-end test coverage (Playwright or Cypress)

---

## Contributing

1. **Branch naming:** `feature/`, `fix/`, `chore/` prefixes (e.g., `feature/reschedule-modal`)
2. **Commits:** Use conventional commits (`feat:`, `fix:`, `refactor:`, etc.)
3. **Code style:** ESLint + Prettier — run `npm run lint` before pushing
4. **State changes:** New global state should go into the appropriate Zustand store; avoid local state for data shared between routes
5. **API calls:** All requests must go through the Axios instance in `src/lib/axios.js` — never use `fetch` directly
6. **Environment:** Never commit `.env` files; add new variables to `.env.example`

For questions about the backend contract or ACS integration, coordinate with the backend team before implementing new endpoints or changing existing payload shapes.

---

> **Petzy Clinic Dashboard** is part of the Petzy platform. For the client-facing mobile app or the backend API repository, refer to the respective repos in the organization.
