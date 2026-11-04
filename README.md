# SIGNOVANTA

> **Every Event. Every Approval. One Platform.**

Student Event Participation, Pre-Approval, Team Management, Certificate Verification, and Academic Activity Monitoring System.

---

## 1. Project Overview & Architecture

SIGNOVANTA is an institutional platform designed to manage and verify the complete lifecycle of student external event participation:
* **Pre-Event Phase (50% Completion):** Application submission, event categorization, faculty coordination, team formation, and faculty/HOD verification.
* **Post-Event Phase (100% Completion):** Attendance confirmation, prize awards, conditional certificate uploads (Winner vs. Participation), and final completion sign-off.
* **Real-Time Student Presence Monitoring:** Live online/offline status tracking with green/grey/yellow/red indicators backed by Firebase Realtime Database and `onDisconnect` triggers.

---

## 2. Three Primary Dashboards

1. **Student Dashboard:**
   * Dynamic student profile and preloaded third-year academic identity.
   * Add New Event submission wizard with 15 standard event categories.
   * Multi-tier progress stepper (50% Pre-Approved, 100% Verified).
   * Collaborative team formation with individual invitation confirmation.
   * Post-event certificate uploader with conditional requirements.

2. **Staff Dashboard (Adaptive Roles):**
   * Dynamically adapts to assigned role: `STAFF`, `HOD`, or `AHOD`.
   * Real-time student directory and online session monitor.
   * Pre-event verification queue (grants 50% progress).
   * Post-event certificate review queue (grants 100% progress).
   * Staff sign-up and role request review gateway.

3. **Master Admin Dashboard:**
   * Comprehensive control center: Student preloads, bulk CSV ingestion, account suspension, and password resets.
   * Staff privilege authorization: Approving staff registration requests and assigning `STAFF`, `HOD`, or `AHOD` roles.
   * Event catalogue management and academic section configuration.
   * Tamper-proof system audit logs and CSV data export.

---

## 3. Technology Stack

* **Frontend:** React 19, TypeScript, Tailwind CSS v4, Lucide React Icons
* **Cloud & Backend Services:**
  * **Firebase Authentication:** Normalized case-insensitive registration numbers (`927624BEC066`).
  * **Cloud Firestore:** Document collections with strict security rules (`firestore.rules`).
  * **Firebase Realtime Database:** Connection presence, heartbeat, and `onDisconnect` triggers (`database.rules.json`).
  * **Cloudinary:** Media and certificate storage (`cloudinaryService.ts`).
* **Hosting:** Vercel

---

## 4. Preloaded Cohorts & Login Instructions

* **Initial Cohort:** Third-Year Students across Sections:
  * `III Year V Section` (Electronics & Communication)
  * `III Year A Section` (Computer Science & Engineering)
  * `III Year C Section` (Civil Engineering)
* **Student Login:**
  * **Username:** Registration Number (e.g., `927624BEC066`).
  * **Initial Password:** Registration Number (e.g., `927624BEC066`).
  * *Note: First-time login enforces a mandatory password change and account activation.*
* **Staff Login:**
  * E.g., `arunkumar.hod@college.edu` / `password123` (HOD - Civil)
  * E.g., `priya.ahod@college.edu` / `password123` (AHOD - ECE)
  * E.g., `ramesh.cse@college.edu` / `password123` (STAFF - CSE)
* **Master Admin Login:**
  * **PIN:** `admin123` or `admin@signovanta2026`

---

## 5. Development & Deployment Commands

```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Run TypeScript checks and production build
npm run build

# Deploy Firebase Security Rules
npx firebase-tools deploy --only firestore:rules,database
```

