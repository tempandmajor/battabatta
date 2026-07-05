import { describe, expect, it } from "vitest";
import rubric from "../docs/product/event-assessment-rubric.json";
import { readFileSync } from "node:fs";
import { assessEvent, assessRecords, assessmentsToCsv, parseCsv } from "../scripts/assess-events.mjs";

const strongConcert = {
  id: "concert-001",
  title: "Riverfront R&B Sessions: Mara Vale Live",
  category: "concert",
  audience: "Adults 21+ who follow independent R&B and Chicago nightlife",
  promise: "An intimate live R&B bill with a headliner, opener, DJ, and late-night lounge energy.",
  start_at: "2026-09-12T20:00:00",
  end_at: "2026-09-13T01:00:00",
  timezone: "America/Chicago",
  venue_name: "Riverfront Hall",
  city: "Chicago",
  organizer: "South Loop Sounds",
  description:
    "Mara Vale headlines a seated-then-standing R&B night at Riverfront Hall with an opener, DJ transitions, VIP balcony tickets, and post-show merch signing.",
  capacity: "650",
  age_policy: "21+",
  accessibility: "ADA accessible entrance, accessible seating, companion ticketing, elevator route, and accessible restroom access.",
  program: "Doors 8 PM; DJ set 8:30 PM; opener set 9:15 PM; headliner set 10:30 PM; merch signing 11:45 PM; close 1 AM.",
  credits_json: JSON.stringify([
    { name: "Mara Vale", role: "artist", sort_order: 1 },
    { name: "DJ Sol", role: "dj", sort_order: 2 },
    { name: "South Loop Sounds", role: "producer", sort_order: 3 }
  ]),
  ticketing: "General admission, VIP balcony, and limited door tickets.",
  revenue_model: "Ticket sales, VIP balcony upgrades, merch, bar share, and local beverage sponsor.",
  cost_model: "Artist guarantee, promoter fee, venue, production, security, medical, staffing, insurance, ticketing fees, and cleanup.",
  break_even: "Break-even at 350 paid tickets after sponsor offset.",
  market_demand: "Comparable R&B events sold out 400-700 capacity rooms; artist socials and streaming data show local demand.",
  sponsor_or_partner_value: "Local beverage sponsor receives bar placement, creator content, and post-event sales report.",
  safety_plan: "Security at entry and stage, medical contact, crowd-flow lanes, incident logging, rideshare zone, and emergency exit briefing.",
  marketing_plan: "Artist socials, venue email, paid social, creator partners, retargeting, and repeat-buyer capture.",
  measurement_plan: "Ticket sell-through, check-in rate, bar and merch revenue, incident rate, satisfaction survey, and repeat-buyer capture."
};

describe("event assessor", () => {
  it("parses quoted CSV cells and embedded JSON credit arrays", () => {
    const [record] = parseCsv('id,title,credits_json\n1,"Title, With Comma","[{""name"":""Mara"",""role"":""artist""}]"\n');

    expect(record.title).toBe("Title, With Comma");
    expect(JSON.parse(record.credits_json)).toEqual([{ name: "Mara", role: "artist" }]);
  });

  it("passes a concrete concert with artist credits and concert economics", () => {
    const assessment = assessEvent(strongConcert, rubric);

    expect(assessment.score).toBeGreaterThanOrEqual(90);
    expect(assessment.status).toBe("publish");
    expect(assessment.missing_fields).toEqual([]);
    expect(assessment.missing_credit_groups).toEqual([]);
    expect(assessment.business_case_findings).toEqual([]);
    expect(assessment.realism_findings).toEqual([]);
    expect(assessment.rewrite_prompt).toContain("headliner");
    expect(assessment.business_case_prompt).toContain("ticket tiers");
  });

  it("flags a concert with no artist or producer credits", () => {
    const assessment = assessEvent(
      {
        ...strongConcert,
        credits_json: JSON.stringify([{ name: "Venue Host", role: "host", sort_order: 1 }])
      },
      rubric
    );

    expect(assessment.missing_credit_groups).toContain("artist|band|musician|dj");
    expect(assessment.missing_credit_groups).toContain("producer");
    expect(assessment.status).not.toBe("publish");
  });

  it("flags when an exported admin assessment status disagrees with the computed status", () => {
    const assessment = assessEvent(
      {
        ...strongConcert,
        assessment_status: "publish",
        credits_json: JSON.stringify([{ name: "Venue Host", role: "host", sort_order: 1 }])
      },
      rubric
    );

    expect(assessment.status).toBe("rebuild");
    expect(assessment.declared_assessment_status).toBe("publish");
    expect(assessment.status_mismatch).toBe(true);
  });

  it("does not flag a status mismatch when the exported status matches", () => {
    const assessment = assessEvent({ ...strongConcert, assessment_status: "publish" }, rubric);

    expect(assessment.status).toBe("publish");
    expect(assessment.declared_assessment_status).toBe("publish");
    expect(assessment.status_mismatch).toBe(false);
  });

  it("flags category-specific business and program gaps for competitions", () => {
    const assessment = assessEvent(
      {
        ...strongConcert,
        id: "competition-001",
        title: "Citywide Talent Finals",
        category: "competition",
        program: "Doors open at 7 PM with performances throughout the evening.",
        credits_json: JSON.stringify([
          { name: "Avery Lee", role: "host", sort_order: 1 },
          { name: "Morgan Judge", role: "judge", sort_order: 2 },
          { name: "StageWorks", role: "producer", sort_order: 3 }
        ]),
        ticketing: "Entry packages at two price levels.",
        revenue_model: "Door income and concessions.",
        cost_model: "Venue, staffing, production, insurance, and cleanup.",
        break_even: "Break-even at 300 paid entries.",
        sponsor_or_partner_value: "Brand visibility after the event.",
        measurement_plan: "Attendance, satisfaction survey, and sponsor recap."
      },
      rubric
    );

    expect(assessment.realism_findings.join(" ")).toContain("Competitions need eligibility");
    expect(assessment.business_case_findings.join(" ")).toContain("competition business case");
    expect(assessment.business_case_findings.join(" ")).toContain("measurement plan");
    expect(assessment.status).not.toBe("publish");
  });

  it("flags invalid date order and invalid timezone", () => {
    const assessment = assessEvent(
      {
        ...strongConcert,
        start_at: "2026-09-13T01:00:00",
        end_at: "2026-09-12T20:00:00",
        timezone: "Not/AZone"
      },
      rubric
    );

    expect(assessment.temporal_findings).toContain("end_at must be after start_at.");
    expect(assessment.temporal_findings).toContain("timezone must be a valid IANA timezone.");
    expect(assessment.criteria_scores.operational_readiness).toBeLessThan(14);
    expect(assessment.status).not.toBe("publish");
  });

  it("flags already-ended events against the assessment date", () => {
    const assessment = assessEvent(
      {
        ...strongConcert,
        start_at: "2026-01-10T20:00:00",
        end_at: "2026-01-10T23:00:00"
      },
      rubric,
      { assessmentDate: "2026-07-05T00:00:00Z" }
    );

    expect(assessment.temporal_findings).toContain("Event has already ended; archive it or reassess with post-event metrics.");
    expect(assessment.status).not.toBe("publish");
  });

  it("formats remediation assessments as an admin-friendly CSV", () => {
    const assessment = assessEvent(
      {
        ...strongConcert,
        title: "Amazing Placeholder Concert",
        description: "Short."
      },
      rubric
    );
    const csv = assessmentsToCsv([assessment]);
    const [header, row] = csv.trim().split("\n");

    expect(header).toContain("event_id,title,category,score");
    expect(header).toContain("declared_assessment_status,status_mismatch");
    expect(header).toContain("temporal_findings");
    expect(row).toContain('"concert-001"');
    expect(row).toContain('"Amazing Placeholder Concert"');
    expect(row).toContain("Title appears generic or placeholder.");
    expect(row).toContain("Description is too thin to feel like a real event.");
    expect(row).toContain("Rewrite as a concert listing");
    expect(row).toContain("Build the business case around ticket tiers");
  });

  it("keeps the realistic core event examples publish-ready", () => {
    const records = parseCsv(readFileSync("docs/product/event-example-records.csv", "utf8"));
    const report = assessRecords(records, rubric, "docs/product/event-example-records.csv");

    expect(report.summary.count).toBe(6);
    expect(report.summary.status_counts).toEqual({ publish: 6 });
    expect(report.summary.category_counts).toEqual({
      conference: 1,
      concert: 1,
      circuit_party: 1,
      play: 1,
      competition: 1,
      festival: 1
    });
    expect(report.summary.status_mismatch_count).toBe(0);
    expect(report.summary.temporal_findings_count).toBe(0);
    expect(report.summary.remediation_count).toBe(0);
    expect(records.map((record) => record.category)).toEqual([
      "conference",
      "concert",
      "circuit_party",
      "play",
      "competition",
      "festival"
    ]);
    for (const assessment of report.assessments) {
      expect(assessment.score).toBeGreaterThanOrEqual(90);
      expect(assessment.missing_fields).toEqual([]);
      expect(assessment.missing_credit_groups).toEqual([]);
      expect(assessment.business_case_findings).toEqual([]);
      expect(assessment.realism_findings).toEqual([]);
      expect(assessment.safety_accessibility_findings).toEqual([]);
    }
  });

  it("keeps flawed examples out of publish status with actionable findings", () => {
    const records = parseCsv(readFileSync("docs/product/event-flawed-records.csv", "utf8"));
    const report = assessRecords(records, rubric, "docs/product/event-flawed-records.csv");

    expect(report.summary.count).toBe(3);
    expect(report.summary.status_counts).toEqual({ reject: 1, rebuild: 2 });
    expect(report.summary.category_counts).toEqual({ concert: 1, competition: 1, play: 1 });
    expect(report.summary.status_counts_by_category).toEqual({
      concert: { reject: 1 },
      competition: { rebuild: 1 },
      play: { rebuild: 1 }
    });
    expect(report.summary.status_mismatch_count).toBe(0);
    expect(report.summary.remediation_count).toBe(3);
    expect(report.assessments.map((assessment) => assessment.status)).not.toContain("publish");

    const badConcert = report.assessments.find((assessment) => assessment.event_id === "bad-concert-001");
    expect(badConcert?.status).toBe("reject");
    expect(badConcert?.missing_fields.length).toBeGreaterThan(5);
    expect(badConcert?.recommended_changes.join(" ")).toContain("Add audience.");

    const badCompetition = report.assessments.find((assessment) => assessment.event_id === "bad-competition-001");
    expect(badCompetition?.status).toBe("rebuild");
    expect(badCompetition?.missing_credit_groups).toContain("judge");
    expect(badCompetition?.realism_findings.join(" ")).toContain("Competitions need eligibility");

    const badPlay = report.assessments.find((assessment) => assessment.event_id === "bad-play-001");
    expect(badPlay?.status).toBe("rebuild");
    expect(badPlay?.missing_credit_groups).toContain("cast");
    expect(badPlay?.realism_findings.join(" ")).toContain("Plays need cast");
  });
});
