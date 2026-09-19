import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Model — Proximo.",
  description: "How Proximo. protects donor and requester privacy at every step.",
};

const sections = [
  {
    id: "principle",
    title: "Core Principle",
    content: `Proximo. is built on one rule: **no personal contact information is ever shared until a donor explicitly accepts a blood request.** There is no public donor directory, no donor search, and no way to browse donor profiles. A donor is only ever reachable through a specific request they chose to respond to.`,
  },
  {
    id: "collected",
    title: "What Data We Collect",
    items: [
      "**Donors**: Full name, phone number, blood group, sex, date of birth, pincode, ward, district, and approximate location (latitude/longitude).",
      "**Requesters**: Name, phone number, patient blood group, hospital details, units needed, and urgency level.",
      "We collect the minimum data needed to match a blood request to compatible, eligible, nearby donors.",
    ],
  },
  {
    id: "matching",
    title: "How Matching Works Without Exposing Data",
    items: [
      "When a request is created, our matching engine runs **server-side**. It filters donors by blood compatibility, donation eligibility intervals, age, distance, and fatigue rules — all without revealing any donor information to the requester.",
      "Eligible donors are notified **in small batches** (not broadcast to everyone). This prevents the notification spam that plagues WhatsApp-based blood drives.",
      "A donor sees limited request details: blood group needed, hospital name, urgency, and distance. **The requester's phone number is hidden.**",
    ],
  },
  {
    id: "reveal",
    title: "When Contact Details Are Shared",
    items: [
      "Contact details are shared **only** after a donor taps \"Accept\" on a specific request.",
      "At that point, a **contact_reveals** audit record is created in our database, logging exactly when and between whom details were shared.",
      "Both parties — the donor and the requester — then see each other's full name and phone number, along with a banner stating when the contact was revealed.",
      "**No API endpoint, server action, or page response ever includes an unmasked phone number without a corresponding contact_reveals record.**",
    ],
  },
  {
    id: "redaction",
    title: "Phone Number Redaction",
    items: [
      "By default, all phone numbers are displayed in a masked format: **+91 9●●●●● ●●23** (first and last two digits visible).",
      "Surnames are shortened to an initial (e.g. \"Arun K.\") until contact is revealed.",
      "This redaction is enforced at the data layer, not just the UI — even programmatic API access receives masked data.",
    ],
  },
  {
    id: "donor-rights",
    title: "Donor Rights",
    items: [
      "**Pause notifications**: Temporarily stop receiving requests while on holiday, recovering, or just wanting a break. Set an auto-resume date or pause indefinitely.",
      "**View your data**: See every request you were notified for, every contact reveal, your donation history, and your eligibility status.",
      "**Delete your account**: One-click account removal. Your data is purged and outstanding notifications are cancelled.",
      "**Decline without consequence**: Declining a request records the reason (for system improvement) but never penalises the donor.",
    ],
  },
  {
    id: "fatigue",
    title: "Notification Fatigue Protection",
    items: [
      "A donor who was notified for **any** request in the last 24 hours is automatically excluded from new matching rounds.",
      "Donors are notified in small batches (typically 3× the units needed, capped at 10). The system waits for responses before sending the next batch.",
      "This is the core design decision that differentiates Proximo. from broadcast-style blood request systems.",
    ],
  },
  {
    id: "audit",
    title: "Audit Trail",
    items: [
      "Every match computation is logged in a **match_audit** table with a full breakdown of how many donors were in the district, how many were excluded at each step, and why.",
      "Every contact reveal is permanently logged with timestamps.",
      "This audit trail ensures transparency and accountability.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="py-12 sm:py-16">
      <div className="container-main max-w-2xl">
        <Link href="/" className="text-sm text-muted transition-base hover:text-foreground">
          ← Back to home
        </Link>

        <h1 className="mt-6 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Privacy Model
        </h1>
        <p className="mt-2 text-base leading-relaxed text-muted">
          How Proximo. keeps donor and requester data private — by design, not by policy.
        </p>

        <div className="mt-10 space-y-10">
          {sections.map((section) => (
            <section key={section.id} id={section.id} aria-labelledby={`heading-${section.id}`}>
              <h2 id={`heading-${section.id}`} className="text-base font-semibold text-foreground">
                {section.title}
              </h2>
              {"content" in section && section.content && (
                <p
                  className="mt-2 text-sm leading-relaxed text-muted"
                  dangerouslySetInnerHTML={{
                    __html: section.content.replace(
                      /\*\*(.*?)\*\*/g,
                      '<strong class="text-foreground font-medium">$1</strong>'
                    ),
                  }}
                />
              )}
              {"items" in section && section.items && (
                <ul className="mt-3 space-y-2">
                  {section.items.map((item, i) => (
                    <li
                      key={i}
                      className="flex gap-2 text-sm leading-relaxed text-muted"
                    >
                      <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-border-strong" aria-hidden="true" />
                      <span
                        dangerouslySetInnerHTML={{
                          __html: item.replace(
                            /\*\*(.*?)\*\*/g,
                            '<strong class="text-foreground font-medium">$1</strong>'
                          ),
                        }}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        <div className="mt-12 card p-6 border-l-3 border-l-green">
          <p className="text-sm font-medium text-foreground">In summary</p>
          <p className="mt-1 text-sm leading-relaxed text-muted">
            Your phone number is never visible to anyone until you choose to accept a request.
            You can pause or delete your account at any time. Every data access is logged.
          </p>
        </div>
      </div>
    </div>
  );
}
