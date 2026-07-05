import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Policy · Battarbox" };

export default function PrivacyPage() {
  return (
    <>
      <h1>Privacy Policy</h1>
      <p className="updated">Version 2026-07-02-draft · Last updated July 2, 2026</p>

      <h2>1. What we collect</h2>
      <ul>
        <li>
          <strong>Account data:</strong> email address and password hash (managed by Supabase Auth).
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
        <li>
          <strong>Invites:</strong> if you invite a friend, we store the invitee email address, invite status, and
          timestamps so we can send and manage the invitation.
        </li>
        <li>
          <strong>Advertising data:</strong> if ads are enabled, third-party vendors including Google may use cookies,
          web beacons, IP addresses, or similar technologies to serve, measure, personalize, and protect ads.
        </li>
      </ul>

      <h2>2. What we do with it</h2>
      <p>
        We use your data to run barter discovery (matching, distance filters, search), messaging, safety features
        (blocks, reports, moderation), invites, platform support payments, and clearly labeled advertising placements
        when enabled. We do not sell personal data or use your content to train AI models.
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
        We rely on Supabase (database, authentication, storage), Stripe (payments), Resend (transactional email), and,
        when advertising is enabled, Google AdSense (ad serving and measurement). Each processes data under its own
        terms and safeguards.
      </p>

      <h2>5. Ads, cookies, and consent</h2>
      <p>
        Ads, when enabled, are labeled and may be served by Google AdSense. Google and its partners may use cookies or
        other local storage to serve ads, limit repeated ads, measure performance, detect invalid traffic, and
        personalize ads where allowed. Users in regions requiring consent, including the EEA, UK, and Switzerland, must
        be given legally required disclosures and choices before personalized ad processing.
      </p>
      <p>
        Third-party vendors, including Google, use cookies to serve ads based on a user's prior visits to Battarbox or
        other websites. Google's use of advertising cookies enables it and its partners to serve ads based on visits to
        Battarbox and/or other sites on the Internet. Users may opt out of personalized advertising through Google's
        Ads Settings. If third-party ad serving is enabled beyond Google, those vendors or ad networks may also place
        and read cookies or use web beacons, and they will be disclosed where required.
      </p>

      <h2>6. Retention and deletion</h2>
      <p>
        Deleting your account permanently removes your profile, posts, photos, offers, messages, saves, follows, and
        blocks through database cascades. Invite records, moderation records, and webhook records of payments may be
        retained as required for safety, abuse prevention, audit, and nonprofit accounting. Backups age out on the
        infrastructure provider's schedule.
      </p>

      <h2>7. Your rights</h2>
      <p>
        You can view and edit your profile in Settings, export your content by request, and delete your account
        yourself. Depending on your jurisdiction you may have additional rights (access, correction, portability,
        erasure); contact OMS2 to exercise them.
      </p>

      <h2>8. Security</h2>
      <p>
        Every application table is protected by row-level security; precise coordinates are excluded from all
        client-readable queries; payment webhooks are signature-verified; sessions use industry-standard encrypted
        cookies. No system is perfectly secure — report vulnerabilities via SECURITY.md in the project repository.
      </p>

      <h2>9. Children</h2>
      <p>Battarbox is for adults 18+. We do not knowingly collect data from minors and delete such accounts.</p>

      <h2>10. Changes and contact</h2>
      <p>
        Material changes to this policy will be announced in-app and require renewed acceptance. Questions: contact
        OMS2 at the address published on the project repository.
      </p>
    </>
  );
}
