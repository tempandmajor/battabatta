import { describe, expect, it } from "vitest";
import { normalizeAvailability, parseLaunchContentText, slug } from "../scripts/lib/launch-content.mjs";

const SAMPLE = `
1. Dayo Adegbola — Freelance writer
Private setup email
Partyboyzchi@gmail.com
Suggested public role
Freelance writer
Suggested profile bio
Freelance writer helping small businesses communicate clearly.

Post 1: I can write a clear, useful blog article for your project
Post type
Offering
Category
Services
Location mode
Online
Availability
1 of 1 slot available this month
Approval
Manual approval required
Expiration
30 days after posting
What I can give
One original 800-1,000 word blog article.
Description: I can write an original educational blog article for your project.
What I am looking for in exchange: Website feedback or another clearly defined non-monetary service.
Scope and safety note: No plagiarism or fake reviews.
Suggested images: A writing sample Dayo owns.

Post 2: I can turn your topic into a structured SEO-friendly article outline
Post type
Offering
Category
Services
Location mode
Online
Availability
2 of 2 outline slots available this month
Approval
Manual approval required
Expiration
30 days after posting
What I can give
A detailed article outline.
Description: I can turn your topic into a practical writing plan.
What I am looking for in exchange: A 30-minute skill exchange.
Scope and safety note: No ranking guarantees.
Suggested images: A sample outline.
`;

describe("launch content parsing", () => {
  it("normalizes handles and availability from the launch document", () => {
    expect(slug("Dayo Adegbola")).toBe("dayo_adegbola");
    expect(normalizeAvailability("2 of 2 outline slots available this month")).toEqual({
      total: 2,
      unit: "outline slots this month"
    });
  });

  it("splits first-batch and later-batch posts from launch text", () => {
    const payload = parseLaunchContentText(SAMPLE);
    expect(payload.accounts).toHaveLength(1);
    expect(payload.accounts[0]?.setupEmail).toBe("partyboyzchi@gmail.com");
    expect(payload.accounts[0]?.posts).toHaveLength(2);
    expect(payload.accounts[0]?.posts[0]).toMatchObject({
      batch: 1,
      kind: "offering",
      category: "services",
      lookingFor: "Website feedback or another clearly defined non-monetary service."
    });
    expect(payload.accounts[0]?.posts[0]?.body).toContain("Scope note: No plagiarism or fake reviews.");
    expect(payload.accounts[0]?.posts[1]?.availabilityUnit).toBe("outline slots this month");
  });
});
