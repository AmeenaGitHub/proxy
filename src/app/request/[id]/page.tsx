import { createServerClient } from "@/lib/supabase/server";
import { redactDonor, maskPhone, maskName } from "@/lib/privacy";
import { notFound } from "next/navigation";
import Link from "next/link";
import { RequestLiveClient } from "./client";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function RequestDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = createServerClient();

  // Fetch request record
  const { data: request } = await supabase
    .from("blood_requests")
    .select("*")
    .eq("id", id)
    .single();

  if (!request) {
    notFound();
  }

  // Fetch match audit row for explainability & batch summary
  const { data: audit } = await supabase
    .from("match_audit")
    .select("*")
    .eq("request_id", id)
    .order("computed_at", { ascending: false })
    .limit(1)
    .single();

  // Fetch notifications for this request with donor details
  const { data: notifications } = await supabase
    .from("notifications")
    .select(`
      id,
      donor_id,
      sent_at,
      status,
      responded_at,
      decline_reason,
      donors (
        id,
        full_name,
        phone,
        blood_group,
        sex,
        district,
        ward_name
      )
    `)
    .eq("request_id", id)
    .order("sent_at", { ascending: true });

  // Fetch contact reveals to strictly enforce privacy rule
  const { data: reveals } = await supabase
    .from("contact_reveals")
    .select("donor_id, revealed_at")
    .eq("request_id", id);

  const revealedDonorsMap = new Map(reveals?.map((r) => [r.donor_id, r.revealed_at]));

  // Redact donor phone numbers server-side unless a contact_reveals row exists
  const sanitizedNotifications = (notifications || []).map((n) => {
    const rawDonor = Array.isArray(n.donors) ? n.donors[0] : n.donors;
    const isRevealed = rawDonor ? revealedDonorsMap.has(rawDonor.id) : false;
    const revealedAt = rawDonor ? revealedDonorsMap.get(rawDonor.id) : null;

    const sanitizedDonor = rawDonor
      ? redactDonor(
          {
            ...rawDonor,
            date_of_birth: "1995-01-01", // Default if omitted
            pincode: "682001",
          },
          isRevealed
        )
      : null;

    return {
      ...n,
      donor: sanitizedDonor,
      isRevealed,
      revealedAt,
    };
  });

  return (
    <div className="py-10 sm:py-14">
      <div className="container-main">
        <Link href="/" className="text-sm text-muted transition-base hover:text-foreground">
          ← Back to home
        </Link>

        <RequestLiveClient
          request={request}
          matchAudit={audit}
          notifications={sanitizedNotifications}
        />
      </div>
    </div>
  );
}
