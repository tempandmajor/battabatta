#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const DEFAULT_RUBRIC = "docs/product/event-assessment-rubric.json";
const DEFAULT_ASSESSMENT_DATE = "2026-07-05T00:00:00Z";

function usage() {
  console.error("Usage: node scripts/assess-events.mjs <events.csv> [rubric.json] [output.json] [remediation.csv]");
  process.exit(1);
}

function readText(filePath) {
  return fs.readFileSync(path.resolve(filePath), "utf8");
}

export function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (quoted) {
      if (char === '"' && next === '"') {
        cell += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        cell += char;
      }
      continue;
    }

    if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (char !== "\r") {
      cell += char;
    }
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  const [headers, ...body] = rows.filter((candidate) => candidate.some((value) => value.trim() !== ""));
  if (!headers) return [];

  return body.map((values) =>
    Object.fromEntries(headers.map((header, index) => [header.trim(), (values[index] ?? "").trim()]))
  );
}

function hasValue(record, field) {
  return Boolean((record[field] ?? "").trim());
}

function value(record, field) {
  return String(record[field] ?? "");
}

function includesAny(value, words) {
  const lower = String(value ?? "").toLowerCase();
  return words.some((word) => lower.includes(word));
}

function parseCredits(raw) {
  if (!raw) return { credits: [], error: "Missing credits_json" };
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return { credits: [], error: "credits_json must be an array" };
    return { credits: parsed, error: null };
  } catch (error) {
    return { credits: [], error: `Invalid credits_json: ${error.message}` };
  }
}

function creditRoles(credits) {
  return new Set(
    credits
      .map((credit) => String(credit?.role ?? "").trim().toLowerCase())
      .filter(Boolean)
  );
}

function missingCreditGroups(record, rubric, roles) {
  const groups = rubric.required_credit_groups_by_category?.[record.category] ?? rubric.required_credit_groups_by_category?.other ?? [];
  return groups
    .filter((group) => !group.some((role) => roles.has(role)))
    .map((group) => group.join("|"));
}

function missingTermGroups(text, terms) {
  if (!terms || terms.length === 0) return [];
  const normalized = String(text ?? "").toLowerCase();
  return terms.filter((term) => !normalized.includes(term));
}

function hasCategorySignal(text, terms) {
  return missingTermGroups(text, terms).length < terms.length;
}

function scoreChecks(weight, checks) {
  const passed = checks.filter(Boolean).length;
  return Math.round((weight * passed) / checks.length);
}

function scoreBand(score, rubric) {
  return rubric.score_bands.find((band) => score >= band.min && score <= band.max)?.status ?? "unscored";
}

function remediationStatus(score, missingFields, missingCredits, findings, rubric) {
  if (score >= 80 && missingFields.length === 0 && missingCredits.length === 0 && findings.length === 0) return "publish";
  if (score < 55 || missingFields.length > 5) return "reject";
  if (missingCredits.length > 0 || missingFields.length > 2 || findings.length > 3) return "rebuild";
  if (score >= rubric.publish_threshold) return "fix";
  if (score >= 55) return "rebuild";
  return "reject";
}

function isValidTimeZone(timeZone) {
  if (!timeZone) return false;
  try {
    Intl.DateTimeFormat("en-US", { timeZone }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

function parseDate(raw) {
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function temporalFindings(record, assessmentDate = DEFAULT_ASSESSMENT_DATE) {
  const findings = [];
  const start = parseDate(value(record, "start_at"));
  const end = parseDate(value(record, "end_at"));
  const assessedAt = parseDate(assessmentDate) ?? parseDate(DEFAULT_ASSESSMENT_DATE);

  if (hasValue(record, "start_at") && !start) findings.push("start_at must be a valid date/time.");
  if (hasValue(record, "end_at") && !end) findings.push("end_at must be a valid date/time.");
  if (start && end && end <= start) findings.push("end_at must be after start_at.");
  if (hasValue(record, "timezone") && !isValidTimeZone(value(record, "timezone"))) {
    findings.push("timezone must be a valid IANA timezone.");
  }
  if (end && assessedAt && end < assessedAt) {
    findings.push("Event has already ended; archive it or reassess with post-event metrics.");
  }

  return {
    findings,
    hasValidSchedule: Boolean(start && end && end > start && isValidTimeZone(value(record, "timezone")))
  };
}

export function assessEvent(record, rubric, options = {}) {
  const { credits, error: creditError } = parseCredits(record.credits_json);
  const roles = creditRoles(credits);
  const missingFields = rubric.required_fields.filter((field) => !hasValue(record, field));
  const missingCredits = missingCreditGroups(record, rubric, roles);
  const findings = [];
  const categoryChecks = rubric.category_specific_checks?.[record.category] ?? rubric.category_specific_checks?.other;
  const programText = `${value(record, "program")} ${value(record, "description")}`;
  const businessText = `${value(record, "ticketing")} ${value(record, "revenue_model")} ${value(record, "cost_model")} ${value(record, "break_even")} ${value(record, "market_demand")} ${value(record, "sponsor_or_partner_value")}`;
  const measurementText = value(record, "measurement_plan");
  const businessCaseFindings = [];
  const realismFindings = [];
  const safetyAccessibilityFindings = [];
  const timing = temporalFindings(record, options.assessmentDate);

  if (!rubric.categories.includes(record.category)) findings.push(`Unknown category: ${record.category || "missing"}`);
  if (creditError) findings.push(creditError);
  if (Number(record.capacity) <= 0 || Number.isNaN(Number(record.capacity))) findings.push("Capacity must be a positive number.");
  findings.push(...timing.findings);
  if (includesAny(record.title, ["example", "amazing", "tbd", "placeholder"])) {
    realismFindings.push("Title appears generic or placeholder.");
  }
  if (value(record, "description").length > 0 && value(record, "description").length < 80) {
    realismFindings.push("Description is too thin to feel like a real event.");
  }
  if (categoryChecks && !hasCategorySignal(programText, categoryChecks.program_terms)) {
    realismFindings.push(`${record.category || "Event"} program is missing category-specific detail: ${categoryChecks.guidance}`);
  }
  if (categoryChecks && !hasCategorySignal(businessText, categoryChecks.business_terms)) {
    businessCaseFindings.push(`${record.category || "Event"} business case is missing category-specific revenue or cost logic: ${categoryChecks.guidance}`);
  }
  if (categoryChecks && !hasCategorySignal(measurementText, categoryChecks.measurement_terms)) {
    businessCaseFindings.push(`${record.category || "Event"} measurement plan is missing category-specific KPIs.`);
  }
  if (!includesAny(`${record.accessibility} ${record.safety_plan}`, ["accessible", "ada", "accommodation", "companion", "route", "seating", "restroom"])) {
    safetyAccessibilityFindings.push("Accessibility details need route, seating, restroom, accommodation, ADA, or companion-ticket specifics.");
  }
  if (!includesAny(record.safety_plan, ["security", "medical", "crowd", "incident", "emergency"])) {
    safetyAccessibilityFindings.push("Safety plan needs security, medical, crowd, incident, or emergency details.");
  }

  const criteriaScores = {
    audience_positioning: scoreChecks(12, [
      hasValue(record, "audience"),
      hasValue(record, "promise"),
      hasValue(record, "market_demand"),
      hasValue(record, "category") && !findings.some((finding) => finding.startsWith("Unknown category"))
    ]),
    program_experience: scoreChecks(16, [
      hasValue(record, "program"),
      credits.length > 0,
      missingCredits.length === 0,
      value(record, "program").length >= 40 && (!categoryChecks || hasCategorySignal(programText, categoryChecks.program_terms))
    ]),
    operational_readiness: scoreChecks(14, [
      hasValue(record, "start_at") && hasValue(record, "end_at") && hasValue(record, "timezone") && timing.hasValidSchedule,
      hasValue(record, "venue_name") && hasValue(record, "city"),
      Number(record.capacity) > 0,
      hasValue(record, "safety_plan")
    ]),
    safety_accessibility: scoreChecks(12, [
      hasValue(record, "age_policy"),
      hasValue(record, "accessibility"),
      includesAny(record.safety_plan, ["security", "medical", "crowd", "incident"]),
      includesAny(`${record.accessibility} ${record.safety_plan}`, ["accessible", "ada", "seating", "restroom", "route"])
    ]),
    business_case: scoreChecks(16, [
      hasValue(record, "revenue_model"),
      hasValue(record, "cost_model"),
      hasValue(record, "break_even"),
      hasValue(record, "ticketing"),
      hasValue(record, "sponsor_or_partner_value"),
      !categoryChecks || hasCategorySignal(businessText, categoryChecks.business_terms)
    ]),
    marketing_community: scoreChecks(10, [
      hasValue(record, "marketing_plan"),
      hasValue(record, "market_demand"),
      includesAny(record.marketing_plan, ["partner", "creator", "social", "email", "paid", "community"]),
      includesAny(record.marketing_plan, ["retention", "repeat", "follow", "subscriber", "capture"])
    ]),
    trust_realism: scoreChecks(8, [
      hasValue(record, "title") && !includesAny(record.title, ["example", "amazing", "tbd", "placeholder"]),
      hasValue(record, "venue_name") && hasValue(record, "city"),
      hasValue(record, "organizer"),
      value(record, "description").length >= 80,
      !categoryChecks || hasCategorySignal(programText, categoryChecks.program_terms)
    ]),
    measurement_plan: scoreChecks(6, [
      hasValue(record, "measurement_plan"),
      includesAny(record.measurement_plan, ["satisfaction", "nps", "survey"]),
      includesAny(record.measurement_plan, ["sales", "attendance", "check-in", "conversion", "revenue"]),
      includesAny(record.measurement_plan, ["incident", "sponsor", "repeat", "retention"]),
      !categoryChecks || hasCategorySignal(measurementText, categoryChecks.measurement_terms)
    ]),
    sustainability_ethics: scoreChecks(6, [
      includesAny(`${record.safety_plan} ${record.marketing_plan}`, ["community", "neighborhood", "local"]),
      includesAny(record.accessibility, ["accessible", "ada", "accommodation", "companion", "route"]),
      includesAny(`${record.cost_model} ${record.safety_plan}`, ["vendor", "staff", "labor", "security"]),
      includesAny(`${record.safety_plan} ${record.marketing_plan}`, ["transit", "rideshare", "waste", "cleanup", "transport"])
    ])
  };

  const score = Object.values(criteriaScores).reduce((sum, value) => sum + value, 0);
  const allFindings = [...findings, ...businessCaseFindings, ...realismFindings, ...safetyAccessibilityFindings];
  const status = remediationStatus(score, missingFields, missingCredits, allFindings, rubric);
  const declaredAssessmentStatus = value(record, "assessment_status") || null;
  const statusMismatch = Boolean(declaredAssessmentStatus && declaredAssessmentStatus !== status);

  return {
    event_id: record.id || null,
    title: record.title || null,
    category: record.category || null,
    score,
    score_band: scoreBand(score, rubric),
    status,
    declared_assessment_status: declaredAssessmentStatus,
    status_mismatch: statusMismatch,
    missing_fields: missingFields,
    missing_credit_groups: missingCredits,
    criteria_scores: criteriaScores,
    findings,
    temporal_findings: timing.findings,
    business_case_findings: businessCaseFindings,
    realism_findings: realismFindings,
    safety_accessibility_findings: safetyAccessibilityFindings,
    rewrite_prompt: categoryChecks?.rewrite_prompt ?? null,
    business_case_prompt: categoryChecks?.business_case_prompt ?? null,
    recommended_changes: [
      ...missingFields.map((field) => `Add ${field}.`),
      ...missingCredits.map((group) => `Add at least one credit with role ${group}.`),
      ...allFindings
    ]
  };
}

function countBy(items, keyForItem) {
  return items.reduce((counts, item) => {
    const key = keyForItem(item) || "unknown";
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});
}

function averageScoresByCategory(assessments) {
  const grouped = assessments.reduce((groups, assessment) => {
    const category = assessment.category || "unknown";
    groups[category] ??= [];
    groups[category].push(assessment.score);
    return groups;
  }, {});

  return Object.fromEntries(
    Object.entries(grouped).map(([category, scores]) => [
      category,
      Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
    ])
  );
}

function statusCountsByCategory(assessments) {
  return assessments.reduce((groups, assessment) => {
    const category = assessment.category || "unknown";
    groups[category] ??= {};
    groups[category][assessment.status] = (groups[category][assessment.status] ?? 0) + 1;
    return groups;
  }, {});
}

function summarizeAssessments(assessments, source) {
  return {
    assessed_at: new Date().toISOString(),
    source,
    count: assessments.length,
    average_score:
      assessments.length === 0
        ? 0
        : Math.round(assessments.reduce((sum, assessment) => sum + assessment.score, 0) / assessments.length),
    status_counts: countBy(assessments, (assessment) => assessment.status),
    category_counts: countBy(assessments, (assessment) => assessment.category),
    status_counts_by_category: statusCountsByCategory(assessments),
    average_score_by_category: averageScoresByCategory(assessments),
    status_mismatch_count: assessments.filter((assessment) => assessment.status_mismatch).length,
    temporal_findings_count: assessments.reduce((sum, assessment) => sum + assessment.temporal_findings.length, 0),
    remediation_count: assessments.filter((assessment) => assessment.status !== "publish").length
  };
}

export function assessRecords(records, rubric, source = "records", options = {}) {
  const assessments = records.map((record) => assessEvent(record, rubric, options));
  return {
    summary: summarizeAssessments(assessments, source),
    assessments
  };
}

function csvCell(value) {
  const text = Array.isArray(value) ? value.join(" | ") : String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

export function assessmentsToCsv(assessments) {
  const headers = [
    "event_id",
    "title",
    "category",
    "score",
    "score_band",
    "status",
    "declared_assessment_status",
    "status_mismatch",
    "missing_fields",
    "missing_credit_groups",
    "temporal_findings",
    "business_case_findings",
    "realism_findings",
    "safety_accessibility_findings",
    "rewrite_prompt",
    "business_case_prompt",
    "recommended_changes"
  ];
  const rows = assessments.map((assessment) =>
    headers
      .map((header) => {
        if (header === "recommended_changes") return csvCell(assessment.recommended_changes);
        return csvCell(assessment[header]);
      })
      .join(",")
  );
  return `${headers.join(",")}\n${rows.join("\n")}${rows.length > 0 ? "\n" : ""}`;
}

export function runCli(argv = process.argv) {
  const [, , csvPath, rubricPath = DEFAULT_RUBRIC, outputPath, remediationCsvPath] = argv;
  if (!csvPath) usage();

  const rubric = JSON.parse(readText(rubricPath));
  const records = parseCsv(readText(csvPath));
  const result = assessRecords(records, rubric, csvPath);
  const json = `${JSON.stringify(result, null, 2)}\n`;

  if (outputPath) {
    fs.writeFileSync(path.resolve(outputPath), json);
  } else {
    process.stdout.write(json);
  }

  if (remediationCsvPath) {
    fs.writeFileSync(path.resolve(remediationCsvPath), assessmentsToCsv(result.assessments));
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  runCli();
}
