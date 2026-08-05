# Gym members table — bulk actions, streak, column controls

Breaks down [binectics-frontend#33](https://github.com/Binectics-Fitness/binectics-frontend/issues/33)
into work that can actually be scheduled.

**Do not implement #33 as written.** It reads as three missing widgets on one
table. It is really one useful feature, two hidden features, and one perf
decision — and two of the five buttons the prototype draws have no backing
concept in the API at all.

Design source: `binectics-design-system/binectics/gym-members.html`.
Current implementation: `src/app/dashboard/gym-owner/members/MembersClient.tsx`
(572 lines).

---

## What the page already does

Not a greenfield surface. Already shipped:

| Capability | Where |
|---|---|
| Search by name / email / plan | `MembersClient.tsx:434` |
| Status filter pills | `FILTERS` const |
| Per-row action menu | `RowActions` |
| Change a member's plan | `ChangePlanModal`, `MembersClient.tsx:224` |
| Export | `MembersClient.tsx:388` |

Nothing about members is broken or unreachable. What is missing is
**throughput** (doing a thing to 20 members at once) and **density**
(what the table shows). That is why this is not urgent.

---

## The blocker nobody wrote down

`MembershipSubscriptionStatus` has exactly four values:

```ts
PENDING_PAYMENT | ACTIVE | EXPIRED | CANCELLED
```

There is **no `PAUSED` or `SUSPENDED`**. This breaks two things the prototype
shows:

1. **The bulk bar's danger button says "Suspend."** The nearest existing
   endpoint is `PATCH /organizations/:orgId/subscriptions/:id/cancel`, and
   cancel is not suspend — a suspended member is expected to come back.
   Shipping Suspend as an alias for Cancel would be a data-integrity
   mistake dressed as a label.
2. **The toolbar pills include "Paused", "New · 30d" and "Churned · 90d."**
   None of those are states in the enum. `New` and `Churned` are derivable
   from dates; `Paused` is not derivable from anything.

**Decision needed before any bulk work starts:** is suspension a real
lifecycle state? If yes it is an enum value, a transition rule (who can
suspend, does billing pause, does a QR check-in fail), and a migration — its
own spec, not a button on a toolbar. If no, the bulk bar ships without a
danger action and the prototype should be corrected.

**And the bulk action that actually matters is Archive, not Suspend.** See
`binectics-api/docs/platform/SEAT_MODEL.md`: archive is what frees a billable
seat, which makes it the one bulk operation with commercial meaning. Suspend
only closes the door. Every comparable product — TrueCoach, ABC Trainerize —
makes archive the primary roster action for exactly this reason. When Phase 2
is built, `Archive` should be in the bulk bar even though the prototype does
not draw it.

---

## Phase 1 — Column controls

**Cost:** small. Client-only, no API, no decisions.

The `Columns` button exists in the prototype toolbar
(`gym-members.html`, `.toolbar .right`), next to `Filter` and `Sort`.

- Popover listing every optional column with a checkbox.
- Name and the row-action cell are always on and not listed.
- Persist to `localStorage` per organization; a gym owner managing two
  locations should not have to re-hide columns per visit.
- Hiding every optional column must leave a legible table, not an empty one.

**Acceptance**

- Toggling a column hides its `<th>` and every matching `<td>`.
- Choice survives a reload and is scoped per organization.
- Keyboard reachable; popover closes on `Escape` and on outside click.
- A test asserts a hidden column's header is absent from the DOM, not merely
  `display: none` — an "unmount vs hide" bug on the `RowActions` menu has
  already happened once on this page (`MembersClient.tsx:98`).

---

## Phase 2 — Bulk selection + the actions that already exist

**Cost:** medium. This is the part worth doing.

Ship selection with only the actions that have a real backing operation
today. `Tag` and `Suspend` are explicitly out of scope here (Phases 4 and 0).

### Selection

- Checkbox column, `<td class="ck">` per the prototype's first cell.
- Header checkbox selects/deselects **the current filtered page**, never the
  whole unloaded result set. If the list is paginated, say what the header
  checkbox covers rather than implying "all 1,284".
- Selection clears when the filter or search changes — a selection made
  under one filter must not silently carry into another.

### Bulk bar

Hidden until selection is non-empty. Prototype spec, verbatim:

```css
.bulk                 { background: var(--ink); color: var(--bg);
                        padding: 12px 20px; border-radius: var(--r-3);
                        display: none; align-items: center; gap: 16px; }
.bulk .count          { font-family: var(--font-mono); font-size: 12px;
                        text-transform: uppercase; letter-spacing: 0.04em;
                        color: oklch(0.7 0.005 85); }
.bulk .actions button { font-family: var(--font-mono); font-size: 10.5px;
                        padding: 5px 10px;
                        border: 1px solid oklch(0.3 0.005 85);
                        border-radius: var(--r-1); color: var(--bg);
                        background: transparent; text-transform: uppercase;
                        letter-spacing: 0.04em; }
.bulk .actions button.danger { color: oklch(0.85 0.05 25);
                               border-color: oklch(0.45 0.1 25); }
```

Count reads `<strong>3</strong> members selected`.

### Actions in scope

| Action | Backing | Notes |
|---|---|---|
| **Move plan** | `PATCH /organizations/:orgId/subscriptions/:id/next-plan` | Reuse `ChangePlanModal`'s plan picker; applies the same target plan to every selected member |
| **Export CSV** | Existing export at `MembersClient.tsx:391-407` | Change scope from page to selection — **and fix it first, see below.** It must go through `buildCsv` from `@/lib/csv/csv` |
| **Email** | Existing gym broadcast messaging | Confirm the broadcast endpoint accepts an explicit recipient list rather than "all members" before promising this |

### Phase 2a — the members CSV export is unescaped (do this one first)

Found while scoping this spec, unrelated to the widgets #33 asks for, and
more important than any of them.

`MembersClient.tsx:402` writes CSV by hand:

```ts
const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
```

Surrounding a field in quotes is not escaping. Two defects:

1. **Formula injection.** A field beginning `=`, `+`, `-` or `@` is still
   evaluated by Excel and Google Sheets after they strip the quotes. Member
   **name and email are member-controlled**, so a member can set their
   display name to a formula and have it execute in the gym owner's
   spreadsheet — a payload delivered by the victim's own export.
2. **Structural break.** An embedded `"` is not doubled, so a name
   containing a quote corrupts every following column, and a name containing
   `","` can inject fields into the row.

A hardened writer already exists in this repo — `buildCsv`,
`escapeCsvField`, `neutralizeFormula`, `csvNumber` in `src/lib/csv/csv.ts`,
covered by `src/tests/unit/csv.test.ts`. `foods-csv.ts` and
`sessions-csv.ts` both use it. This export does not, and predates it.

**Fix:** replace the hand-rolled writer with `buildCsv`. No behaviour change
for ordinary data; roughly a ten-line diff.

**Acceptance**

- The members export routes through `buildCsv`; no string-concatenated CSV
  remains in `MembersClient.tsx`.
- A test asserts a member named `=HYPERLINK("http://evil","click")` exports
  with the value neutralised, and that a name containing `"` round-trips as
  a single field.
- No other hand-rolled writer to chase. Four files touch `text/csv`:
  `foods/page.tsx` and `trainer/sessions/page.tsx` build through the helper,
  `bulk-invite/BulkInviteClient.tsx` only *accepts* an upload, and this one
  is the sole remaining hand-rolled writer.

### Partial failure is the real design problem

A bulk action over N subscriptions will partially fail — one member's
subscription expires mid-request, another is already on the target plan.

- Never report success unless every item succeeded.
- Report `succeeded / failed` with the failed members named, and leave the
  failed ones still selected so the operator can retry just those.
- Do not roll back the successes; a partial plan move is a real state, and
  pretending otherwise loses work.

**Server-side:** a real bulk endpoint is preferable to N client requests —
20 sequential `PATCH`es is 20 chances to lose the tab. Suggested:
`PATCH /organizations/:orgId/subscriptions/bulk/next-plan` taking
`{ subscription_ids: string[], plan_id: string }` and returning a per-id
result array. If that is out of scope, the client must at least cap
concurrency and survive a mid-flight navigation without leaving the operator
unsure what applied.

**Acceptance**

- Bulk bar appears only with a non-empty selection and reports the true count.
- Selection resets on filter/search change.
- A partial failure names the failures and keeps them selected.
- Exported CSV of a selection is escaped identically to the existing export;
  a test asserts a `=`-leading field stays inert.

---

## Phase 3 — Streak indicator

**Cost:** medium, and larger than it looks. **Recommend deferring.**

Prototype spec:

```css
tbody .streak     { display: inline-flex; align-items: center; gap: 5px;
                    font-family: var(--font-mono); font-size: 11.5px;
                    color: var(--ink); padding: 3px 8px;
                    background: var(--bg-2); border-radius: 999px; }
tbody .streak svg { width: 10px; height: 10px;
                    color: var(--signal-ink); fill: currentColor; }
```

A flame glyph and a day count (`32`).

**Why it is not cheap.** `current_streak_days` exists
(`src/checkins/checkins.service.ts:54`) but only on
`MyDashboardStatsResponse` — a member reading their *own* streak. Streak is
derived by counting `CheckIn` rows. Putting it in this table means that
aggregation once per member per page load, and the prototype's own header
says **1,284 members**. That is a per-row aggregation for a decorative pill.

**If it is wanted, denormalise rather than compute at read time:** maintain
`current_streak_days` on the subscription (or on a member-stats document)
when a check-in lands, and have the list endpoint return the stored value.
That is a write-path change with its own correctness questions — what happens
on a missed day, on a timezone boundary, on a rejected check-in — and it
belongs in a check-in spec, not here.

**Do not** ship an N+1 aggregation to get the pill on screen.

---

## Phase 4 — Member tags

**Cost:** a feature. **Split into its own issue.**

The prototype's bulk bar has a `Tag` button. There is **no tag concept
anywhere in the API** — not on `MembershipSubscription`, not on `User`.
(`client-profile.entity.ts:47` has free-text *goals*, which is a different
thing and should not be overloaded.)

A toolbar button is the last 5% of this. What has to be decided first:

- What is a tag *for* — segmentation for messaging, or an operator note?
- Free-text or a controlled vocabulary per organization?
- Do tags filter the table? Appear as a column? Drive a broadcast audience?
- Who creates and deletes them, and does deleting one strip it from members?
- Are they visible to the member, or internal to the gym?

Until those are answered, "add a Tag button" is not a task. It needs its own
spec covering the entity, endpoints, permissions, and the filter integration
that makes tags worth having.

---

## Suggested issue split

Replace #33 with:

1. **`fix(gym-members): route the CSV export through buildCsv`** — Phase 2a. Security, small, do first. Not something #33 asked for.
2. **`feat(gym-members): column visibility controls`** — Phase 1. Independent, cheap, no decisions.
3. **`feat(gym-members): bulk selection with move plan, export, email`** — Phase 2. Depends on confirming the broadcast endpoint takes a recipient list.
4. **`spec: is subscription suspension a real lifecycle state?`** — the enum question. Blocks the bulk bar's danger action and the "Paused" filter pill.
5. **`feat(members): member tagging`** — Phase 4. Needs product input before estimation.
6. **`perf: expose per-member streak without an N+1`** — Phase 3. Defer.

Then close #33 pointing at these, so the tracker stops implying one afternoon
of work.

## Priority

**Phase 2a is the only urgent item, and #33 did not ask for it.** An
unescaped export of member-controlled text is a live vulnerability with a
ten-line fix and a helper already sitting in the repo.

Everything else is below anything touching money or correctness. It is
friction on an internal admin table — real friction if gyms run hundreds of
members, but no data is wrong and nothing is unreachable. Those parts also
sit below
[#32](https://github.com/Binectics-Fitness/binectics-frontend/issues/32)'s
review indicators, which are smaller and member-facing.

Phase 1 can be picked up any time by anyone. Phase 2 is the one with genuine
operator value. Phases 3 and 4 should not start until their decisions land.
