import { createServerClient } from "@/lib/supabase/server";
import { DemoClient } from "./client";
import { BloodGroup, DonorInput } from "@/lib/matching";

export const dynamic = "force-dynamic";

// Fallback seed generator for offline demo mode
function generateFallbackDonors(): DonorInput[] {
  const bloodGroups: BloodGroup[] = ["O+", "O+", "O+", "A+", "A+", "B+", "B+", "AB+", "O-", "A-", "B-", "AB-"];
  const names = [
    "Anand V.", "Deepa Nair", "Rahul K.", "Anjali Menon", "Siddharth Shenoy",
    "Fathima Beevi", "Mathew Joseph", "Lakshmi Priya", "Gokul Das", "Neethu Thomas",
    "Vishnu Unni", "Arya Suresh", "Mohammed Razi", "Kavya Ramakrishnan", "Sarath Chandran",
  ];

  const donors: DonorInput[] = [];
  const hospitalLat = 10.0274;
  const hospitalLng = 76.3071;

  for (let i = 0; i < 150; i++) {
    const sex = i % 3 === 0 ? "F" : "M";
    const bg = bloodGroups[i % bloodGroups.length];
    const name = `${names[i % names.length]} #${i + 1}`;

    // Vary last donation date to create realistic eligibility mix
    let lastDonationDate: string | null = null;
    if (i % 5 === 0) {
      // Donated 40 days ago (ineligible)
      const d = new Date(); d.setDate(d.getDate() - 40);
      lastDonationDate = d.toISOString().split("T")[0];
    } else if (i % 5 === 1) {
      // Donated 100 days ago (male eligible, female ineligible)
      const d = new Date(); d.setDate(d.getDate() - 100);
      lastDonationDate = d.toISOString().split("T")[0];
    } else if (i % 5 === 2) {
      // Donated 180 days ago (eligible)
      const d = new Date(); d.setDate(d.getDate() - 180);
      lastDonationDate = d.toISOString().split("T")[0];
    }

    // Distance spread from hospital (0 to 30 km)
    const latOffset = (Math.random() - 0.5) * 0.3; // ~15km
    const lngOffset = (Math.random() - 0.5) * 0.3;

    // Paused donors (5% of donors)
    const isPaused = i % 20 === 0;

    donors.push({
      id: `donor-${i + 1}`,
      full_name: name,
      phone: `+919847${(100000 + i).toString()}`,
      blood_group: bg,
      sex,
      date_of_birth: i % 15 === 0 ? "2009-01-01" : "1995-05-15", // 1 under-age donor for age filter check
      lat: hospitalLat + latOffset,
      lng: hospitalLng + lngOffset,
      last_donation_date: lastDonationDate,
      is_paused: isPaused,
      paused_until: null,
      last_notified_at: i % 10 === 0 ? new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() : null, // 3h ago notification fatigue
      declined_request_ids: [],
    });
  }

  return donors;
}

export default async function DemoPage() {
  let donors: DonorInput[] = [];

  try {
    const supabase = createServerClient();

    // Fetch all donors in Ernakulam district
    const { data: rawDonors } = await supabase
      .from("donors")
      .select("*")
      .eq("district", "Ernakulam")
      .order("created_at", { ascending: true });

    // Fetch recent notifications to build fatigue protection map
    const { data: rawNotifs } = await supabase
      .from("notifications")
      .select("donor_id, sent_at, status, request_id")
      .order("sent_at", { ascending: false });

    // Build donor fatigue map
    const donorFatigueMap: Record<string, { lastNotifiedAt?: string; declinedReqs: string[] }> = {};
    for (const n of rawNotifs || []) {
      if (!donorFatigueMap[n.donor_id]) {
        donorFatigueMap[n.donor_id] = { declinedReqs: [] };
      }
      if (n.sent_at) {
        const prev = donorFatigueMap[n.donor_id].lastNotifiedAt;
        if (!prev || new Date(n.sent_at) > new Date(prev)) {
          donorFatigueMap[n.donor_id].lastNotifiedAt = n.sent_at;
        }
      }
      if (n.status === "declined") {
        donorFatigueMap[n.donor_id].declinedReqs.push(n.request_id);
      }
    }

    donors = (rawDonors || []).map((d) => ({
      id: d.id,
      full_name: d.full_name,
      phone: d.phone,
      blood_group: d.blood_group as BloodGroup,
      sex: d.sex,
      date_of_birth: d.date_of_birth,
      lat: d.lat,
      lng: d.lng,
      last_donation_date: d.last_donation_date,
      is_paused: d.is_paused,
      paused_until: d.paused_until,
      last_notified_at: donorFatigueMap[d.id]?.lastNotifiedAt || null,
      declined_request_ids: donorFatigueMap[d.id]?.declinedReqs || [],
    }));
  } catch (err) {
    console.warn("Supabase query error, falling back to seed dataset:", err);
  }

  // If no database donors returned, use offline seed dataset (150 donors)
  if (donors.length === 0) {
    donors = generateFallbackDonors();
  }

  return (
    <div className="py-10 sm:py-14 pb-24">
      <div className="container-main">
        {/* Header */}
        <div className="border-b border-border pb-6">
          <div className="flex items-center gap-2">
            <span className="badge badge-critical font-mono uppercase">Judges Explainability Panel</span>
            <span className="text-xs text-muted">Phase 5 Debugger</span>
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Matching Engine & Privacy Inspector
          </h1>
          <p className="mt-1 text-sm leading-relaxed text-muted max-w-2xl">
            Inspect live matching funnel execution, test canned hackathon scenarios, examine exact exclusion reasons per rule, and switch donor impersonations with 1 click.
          </p>
        </div>

        {/* Client interactive debugger */}
        <DemoClient initialDonors={donors} />
      </div>
    </div>
  );
}
