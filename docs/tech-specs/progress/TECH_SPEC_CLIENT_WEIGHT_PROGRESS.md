# Tech Spec: Client Weight Progress on Dashboard

**Status**: Proposed
**Author**: Auto-generated
**Date**: 2026-03-19
**PR Context**: [Copilot review on dietitian/page.tsx#L24-27](https://github.com/Binectics-Fitness/binectics-frontend/pull/9)

---

## Problem

The `computeProgress()` function in the dietitian dashboard (`src/app/dashboard/dietitian/page.tsx`) always returns `0` even when a client has `starting_weight_kg` and `target_weight_kg` set. The progress bar renders `0%`, which is misleading.

```ts
function computeProgress(profile: ClientProfile): number {
  const start = profile.starting_weight_kg;
  const target = profile.target_weight_kg;
  if (!start || !target || start === target) return 0;
  // We don't have latest weight here, so show 0 (would need weight logs)
  return 0; // ← always 0
}
```

The root cause: `ClientProfile` has `starting_weight_kg` and `target_weight_kg` but no `current_weight_kg`. The latest weight lives in the `weight_logs` collection and is only accessible via the per-profile summary endpoint (`GET /progress/clients/:profileId/summary`).

---

## Existing Backend Infrastructure

The progress module (`src/progress/`) already provides:

| Endpoint                                   | Returns                                                             |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `GET /progress/clients`                    | `ClientProfile[]` — no weight log data                              |
| `GET /progress/clients/:profileId/weight`  | `WeightLog[]` — full history for one profile                        |
| `GET /progress/clients/:profileId/summary` | `ProgressSummary` — includes `weight.latest_kg`, `weight.change_kg` |
| `GET /progress/dashboard-stats`            | Aggregate counts (active_clients, etc.)                             |

**Gap**: No batch endpoint to get the latest weight for multiple client profiles in a single request. Fetching `/summary` per profile (N+1) is wasteful for a dashboard that only needs one number per client.

---

## Proposed Solution

### Backend: New Batch Endpoint

Add a lightweight endpoint that returns the latest weight log for each active client profile in one query.

#### Endpoint

```
GET /progress/clients/latest-weights
```

**Response**:

```json
{
  "success": true,
  "data": {
    "<profileId_1>": {
      "weight_kg": 82.3,
      "recorded_at": "2026-03-15T08:00:00Z"
    },
    "<profileId_2>": {
      "weight_kg": 68.1,
      "recorded_at": "2026-03-18T07:30:00Z"
    },
    "<profileId_3>": null
  }
}
```

- Keys are `client_profile_id` strings
- Value is the most recent `WeightLog` entry (just `weight_kg` + `recorded_at`), or `null` if no logs exist
- Scoped to the authenticated professional's profiles only

#### Organization variant

```
GET /progress/organizations/:organizationId/clients/latest-weights
```

Same response shape, scoped to the org's client profiles.

#### Implementation (Service)

Uses a single MongoDB aggregation pipeline:

```ts
async getLatestWeights(
  professionalId: string,
  organizationId?: string,
): Promise<Record<string, { weight_kg: number; recorded_at: Date } | null>> {
  // 1. Get all active profile IDs for this professional
  const filter: any = { professional_id: new Types.ObjectId(professionalId), is_active: true };
  if (organizationId) filter.organization_id = new Types.ObjectId(organizationId);

  const profiles = await this.clientProfileModel
    .find(filter)
    .select('_id')
    .lean()
    .exec();

  const profileIds = profiles.map(p => p._id);
  if (profileIds.length === 0) return {};

  // 2. Single aggregation: group by profile, get latest weight
  const results = await this.weightLogModel.aggregate([
    { $match: { client_profile_id: { $in: profileIds } } },
    { $sort: { recorded_at: -1 } },
    { $group: {
        _id: '$client_profile_id',
        weight_kg: { $first: '$weight_kg' },
        recorded_at: { $first: '$recorded_at' },
    }},
  ]);

  // 3. Build response map
  const map: Record<string, { weight_kg: number; recorded_at: Date } | null> = {};
  for (const p of profiles) {
    map[p._id.toString()] = null;
  }
  for (const r of results) {
    map[r._id.toString()] = { weight_kg: r.weight_kg, recorded_at: r.recorded_at };
  }
  return map;
}
```

**Performance**: Two queries total (one `find` + one `aggregate`) regardless of number of clients.

#### DTO (Response)

No request DTO needed. Response is a plain object typed as:

```ts
Record<string, { weight_kg: number; recorded_at: string } | null>;
```

#### Tests

- Returns empty object when professional has no clients
- Returns `null` for profiles with no weight logs
- Returns latest weight (not earliest) when multiple logs exist
- Scopes to organization when `organizationId` is provided
- Rejects unauthenticated requests (401)

---

### Frontend: Consume the New Endpoint

#### 1. Add API method (`src/lib/api/progress.ts`)

```ts
export interface LatestWeight {
  weight_kg: number;
  recorded_at: string;
}

async getLatestWeights(): Promise<ApiResponse<Record<string, LatestWeight | null>>> {
  return await apiClient.get<Record<string, LatestWeight | null>>(
    '/progress/clients/latest-weights',
  );
}
```

#### 2. Update dietitian dashboard (`src/app/dashboard/dietitian/page.tsx`)

```ts
const [latestWeights, setLatestWeights] = useState<
  Record<string, { weight_kg: number; recorded_at: string } | null>
>({});

useEffect(() => {
  if (!user) return;
  // existing calls...
  progressService.getLatestWeights().then((res) => {
    if (res.success && res.data) setLatestWeights(res.data);
  });
}, [user]);

function computeProgress(profile: ClientProfile): number {
  const start = profile.starting_weight_kg;
  const target = profile.target_weight_kg;
  if (typeof start !== "number" || typeof target !== "number") return 0;
  if (!isFinite(start) || !isFinite(target) || start === target) return 0;

  const latest = latestWeights[profile._id];
  if (!latest) return 0; // No weight logs yet — show 0%

  const current = latest.weight_kg;
  const totalChange = target - start;
  const currentChange = current - start;
  let progress = (currentChange / totalChange) * 100;

  return Math.max(0, Math.min(100, Math.round(progress)));
}
```

#### 3. Hide progress bar when no data

When there are no weight logs for a client, instead of showing a misleading 0% bar, show a "No weight data" message:

```tsx
{
  start &&
    target &&
    start !== target &&
    (latestWeights[profile._id] ? (
      <ProgressBar progress={computeProgress(profile)} />
    ) : (
      <p className="text-xs text-foreground-tertiary">No weight logs yet</p>
    ));
}
```

---

## Scope

### In Scope

- New `GET /progress/clients/latest-weights` endpoint (backend)
- New `GET /progress/organizations/:orgId/clients/latest-weights` endpoint (backend)
- Unit tests for the new service method
- Frontend API method addition
- Dietitian dashboard `computeProgress` fix
- Conditional "No weight logs yet" message

### Out of Scope

- Trainer dashboard (no progress bar currently shown there)
- Gym owner dashboard (no progress bar currently shown there)
- Weight log UI (create/edit/delete) — already exists at `/progress/clients/:profileId/weight`
- Chart visualizations — existing summary endpoint covers this

---

## Alternatives Considered

### 1. Fetch `/summary` per profile (N+1)

**Rejected**: Dashboard loads top 4 clients. 4 extra API calls is tolerable but doesn't scale. Also fetches meal + activity data unnecessarily.

### 2. Add `current_weight_kg` to `ClientProfile` entity

**Rejected**: Denormalization means keeping it in sync whenever a weight log is created/deleted. Error-prone and violates single source of truth.

### 3. Populate latest weight in `getClientProfiles` via aggregation lookup

**Rejected**: Modifying the existing endpoint's response shape could break other consumers. A dedicated endpoint is cleaner.

---

## Rollout Plan

1. **Backend**: Implement new endpoint + tests on `feat/more-features` branch
2. **Frontend**: Add API method + fix `computeProgress` + conditional UI
3. **Test**: Manually verify with real client profiles that have weight logs
4. **Merge**: Both PRs together
