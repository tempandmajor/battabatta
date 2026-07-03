import type { Metadata } from "next";

export const metadata: Metadata = { title: "Copyright & DMCA · BattaBatta" };

export default function DmcaPage() {
  return (
    <>
      <h1>Copyright &amp; DMCA Policy</h1>
      <p className="updated">Version 2026-07-02-draft · Last updated July 2, 2026</p>

      <h2>Reporting infringement</h2>
      <p>
        If you believe content on BattaBatta infringes your copyright, send a takedown notice to OMS2's designated
        agent at the contact address published on the project repository. A valid notice includes:
      </p>
      <ul>
        <li>Identification of the copyrighted work claimed to be infringed.</li>
        <li>The URL or sufficient description of the infringing material on BattaBatta.</li>
        <li>Your name, address, email, and (if applicable) authority to act for the rights holder.</li>
        <li>A statement of good-faith belief that the use is not authorized.</li>
        <li>A statement, under penalty of perjury, that the notice is accurate.</li>
        <li>Your physical or electronic signature.</li>
      </ul>

      <h2>What happens next</h2>
      <p>
        We remove or disable access to the identified material promptly, notify the member who posted it, and record
        the takedown. Members may submit a counter-notice with the elements required by 17 U.S.C. §512(g); if we
        receive one, we may restore the material after 10-14 business days unless the claimant files a court action.
      </p>

      <h2>Repeat infringers</h2>
      <p>Accounts that repeatedly infringe are terminated.</p>

      <h2>Trademarks</h2>
      <p>
        The BattaBatta name, logos, icons, and brand assets are trademarks or reserved brand assets of OMS2 and are
        not licensed for unrelated products, even though the software itself is MIT licensed. See
        TRADEMARK_POLICY.md in the repository.
      </p>
    </>
  );
}
