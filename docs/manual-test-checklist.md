# Manual Test Checklist — Booking & Ledger Refactor

Use this checklist to verify the booking hardening, checkout late-fee flow, cache invalidation, and related UI changes.

**Environment:** local dev (`npm run dev` → `http://localhost:3000`)

---

## Setup

- [ ] App runs without errors
- [ ] Staff account logged in (non-admin OK for most flows)
- [ ] Admin account available for user/room management
- [ ] At least 2 `AVAILABLE` rooms, plus 1 room with a future `RESERVED` booking for overlap tests
- [ ] Optional: 2 browser tabs or 2 users for race-condition checks
- [ ] Optional: run `db:push` before room-number duplicate test (partial unique index on `rooms.room_number`)

---

## 1. Auth / Server Function Protection

| # | Test | Steps | Expected |
|---|------|-------|----------|
| 1.1 | Logged-out blocked | Log out → hit `/bookings`, `/timeline`, `/dashboard` | Redirect to login |
| 1.2 | Logged-in reads work | Log in → open Bookings, Timeline, Dashboard, Rooms | Data loads, no 401 |
| 1.3 | Admin-only writes | As staff, try Room Management create/delete (if exposed) | Admin-only actions blocked or hidden |

---

## 2. Create Booking

| # | Test | Steps | Expected |
|---|------|-------|----------|
| 2.1 | Walk-in daily | Create walk-in daily booking for free room | Booking created, room → `OCCUPIED`, ledger paid lines |
| 2.2 | Reservation | Create future reservation | Status `RESERVED`, room stays `AVAILABLE` |
| 2.3 | Overlap rejected | Book same room + overlapping dates as existing active booking | Error: room not available |
| 2.4 | Over-capacity | Try occupants > room capacity (if UI allows craft payload) | Server rejects over capacity |
| 2.5 | Manila booking ref | Create booking near midnight (if possible) | Ref prefix `BK-YYYYMMDD-` uses Manila date |
| 2.6 | Timeline updates | After create → open `/timeline` | New bar appears without hard refresh |

---

## 3. Check-In

| # | Test | Steps | Expected |
|---|------|-------|----------|
| 3.1 | Happy path | Open reserved booking → Check in → settle balance → confirm | Status `CHECKED_IN`, room `OCCUPIED` |
| 3.2 | Before check-in date | Try check-in before scheduled date | Blocked with date error |
| 3.3 | Date display | Check stay dates on check-in dialog | Manila-formatted dates |
| 3.4 | Dashboard cache | After check-in → `/dashboard` | Check-ins / occupancy reflect change |

---

## 4. Check-Out + Late Fee (Main Fix)

Use a checked-in booking with **scheduled check-out in the past** (overdue).

| # | Test | Steps | Expected |
|---|------|-------|----------|
| 4.1 | Late fee preview | Open check-out dialog on overdue booking | Alert shows days overdue, rate, total, “temporary preview” text |
| 4.2 | No ledger line yet | Before completing checkout, inspect ledger table in dialog | **No** unpaid `LATE_FEE` row yet |
| 4.3 | Blocked with unpaid charges | Leave other unpaid lines → try checkout | Checkout disabled / server rejects |
| 4.4 | Settle then checkout (no late fee) | On-time booking, settle all → checkout | Checkout succeeds |
| 4.5 | Late fee payment required | Overdue, all other charges paid → late fee section shows payment fields | Must pick method (+ ref if GCash/bank) |
| 4.6 | Late fee GCash validation | GCash + empty reference → checkout | Client error before submit |
| 4.7 | Late fee happy path | Settle all posted charges → fill late fee payment → Complete check-out | One click: `LATE_FEE` inserted **paid**, booking `CHECKED_OUT`, room freed |
| 4.8 | No double-charge loop | Repeat 4.7 once | No “outstanding balance” error after fee applied |
| 4.9 | Form reset on reopen | Open dialog, type in settlement form, close, reopen | Resets only on open, not mid-session refetch |
| 4.10 | Room freed correctly | After checkout → `/rooms` + `/timeline` | Room `AVAILABLE`, bar gone/updated |

---

## 5. Extend Booking (Monthly)

Checked-in **monthly** booking only.

| # | Test | Steps | Expected |
|---|------|-------|----------|
| 5.1 | Pay now (no cash advance) | Extend with toggle **off**, pick payment method | Extension `ROOM_CHARGE` **paid** in ledger |
| 5.2 | Cash advance deferred | Extend with toggle **on** | Extension charge **unpaid**; “Total due now: ₱0” |
| 5.3 | No ref when deferred | Cash advance on + GCash + empty ref | Client validation passes; server accepts |
| 5.4 | Ref required when paid | Cash advance off + GCash + empty ref | Validation error |
| 5.5 | Overlap on extend | Extend into period blocked by another booking on same room | Error: not available |
| 5.6 | Timeline after extend | Extend → timeline | Bar extends without manual refresh |

---

## 6. Transfer Booking

Checked-in guest, target room `AVAILABLE`, no overlapping reservation on target.

| # | Test | Steps | Expected |
|---|------|-------|----------|
| 6.1 | Happy path | Transfer to different available room | Old booking `TRANSFERRED`, new booking `CHECKED_IN` on target |
| 6.2 | Ledger preserved | Compare ledger before/after on new booking ref | Same lines moved, **not** fresh paid daily charges |
| 6.3 | Payment status preserved | Monthly/unpaid balance case | New booking keeps same payment status |
| 6.4 | Old room freed | After transfer | Source room no longer occupied (if no other check-ins) |
| 6.5 | Target occupied | Transfer to room with overlapping future booking | Rejected |
| 6.6 | Same room | Transfer to current room | Rejected |
| 6.7 | Timeline | After transfer | Both rooms update on timeline |

---

## 7. Cancel / Evict

| # | Test | Steps | Expected |
|---|------|-------|----------|
| 7.1 | Cancel reserved | Cancel `RESERVED` booking | Status `CANCELLED` |
| 7.2 | Cancel checked-in blocked | Try cancel `CHECKED_IN` via status API/UI | Rejected |
| 7.3 | Evict checked-in | Evict active guest | Status `EVICTED`, room freed if no other check-ins |
| 7.4 | Evict reserved blocked | Try evict `RESERVED` | Rejected |

---

## 8. Rooms

| # | Test | Steps | Expected |
|---|------|-------|----------|
| 8.1 | Price formatting | `/rooms` table + card view | Uses `formatPeso` (₱ with 2 decimals) |
| 8.2 | Valid status change | Available → Maintenance (room card/dialog) | Succeeds |
| 8.3 | Invalid transition | Try invalid jump (e.g. Maintenance → Occupied if shown) | Rejected |
| 8.4 | Cannot set OCCUPIED manually | Change status dialog options | `OCCUPIED` not offered |
| 8.5 | Soft-deleted room | Delete room (admin) → fetch by old ID if possible | Not found |
| 8.6 | Duplicate room number | Admin: create room with existing number | Error (stronger after `db:push`) |
| 8.7 | Room create/delete cache | Create or delete room → timeline | Timeline reflects change |

---

## 9. Ledger & Payments

| # | Test | Steps | Expected |
|---|------|-------|----------|
| 9.1 | Add expense | Add unpaid charge while checked in | Appears in ledger, balance updates |
| 9.2 | Pay single line | Pay one unpaid expense | Line paid, balance drops |
| 9.3 | Bulk settle | Check-out dialog unified settle | All unpaid marked paid |
| 9.4 | Separate settle | Separate payment per line | Each line gets own method/ref |
| 9.5 | Category labels | Ledger table + invoice PDF | Consistent labels (Room charge, Late fee, etc.) |
| 9.6 | Dashboard after payment | Pay balance on active booking → dashboard | Metrics update |

---

## 10. Monthly Utilities

Route: `/bookings/{id}/monthly-utilities`

| # | Test | Steps | Expected |
|---|------|-------|----------|
| 10.1 | Default period | Open route with no `?period=` | Loads period 0 |
| 10.2 | Bad period param | Open `?period=abc` or `?period=-1` | Falls back to 0, no crash |
| 10.3 | Period switch | Change billing period dropdown | Recorded utilities + preview update immediately |
| 10.4 | Record utilities | Submit utility charges for period | Ledger rows created, no duplicate mains (ELECTRICITY/WATER/INTERNET) |
| 10.5 | Re-submit same period | Submit same utility type again quickly / double-click | Second insert skipped or no duplicate (lock) |

---

## 11. Cache Invalidation (Stale UI)

After each action, check **without hard refresh**:

| Action | Check these screens |
|--------|---------------------|
| Create booking | Timeline, Dashboard, Bookings list |
| Check-in / check-out | Timeline, Dashboard, Room list, Booking detail |
| Transfer | Timeline, Dashboard, both booking details |
| Extend | Timeline, Booking detail, Ledger |
| Ledger payment | Booking detail, Dashboard, Rooms (if payment status affects display) |
| Room status change | Timeline, Rooms |
| Room create/delete/sync | Timeline, Rooms |

**Pass criteria:** all relevant screens show fresh data within ~1–2 seconds.

---

## 12. User Management (Admin)

| # | Test | Steps | Expected |
|---|------|-------|----------|
| 12.1 | Partial first name only | Edit user, change first name only | Last name unchanged in display/`name` |
| 12.2 | Partial last name only | Edit last name only | First name unchanged |
| 12.3 | Both names | Change both | Full name updates correctly |

---

## 13. PDF / Fonts

| # | Test | Steps | Expected |
|---|------|-------|----------|
| 13.1 | Ledger invoice PDF | Booking detail → generate/download invoice | PDF renders, no font load error |
| 13.2 | Italic text | PDF with italic styling (if any) | Renders correctly (was broken HTML fonts before) |
| 13.3 | Thermal receipt | Print/preview thermal receipt | Renders without error |

---

## 14. Route / Loader Edge Cases

| # | Test | Steps | Expected |
|---|------|-------|----------|
| 14.1 | Invalid booking ID | Visit `/bookings/abc` | 404 not found |
| 14.2 | Missing booking | Visit `/bookings/99999999` | 404 not found |
| 14.3 | Valid booking | Visit real ID | Detail loads with ledger prefetched |

---

## 15. Date / Timezone Sanity

| # | Test | Steps | Expected |
|---|------|-------|----------|
| 15.1 | Dashboard “today” | Compare dashboard date lists with Manila calendar | Matches property local day |
| 15.2 | Walk-in default date | New walk-in booking form check-in date | Manila today |
| 15.3 | Timeline “today” highlight | Open timeline on current week | Today column correct |
| 15.4 | Booking detail dates | Check-in/out on detail cards | Manila-formatted, consistent across cards/dialogs |

---

## 16. Race / Concurrency (Optional, Advanced)

Two tabs, same booking/room, submit nearly same time:

| # | Test | Expected |
|---|------|----------|
| 16.1 | Two creates same room/dates | Only one succeeds |
| 16.2 | Two utility submits same period | No duplicate utility rows |
| 16.3 | Two late-fee applies (if manual path still exists) | At most one unpaid late fee |

---

## 17. Regression / Removed Cruft

| # | Test | Expected |
|---|------|----------|
| 17.1 | App builds and navigates all main routes | No import errors from deleted UI components |
| 17.2 | Bookings list/table | Renders normally |
| 17.3 | Dialog scroll areas | Dialogs still scroll (Base UI primitive, not deleted wrapper) |

---

## Quick Smoke Path (~15 min)

If short on time, run this single happy path:

1. Log in as staff
2. Create walk-in daily booking
3. Check timeline shows bar
4. Open booking → add small unpaid expense → settle
5. Check out (on-time, no late fee)
6. Confirm room available + timeline updated
7. Create monthly reservation → check in → extend with cash advance ON → verify unpaid extension
8. Transfer to another room → verify ledger moved
9. Open invoice PDF
10. Admin: edit user first name only → verify last name kept

---

## Notes

- **Responsiveness** was not in scope for this refactor — test desktop/tablet separately if needed.
- **Room number unique index** is schema-only until you run `db:push`; duplicate-room test may only be app-level until then.
- **`routeTree.gen.ts`** formatting changes require no functional test.
