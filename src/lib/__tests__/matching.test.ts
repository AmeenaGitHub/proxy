import { describe, it, expect } from "vitest";
import {
  findEligibleDonors,
  isBloodCompatible,
  getNextEligibleDate,
  haversineDistanceKm,
  calculateAge,
  getBatchToNotify,
  DonorInput,
  RequestInput,
  BloodGroup,
} from "../matching";

// Standard reference date for deterministic testing
const NOW = new Date("2026-03-20T10:00:00Z");

// Base donor helper
function createDonor(overrides: Partial<DonorInput> = {}): DonorInput {
  return {
    id: "donor-1",
    full_name: "Test Donor",
    phone: "+919847000001",
    blood_group: "O-",
    sex: "M",
    date_of_birth: "1995-05-15",
    lat: 10.0,
    lng: 76.3,
    last_donation_date: null,
    is_paused: false,
    paused_until: null,
    last_notified_at: null,
    declined_request_ids: [],
    ...overrides,
  };
}

// Base request helper (hospital at 10.0, 76.3)
function createRequest(overrides: Partial<RequestInput> = {}): RequestInput {
  return {
    id: "req-1",
    patient_blood_group: "B+",
    units_needed: 2,
    hospital_lat: 10.0,
    hospital_lng: 76.3,
    urgency: "urgent",
    district: "Ernakulam",
    ...overrides,
  };
}

describe("1. ABO/Rh Compatibility", () => {
  it("A B+ patient surfaces ONLY O+, O-, B-, B+ donors and no others", () => {
    const allGroups: BloodGroup[] = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
    const donors = allGroups.map((bg, idx) =>
      createDonor({ id: `donor-${idx}`, blood_group: bg })
    );

    const request = createRequest({ patient_blood_group: "B+" });
    const result = findEligibleDonors(request, donors, NOW);

    const eligibleGroups = result.eligible.map((r) => r.donor.blood_group);
    expect(eligibleGroups.sort()).toEqual(["B+", "B-", "O+", "O-"].sort());

    const excludedWrongGroup = result.excluded
      .filter((e) => e.category === "wrong_group")
      .map((e) => e.blood_group);
    expect(excludedWrongGroup.sort()).toEqual(["A+", "A-", "AB+", "AB-"].sort());
  });

  it("AB+ patient can receive from all 8 blood groups", () => {
    const allGroups: BloodGroup[] = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
    const donors = allGroups.map((bg, idx) =>
      createDonor({ id: `donor-${idx}`, blood_group: bg })
    );

    const request = createRequest({ patient_blood_group: "AB+" });
    const result = findEligibleDonors(request, donors, NOW);

    expect(result.eligible.length).toBe(8);
    expect(result.excluded.length).toBe(0);
  });

  it("O- patient can ONLY receive from O- donors", () => {
    const allGroups: BloodGroup[] = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
    const donors = allGroups.map((bg, idx) =>
      createDonor({ id: `donor-${idx}`, blood_group: bg })
    );

    const request = createRequest({ patient_blood_group: "O-" });
    const result = findEligibleDonors(request, donors, NOW);

    expect(result.eligible.length).toBe(1);
    expect(result.eligible[0].donor.blood_group).toBe("O-");
  });
});

describe("2. Donation Interval (NBTC India)", () => {
  it("Male donor who gave blood 60 days ago is excluded; at 91 days included", () => {
    // 60 days ago from NOW (2026-03-20) -> ~2026-01-19
    const d60 = new Date(NOW);
    d60.setDate(d60.getDate() - 60);

    const male60 = createDonor({
      id: "male-60",
      sex: "M",
      blood_group: "O-",
      last_donation_date: d60.toISOString().split("T")[0],
    });

    const req = createRequest({ patient_blood_group: "O-" });
    const res1 = findEligibleDonors(req, [male60], NOW);

    expect(res1.eligible.length).toBe(0);
    expect(res1.excluded.length).toBe(1);
    expect(res1.excluded[0].category).toBe("ineligible_date");
    expect(res1.excluded[0].reason).toContain("Ineligible until");

    // 91 days ago -> eligible
    const d91 = new Date(NOW);
    d91.setDate(d91.getDate() - 91);

    const male91 = createDonor({
      id: "male-91",
      sex: "M",
      blood_group: "O-",
      last_donation_date: d91.toISOString().split("T")[0],
    });

    const res2 = findEligibleDonors(req, [male91], NOW);
    expect(res2.eligible.length).toBe(1);
    expect(res2.excluded.length).toBe(0);
  });

  it("Female donor at 100 days is excluded; at 121 days included", () => {
    const d100 = new Date(NOW);
    d100.setDate(d100.getDate() - 100);

    const female100 = createDonor({
      id: "female-100",
      sex: "F",
      blood_group: "O-",
      last_donation_date: d100.toISOString().split("T")[0],
    });

    const req = createRequest({ patient_blood_group: "O-" });
    const res1 = findEligibleDonors(req, [female100], NOW);
    expect(res1.eligible.length).toBe(0);

    const d121 = new Date(NOW);
    d121.setDate(d121.getDate() - 121);

    const female121 = createDonor({
      id: "female-121",
      sex: "F",
      blood_group: "O-",
      last_donation_date: d121.toISOString().split("T")[0],
    });

    const res2 = findEligibleDonors(req, [female121], NOW);
    expect(res2.eligible.length).toBe(1);
  });

  it("Donors with no recorded last donation are eligible", () => {
    const noDonationDonor = createDonor({
      last_donation_date: null,
      blood_group: "O-",
    });
    const req = createRequest({ patient_blood_group: "O-" });
    const res = findEligibleDonors(req, [noDonationDonor], NOW);
    expect(res.eligible.length).toBe(1);
  });
});

describe("3. Age Restrictions", () => {
  it("Excludes donors under 18 or over 65", () => {
    const underAge = createDonor({ id: "under-18", date_of_birth: "2010-01-01", blood_group: "O-" }); // ~16
    const validAge = createDonor({ id: "valid-25", date_of_birth: "2000-01-01", blood_group: "O-" }); // ~26
    const overAge = createDonor({ id: "over-65", date_of_birth: "1955-01-01", blood_group: "O-" });  // ~71

    const req = createRequest({ patient_blood_group: "O-" });
    const res = findEligibleDonors(req, [underAge, validAge, overAge], NOW);

    expect(res.eligible.length).toBe(1);
    expect(res.eligible[0].donor.id).toBe("valid-25");
    expect(res.excluded.map((e) => e.category)).toEqual(["age", "age"]);
  });
});

describe("4. Paused Donors", () => {
  it("Excludes donors who are paused indefinitely or until a future date", () => {
    const pausedIndefinite = createDonor({ id: "paused-1", is_paused: true, paused_until: null, blood_group: "O-" });
    const pausedFuture = createDonor({ id: "paused-2", is_paused: true, paused_until: "2026-04-01T00:00:00Z", blood_group: "O-" });
    const pausedPast = createDonor({ id: "paused-3", is_paused: true, paused_until: "2026-01-01T00:00:00Z", blood_group: "O-" });

    const req = createRequest({ patient_blood_group: "O-" });
    const res = findEligibleDonors(req, [pausedIndefinite, pausedFuture, pausedPast], NOW);

    expect(res.eligible.length).toBe(1);
    expect(res.eligible[0].donor.id).toBe("paused-3");
  });
});

describe("5. Distance Rules", () => {
  it("Radius expands by urgency: critical 25 km, urgent 15 km, routine 10 km", () => {
    // Hospital at (10.0, 76.3)
    // Donor ~12 km away (10.1, 76.3) -> ~11.1 km
    const donor12km = createDonor({ id: "donor-12km", lat: 10.1, lng: 76.3, blood_group: "O-" });

    const routineReq = createRequest({ urgency: "routine", patient_blood_group: "O-" });
    const urgentReq = createRequest({ urgency: "urgent", patient_blood_group: "O-" });

    const resRoutine = findEligibleDonors(routineReq, [donor12km], NOW);
    expect(resRoutine.eligible.length).toBe(0);
    expect(resRoutine.excluded[0].category).toBe("too_far");

    const resUrgent = findEligibleDonors(urgentReq, [donor12km], NOW);
    expect(resUrgent.eligible.length).toBe(1);
  });
});

describe("6. Notification Fatigue Protection", () => {
  it("Excludes a donor notified for ANY request in the last 24 hours", () => {
    const recentNotified = createDonor({
      id: "recent",
      blood_group: "O-",
      last_notified_at: new Date(NOW.getTime() - 2 * 60 * 60 * 1000).toISOString(), // 2h ago
    });

    const oldNotified = createDonor({
      id: "old",
      blood_group: "O-",
      last_notified_at: new Date(NOW.getTime() - 25 * 60 * 60 * 1000).toISOString(), // 25h ago
    });

    const req = createRequest({ patient_blood_group: "O-" });
    const res = findEligibleDonors(req, [recentNotified, oldNotified], NOW);

    expect(res.eligible.length).toBe(1);
    expect(res.eligible[0].donor.id).toBe("old");
    expect(res.excluded[0].category).toBe("recently_notified");
  });

  it("Excludes a donor who declined this specific request", () => {
    const declinedDonor = createDonor({
      id: "declined",
      blood_group: "O-",
      declined_request_ids: ["req-1"],
    });

    const req = createRequest({ id: "req-1", patient_blood_group: "O-" });
    const res = findEligibleDonors(req, [declinedDonor], NOW);

    expect(res.eligible.length).toBe(0);
    expect(res.excluded[0].category).toBe("recently_notified");
    expect(res.excluded[0].reason).toContain("declined");
  });
});

describe("7. Ranking Algorithm", () => {
  it("Ranks exact match first, then distance, then longest time since last donation", () => {
    const req = createRequest({ patient_blood_group: "B+", hospital_lat: 10.0, hospital_lng: 76.3 });

    // Donor 1: O+ (compatible but not exact), 2 km away
    const donorO = createDonor({ id: "donor-O", blood_group: "O+", lat: 10.018, lng: 76.3 }); // ~2 km

    // Donor 2: B+ (exact match), 5 km away
    const donorB = createDonor({ id: "donor-B", blood_group: "B+", lat: 10.045, lng: 76.3 }); // ~5 km

    const res = findEligibleDonors(req, [donorO, donorB], NOW);

    // Exact match (B+) should come first despite being further away
    expect(res.eligible[0].donor.id).toBe("donor-B");
    expect(res.eligible[1].donor.id).toBe("donor-O");
  });
});

describe("8. Notification Batching Helper", () => {
  it("Batch size is capped at units_needed * 3 or max 10", () => {
    const donors = Array.from({ length: 15 }, (_, i) => `donor-${i}`);

    const batchSmall = getBatchToNotify(donors, 2); // 2 * 3 = 6
    expect(batchSmall.length).toBe(6);

    const batchLarge = getBatchToNotify(donors, 4); // 4 * 3 = 12 -> capped at 10
    expect(batchLarge.length).toBe(10);
  });
});
