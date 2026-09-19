import { getSession } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase/server";
import { maskPhone, maskName } from "@/lib/privacy";
import { getNextEligibleDate } from "@/lib/matching";
import { DonorDashboardClient } from "./client";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DonorDashboardPage() {
  const session = await getSession();
  const supabase = createServerClient();

  // If logged in via session cookie, fetch full donor record
  let currentDonor = null;
  let notifications: any[] = [];
  let demoDonors: any[] = [];

  if (session?.donorId) {
    const { data: d } = await supabase
      .from("donors")
      .select("*")
      .eq("id", session.donorId)
      .single();

    if (d) {
      currentDonor = d;

      // Fetch donor notifications with request details
      const { data: notifs } = await supabase
        .from("notifications")
        .select(`
          id,
          request_id,
          sent_at,
          status,
          responded_at,
          decline_reason,
          blood_requests (
            id,
            requester_name,
            requester_phone,
            patient_blood_group,
            units_needed,
            units_confirmed,
            hospital_name,
            urgency,
            needed_by,
            status,
            notes
          )
        `)
        .eq("donor_id", d.id)
        .order("sent_at", { ascending: false });

      // Fetch contact reveals to check which requests reveal full phone
      const { data: reveals } = await supabase
        .from("contact_reveals")
        .select("request_id, revealed_at")
        .eq("donor_id", d.id);

      const revealedReqMap = new Map(reveals?.map((r) => [r.request_id, r.revealed_at]));

      notifications = (notifs || []).map((n) => {
        const req = Array.isArray(n.blood_requests) ? n.blood_requests[0] : n.blood_requests;
        const revealedAt = req ? revealedReqMap.get(req.id) : null;
        // Requester contact is masked on the server until this donor accepts
        const safeReq = req && !revealedAt
          ? {
              ...req,
              requester_name: maskName(req.requester_name),
              requester_phone: maskPhone(req.requester_phone),
            }
          : req;
        return {
          ...n,
          blood_requests: safeReq,
          isRevealed: !!revealedAt,
          revealedAt,
        };
      });
    }
  }

  // If no session, fetch a demo donor from Supabase so judges can impersonate immediately!
  if (!currentDonor) {
    const { data: list } = await supabase
      .from("donors")
      .select("id, full_name, phone, blood_group, district")
      .limit(8);
    demoDonors = list || [];
  }

  return (
    <div className="py-10 sm:py-14">
      <div className="container-main">
        {/* Header */}
        <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="badge badge-success">Donor Portal</span>
              {currentDonor && (
                <span className="text-xs text-muted">
                  Phone: <strong className="font-mono text-foreground">{currentDonor.phone}</strong>
                </span>
              )}
            </div>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {currentDonor ? `Welcome, ${currentDonor.full_name}` : "Donor Dashboard"}
            </h1>
          </div>

          {!currentDonor && (
            <Link
              href="/join"
              className="inline-flex h-10 items-center justify-center rounded-xl bg-crimson px-5 text-sm font-medium text-white transition-base hover:opacity-90"
            >
              Register as Donor →
            </Link>
          )}
        </div>

        {/* Client component for interactive dashboard & impersonation switcher */}
        <DonorDashboardClient
          currentDonor={currentDonor}
          notifications={notifications}
          demoDonors={demoDonors}
        />
      </div>
    </div>
  );
}
