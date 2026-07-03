import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Policy · BattaBatta" };

export default function PrivacyPage() {
  return (
    <>
      <h1>Privacy Policy</h1>
      <p className="updated">Version 2026-07-02-draft · Last updated July 2, 2026</p>

      <h2>1. What we collect</h2>
      <ul>
        <li>
          <strong>Account data:</strong> email address, password hash (managed by Supabase Auth), and optional GitHub
          OAuth identity.
        </li>
        <li>
          <strong>Profile data you publish:</strong> display name, handle, bio, interests, profile photo, an
          approximate location label you write yourself, and your local/online preference.
        </li>
        <li>
          <strong>Precise location (optional):</strong> if you tap “Use my current location,” we store your
          coordinates privately to power distance filters. They are never shown to anyone — other members only ever
          see bucketed distances such as “1-5 mi.”
        </li>
        <li>
          <strong>Activity:</strong> posts, photos, offers, messages, saves, follows, blocks, reports, and legal
          consents (with document versions).
        </li>
        <li>
          <strong>Payments:</strong> if you donate or subscribe, Stripe processes your payment. We store only your
          Stripe customer reference, subscription status, and donation amounts — never card numbers.
        </li>
      </ul>

      <h2>2. What we do with it</h2>
      <p>
        We use your data to run barter discovery (matching, distance filters, search), messaging, safety features
        (blocks, reports, moderation), and platform support payments. We do not sell personal data, run third-party
        advertising, or use your content to train AI models.
      </p>

      <h2>3. Who can see what</h2>
      <ul>
        <li>
          <strong>Public:</strong> your profile (name, handle, bio, photo, interests, approximate location label,
          follower counts) and your active posts.
        </li>
        <li>
          <strong>Participants only:</strong> offers, offer history, and messages are visible only to the two members
          in the thread, enforced by database row-level security.
        </li>
        <li>
          <strong>Only you:</strong> precise coordinates, email, saved posts, block list, donation history, and legal
          consents.
        </li>
        <li>
          <strong>Moderators:</strong> reports and reported content, for review.
        </li>
      </ul>

      <h2>4. Processors</h2>
      <p>
        We rely on Supabase (database, authentication, storage) and Stripe (payments). Each processes data under its
        own terms and safeguards.
      </p>

      <h2>5. Retention and deletion</h2>
      <p>
        Deleting your account permanently removes your profile, posts, photos, offers, messages, saves, follows, and
        blocks through database cascades. Webhook records of payments are retained as required for nonprofit
        accounting. Backups age out on the infrastructure provider's schedule.
      </p>

      <h2>6. Your rights</h2>
      <p>
        You can view and edit your profile in Settings, export your content by request, and delete your account
        yourself. Depending on your jurisdiction you may have additional rights (access, correction, portability,
        erasure); contact OMS2 to exercise them.
      </p>

      <h2>7. Security</h2>
      <p>
        Every application table is protected by row-level security; precise coordinates are excluded from all
        client-readable queries; payment webhooks are signature-verified; sessions use industry-standard encrypted
        cookies. No system is perfectly secure — report vulnerabilities via SECURITY.md in the project repository.
      </p>

      <h2>8. Children</h2>
      <p>BattaBatta is for adults 18+. We do not knowingly collect data from minors and delete such accounts.</p>

      <h2>9. Changes and contact</h2>
      <p>
        Material changes to this policy will be announced in-app and require renewed acceptance. Questions: contact
        OMS2 at the address published on the project repository.
      </p>
    </>
  );
}
