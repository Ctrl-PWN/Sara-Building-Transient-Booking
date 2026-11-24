# Building Rentals — Implementation Plan

Status: **confirmed, ready to implement**. The business rules were agreed in the design interview held 2026-11-19 to 2026-11-20. Decisions D1–D8 were confirmed by the owner on 2026-11-20. Start at Phase 0, and stop for review after each phase.

## Goal

Extend the app from transient rooms to the **whole building**. It should track room status, bookings, commercial space leases, and every charge and payment, including partial payments per charge category, so it is always clear who has paid what.

---

## 1. Agreed business rules (reference)

### Roles
| Role | Can do |
|---|---|
| Admin | Everything staff can do, plus manage rooms, users, spaces, tenants, leases and utility rates; end leases; edit or delete **paid** lines (reason required); view the all-edits audit page |
| Staff | Bookings; enter meter readings and utilities; record payments; edit **unpaid** lines; Collections page |

### Rooms and bookings
- Walk-in or reservation, **Daily** or **Monthly**. Guest details stay on the booking (no contacts table).
- **Daily**: unchanged, including the existing invoice that prints every charge.
- **Monthly, 1 month only**: fixed check-out, one rent charge, and **Extend** still works.
- **Monthly, long-term (1 month + advance)**:
  - **Open-ended**, with check-out empty until the guest gives notice.
  - Rent is billed automatically every month.
  - The advance (one month's rent, non-refundable) is **held** and covers the **final month**.
  - On notice, staff sets the end date and the room shows **"Available from <date>"**. It can be reserved for dates after that.
  - The timeline shows an "ongoing" bar until the end date is set.
- **Expired reservations**: once the deposit deadline passes on an unpaid reservation, the dashboard flags it. Staff confirms the cancellation; nothing is cancelled automatically.

### Commercial spaces (not bookings)
- **Space**: label, location, size, default monthly rent.
  - Status: VACANT / OCCUPIED (set by the system) and MAINTENANCE (set by hand).
  - Spaces do not appear on the room timeline.
- **Tenant**: business name, contact person, contact number, address.
- **Lease**: one tenant on one space; one active lease per space.
  - Terms: frozen monthly rent, start date, optional one-month advance (held, covers the last month, non-refundable).
- **Notice**: an end date is set and the space shows "Available from". When the lease ends, the space becomes VACANT.
  - A lease that ends mid-month is charged for the **full month**.
  - Unpaid balances stay owed; the advance is never applied to them.
- **Rent change**: effective from a chosen month onward, which can be the current one.
  - If that month's rent has not been charged yet, it is created at the new rate.
  - If it already exists, a **Rent adjustment** charge bills the difference.
  - Past months are untouched.

### Monthly billing engine (long-term bookings and leases)
1. **Rent** is generated automatically, once per billing period. Generation is idempotent and runs on demand (on page load and from a "Generate bills" button).
2. **Utilities** (only Electricity and Water count as utilities; Internet is removed):
   - Staff enters **previous and current meter readings**. The amount is consumption × the current **general rate**, and the rate is saved on the charge.
   - The previous reading is pre-filled from the last reading for that room or space.
   - **Other** charges are entered as a flat amount.
3. **Partial payments by category.** A payment is recorded against one **category of one billing period**, not against a single charge.
   - Example: utilities total ₱2,000 (electricity ₱1,500 + water ₱500). A payment of ₱500 leaves a ₱1,500 utilities balance.
4. **Overdue**: a category balance greater than 0 after its due date. Late fees are added by hand only.

### Payments, Collections and invoices
- Each payment records paid date, the staff member who recorded it, method (Cash / GCash / Bank) and reference number.
- **Collections page**: every outstanding category balance across bookings and leases, grouped as **Overdue / Due this week / Upcoming**, with a "Record payment" action.
- **Monthly invoice**: one per billing period, for long-term bookings and leases. It shows that period's charges, payments by category, and a single **"Previous unpaid balance"** line. Daily, walk-in and 1-month bookings keep the current full invoice.

### Corrections and audit
- Charges and payments can be **edited** after a confirmation dialog showing *old → new*. Paid or settled items can be edited only by admins, with a reason.
- Every edit and delete is written to `ledger_audit_log`. Each line has a "History" link, and admins have an all-edits page.

### Out of scope
Daily cash-count report, reminder messages, dashboard money widgets, guest or contacts table, deposit refunds or settlement, automatic SMS, automatic late fees.

---

## 2. Implementation decisions (✅ confirmed 2026-11-20)

| # | Decision | Why |
|---|---|---|
| D1 | **Partial payments apply to monthly accounts only** (long-term bookings and leases). Daily and 1-month bookings keep today's per-line paid/unpaid model, because they are paid upfront or at check-in. | Avoids rewriting check-in and walk-in flows that already work. Collections still lists both. |
| D2 | **Payment categories** are **Rent** (rent and rent adjustments), **Utilities** (electricity, water, other) and **Fees** (late fees). The advance is paid in full at move-in. | Matches "pay per category, not per charge". |
| D3 | **Billing period** follows the start-date anniversary (for example Jan 5 – Feb 4), as `listMonthlyBillingPeriods` already does. **The due day is the start day**, so there is no separate due-day field. Rent is due at the start of each period. | Avoids proration. This replaces the separate "due day" from Q5. |
| D4 | **Utilities for a period are due on the next period's due date.** Meters are read at the end of a period, so October's electricity is due with November's rent. | A bill can't be due before the meter is read. |
| D5 | **Overpayment is blocked**: a payment can't exceed the category balance. | Keeps balances simple; there are no credits besides the advance. |
| D6 | **The advance is applied by an automatic payment** (method `ADVANCE`) to the final period's Rent balance once an end date is set. If rent has risen since move-in, the remainder is still owed. | Shows the final month as "covered by advance" without special cases. |
| D7 | **Placeholder general rates**: Electricity **₱13.00 / kWh**, Water **₱40.00 / m³**. Admins can change them on a Utility Rates page. Each rate has an *effective from* date, and a charge keeps the rate it was billed at. | You will replace these when you have the real figures. |
| D8 | **Existing `INTERNET` utility rows become `OTHER`**, with "Internet" kept in the description. | Postgres can't simply drop an enum value; this keeps old data intact. |

**Answered:** the app is deployed but has no real usage yet, so **Phase 9 is skipped**. Development and migration testing use the Neon branch **`Testing`** (dummy data).

---

## 3. Data model changes

New tables:

```
spaces            id, label, location, size_sqm?, default_monthly_rent,
                  status (VACANT|OCCUPIED|MAINTENANCE), deleted_at, created_at

tenants           id, business_name, contact_person, contact_number, address,
                  deleted_at, created_at

leases            id, space_id, tenant_id, monthly_rent, start_date,
                  end_date (null = open-ended), advance_amount,
                  status (ACTIVE|ENDED), ended_at, created_at
                  -- unique partial index: one ACTIVE lease per space

lease_rent_changes id, lease_id, effective_period_start, old_rent, new_rent,
                  created_by, created_at

utility_rates     id, utility_type (ELECTRICITY|WATER), rate_per_unit,
                  unit_label (kWh|m³), effective_from, created_by, created_at

payments          id, booking_id?, lease_id?   -- exactly one (CHECK)
                  period_start, charge_group (RENT|UTILITIES|FEES|ADVANCE),
                  amount, payment_method, reference_number,
                  paid_at, recorded_by, updated_at, updated_by, deleted_at

ledger_audit_log  id, entity_type (CHARGE|PAYMENT), entity_id,
                  action (EDIT|DELETE), before jsonb, after jsonb,
                  reason?, user_id, created_at
```

Changes to existing tables:

```
bookings              + is_long_term boolean default false
                      (check_out already nullable; NULL = open-ended)

ledger_transactions   bookingId → nullable, + lease_id (CHECK exactly one)
  (= charges)         + period_start date            (monthly accounts)
                      + due_date date
                      + paid_at, recorded_by         (per-line model, D1)
                      + updated_at, updated_by
                      + meter_previous, meter_current, rate_snapshot (decimal)
                      -- unique partial index on (booking_id|lease_id, period_start)
                         WHERE category = 'RENT'  → idempotent generation

enums                 ledger_transaction_category + RENT, RENT_ADJUSTMENT
                      payment_method + ADVANCE
                      utility_type: drop INTERNET (D8), keep ELECTRICITY, WATER, OTHER
                      + space_status, lease_status, charge_group, audit_action
```

Balances for monthly accounts are always **computed** as `sum(charges) − sum(payments)` per (account, period, group). No running balance is stored.

---

## 4. Code layout (per AGENTS.md conventions)

```
src/db/schema/        spaces.ts, tenants.ts, leases.ts, payments.ts,
                      utility-rates.ts, audit-log.ts  (+ barrel, enums)
src/lib/spaces/       types, schemas, spaces.functions/queries/mutations
src/lib/leases/       types, schemas, leases.functions/queries/mutations
src/lib/billing/      account.ts         (BookingAccount | LeaseAccount abstraction)
                      periods.ts         (reuse/move listMonthlyBillingPeriods)
                      balances.ts        (pure: group balances, status, overdue)
                      generate-rent.ts   (idempotent rent generation)
                      advance.ts         (apply advance to final period)
                      meter.ts           (pure: consumption × rate)
                      billing.functions/queries/mutations
src/lib/payments/     schemas, payments.functions/queries/mutations
src/lib/utility-rates/ schemas, functions/queries/mutations
src/lib/audit/        audit.ts (writeAudit(tx, …) helper), functions/queries
src/routes/_authenticated/
  collections/index.tsx
  spaces/index.tsx, spaces/$spaceId/index.tsx, spaces/$spaceId/invoice.tsx
  leases/$leaseId/index.tsx
  _admin/space-management/index.tsx
  _admin/utility-rates/index.tsx
  _admin/audit-log/index.tsx
src/components/billing/  RecordPaymentDialog, CategoryBalanceTable,
                         MeterReadingFields, EditChargeDialog (confirm old→new),
                         HistoryPopover, MonthlyStatement
```

---

## 5. Phases

Each phase ends in a working app and can be its own PR.

### Phase 0: Groundwork
- Set up Vitest (`vitest.config.ts`; there is no config yet) for the pure billing functions.
- Move `listMonthlyBillingPeriods` / `isWithinPeriod` into `src/lib/billing/periods.ts` and re-export them from the old location.
- **Done when:** `npm run test` runs and period tests pass, including 29th–31st start days and Manila timezone.

### Phase 1: Schema and migration
- Add the tables, columns and enums from §3. Generate a migration with `npm run db:generate`, then hand-edit it for:
  - the INTERNET → OTHER conversion and recreating the enum type (D8)
  - the CHECK constraints and partial unique indexes
  - backfilling `paid_at = created_at` and `recorded_by = NULL` on existing paid lines
- Seed placeholder utility rates (D7).
- **Done when:** the migration applies cleanly on the Neon `Testing` branch, and existing pages still work.

### Phase 2: Ledger core (audit, paid date, edit)
- `writeAudit` helper; every charge edit and delete goes through it inside the same transaction.
- Edit charge server function with permission rules: staff can edit unpaid lines; admins can edit paid lines with a required reason.
- `paid_at` and `recorded_by` are set wherever a line is marked paid (check-in, payExpense, bulk pay).
- UI: `EditChargeDialog` with an *old → new* confirmation step, and a History popover on ledger rows.
- **Done when:** editing or deleting a line writes an audit row, and staff are blocked from editing paid lines.

### Phase 3: Utility rates and meter input
- Admin Utility Rates page; rates have effective-from dates.
- Electricity and Water entry: previous reading (pre-filled from the last reading for that room or space), current reading, consumption and amount computed live, rate saved on the charge. Validation: current ≥ previous.
- Remove Internet from the utility UI. Other is a flat amount.
- Utilities are saved as **unpaid** charges, with a "Paid now" option.
- **Done when:** entering readings produces a correct charge, and a later rate change does not alter past charges.

### Phase 4: Spaces, tenants, leases (admin)
- Space management CRUD; space status rules (OCCUPIED/VACANT come from the lease).
- Tenant create and edit (inline in the lease form, with search over existing tenants).
- Create lease: rent pre-filled from the space; optional advance recorded as paid; the first period's rent is generated.
- Lease detail page: terms, periods, balances by category, payments.
- Spaces nav entries (main nav: Spaces; admin nav: Space Management, Utility Rates, Audit Log).
- **Done when:** an admin can lease Unit A to a grocery store and see the first period's rent.

### Phase 5: Billing engine and payments
- `generateRentCharges(account)`: creates any missing RENT charges up to the current period. Called on load of Collections, lease and booking pages, plus a "Generate bills" button. Idempotent through the unique index.
- `recordPayment`: account, period, group, amount ≤ balance (D5), method, reference, paid date. Audited on edit and delete.
- Due dates and overdue status (D3, D4); sync the payment status of `bookings`.
- Rent change: effective period, adjustment line when that period is already charged, and a `lease_rent_changes` row.
- Give notice / end: set the end date and apply the advance (D6); space shows "Available from"; on the end date the lease is ENDED and the space VACANT.
- **Done when:** unit tests cover generation idempotency, partial payments, overdue rules, advance application and mid-period rent changes.

### Phase 6: Long-term monthly bookings
- Booking form: "1 month only" vs "Long-term (with advance)". Long-term bookings are saved with `is_long_term = true` and `check_out = NULL`.
- **Availability rule (agreed):**
  - While a long-term stay has no end date, the room is **booked for every future date**. Any reservation attempt is rejected with "Occupied by a long-term stay (no move-out date yet)".
  - Once the guest gives notice, the stated move-out date **and every date after it** become available. A new guest can check in on the move-out day, the same as today's check-out-day rule.
  - The notice date can be moved or cleared only while no reservation exists after it.
- **Overlap and availability queries** must treat `check_out IS NULL` as "until further notice". Places to update: `createBooking`, `transferBooking`, `syncRoomStatuses`, `getTimelineWeek`, and the room pickers.
- Timeline: an "ongoing" bar to the edge of the week. After notice, a normal bar plus an "available from" marker.
- Notice action on a booking: set the end date, apply the advance, and allow future reservations after it.
- Long-term bookings use the engine (Phase 5) for rent, utilities and partial payments. Extend stays for 1-month bookings only.
- **Done when:** a long-term guest is billed monthly with no Extend, and a reservation can be made for after their notice date.

### Phase 7: Collections page
- One table for all accounts (bookings and leases), with one row per (account, period, group) where the balance is greater than 0.
- Columns: due date, total, paid, balance, status. Sections: Overdue / Due this week / Upcoming.
- 1-month and daily bookings appear through their unpaid lines (D1).
- Filters: rooms / spaces / all. "Record payment" opens `RecordPaymentDialog`.
- **Done when:** every unpaid amount in the building is visible on one page.

### Phase 8: Monthly invoice and dashboard flag
- Monthly statement (reuse the monthly invoice layout and `INV-<ref>-P<n>` numbering; use `LSE-<id>-P<n>` for leases): that period's charges, payments by category, and one "Previous unpaid balance" line.
- Dashboard: "Deposit deadline passed – cancel?" list with a one-click cancel after confirmation.
- Admin Audit Log page (filter by user, date, action).

### Phase 9: Convert existing monthly bookings: **SKIPPED** (no real usage yet)
- Script with **dry-run report**: mark bookings with an ADVANCE line as long-term, assign existing lines to periods by `created_at`, and create payments from paid lines.
- Staff reviews the report before running it for real.

### Phase 10: Verification
- Unit tests (billing pure functions), `npm run lint`, `npm run build`.
- Extend `docs/manual-test-checklist.md` with scenarios for lease lifecycle, long-term booking, meter entry, partial payment, rent change, notice and advance, edit and audit, and permissions.

---

## 6. Risks

- **Null check-out** affects every overlap query. Phase 6 must cover all of them, or rooms could be double-booked.
- **Removing an enum value** (D8) requires recreating the Postgres type. Run it on a Neon branch first.
- **Two payment models** (D1) mean Collections must merge them carefully. This is covered in Phase 7.
- **Placeholder rates** (D7) must be replaced before real bills are issued.
