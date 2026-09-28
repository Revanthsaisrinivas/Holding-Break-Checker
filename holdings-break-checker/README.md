# Holdings Break Checker & Exception Board

A small full-stack reconciliation tool: upload an internal book CSV and a
custodian CSV, and it tells you where they disagree. Built as a compact
demonstration of a financial-data reconciliation system for an interview —
not a production risk system.

## 1. Project objective

Firms keep their own record of holdings (the "internal book") and receive an
independent record from the custodian bank that actually holds the assets.
The two are supposed to match. This app compares them account by account and
security by security, flags every mismatch as an "exception," and gives an
analyst a dashboard to triage and resolve those exceptions.

## 2. Architecture

```
React (Vite) UI  --HTTP-->  Express API  -->  Reconciliation service  -->  MongoDB
     |                          |                                            |
     | upload 2 CSVs            | POST /api/reconcile                       stores
     | view/filter exceptions   | GET/PATCH /api/exceptions                 open
     | export CSV               | DELETE /api/exceptions                    exceptions
```

- **Frontend** (`frontend/`): React + Vite. Uploads the two CSVs, shows a
  summary strip, filters, and an exception table with inline status updates
  and a CSV export.
- **Backend** (`backend/`): Express API. A route layer (`routes/`) handles
  HTTP concerns only; a service layer (`services/`) holds the actual CSV
  parsing and reconciliation logic, so it's testable independent of Express
  or MongoDB.
- **Database**: MongoDB, via Mongoose. Stores the exceptions produced by the
  most recent reconciliation run.

## 3. Technologies used

- React 18 + Vite (frontend)
- Node.js + Express 4 (backend API)
- MongoDB + Mongoose (persistence)
- Multer (multipart file upload handling)
- csv-parse (CSV parsing)
- Plain CSS (no UI framework)

## 4. How reconciliation works

1. The internal book and custodian CSVs are parsed and validated (both must
   contain `account, security_id, quantity, value, cash`).
2. Internal rows are loaded into a lookup map keyed by `account + security_id`.
3. Each custodian row is matched against that map:
   - **No match** → `MISSING_IN_INTERNAL` exception (custodian has a position
     the internal book doesn't).
   - **Match found** → `quantity`, `value`, and `cash` are compared
     independently. Any field that differs produces its own exception
     (`QUANTITY_BREAK`, `VALUE_BREAK`, or `CASH_BREAK`), so one account/security
     pair can generate more than one exception.
4. After all custodian rows are processed, any internal row that was never
   matched produces a `MISSING_IN_CUSTODIAN` exception (internal book has a
   position the custodian doesn't).
5. Running a new reconciliation replaces the previously stored exceptions
   with the fresh set, so re-running is idempotent instead of accumulating
   duplicates.

### Severity rule (simple and configurable — not a real risk model)

Defined in one place: `backend/utils/severity.js`.

- Missing-record exceptions (present on only one side) are always **HIGH**.
- Field-level breaks are scored by percentage difference from the internal
  value: `|difference| / |internal value|`.
  - `>= 10%` → **HIGH**
  - `>= 3%` and `< 10%` → **MEDIUM**
  - `< 3%` → **LOW**

Change the two threshold numbers in that one file to retune severity.

### Suggested check

Also centralized in `backend/utils/severity.js`:

| Break type | Suggested check |
|---|---|
| `QUANTITY_BREAK` | Check recent trade activity and settlement. |
| `VALUE_BREAK` | Check security price or valuation. |
| `CASH_BREAK` | Check recent cash movements or transactions. |
| `MISSING_IN_CUSTODIAN` / `MISSING_IN_INTERNAL` | Check whether the position was recently opened, closed, or transferred. |

## 5. CSV format

Both files need this header row and columns (order doesn't matter, matching
is case-insensitive on the header names):

```
account,security_id,quantity,value,cash
```

Sample files are in `sample-data/`.

## 6. API endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/api/reconcile` | Multipart form with `internalBook` and `custodianFile` CSV files. Parses, validates, reconciles, replaces stored exceptions, returns the results. |
| GET | `/api/exceptions` | Returns all stored exceptions (newest first). |
| GET | `/api/exceptions/:id` | Returns one exception. |
| PATCH | `/api/exceptions/:id` | Body `{ "status": "OPEN" \| "IN_REVIEW" \| "RESOLVED" }`. Updates status. |
| DELETE | `/api/exceptions` | Clears all stored exceptions. |
| GET | `/api/health` | Basic health check. |

## 7. MongoDB schema

`Exception` (see `backend/models/Exception.js`):

```
account          String   (required)
securityId       String   (required)
breakType        String   (enum: QUANTITY_BREAK, VALUE_BREAK, CASH_BREAK,
                            MISSING_IN_CUSTODIAN, MISSING_IN_INTERNAL)
field            String   (quantity | value | cash | null)
internalValue    Number   (null for MISSING_IN_INTERNAL)
custodianValue   Number   (null for MISSING_IN_CUSTODIAN)
difference       Number
severity         String   (enum: HIGH, MEDIUM, LOW)
suggestedCheck   String
status           String   (enum: OPEN, IN_REVIEW, RESOLVED — default OPEN)
createdAt        Date     (default: now)
```

## 8. How to run the backend

Requires Node.js 18+ and a MongoDB instance (local `mongod`, Docker, or a
free MongoDB Atlas cluster — any connection string works).

```bash
cd backend
cp .env.example .env      # edit MONGO_URI if not using the local default
npm install
npm run dev               # or: npm start
```

The API starts on `http://localhost:5000` (configurable via `PORT` in `.env`).

## 9. How to run the frontend

In a second terminal:

```bash
cd frontend
cp .env.example .env      # edit VITE_API_BASE_URL if the API isn't on :5000
npm install
npm run dev
```

Open `http://localhost:5173`.

## 10. Example reconciliation

Using `sample-data/internal_book.csv` and `sample-data/custodian.csv`:

| Account / Security | Result |
|---|---|
| ACC001 / AAPL | No exception — everything matches. |
| ACC002 / MSFT | `QUANTITY_BREAK` (200 vs 190) and `VALUE_BREAK` (80000 vs 76000), both MEDIUM. |
| ACC003 / GOOG | `VALUE_BREAK` (7500 vs 7000), MEDIUM. |
| ACC004 / AMZN | `MISSING_IN_CUSTODIAN`, HIGH — internal book has it, custodian doesn't. |
| ACC005 / NVDA | `MISSING_IN_INTERNAL`, HIGH — custodian has it, internal book doesn't. |

Upload those two files and click **Run reconciliation** to see this end to end.

## 11. Possible future improvements

- Authentication and per-user/team exception ownership.
- Historical trend view (breaks over time, resolution time metrics).
- Tolerance bands per security type instead of a single global percentage rule.
- Bulk status updates and comment/audit trail per exception.
- Server-side pagination and filtering for very large exception sets.
- Scheduled/automatic reconciliation instead of manual upload.
