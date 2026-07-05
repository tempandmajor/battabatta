# Event Assessment Runbook

Use this runbook when the Quborly event inventory is available as a database table, CSV, JSON export, or admin scrape.

## Inputs

- `docs/product/event-assessment-rubric.json`: machine-readable scoring criteria, categories, roles, required fields, and remediation statuses.
- `docs/product/event-inventory-template.csv`: minimum export/import shape for event records.
- `docs/product/event-example-records.csv`: publish-ready example records for the core categories: conference, concert, circuit party, play, competition, and festival.
- `docs/product/event-flawed-records.csv`: intentionally weak records that should produce reject or rebuild statuses with remediation findings.
- Source event records from `admin/quborlyevents` or the production event database.

## Required Export Fields

Every event needs:

- Identity: `id`, `title`, `category`, `current_status`.
- Audience: `audience`, `promise`, `description`.
- Logistics: `start_at`, `end_at`, `timezone`, `venue_name`, `city`, `capacity`, `age_policy`.
- Program: `program`, `credits_json`.
- Access and safety: `accessibility`, `safety_plan`.
- Business case: `ticketing`, `revenue_model`, `cost_model`, `break_even`, `market_demand`, `sponsor_or_partner_value`.
- Growth and measurement: `marketing_plan`, `measurement_plan`.

## Process

1. Export all events from the admin account.
2. Normalize categories to the rubric values, including `concert`.
3. Normalize credited people and organizations into `credits_json`.
4. Check required credits by category:
   - Conference: speakers, hosts/moderators, organizers, sponsors if sold.
   - Concert: headliner/artists/bands, DJs or hosts where applicable, producer/promoter.
   - Circuit party/nightlife: DJs, hosts, entertainers, performers, producers.
   - Play/theater: cast, director, playwright where applicable, producer/company.
   - Competition: host, judges, contestants or teams when public, coaches/mentors where relevant.
   - Festival: artist/music lineup for music festivals, performers/entertainers, hosts/MCs, vendors, sponsors, producers.
5. Score the event against each criterion in `event-assessment-rubric.json`.
6. Assign one remediation status: `publish`, `fix`, `rebuild`, `archive`, or `reject`.
7. Rewrite event-facing copy only after missing logistics, credits, safety, accessibility, and business-case facts are resolved.
8. Store score, reviewer, assessment date, findings, and rewritten fields back in the admin system.

## Local Assessment Command

After exporting events to the CSV shape in `docs/product/event-inventory-template.csv`, run:

```bash
npm run events:assess -- path/to/quborly-events.csv docs/product/event-assessment-rubric.json path/to/event-assessments.json path/to/event-remediation.csv
```

The command emits a JSON report with score, score band, remediation status, missing fields, missing credit groups, criterion-level scores, general findings, category-specific business-case findings, realism findings, safety/accessibility findings, and recommended changes for every event. If a fourth argument is provided, it also writes an admin-friendly remediation CSV with one row per event. If no JSON output path is provided, the report prints to stdout.

The remediation CSV columns are:

- `event_id`
- `title`
- `category`
- `score`
- `score_band`
- `status`
- `declared_assessment_status`
- `status_mismatch`
- `missing_fields`
- `missing_credit_groups`
- `temporal_findings`
- `business_case_findings`
- `realism_findings`
- `safety_accessibility_findings`
- `rewrite_prompt`
- `business_case_prompt`
- `recommended_changes`

`temporal_findings` flags invalid dates, invalid IANA timezones, end times before start times, and events that have already ended relative to the assessment date.

The JSON report summary includes:

- `count`
- `average_score`
- `status_counts`
- `category_counts`
- `status_counts_by_category`
- `average_score_by_category`
- `status_mismatch_count`
- `temporal_findings_count`
- `remediation_count`

## Copy Rewrite Rules

Do:

- Name the exact audience, venue, neighborhood/city, organizer, dates, and time.
- Show the actual lineup, cast, speakers, hosts, judges, or performers.
- Make the format concrete: doors, set times, sessions, rounds, acts, intermission, awards, afterparty, or closing.
- State accessibility, age policy, and key safety details in plain language.
- Make the business reason visible internally even if not shown publicly.

Do not:

- Publish generic titles such as "Music Festival 2026" or "Amazing Conference."
- Hide missing lineup, cast, speaker, host, or judge details inside vague prose.
- Use fake venue certainty, fake sponsor names, or inflated capacity.
- Treat American Idol-style competitions as open mic nights; they need rules, eligibility, judging, voting, advancement, and prize details.

## Assessment Output

Each reviewed event should produce:

```json
{
  "event_id": "event identifier",
  "score": 0,
  "status": "publish | fix | rebuild | archive | reject",
  "declared_assessment_status": "status from the source export when present",
  "status_mismatch": false,
  "category": "conference | concert | circuit_party | play | competition | festival | other",
  "missing_fields": [],
  "missing_credit_groups": [],
  "temporal_findings": [],
  "criteria_scores": {},
  "findings": [],
  "business_case_findings": [],
  "realism_findings": [],
  "safety_accessibility_findings": [],
  "rewrite_prompt": "category-specific public copy rewrite guidance",
  "business_case_prompt": "category-specific business-case guidance",
  "recommended_changes": [],
  "rewritten_title": "optional improved public title",
  "rewritten_description": "optional improved public description"
}
```
