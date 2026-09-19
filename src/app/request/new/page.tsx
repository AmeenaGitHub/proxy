"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createRequestAction } from "@/app/actions";
import { BloodGroup, Urgency } from "@/lib/matching";

const hospitals = [
  { name: "Amrita Institute of Medical Sciences", lat: 10.0274, lng: 76.3071, pincode: "682041" },
  { name: "Lakeshore Hospital", lat: 9.9825, lng: 76.3007, pincode: "682040" },
  { name: "Lisie Hospital", lat: 9.9963, lng: 76.2908, pincode: "682018" },
  { name: "Ernakulam Medical Centre", lat: 10.0096, lng: 76.3042, pincode: "682028" },
  { name: "PVS Memorial Hospital", lat: 10.0033, lng: 76.3019, pincode: "682017" },
  { name: "Aster Medcity", lat: 9.9612, lng: 76.3321, pincode: "682027" },
];

export default function NewRequestPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Selected hospital state
  const [selectedHospital, setSelectedHospital] = useState(hospitals[0]);
  const [urgency, setUrgency] = useState<Urgency>("critical");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);

    const formData = new FormData(e.currentTarget);
    formData.set("hospital_name", selectedHospital.name);
    formData.set("hospital_lat", selectedHospital.lat.toString());
    formData.set("hospital_lng", selectedHospital.lng.toString());

    startTransition(async () => {
      const res = await createRequestAction(formData);
      if (res.success && res.requestId) {
        router.push(`/request/${res.requestId}`);
      } else {
        setErrorMsg(res.error || "Failed to create request.");
      }
    });
  };

  return (
    <div className="py-12 sm:py-16">
      <div className="container-main max-w-xl">
        <Link href="/" className="text-sm text-muted transition-base hover:text-foreground">
          ← Back to home
        </Link>

        <div className="mt-4">
          <span className="badge badge-critical mb-2">Hospital Emergency</span>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Create Blood Request
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Matching engine will run instantly to find eligible donors in Ernakulam district. Donors are notified in small batches — never broadcast all at once.
          </p>
        </div>

        {errorMsg && (
          <div className="mt-6 rounded-xl border border-crimson/30 bg-crimson-light/20 p-4 text-sm text-crimson">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {/* Requester Details */}
          <div className="card p-5 space-y-4">
            <h2 className="text-sm font-semibold text-foreground border-b border-border pb-2">
              1. Requester Contact Information
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="requester_name" className="block text-xs font-medium text-foreground">
                  Requester Name <span className="text-crimson">*</span>
                </label>
                <input
                  type="text"
                  id="requester_name"
                  name="requester_name"
                  required
                  placeholder="e.g. Dr. Anand Sharma"
                  defaultValue="Dr. Anand Sharma"
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-crimson"
                />
              </div>

              <div>
                <label htmlFor="requester_phone" className="block text-xs font-medium text-foreground">
                  Requester Phone <span className="text-crimson">*</span>
                </label>
                <input
                  type="tel"
                  id="requester_phone"
                  name="requester_phone"
                  required
                  placeholder="+919847100001"
                  defaultValue="+919847100001"
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-mono text-foreground focus-visible:outline-crimson"
                />
              </div>
            </div>
            <p className="text-xs text-muted">
              🔒 Phone is hidden until a donor accepts the request.
            </p>
          </div>

          {/* Patient Needs */}
          <div className="card p-5 space-y-4">
            <h2 className="text-sm font-semibold text-foreground border-b border-border pb-2">
              2. Patient Medical Requirements
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="patient_blood_group" className="block text-xs font-medium text-foreground">
                  Patient Blood Group <span className="text-crimson">*</span>
                </label>
                <select
                  id="patient_blood_group"
                  name="patient_blood_group"
                  required
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-crimson"
                >
                  <option value="O-">O- (Requires O-)</option>
                  <option value="O+">O+ (Can accept O-, O+)</option>
                  <option value="A-">A- (Can accept O-, A-)</option>
                  <option value="A+">A+ (Can accept O-, O+, A-, A+)</option>
                  <option value="B-">B- (Can accept O-, B-)</option>
                  <option value="B+">B+ (Can accept O-, O+, B-, B+)</option>
                  <option value="AB-">AB- (Can accept O-, A-, B-, AB-)</option>
                  <option value="AB+">AB+ (Can accept All 8 Groups)</option>
                </select>
              </div>

              <div>
                <label htmlFor="units_needed" className="block text-xs font-medium text-foreground">
                  Units Needed <span className="text-crimson">*</span>
                </label>
                <input
                  type="number"
                  id="units_needed"
                  name="units_needed"
                  min="1"
                  max="10"
                  required
                  defaultValue="2"
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-mono text-foreground focus-visible:outline-crimson"
                />
              </div>
            </div>

            {/* Urgency */}
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Urgency Level <span className="text-crimson">*</span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: "critical", label: "Critical (25km)", desc: "Immediate (accident/ICU)" },
                  { id: "urgent", label: "Urgent (15km)", desc: "Needed within 24h" },
                  { id: "routine", label: "Routine (10km)", desc: "Scheduled transfusions" },
                ].map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => setUrgency(item.id as Urgency)}
                    className={`rounded-xl border p-3 text-left transition-base ${
                      urgency === item.id
                        ? "border-crimson bg-crimson-light/20 text-foreground"
                        : "border-border bg-background text-muted hover:bg-surface-hover"
                    }`}
                  >
                    <div className="text-xs font-semibold">{item.label}</div>
                    <div className="mt-1 text-[10px] text-muted-foreground">{item.desc}</div>
                  </button>
                ))}
              </div>
              <input type="hidden" name="urgency" value={urgency} />
            </div>

            {/* Needed By Hours */}
            <div>
              <label htmlFor="needed_by_hours" className="block text-xs font-medium text-foreground">
                Needed Within
              </label>
              <select
                id="needed_by_hours"
                name="needed_by_hours"
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-crimson"
              >
                <option value="6">Within 6 Hours (Immediate)</option>
                <option value="12">Within 12 Hours</option>
                <option value="24">Within 24 Hours</option>
                <option value="48">Within 48 Hours</option>
              </select>
            </div>
          </div>

          {/* Hospital Location */}
          <div className="card p-5 space-y-4">
            <h2 className="text-sm font-semibold text-foreground border-b border-border pb-2">
              3. Hospital Location (Kochi / Ernakulam)
            </h2>

            <div>
              <label className="block text-xs font-medium text-foreground">Select Hospital</label>
              <select
                value={selectedHospital.name}
                onChange={(e) => {
                  const h = hospitals.find((item) => item.name === e.target.value);
                  if (h) setSelectedHospital(h);
                }}
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground focus-visible:outline-crimson"
              >
                {hospitals.map((h) => (
                  <option key={h.name} value={h.name}>
                    {h.name} (Pincode: {h.pincode})
                  </option>
                ))}
              </select>
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="notes" className="block text-xs font-medium text-foreground">
                Clinical / Additional Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={2}
                placeholder="e.g. ICU Bed 4, patient needs whole blood donation."
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-crimson"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-xl bg-crimson py-3 text-base font-medium text-white transition-base hover:opacity-90 focus-visible:outline-crimson disabled:opacity-50"
          >
            {isPending ? "Running Matching Engine..." : "Submit & Match Donors →"}
          </button>
        </form>
      </div>
    </div>
  );
}
