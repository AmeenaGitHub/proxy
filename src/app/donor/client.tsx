"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  respondToNotificationAction,
  togglePauseDonorAction,
  deleteDonorAccountAction,
  loginDonorByPhoneAction,
  logoutAction,
} from "@/app/actions";
import { getNextEligibleDate, Sex } from "@/lib/matching";

interface Props {
  currentDonor: any;
  notifications: any[];
  demoDonors: any[];
}

export function DonorDashboardClient({ currentDonor, notifications, demoDonors }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Phone login modal / impersonation switcher
  const [phoneInput, setPhoneInput] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);

  // Decline reason modal state
  const [declineModalNotifId, setDeclineModalNotifId] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState("Not feeling well");

  // Pause state modal / inputs
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [pauseUntilDate, setPauseUntilDate] = useState("");

  if (!currentDonor) {
    return (
      <div className="mt-8 space-y-8">
        <div className="card p-8 text-center max-w-lg mx-auto">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-subtle text-muted mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-foreground">Sign In to Your Donor Profile</h2>
          <p className="mt-2 text-sm text-muted">
            Enter your 10-digit mobile number or pick a seeded donor below to impersonate for demo judging.
          </p>

          {loginError && (
            <div className="mt-4 rounded-xl border border-crimson/30 bg-crimson-light/20 p-3 text-xs text-crimson">
              {loginError}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              setLoginError(null);
              startTransition(async () => {
                const res = await loginDonorByPhoneAction(phoneInput);
                if (res.success) router.refresh();
                else setLoginError(res.error || "Login failed");
              });
            }}
            className="mt-6 space-y-3"
          >
            <input
              type="tel"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              placeholder="e.g. +919847100001"
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground focus-visible:outline-crimson"
            />
            <button
              type="submit"
              disabled={isPending}
              className="w-full rounded-xl bg-crimson py-2.5 text-sm font-medium text-white transition-base hover:opacity-90 disabled:opacity-50"
            >
              {isPending ? "Signing In..." : "Sign In with Phone →"}
            </button>
          </form>

          {/* Quick Impersonation Switcher for Judges */}
          {demoDonors.length > 0 && (
            <div className="mt-8 border-t border-border pt-6 text-left">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                Judges Demo Switcher (Click to impersonate)
              </span>
              <div className="mt-3 flex flex-wrap gap-2">
                {demoDonors.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => {
                      startTransition(async () => {
                        await loginDonorByPhoneAction(d.phone);
                        router.refresh();
                      });
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-base hover:bg-surface-hover"
                  >
                    <span className="font-semibold text-crimson">{d.blood_group}</span>
                    <span>{d.full_name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Calculate donation cooldown status
  const nextEligibleDate = getNextEligibleDate(currentDonor.last_donation_date, currentDonor.sex as Sex);
  const now = new Date();
  const isEligibleToday = !nextEligibleDate || nextEligibleDate.getTime() <= now.getTime();

  let daysRemaining = 0;
  if (nextEligibleDate && !isEligibleToday) {
    daysRemaining = Math.ceil((nextEligibleDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }

  const cooldownTotalDays = currentDonor.sex === "M" ? 90 : 120;
  const progressPercent = isEligibleToday
    ? 100
    : Math.max(0, Math.min(100, Math.round(((cooldownTotalDays - daysRemaining) / cooldownTotalDays) * 100)));

  // Respond action handler
  const handleRespond = (notifId: string, status: "accepted" | "declined", reason?: string) => {
    startTransition(async () => {
      await respondToNotificationAction(notifId, status, reason);
      setDeclineModalNotifId(null);
      router.refresh();
    });
  };

  return (
    <div className="mt-8 space-y-8">
      {/* Top Bar: Profile & Switcher */}
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-crimson-light font-bold text-crimson">
            {currentDonor.blood_group}
          </div>
          <div>
            <div className="text-sm font-semibold text-foreground">{currentDonor.full_name}</div>
            <div className="text-xs text-muted">
              {currentDonor.district} • Ward: {currentDonor.ward_name || "N/A"} • Pincode: {currentDonor.pincode}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Pause Toggle Button */}
          <button
            onClick={() => {
              if (currentDonor.is_paused) {
                startTransition(async () => {
                  await togglePauseDonorAction(currentDonor.id, false);
                  router.refresh();
                });
              } else {
                setShowPauseModal(true);
              }
            }}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-base ${
              currentDonor.is_paused
                ? "border-amber-300 bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
                : "border-border bg-subtle text-foreground hover:bg-surface-hover"
            }`}
          >
            {currentDonor.is_paused ? "⏸ Paused (Click to Resume)" : "⏸ Pause Availability"}
          </button>

          <button
            onClick={() => {
              startTransition(async () => {
                await logoutAction();
                router.refresh();
              });
            }}
            className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted transition-base hover:text-foreground"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Grid: Eligibility Ring & Quick Stats */}
      <div className="grid gap-6 sm:grid-cols-3">
        {/* ELIGIBILITY COUNTDOWN RING CARD */}
        <div className="card p-6 sm:col-span-2 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                Donation Eligibility Status
              </span>
              <h2 className="mt-1 text-lg font-semibold text-foreground">
                {isEligibleToday ? "Eligible to Donate Today!" : `Next Eligible: ${daysRemaining} days left`}
              </h2>
            </div>
            <span className={`badge ${isEligibleToday ? "badge-success" : "badge-urgent"}`}>
              {isEligibleToday ? "Ready" : `${daysRemaining}d Cooldown`}
            </span>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row items-center gap-6">
            {/* Countdown Ring */}
            <div className="relative flex h-28 w-28 flex-shrink-0 items-center justify-center">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-border"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={isEligibleToday ? "text-green" : "text-crimson"}
                  strokeDasharray={`${progressPercent}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute text-center">
                <span className="text-xl font-bold tracking-tight text-foreground">
                  {isEligibleToday ? "100%" : `${progressPercent}%`}
                </span>
              </div>
            </div>

            <div className="text-sm text-muted leading-relaxed">
              <p>
                {isEligibleToday ? (
                  "You have completed your mandatory donation interval. You are currently visible to matching queries in Ernakulam district."
                ) : (
                  <>
                    NBTC India guidance enforces a <strong>{cooldownTotalDays}-day interval</strong> for{" "}
                    {currentDonor.sex === "M" ? "male" : "female"} donors. Your last recorded donation was on{" "}
                    <strong className="text-foreground">{currentDonor.last_donation_date}</strong>.
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* STATS CARD */}
        <div className="card p-6 flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">Donation History</span>
            <div className="mt-3 text-3xl font-bold tracking-tight text-foreground">
              {currentDonor.total_donations || 0}{" "}
              <span className="text-sm font-normal text-muted">total donations</span>
            </div>
          </div>
          <div className="mt-6 border-t border-border pt-4 text-xs text-muted space-y-1">
            <div>Blood Group: <strong className="text-foreground">{currentDonor.blood_group}</strong></div>
            <div>Sex: <strong className="text-foreground">{currentDonor.sex}</strong></div>
            <div>Status: <strong className={currentDonor.is_paused ? "text-amber-600" : "text-green"}>{currentDonor.is_paused ? "Paused" : "Active"}</strong></div>
          </div>
        </div>
      </div>

      {/* INCOMING REQUESTS INBOX */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            Incoming Requests Inbox ({notifications.length})
          </h2>
          <span className="text-xs text-muted">Updates in real time</span>
        </div>

        {notifications.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-sm text-muted">No active blood requests currently matched to your profile.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((n) => {
              const req = n.blood_requests;
              if (!req) return null;

              const isPendingNotif = n.status === "pending";
              const isAcceptedNotif = n.status === "accepted";
              const isDeclinedNotif = n.status === "declined";

              return (
                <div
                  key={n.id}
                  className={`card p-6 transition-base ${
                    req.urgency === "critical"
                      ? "urgency-critical"
                      : req.urgency === "urgent"
                      ? "urgency-urgent"
                      : "urgency-routine"
                  }`}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`badge badge-${req.urgency}`}>{req.urgency.toUpperCase()}</span>
                        <span className="text-xs text-muted">
                          Needs <strong className="text-foreground">{req.patient_blood_group}</strong> ({req.units_needed} units)
                        </span>
                        <span className="text-xs text-muted">• Hospital: <strong className="text-foreground">{req.hospital_name}</strong></span>
                      </div>

                      <h3 className="mt-2 text-base font-semibold text-foreground">
                        {req.hospital_name} — {req.patient_blood_group} Request
                      </h3>

                      {req.notes && <p className="mt-1 text-sm text-muted italic">"{req.notes}"</p>}

                      {/* PRIVACY CONTACT REVEAL BANNER (Rendered after Accept) */}
                      {isAcceptedNotif && n.isRevealed && (
                        <div className="mt-4 rounded-xl border border-green-light bg-green-light/40 p-4 text-sm text-green-dark dark:bg-green-950/40 dark:text-green">
                          <div className="font-semibold flex items-center gap-2">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                              <polyline points="22 4 12 14.01 9 11.01" />
                            </svg>
                            Contact Details Shared — Audit Row Logged
                          </div>
                          <div className="mt-2 text-xs space-y-1">
                            <div>Requester Name: <strong>{req.requester_name}</strong></div>
                            <div>Requester Phone: <strong className="font-mono text-sm underline">{req.requester_phone}</strong></div>
                            <div>Revealed At: <span>{new Date(n.revealedAt).toLocaleString("en-IN")}</span></div>
                          </div>
                        </div>
                      )}

                      {isDeclinedNotif && (
                        <div className="mt-3 text-xs text-amber-700 dark:text-amber-400">
                          Declined request ({n.decline_reason || "No reason specified"}). You will not be notified for this request again.
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-shrink-0 items-center gap-2">
                      {isPendingNotif && (
                        <>
                          <button
                            onClick={() => handleRespond(n.id, "accepted")}
                            disabled={isPending}
                            className="rounded-xl bg-green px-4 py-2 text-sm font-medium text-white transition-base hover:opacity-90 disabled:opacity-50"
                          >
                            Accept Request
                          </button>

                          <button
                            onClick={() => setDeclineModalNotifId(n.id)}
                            disabled={isPending}
                            className="rounded-xl border border-border px-3 py-2 text-sm text-muted transition-base hover:bg-surface-hover hover:text-foreground disabled:opacity-50"
                          >
                            Decline
                          </button>
                        </>
                      )}

                      {isAcceptedNotif && (
                        <span className="badge badge-success font-medium">✓ Request Accepted</span>
                      )}

                      {isDeclinedNotif && (
                        <span className="badge badge-routine text-muted">Declined</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Decline Reason Modal */}
      {declineModalNotifId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="card w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-foreground">Decline Request</h3>
            <p className="mt-1 text-sm text-muted">
              Declining will exclude you from this specific request without penalising your donor profile.
            </p>

            <div className="mt-4">
              <label className="block text-xs font-semibold text-muted">Reason for declining</label>
              <select
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-crimson"
              >
                <option value="Not feeling well">Not feeling well</option>
                <option value="Currently out of city / travelling">Currently out of city / travelling</option>
                <option value="Recently donated elsewhere">Recently donated elsewhere</option>
                <option value="Busy with work/family">Busy with work / family</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setDeclineModalNotifId(null)}
                className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground transition-base hover:bg-surface-hover"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRespond(declineModalNotifId, "declined", declineReason)}
                disabled={isPending}
                className="rounded-xl bg-crimson px-5 py-2 text-sm font-medium text-white transition-base hover:opacity-90 disabled:opacity-50"
              >
                Confirm Decline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pause Modal */}
      {showPauseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="card w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-foreground">Pause Availability</h3>
            <p className="mt-1 text-sm text-muted">
              You will not receive any blood request notifications while paused.
            </p>

            <div className="mt-4">
              <label className="block text-xs font-semibold text-muted">Pause until date (Optional)</label>
              <input
                type="date"
                value={pauseUntilDate}
                onChange={(e) => setPauseUntilDate(e.target.value)}
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-crimson"
              />
              <p className="mt-1 text-xs text-muted">Leave blank to pause indefinitely until manual resume.</p>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowPauseModal(false)}
                className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground transition-base hover:bg-surface-hover"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  startTransition(async () => {
                    await togglePauseDonorAction(currentDonor.id, true, pauseUntilDate || null);
                    setShowPauseModal(false);
                    router.refresh();
                  });
                }}
                disabled={isPending}
                className="rounded-xl bg-amber-600 px-5 py-2 text-sm font-medium text-white transition-base hover:opacity-90 disabled:opacity-50"
              >
                Confirm Pause
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MY DATA & ACCOUNT CONTROL */}
      <div className="border-t border-border pt-8">
        <div className="card p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Data Privacy & Account Control</h3>
            <p className="mt-1 text-xs text-muted">
              You have full control over your data. Delete your account and purge stored records anytime.
            </p>
          </div>
          <button
            onClick={() => {
              if (confirm("Are you sure you want to delete your donor account? This cannot be undone.")) {
                startTransition(async () => {
                  await deleteDonorAccountAction(currentDonor.id);
                  router.refresh();
                });
              }
            }}
            disabled={isPending}
            className="mt-4 sm:mt-0 text-xs font-medium text-crimson transition-base hover:underline disabled:opacity-50"
          >
            Delete Donor Account
          </button>
        </div>
      </div>
    </div>
  );
}
