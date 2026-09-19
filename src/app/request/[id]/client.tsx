"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { markUnitReceivedAction } from "@/app/actions";
import Link from "next/link";

interface Props {
  request: any;
  matchAudit: any;
  notifications: any[];
}

export function RequestLiveClient({ request, matchAudit, notifications }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const isFulfilled = request.units_confirmed >= request.units_needed || request.status === "fulfilled";
  const progressPercent = Math.min(100, Math.round((request.units_confirmed / request.units_needed) * 100));

  const acceptedNotifs = notifications.filter((n) => n.status === "accepted");
  const pendingNotifs = notifications.filter((n) => n.status === "pending");
  const expiredNotifs = notifications.filter((n) => n.status === "expired");

  const handleMarkReceived = () => {
    startTransition(async () => {
      await markUnitReceivedAction(request.id);
      router.refresh();
    });
  };

  return (
    <div className="mt-6 space-y-8">
      {/* Top Banner & Status */}
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className={`badge badge-${request.urgency}`}>{request.urgency.toUpperCase()}</span>
            <span className={`badge ${isFulfilled ? "badge-success" : "badge-urgent"}`}>
              {isFulfilled ? "FULFILLED" : request.status.toUpperCase()}
            </span>
            <span className="text-xs text-muted">ID: {request.id.slice(0, 8)}</span>
          </div>

          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {request.hospital_name} — {request.patient_blood_group} Needed
          </h1>
          <p className="mt-1 text-sm text-muted">
            Requester: <strong className="text-foreground">{request.requester_name}</strong> • Needed by:{" "}
            {new Date(request.needed_by).toLocaleString("en-IN")}
          </p>
        </div>

        {/* Action Button: Mark Unit Received */}
        {!isFulfilled && (
          <button
            onClick={handleMarkReceived}
            disabled={isPending}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-crimson px-6 text-sm font-medium text-white transition-base hover:opacity-90 disabled:opacity-50"
          >
            {isPending ? "Updating..." : "Mark 1 Unit Received +"}
          </button>
        )}
      </div>

      {/* Progress Cards Grid */}
      <div className="grid gap-6 sm:grid-cols-3">
        {/* UNITS CONFIRMED PROGRESS */}
        <div className="card p-6 sm:col-span-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">
              Blood Units Fulfilled
            </span>
            <span className="text-sm font-bold text-foreground">
              {request.units_confirmed} / {request.units_needed} units
            </span>
          </div>

          {/* Progress Bar */}
          <div className="mt-3 h-3.5 w-full overflow-hidden rounded-full bg-subtle">
            <div
              className={`h-full transition-all duration-500 ${isFulfilled ? "bg-green" : "bg-crimson"}`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* AUTO-CLOSE THANK YOU STATE */}
          {isFulfilled ? (
            <div className="mt-4 rounded-xl border border-green-light bg-green-light/40 p-4 text-sm text-green-dark dark:bg-green-950/40 dark:text-green">
              <div className="font-semibold flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                Request Fulfilled — Thank You!
              </div>
              <p className="mt-1 text-xs">
                All required units have been arranged. Pending donor notifications have been automatically marked as expired with a "no longer needed, thank you" message.
              </p>
            </div>
          ) : (
            <p className="mt-3 text-xs text-muted">
              {request.units_needed - request.units_confirmed} more unit(s) required to fulfill this emergency request.
            </p>
          )}
        </div>

        {/* BATCH PROGRESS CARD */}
        <div className="card p-6 flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">Batching Progress</span>
            <div className="mt-2 text-2xl font-bold text-foreground">
              Batch 1 <span className="text-xs font-normal text-muted">({notifications.length} notified)</span>
            </div>
            <p className="mt-1 text-xs text-muted">
              Engine notified <strong className="text-foreground">{notifications.length}</strong> donors ({request.units_needed * 3} ratio, max 10 cap).
            </p>
          </div>
          <Link href="/demo" className="mt-4 text-xs font-medium text-crimson hover:underline">
            View Match Funnel in Demo Panel →
          </Link>
        </div>
      </div>

      {/* ACCEPTED DONORS & REVEALED CONTACTS */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          Accepted Donors & Contact Reveals ({acceptedNotifs.length})
        </h2>

        {acceptedNotifs.length === 0 ? (
          <div className="card p-6 text-center text-sm text-muted">
            No donors have accepted this request yet. Pending notifications sent to {pendingNotifs.length} donors.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {acceptedNotifs.map((n) => (
              <div key={n.id} className="card p-5 border-l-4 border-l-green">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="badge badge-success font-bold">{n.donor?.blood_group || "Donor"}</span>
                    <span className="text-sm font-semibold text-foreground">{n.donor?.full_name}</span>
                  </div>
                  <span className="text-xs text-muted">Accepted</span>
                </div>

                {/* PRIVACY CONTACT REVEAL BANNER */}
                <div className="mt-3 rounded-xl bg-subtle p-3 text-xs space-y-1">
                  <div className="font-semibold text-green flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-green" />
                    Contact Shared (contact_reveals audit row logged)
                  </div>
                  <div>Phone Number: <strong className="font-mono text-sm underline text-foreground">{n.donor?.phone}</strong></div>
                  <div className="text-muted text-[10px]">
                    Revealed on: {n.revealedAt ? new Date(n.revealedAt).toLocaleString("en-IN") : "Now"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* EVENT TIMELINE */}
      <div className="card p-6 space-y-4">
        <h2 className="text-base font-semibold text-foreground border-b border-border pb-2">
          Request Event Timeline
        </h2>
        <div className="space-y-4 text-xs">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 h-2 w-2 rounded-full bg-crimson" />
            <div>
              <div className="font-semibold text-foreground">Request Created</div>
              <div className="text-muted">{new Date(request.created_at).toLocaleString("en-IN")}</div>
            </div>
          </div>

          {matchAudit && (
            <div className="flex items-start gap-3">
              <span className="mt-0.5 h-2 w-2 rounded-full bg-amber-500" />
              <div>
                <div className="font-semibold text-foreground">Matching Engine Executed</div>
                <div className="text-muted">
                  Analyzed {matchAudit.total_donors_in_district} donors in district → Notified top {matchAudit.notified_count} eligible donors.
                </div>
              </div>
            </div>
          )}

          {acceptedNotifs.map((an) => (
            <div key={an.id} className="flex items-start gap-3">
              <span className="mt-0.5 h-2 w-2 rounded-full bg-green" />
              <div>
                <div className="font-semibold text-green">Donor Accepted ({an.donor?.full_name})</div>
                <div className="text-muted">
                  Contact details revealed to both parties. Audit log recorded.
                </div>
              </div>
            </div>
          ))}

          {isFulfilled && (
            <div className="flex items-start gap-3">
              <span className="mt-0.5 h-2 w-2 rounded-full bg-green" />
              <div>
                <div className="font-semibold text-green">Request Fulfilled & Closed</div>
                <div className="text-muted">All required units arranged. Remaining pending notifications expired.</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
