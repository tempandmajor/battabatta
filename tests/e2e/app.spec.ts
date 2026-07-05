import { expect, test, type Page } from "@playwright/test";

// Seeded local users (supabase/seed.sql). Password is shared.
const PASSWORD = "password123";

async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  // exact: the show-password toggle's aria-label ("Show password") also substring-matches
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/");
}

test.describe("anonymous visitor", () => {
  test("discover shows seeded posts with approximate locations only", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Discover nearby" })).toBeVisible();
    await expect(page.getByText("Weekly surplus produce box")).toBeVisible();
    await expect(page.getByText("Advertisements")).toHaveCount(0);
    // Paused member (Dev) must not appear in discovery.
    await expect(page.getByText("Python tutoring, 1:1")).toHaveCount(0);
  });

  test("search and filters narrow results", async ({ page }) => {
    await page.goto("/?q=produce");
    await expect(page.getByText("Weekly surplus produce box")).toBeVisible();
    await expect(page.getByText("Photography lessons wanted")).toHaveCount(0);
  });

  test("post cards link directly to the owner's profile", async ({ page }) => {
    await page.goto("/?q=sourdough");
    const card = page.locator("article", { hasText: "Sourdough starter + baking lesson" });
    await card.getByRole("link", { name: /Sam Okafor/i }).click();
    await page.waitForURL("**/profiles/sam");
    await expect(page.getByRole("heading", { name: "Sam Okafor" })).toBeVisible();
  });

  test("legal pages render with draft banner", async ({ page }) => {
    for (const path of ["/legal/terms", "/legal/privacy", "/legal/safety", "/legal/prohibited-items", "/legal/dmca", "/legal/tax-notice"]) {
      await page.goto(path);
      await expect(page.getByText("Draft — pending counsel review")).toBeVisible();
    }
  });

  test("unknown routes show the 404 page", async ({ page }) => {
    await page.goto("/no-such-page");
    await expect(page.getByText("This page does not exist")).toBeVisible();
  });

  test("support page explains payment boundary", async ({ page }) => {
    await page.goto("/support");
    await expect(page.getByRole("heading", { name: "Keep Battarbox free" })).toBeVisible();
    await expect(page.getByText("never pay another user for an exchange")).toBeVisible();
  });
});

test.describe("member journey", () => {
  test("sam publishes a post and it appears in discovery", async ({ page }) => {
    const title = `Cedar planter boxes ${Date.now()}`;
    await login(page, "sam@example.com");

    await page.goto("/posts/new");
    await page.getByLabel("Title").fill(title);
    await page
      .getByLabel("Description")
      .fill("Two cedar planter boxes, built this spring. Looking for seedlings or garden tools.");
    await page.getByRole("button", { name: "Publish post" }).click();
    await page.waitForURL("**/posts/**");
    await expect(page.getByRole("heading", { name: title })).toBeVisible();

    await page.goto("/");
    await expect(page.getByText(title)).toBeVisible();
  });

  test("maya sends an offer on a post and the thread opens", async ({ page }) => {
    await login(page, "maya@example.com");

    await page.goto("/?q=sourdough");
    await page.getByText("Sourdough starter + baking lesson").click();
    await page.waitForURL("**/posts/**");

    await page.getByLabel("I am offering").fill("Botanical linocut print, framed");
    await page.getByLabel("Timing").fill("Any weekend this month");
    await page.getByRole("button", { name: "Send offer" }).click();
    await page.waitForURL("**/messages/**");

    await expect(page.getByText("Battarbox does not process settlement")).toBeVisible();
    await expect(async () => {
      const message = page.getByText("Fresh print for a lively starter?");
      if ((await message.count()) === 0) {
        await page.getByPlaceholder("Write a message...").fill("Hi Sam! Fresh print for a lively starter?");
        await page.getByRole("button", { name: "Send", exact: true }).click();
        await page.waitForTimeout(1000);
      }
      await expect(message).toBeVisible({ timeout: 5000 });
    }).toPass({ timeout: 45_000 });
  });

  test("sam sees the offer and responds interested", async ({ page }) => {
    await login(page, "sam@example.com");

    await page.goto("/messages");
    await page.getByText("Maya Lindqvist").first().click();
    await page.waitForURL("**/messages/**");
    // Wait for the offer card to render before inspecting its state.
    await expect(page.getByText("Battarbox does not process settlement")).toBeVisible();

    // Click until the state changes: on a heavily loaded machine a click can
    // land before hydration and get swallowed, so re-click after a reload.
    await expect(async () => {
      const interested = page.getByRole("button", { name: "Interested" });
      if (await interested.isVisible()) {
        await interested.click();
        await page.waitForTimeout(2000);
        await page.reload();
      }
      await expect(page.getByText("marked as interested", { exact: false })).toBeVisible({ timeout: 5000 });
    }).toPass({ timeout: 60_000 });
  });

  test("saving a post adds it to Saved", async ({ page }) => {
    await login(page, "rosa@example.com");

    await page.goto("/?q=linocut");
    const card = page.locator("article", { hasText: "Botanical linocut prints, A4" });
    // The save may persist from an earlier suite run, so only click when unsaved.
    const saveToggle = card.getByRole("button", { name: /Save post|Remove from saved/ });
    await expect(saveToggle).toBeVisible();
    if ((await saveToggle.getAttribute("aria-pressed")) !== "true") {
      await saveToggle.click();
    }
    await expect(card.getByRole("button", { name: "Remove from saved" })).toBeVisible();

    await page.goto("/saved");
    await expect(page.getByText("Botanical linocut prints, A4")).toBeVisible();
  });

  test("saving from a post detail page adds it to Saved", async ({ page }) => {
    await login(page, "jordan@example.com");

    await page.goto("/?q=film camera");
    await page.getByText("Seeking a working film camera").click();
    await page.waitForURL("**/posts/**");

    // Client-side navigation updates the URL before the page streams in, so
    // wait for the save toggle to render instead of sampling isVisible().
    const saveToggle = page.getByRole("button", { name: /^(Save|Saved)$/ });
    await expect(saveToggle).toBeVisible();
    if ((await saveToggle.textContent())?.trim() === "Save") {
      await saveToggle.click();
      await expect(page.getByRole("button", { name: "Saved" })).toBeVisible();
    }

    await page.goto("/saved");
    await expect(page.getByText("Seeking a working film camera")).toBeVisible();
  });

  test("admin can open the moderation panel", async ({ page }) => {
    await login(page, "jordan@example.com");

    await page.goto("/admin");
    await expect(page.getByRole("heading", { name: "Admin" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Reports queue" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Members" })).toBeVisible();
  });

  test("non-admins cannot open the moderation panel", async ({ page }) => {
    await login(page, "sam@example.com");

    await page.goto("/admin");
    await page.waitForURL("**/");
    await expect(page.getByRole("heading", { name: "Discover nearby" })).toBeVisible();
  });

  test("members can open the invite page", async ({ page }) => {
    await login(page, "sam@example.com");

    await page.goto("/invite");
    await expect(page.getByRole("heading", { name: "Invite friends" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Send invite" })).toBeVisible();
  });

  test("reporting a post reaches moderators", async ({ page }) => {
    await login(page, "rosa@example.com");

    await page.goto("/?q=sourdough");
    await page.getByText("Sourdough starter + baking lesson").click();
    await page.waitForURL("**/posts/**");
    await expect(async () => {
      await page.getByRole("button", { name: "Report" }).click();
      await expect(page.getByLabel("What happened?")).toBeVisible({ timeout: 5000 });
    }).toPass({ timeout: 45_000 });
    await page.getByLabel("What happened?").fill("Test report from e2e suite.");
    await page.getByRole("button", { name: "Submit report" }).click();
    await expect(page.getByText("Report received")).toBeVisible();
  });

  test("blocking hides a member's posts", async ({ page }) => {
    await login(page, "jordan@example.com");

    await page.goto("/profiles/rosa");
    // Click until the state changes (see the interested-offer test). Also
    // retry-safe: a previous attempt may have left Rosa blocked.
    await expect(async () => {
      const blockButton = page.getByRole("button", { name: "Block", exact: true });
      if (await blockButton.isVisible()) {
        await blockButton.click();
        await page.waitForTimeout(2000);
        await page.reload();
      }
      await expect(page.getByText("You have blocked this member.")).toBeVisible({ timeout: 5000 });
    }).toPass({ timeout: 60_000 });

    await expect(async () => {
      await page.goto("/");
      await expect(page.getByText("Weekly surplus produce box")).toHaveCount(0, { timeout: 5000 });
    }).toPass({ timeout: 45_000 });

    // Clean up so other runs still see Rosa.
    await page.goto("/profiles/rosa");
    await expect(async () => {
      const unblockButton = page.getByRole("button", { name: "Unblock" });
      if (await unblockButton.isVisible()) {
        await unblockButton.click();
        await page.waitForTimeout(2000);
        await page.reload();
      }
      await expect(page.getByRole("button", { name: "Block", exact: true })).toBeVisible({ timeout: 5000 });
    }).toPass({ timeout: 60_000 });

    await expect(async () => {
      await page.goto("/");
      await expect(page.getByText("Weekly surplus produce box")).toBeVisible({ timeout: 5000 });
    }).toPass({ timeout: 45_000 });
  });
});
