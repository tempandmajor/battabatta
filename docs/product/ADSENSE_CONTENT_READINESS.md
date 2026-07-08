# AdSense Content Readiness

Use this checklist before adding the production domain in AdSense.

## Public Content Targets

- Keep at least 30 real, active public posts visible to anonymous visitors.
- Keep at least 10 real member profiles with bios, approximate locations, interests, and active posts.
- Maintain a mix of goods, services, offering, seeking, local, and online posts so filters do not look empty.
- Add only original profile/post photos that the member owns or has permission to use.
- Avoid placeholder text, duplicated posts, copied marketplace listings, and generic filler.

## Friend Onboarding Sprint

Ten friends can materially improve approval readiness if they create genuine accounts and posts.

- Each friend should control their own account and confirm they are 18+.
- Each friend should complete a profile with a real display name, short bio, approximate location, and interests.
- Ask each friend for 2-3 real posts they would genuinely barter.
- Review every profile, post, and image before AdSense submission.
- Help friends write clearer posts, but do not create fake accounts or invented listings.

## Launch Content Import Workflow

The launch import workflow stages content for admin review only. It does not create live accounts, set passwords, accept legal terms, or publish posts for friends.

1. Extract the DOCX into structured JSON:

   ```bash
   node scripts/extract-launch-content.mjs ~/Downloads/Battarbox_10_Accounts_40_Posts.docx > /tmp/battarbox-launch-content.json
   ```

2. Import the JSON into the admin staging tables:

   ```bash
   npm run launch:import -- /tmp/battarbox-launch-content.json
   ```

3. Open `/admin` and review Launch content staging.
4. Mark each profile and post as first batch, later batch, needs edits, or staged.
5. Send real invites to friends and have each friend create their own account, confirm email, accept terms, and publish reviewed first-batch posts.

## Hosted Live Seed Workflow

If you intentionally need the temporary-password live seed path for project `bjmjpwvstlaccflabwjv`, keep it isolated from local Docker env:

1. Copy `.env.hosted.example` to `.env.hosted.local`.
2. Add the hosted service-role key.
3. Run:

   ```bash
   npm run launch:seed-live:hosted -- ~/Downloads/Battarbox_10_Accounts_40_Posts.docx
   ```

The script will refuse to run unless the env resolves to hosted project ref `bjmjpwvstlaccflabwjv`.

## Post Quality Checklist

Each public post should answer:

- What exactly is offered or requested?
- What condition, skill level, size, quantity, or timing matters?
- Is it local, online, or both?
- What would make the trade fair?
- Is it free of exact addresses, private contact details, money requests, and prohibited categories?

## Manual Policy Audit

Before submission, review all public content for:

- Weapons, firearms, ammunition, explosives, or weapon accessories.
- Drugs, cannabis, CBD, THC, paraphernalia, prescription products, or regulated medical claims.
- Alcohol, tobacco, nicotine, vaping products, adult services, explicit sexual content, or unsafe personal services.
- Financial products, stored value, gift cards, crypto, money transfers, gambling, raffles, or sweepstakes.
- Counterfeit goods, recalled goods, stolen goods, hate/extremism, illegal activity, or harassment.

Also correct any existing production listing that has mismatched content before inviting new members. The July 8 launch document specifically calls out a public real-estate listing with unrelated MVP-planning text and incorrect `Can give` content; fix or hide that listing before importing friend content.

Ads should stay disabled until AdSense approval is complete.
