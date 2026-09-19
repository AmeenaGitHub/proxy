# Proximo. (रक्तसेतु) — District Blood Donor Matching Platform

> **Privately, Medically & Intelligently connecting blood donors with hospital emergencies in Ernakulam District.**

---

## 🎯 Problem Statement & Core Value Proposition

Blood donation coordination today relies heavily on broadcast WhatsApp forwards. This approach has critical flaws:
1. **Wrong Blood Group Reaches**: Broadcasts reach thousands of incompatible people.
2. **Medical Ineligibility Ignored**: Reaches donors who gave blood recently (violating NBTC India mandatory 90-day male / 120-day female donation intervals).
3. **Severe Privacy Breaches**: Personal mobile phone numbers are exposed to hundreds of strangers.
4. **WhatsApp Fatigue**: Donors are repeatedly pinged after a need has already been met, causing them to mute or leave donor groups.

### **Proximo.'s Solution**
Proximo. is a district-level intelligent matching engine and private donor management system built with Next.js 15, TypeScript, Tailwind CSS v4, and PostgreSQL (Supabase).

- **Privacy First**: Phone numbers and surnames are masked server-side by default (`+91 9•••• ••23`). Contacts are revealed **ONLY** after a donor accepts a request, creating a logged audit trail (`contact_reveals`).
- **Medical Interval Enforcement**: Strict enforcement of National Blood Transfusion Council (NBTC India) guidance (90d M / 120d F cooldown).
- **Fatigue Protection**: 24-hour notification cooldown per donor and small-batch notification (`units_needed * 3`, capped at 10).

---

## 🚀 Key Features

1. **Interactive Donor Registration & Live Eligibility Calculator (`/join`)**
   - Real-time calculator widget that updates `"You can next donate on <date>"` live as sex or last donation date changes.
   - Demo 6-digit OTP login stub with Dev Panel output.

2. **Donor Dashboard (`/donor`)**
   - **Eligibility Countdown Ring**: Visual SVG progress ring displaying remaining cooldown days or green "Eligible Today" status.
   - **Pause Toggle**: One-click availability pause with optional resume date picker.
   - **Incoming Requests Inbox**: Direct Accept / Decline buttons with reason modal.
   - **Privacy Banner**: Post-acceptance reveal banner showing shared contact details and reveal timestamp.
   - **Judge Impersonation Switcher**: 1-click login switching between seeded donors.

3. **Hospital Request Creation (`/request/new`)**
   - Autocomplete dropdown populated with 6 Kochi hospitals & GPS coordinates.
   - Urgency radius expansion (`critical` 25km, `urgent` 15km, `routine` 10km).
   - Submitting triggers the matching engine, logs `match_audit`, creates notifications for top batch, and redirects to live view.

4. **Live Request Status Page (`/request/[id]`)**
   - Units confirmed progress bar, batching indicator, accepted donor contact cards with unmasked numbers, event timeline, and "Mark unit received" button.

5. **Judging Explainability Panel (`/demo`)**
   - **7-Step Visual Match Funnel Debugger**: Step-by-step breakdown tracking how 150 district donors pass each rule down to the top batch.
   - **Top Ranked Survivors Table**: Displays exact rank order, ABO match status, distance (km), and batch priority score.
   - **Excluded Donors Audit Accordion**: Tabbed view inspecting exact rule exclusion reason per donor.
   - **3 Canned Scenario Simulators**:
     1. *Rare Group Emergency (AB-)*: Demonstrates district-wide search for rare AB- & O- donors.
     2. *Notification Fatigue Protection*: Demonstrates 2nd request skipping donors notified in 1st request within 12h.
     3. *NBTC Interval Edge Case (89d vs 91d)*: Compares 89d male (excluded) vs 91d male (eligible).
   - **Persistent Judge Impersonation Bar**: Fixed 1-click switcher persistent at bottom.

6. **Privacy Model Documentation (`/privacy`)**
   - Detailed breakdown of server redaction rules, contact reveal audit policy, and donor rights.

---

## 🔬 Matching Engine Rules (`lib/matching.ts`)

Pure TypeScript matching function `findEligibleDonors(request, allDonors, now)` evaluated sequentially:

| Rule | Name | Condition |
| :--- | :--- | :--- |
| **Rule 1** | ABO/Rh Compatibility Matrix | Exact match or medical universal compatibility (8 blood groups) |
| **Rule 2** | NBTC India Interval | Male >= 90 days, Female/Other >= 120 days since last donation |
| **Rule 3** | Age Check | Donor age must be between 18 and 65 years |
| **Rule 4** | Availability Pause | `is_paused` = false (or `paused_until` in past) |
| **Rule 5** | Distance Radius | Haversine distance <= urgency radius (25km critical / 15km urgent / 10km routine) |
| **Rule 6** | Notification Fatigue | Excludes donors notified < 24h ago or who declined this request |

### **Ranking Algorithm**
Surviving donors are ranked by:
1. Exact blood group match first (e.g. B+ donor before O+ donor for B+ request).
2. Haversine distance ascending (closest first).
3. Longest time since last donation.

### **Notification Batch Ratio**
Batch size formula: `min(units_needed * 3, 10)`

---

## 🧪 Unit Testing

Matching engine logic is covered by Vitest unit tests in `src/lib/__tests__/matching.test.ts`.

```bash
npx vitest run
```

```
✓ src/lib/__tests__/matching.test.ts (13 tests) 30ms

Test Files  1 passed (1)
     Tests  13 passed (13)
```

---

## 🛠️ Local Development & Setup

### Prerequisites
- Node.js 18+
- npm

### Installation & Server Execution
```bash
# 1. Clone repository
git clone https://github.com/your-repo/Proximo..git
cd Proximo.

# 2. Install dependencies
npm install

# 3. Build production bundle
npm run build

# 4. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🗄️ Database Schema (`supabase/schema.sql`)

The application consists of 5 core PostgreSQL tables:
- `donors`: Donor profiles, blood group, location coordinates, last donation date, pause state.
- `blood_requests`: Hospital requests, patient blood group, units needed/confirmed, urgency, status.
- `notifications`: Dispatch logs, status (pending/accepted/declined/expired), decline reasons.
- `contact_reveals`: Audit logs created upon donor acceptance, revealing phone numbers.
- `match_audit`: Funnel audit snapshot storing district donor count and rule exclusion tallies.

---

## 📜 License & Hackathon Submission

Built for the District Blood Donor Matching Hackathon selection submission.
`Proximo. — Connecting Lifesavers, Protecting Privacy.`
