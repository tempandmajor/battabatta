# AdSense Compliance Checklist

This is an implementation checklist. Verify the current Google AdSense and Google Publisher Policies before enabling ads.

## Launch Gates

- Keep `NEXT_PUBLIC_ADS_ENABLED=false` until the site is approved in AdSense.
- If serving users in the EEA, UK, or Switzerland, set `NEXT_PUBLIC_SERVE_EEA_UK_CH=true` and do not enable ads until a Google-certified CMP is live and `NEXT_PUBLIC_ADSENSE_CMP_READY=true`.
- Add the AdSense publisher client ID and in-feed slot ID only after creating the approved in-feed unit.
- Confirm `/ads.txt` returns the publisher line after ads are enabled.
- Set `NEXT_PUBLIC_SITE_URL` to the exact production HTTPS origin before domain review.
- Confirm the production CSP allows the Google ad script, frames, images, and network calls before enabling ads.
- Launch with enough original public listings/profiles for Google to understand the site.
- Keep active moderation staffed. Public profile, post, offer, and message writes include a deterministic prohibited-content screen, but production content still needs manual review.

## Placement Rules

- Ads render only in the public discovery feed.
- Ads must not render on auth, onboarding, settings, saved posts, messages, admin, legal, support payment, post edit, or report dialog surfaces.
- Ad labels must use Google-allowed wording: `Advertisements` or `Sponsored Links`.
- Ads must not mimic member post actions, profile links, save/share controls, navigation, download links, or form controls.
- Keep conservative density: no ad before six organic posts, then roughly one ad per nine organic posts.

## Policy and Privacy

- Maintain a public privacy policy that discloses Google and third-party ad cookies, web beacons, personalization, and opt-out choices.
- Do not ask users to click ads, draw unnatural attention to ads, or place ads near heavy interaction controls.
- Do not use ads to sell ranking, boosting, or placement for member barter posts.
- Re-review if the prohibited-items policy, user-generated content moderation, location handling, or public launch posture changes.

## Official References

- Ad placement policies: https://support.google.com/adsense/answer/1346295
- Required privacy content: https://support.google.com/adsense/answer/1348695
- AdSense cookies: https://support.google.com/adsense/answer/7549925
- Consent management requirements: https://support.google.com/adsense/answer/13554116
- Program policies: https://support.google.com/adsense/answer/48182
