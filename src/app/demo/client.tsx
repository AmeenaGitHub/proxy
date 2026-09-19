"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { findEligibleDonors, getBatchToNotify, BloodGroup, Urgency, DonorInput, RequestInput } from "@/lib/matching";
import { loginDonorByPhoneAction } from "@/app/actions";

interface Props {
  initialDonors: DonorInput[];
}

const hospitals = [
  { name: "Amrita Institute of Medical Sciences", lat: 10.0274, lng: 76.3071 },
  { name: "Lakeshore Hospital", lat: 9.9825, lng: 76.3007 },
  { name: "Lisie Hospital", lat: 9.9963, lng: 76.2908 },
  { name: "Ernakulam Medical Centre", lat: 10.0096, lng: 76.3042 },
];

export function DemoClient({ initialDonors }: Props) {
  const router = useRouter();

  // Query Builder state
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>("B+");
  const [urgency, setUrgency] = useState<Urgency>("urgent");
  const [unitsNeeded, setUnitsNeeded] = useState<number>(2);
  const [selectedHospital, setSelectedHospital] = useState(hospitals[0]);
  const [activeTab, setActiveTab] = useState<"all" | "wrong_group" | "ineligible_date" | "age" | "paused" | "too_far" | "recently_notified">("all");

  // Selected scenario active indicator
  const [activeScenario, setActiveScenario] = useState<string | null>(null);

  // Custom simulator donors state (allows modifying state live in scenario 3)
  const [simulatorDonors, setSimulatorDonors] = useState<DonorInput[]>(initialDonors);

  // Execute matching engine in memory
  const requestInput: RequestInput = {
    id: "demo-req-1",
    patient_blood_group: bloodGroup,
    units_needed: unitsNeeded,
    hospital_lat: selectedHospital.lat,
    hospital_lng: selectedHospital.lng,
    urgency,
    district: "Ernakulam",
  };

  const matchResult = findEligibleDonors(requestInput, simulatorDonors, new Date());
  const batchToNotify = getBatchToNotify(matchResult.eligible, unitsNeeded);

  // Filter excluded donors by tab
  const filteredExcluded = activeTab === "all"
    ? matchResult.excluded
    : matchResult.excluded.filter((e) => e.category === activeTab);

  // Canned Scenario Loaders
  const runScenario1 = () => {
    setActiveScenario("Scenario 1: Rare Group Emergency (AB-)");
    setBloodGroup("AB-");
    setUrgency("critical");
    setUnitsNeeded(2);
    setSimulatorDonors(initialDonors);
  };

  const runScenario2 = () => {
    setActiveScenario("Scenario 2: Notification Fatigue Protection");
    setBloodGroup("B+");
    setUrgency("urgent");
    setUnitsNeeded(2);

    // Simulate 20 donors notified 2 hours ago for Request #1
    const modified = initialDonors.map((d, i) => {
      if (i < 20) {
        return {
          ...d,
          last_notified_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        };
      }
      return d;
    });
    setSimulatorDonors(modified);
  };

  const runScenario3 = () => {
    setActiveScenario("Scenario 3: NBTC Interval Edge Case (89d vs 91d)");
    setBloodGroup("O+");
    setUrgency("urgent");
    setUnitsNeeded(2);

    // Create 2 male donors: one at 89 days ago, one at 91 days ago
    const d89 = new Date(); d89.setDate(d89.getDate() - 89);
    const d91 = new Date(); d91.setDate(d91.getDate() - 91);

    const donor89: DonorInput = {
      id: "edge-donor-89",
      full_name: "Kiran R. (Donated 89 days ago)",
      phone: "+919847990089",
      blood_group: "O+",
      sex: "M",
      date_of_birth: "1996-01-01",
      lat: selectedHospital.lat + 0.01,
      lng: selectedHospital.lng + 0.01,
      last_donation_date: d89.toISOString().split("T")[0],
      is_paused: false,
      paused_until: null,
      last_notified_at: null,
      declined_request_ids: [],
    };

    const donor91: DonorInput = {
      id: "edge-donor-91",
      full_name: "Rahul S. (Donated 91 days ago)",
      phone: "+919847990091",
      blood_group: "O+",
      sex: "M",
      date_of_birth: "1994-01-01",
      lat: selectedHospital.lat + 0.01,
      lng: selectedHospital.lng + 0.01,
      last_donation_date: d91.toISOString().split("T")[0],
      is_paused: false,
      paused_until: null,
      last_notified_at: null,
      declined_request_ids: [],
    };

    setSimulatorDonors([donor89, donor91, ...initialDonors]);
  };

  const resetSimulator = () => {
    setActiveScenario(null);
    setSimulatorDonors(initialDonors);
  };

  return (
    <div className="mt-8 space-y-10">
      {/* CANNED SCENARIOS BAR */}
      <div className="card p-6 border-l-4 border-l-crimson">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="badge badge-critical">Interactive Simulator</span>
            <h2 className="text-base font-semibold text-foreground">Canned Hackathon Judging Scenarios</h2>
          </div>
          {activeScenario && (
            <button
              onClick={resetSimulator}
              className="text-xs font-medium text-crimson hover:underline"
            >
              Reset Filters ↺
            </button>
          )}
        </div>

        <p className="mt-1 text-xs text-muted">
          Click any preset scenario below to demonstrate specific rules to judges:
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <button
            onClick={runScenario1}
            className={`rounded-xl border p-4 text-left transition-base ${
              activeScenario?.includes("Scenario 1")
                ? "border-crimson bg-crimson-light/20 text-foreground"
                : "border-border bg-subtle hover:bg-surface-hover"
            }`}
          >
            <div className="text-xs font-bold text-crimson">Scenario 1</div>
            <div className="mt-1 text-sm font-semibold text-foreground">Rare Group Emergency (AB-)</div>
            <div className="mt-1 text-xs text-muted">
              Shows matching engine finding rare AB- & O- donors across district.
            </div>
          </button>

          <button
            onClick={runScenario2}
            className={`rounded-xl border p-4 text-left transition-base ${
              activeScenario?.includes("Scenario 2")
                ? "border-crimson bg-crimson-light/20 text-foreground"
                : "border-border bg-subtle hover:bg-surface-hover"
            }`}
          >
            <div className="text-xs font-bold text-amber-600">Scenario 2</div>
            <div className="mt-1 text-sm font-semibold text-foreground">Fatigue Protection Test</div>
            <div className="mt-1 text-xs text-muted">
              2nd request within 12h skips 20 donors notified in 1st request.
            </div>
          </button>

          <button
            onClick={runScenario3}
            className={`rounded-xl border p-4 text-left transition-base ${
              activeScenario?.includes("Scenario 3")
                ? "border-crimson bg-crimson-light/20 text-foreground"
                : "border-border bg-subtle hover:bg-surface-hover"
            }`}
          >
            <div className="text-xs font-bold text-green">Scenario 3</div>
            <div className="mt-1 text-sm font-semibold text-foreground">Interval Edge Case (89d vs 91d)</div>
            <div className="mt-1 text-xs text-muted">
              Male at 89 days excluded; male at 91 days passes (90d NBTC rule).
            </div>
          </button>
        </div>
      </div>

      {/* QUERY BUILDER */}
      <div className="card p-6">
        <h2 className="text-base font-semibold text-foreground border-b border-border pb-3">
          Match Engine Query Parameters
        </h2>

        <div className="mt-4 grid gap-4 sm:grid-cols-4">
          <div>
            <label className="block text-xs font-semibold text-muted">Patient Blood Group</label>
            <select
              value={bloodGroup}
              onChange={(e) => setBloodGroup(e.target.value as BloodGroup)}
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-crimson"
            >
              {["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"].map((bg) => (
                <option key={bg} value={bg}>
                  {bg}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted">Urgency (Radius Limit)</label>
            <select
              value={urgency}
              onChange={(e) => setUrgency(e.target.value as Urgency)}
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-crimson"
            >
              <option value="critical">Critical (25 km radius)</option>
              <option value="urgent">Urgent (15 km radius)</option>
              <option value="routine">Routine (10 km radius)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted">Units Needed</label>
            <input
              type="number"
              min="1"
              max="5"
              value={unitsNeeded}
              onChange={(e) => setUnitsNeeded(parseInt(e.target.value || "1", 10))}
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-mono text-foreground focus-visible:outline-crimson"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted">Hospital Location</label>
            <select
              value={selectedHospital.name}
              onChange={(e) => {
                const h = hospitals.find((item) => item.name === e.target.value);
                if (h) setSelectedHospital(h);
              }}
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-crimson"
            >
              {hospitals.map((h) => (
                <option key={h.name} value={h.name}>
                  {h.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 7-STEP VISUAL MATCH FUNNEL BREAKDOWN */}
      <div className="card p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Visual Match Funnel Breakdown</h2>
            <p className="text-xs text-muted">
              Sequential enforcement of all 6 matching rules + ranking & batching ratio
            </p>
          </div>
          <span className="badge badge-success font-mono">
            {matchResult.eligible.length} Eligible Donors Found
          </span>
        </div>

        {/* Funnel Steps */}
        <div className="space-y-3">
          {[
            {
              step: "Step 1",
              name: "Total District Donors",
              count: matchResult.summary.total_in_district,
              loss: 0,
              desc: "Donors in Ernakulam district database",
              color: "bg-subtle text-foreground",
            },
            {
              step: "Step 2",
              name: "Rule 1: ABO/Rh Compatibility",
              count: matchResult.summary.total_in_district - matchResult.summary.excluded_wrong_group,
              loss: matchResult.summary.excluded_wrong_group,
              desc: `Compatible with ${bloodGroup}`,
              color: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
            },
            {
              step: "Step 3",
              name: "Rule 2: NBTC Donation Interval",
              count:
                matchResult.summary.total_in_district -
                matchResult.summary.excluded_wrong_group -
                matchResult.summary.excluded_ineligible,
              loss: matchResult.summary.excluded_ineligible,
              desc: "Enforces 90d male / 120d female interval",
              color: "bg-purple-500/10 text-purple-700 dark:text-purple-300",
            },
            {
              step: "Step 4",
              name: "Rule 3: Age Range Check",
              count:
                matchResult.summary.total_in_district -
                matchResult.summary.excluded_wrong_group -
                matchResult.summary.excluded_ineligible -
                matchResult.summary.excluded_age,
              loss: matchResult.summary.excluded_age,
              desc: "Must be between 18 and 65 years old",
              color: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300",
            },
            {
              step: "Step 5",
              name: "Rule 4: Paused Availability",
              count:
                matchResult.summary.total_in_district -
                matchResult.summary.excluded_wrong_group -
                matchResult.summary.excluded_ineligible -
                matchResult.summary.excluded_age -
                matchResult.summary.excluded_paused,
              loss: matchResult.summary.excluded_paused,
              desc: "Excludes paused donors",
              color: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
            },
            {
              step: "Step 6",
              name: "Rule 5: Urgency Distance Radius",
              count:
                matchResult.summary.total_in_district -
                matchResult.summary.excluded_wrong_group -
                matchResult.summary.excluded_ineligible -
                matchResult.summary.excluded_age -
                matchResult.summary.excluded_paused -
                matchResult.summary.excluded_too_far,
              loss: matchResult.summary.excluded_too_far,
              desc: `Haversine distance within ${urgency === "critical" ? "25km" : urgency === "urgent" ? "15km" : "10km"}`,
              color: "bg-orange-500/10 text-orange-700 dark:text-orange-300",
            },
            {
              step: "Step 7",
              name: "Rule 6: 24h Notification Fatigue",
              count: matchResult.eligible.length,
              loss: matchResult.summary.excluded_recently_notified,
              desc: "Excludes donors notified <24h ago or who declined",
              color: "bg-green-500/10 text-green-700 dark:text-green-300",
            },
          ].map((item, i) => {
            const pct = Math.round((item.count / matchResult.summary.total_in_district) * 100);
            return (
              <div key={item.step} className="rounded-xl border border-border p-3.5 transition-base">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-muted">{item.step}</span>
                    <span className="text-sm font-semibold text-foreground">{item.name}</span>
                    <span className="text-xs text-muted">({item.desc})</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {item.loss > 0 && (
                      <span className="text-xs font-semibold text-crimson">-{item.loss} excluded</span>
                    )}
                    <span className="font-mono text-sm font-bold text-foreground">
                      {item.count} <span className="text-xs text-muted font-normal">({pct}%)</span>
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-subtle">
                  <div
                    className={`h-full transition-all duration-300 ${
                      i === 6 ? "bg-green" : "bg-crimson"
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* BATCH RECOMMENDATION HIGHLIGHT */}
        <div className="rounded-xl border border-green-light bg-green-light/30 p-4 text-sm">
          <div className="flex items-center justify-between">
            <div className="font-semibold text-foreground flex items-center gap-2">
              <span className="badge badge-success font-mono">BATCH RECOMMENDATION</span>
              <span>Notifying Top {batchToNotify.length} Donors for Batch 1</span>
            </div>
            <span className="text-xs text-muted">Formula: min(units_needed * 3, 10)</span>
          </div>
          <p className="mt-1 text-xs text-muted">
            Rather than broadcasting WhatsApp forwards to all {matchResult.eligible.length} eligible donors, Proximo. notifies only {batchToNotify.length} donors in Batch 1 to protect against fatigue.
          </p>
        </div>
      </div>

      {/* TOP SURVIVORS RANKED TABLE */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h2 className="text-base font-semibold text-foreground">
            Top Ranked Eligible Donors ({matchResult.eligible.length})
          </h2>
          <span className="text-xs text-muted">
            Rank Order: ABO Exact Match → Distance Asc → Longest Interval
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border bg-subtle text-muted uppercase font-mono">
              <tr>
                <th className="p-3">Rank</th>
                <th className="p-3">Donor Name</th>
                <th className="p-3">Blood Group</th>
                <th className="p-3">ABO Match</th>
                <th className="p-3">Distance</th>
                <th className="p-3">Last Donation</th>
                <th className="p-3">Batch Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-foreground">
              {matchResult.eligible.map((rd, idx) => {
                const inBatch1 = idx < batchToNotify.length;
                return (
                  <tr key={rd.donor.id} className={inBatch1 ? "bg-green-light/20" : ""}>
                    <td className="p-3 font-mono font-bold">#{idx + 1}</td>
                    <td className="p-3 font-medium">{rd.donor.full_name}</td>
                    <td className="p-3 font-mono font-bold text-crimson">{rd.donor.blood_group}</td>
                    <td className="p-3">
                      <span className={`badge ${rd.is_exact_match ? "badge-success" : "badge-routine"}`}>
                        {rd.is_exact_match ? "Exact Match" : "Compatible"}
                      </span>
                    </td>
                    <td className="p-3 font-mono">{rd.distance_km.toFixed(1)} km</td>
                    <td className="p-3 font-mono text-muted">
                      {rd.donor.last_donation_date || "Never (First Time)"}
                    </td>
                    <td className="p-3">
                      {inBatch1 ? (
                        <span className="badge badge-success font-semibold">Notified (Batch 1)</span>
                      ) : (
                        <span className="text-muted">Standby (Batch 2)</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* EXCLUDED DONORS ACCORDION */}
      <div className="card p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border pb-3 gap-2">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Excluded Donors Audit Trail ({matchResult.excluded.length})
            </h2>
            <p className="text-xs text-muted">Click tabs to inspect exact exclusion reasons per rule</p>
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-1">
            {[
              { id: "all", label: `All (${matchResult.excluded.length})` },
              { id: "wrong_group", label: `Wrong Group (${matchResult.summary.excluded_wrong_group})` },
              { id: "ineligible_date", label: `Interval (${matchResult.summary.excluded_ineligible})` },
              { id: "too_far", label: `Distance (${matchResult.summary.excluded_too_far})` },
              { id: "recently_notified", label: `Fatigue (${matchResult.summary.excluded_recently_notified})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-base ${
                  activeTab === tab.id
                    ? "bg-crimson text-white"
                    : "bg-subtle text-muted hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Excluded Cards List */}
        <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
          {filteredExcluded.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted">No excluded donors in this category.</div>
          ) : (
            filteredExcluded.map((ex, i) => (
              <div
                key={i}
                className="rounded-xl border border-border bg-subtle p-3 text-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-crimson w-8">{ex.blood_group}</span>
                  <div>
                    <span className="font-semibold text-foreground font-mono">Donor {ex.donor_id?.slice(0, 8)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="badge badge-urgent font-mono">{ex.category.toUpperCase()}</span>
                  <span className="text-muted max-w-md truncate">{ex.reason}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* FIXED PERSISTENT JUDGE IMPERSONATION BAR */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 p-3 backdrop-blur-md shadow-2xl">
        <div className="container-main flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
            <span className="badge badge-critical animate-pulse">JUDGE DEMO SWITCHER</span>
            <span>1-Click Switch Active View:</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap text-xs">
            <button
              onClick={() => {
                loginDonorByPhoneAction("+919847100001").then(() => router.push("/donor"));
              }}
              className="rounded-lg border border-border bg-background px-3 py-1.5 font-medium text-foreground transition-base hover:border-crimson hover:text-crimson"
            >
              👤 Anand V. (B+ Donor)
            </button>

            <button
              onClick={() => {
                loginDonorByPhoneAction("+919847200002").then(() => router.push("/donor"));
              }}
              className="rounded-lg border border-border bg-background px-3 py-1.5 font-medium text-foreground transition-base hover:border-crimson hover:text-crimson"
            >
              👤 Deepa Nair (O- Donor)
            </button>

            <button
              onClick={() => {
                router.push("/request/new");
              }}
              className="rounded-lg border border-border bg-background px-3 py-1.5 font-medium text-foreground transition-base hover:border-crimson hover:text-crimson"
            >
              🏥 Amrita Hospital Admin
            </button>

            <button
              onClick={() => {
                router.push("/privacy");
              }}
              className="rounded-lg border border-border bg-background px-3 py-1.5 font-medium text-foreground transition-base hover:border-crimson hover:text-crimson"
            >
              🔒 Privacy Model
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
