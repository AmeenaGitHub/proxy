/**
 * RaktSetu — Pure Matching Engine
 *
 * Single pure function `findEligibleDonors(request, allDonors, now)`
 * with NO database or framework dependencies. Fully unit testable.
 */

export type BloodGroup = "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";
export type Sex = "M" | "F" | "other";
export type Urgency = "critical" | "urgent" | "routine";

export interface DonorInput {
  id: string;
  full_name: string;
  phone: string;
  blood_group: BloodGroup;
  sex: Sex;
  date_of_birth: string; // YYYY-MM-DD
  lat: number | null;
  lng: number | null;
  last_donation_date?: string | null; // YYYY-MM-DD
  is_paused: boolean;
  paused_until?: string | null; // ISO string or YYYY-MM-DD
  // Notification history context
  last_notified_at?: string | null; // ISO string
  declined_request_ids?: string[]; // IDs of requests this donor explicitly declined
}

export interface RequestInput {
  id: string;
  patient_blood_group: BloodGroup;
  units_needed: number;
  hospital_lat: number;
  hospital_lng: number;
  urgency: Urgency;
  district: string;
}

export type ExclusionCategory =
  | "wrong_group"
  | "ineligible_date"
  | "age"
  | "paused"
  | "too_far"
  | "recently_notified";

export interface ExclusionRecord {
  donor_id: string;
  donor_name_masked: string;
  blood_group: BloodGroup;
  category: ExclusionCategory;
  reason: string;
  details?: {
    next_eligible_date?: string;
    distance_km?: number;
    max_radius_km?: number;
    age?: number;
    last_notified_at?: string;
  };
}

export interface RankedDonor {
  donor: DonorInput;
  distance_km: number;
  is_exact_match: boolean;
  next_eligible_date: string | null;
  days_since_last_donation: number | null;
}

export interface MatchingResult {
  eligible: RankedDonor[];
  excluded: ExclusionRecord[];
  summary: {
    total_in_district: number;
    excluded_wrong_group: number;
    excluded_ineligible: number;
    excluded_age: number;
    excluded_paused: number;
    excluded_too_far: number;
    excluded_recently_notified: number;
    eligible_count: number;
  };
}

// ============================================================
// 1. ABO / Rh COMPATIBILITY MATRIX (Whole Blood / Packed Red Cells)
// ============================================================
const COMPATIBILITY_MAP: Record<BloodGroup, BloodGroup[]> = {
  "O-": ["O-"],
  "O+": ["O-", "O+"],
  "A-": ["O-", "A-"],
  "A+": ["O-", "O+", "A-", "A+"],
  "B-": ["O-", "B-"],
  "B+": ["O-", "O+", "B-", "B+"],
  "AB-": ["O-", "A-", "B-", "AB-"],
  "AB+": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
};

export function isBloodCompatible(patientGroup: BloodGroup, donorGroup: BloodGroup): boolean {
  const allowedDonors = COMPATIBILITY_MAP[patientGroup];
  return allowedDonors ? allowedDonors.includes(donorGroup) : false;
}

// ============================================================
// 2. DONATION INTERVAL CALCULATOR (NBTC India Guidance)
// ============================================================
// Male: 90 days, Female/other: 120 days
export function getNextEligibleDate(lastDonationDateStr: string | null | undefined, sex: Sex): Date | null {
  if (!lastDonationDateStr) return null;
  const lastDate = new Date(lastDonationDateStr);
  if (isNaN(lastDate.getTime())) return null;

  const cooldownDays = sex === "M" ? 90 : 120;
  const nextDate = new Date(lastDate);
  nextDate.setDate(nextDate.getDate() + cooldownDays);
  return nextDate;
}

// ============================================================
// 3. HAVERSINE DISTANCE CALCULATOR
// ============================================================
export function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10; // 1 decimal place
}

export function getMaxRadiusKm(urgency: Urgency): number {
  switch (urgency) {
    case "critical":
      return 25;
    case "urgent":
      return 15;
    case "routine":
      return 10;
  }
}

// ============================================================
// 4. AGE CALCULATOR
// ============================================================
export function calculateAge(dobStr: string, now: Date): number {
  const dob = new Date(dobStr);
  let age = now.getFullYear() - dob.getFullYear();
  const monthDiff = now.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

// Masking helper for privacy in explainability panel
export function maskName(fullName: string): string {
  const parts = fullName.trim().split(" ");
  if (parts.length === 1) return parts[0];
  const first = parts[0];
  const lastInitial = parts[parts.length - 1].charAt(0).toUpperCase() + ".";
  return `${first} ${lastInitial}`;
}

// ============================================================
// 5. CORE MATCHING ENGINE
// ============================================================
export function findEligibleDonors(
  request: RequestInput,
  allDonors: DonorInput[],
  now: Date = new Date()
): MatchingResult {
  const excluded: ExclusionRecord[] = [];
  const survivors: RankedDonor[] = [];

  let countWrongGroup = 0;
  let countIneligibleDate = 0;
  let countAge = 0;
  let countPaused = 0;
  let countTooFar = 0;
  let countRecentlyNotified = 0;

  const maxRadius = getMaxRadiusKm(request.urgency);

  for (const donor of allDonors) {
    const maskedName = maskName(donor.full_name);

    // Rule 1: ABO/Rh Compatibility
    if (!isBloodCompatible(request.patient_blood_group, donor.blood_group)) {
      countWrongGroup++;
      excluded.push({
        donor_id: donor.id,
        donor_name_masked: maskedName,
        blood_group: donor.blood_group,
        category: "wrong_group",
        reason: `Incompatible blood group: Patient requires ${request.patient_blood_group}, donor is ${donor.blood_group}`,
      });
      continue;
    }

    // Rule 2: Donation Interval (90 days male / 120 days female)
    const nextEligibleDate = getNextEligibleDate(donor.last_donation_date, donor.sex);
    if (nextEligibleDate && nextEligibleDate.getTime() > now.getTime()) {
      countIneligibleDate++;
      const nextEligibleISO = nextEligibleDate.toISOString().split("T")[0];
      const cooldownDays = donor.sex === "M" ? 90 : 120;
      excluded.push({
        donor_id: donor.id,
        donor_name_masked: maskedName,
        blood_group: donor.blood_group,
        category: "ineligible_date",
        reason: `Ineligible until ${nextEligibleISO} (${cooldownDays}-day interval required for ${donor.sex === "M" ? "male" : "female"} donors)`,
        details: { next_eligible_date: nextEligibleISO },
      });
      continue;
    }

    // Rule 3: Age (18 to 65 inclusive)
    const age = calculateAge(donor.date_of_birth, now);
    if (age < 18 || age > 65) {
      countAge++;
      excluded.push({
        donor_id: donor.id,
        donor_name_masked: maskedName,
        blood_group: donor.blood_group,
        category: "age",
        reason: `Donor age (${age}) outside eligible range (18-65)`,
        details: { age },
      });
      continue;
    }

    // Rule 4: Paused Status
    if (donor.is_paused) {
      const pausedUntilDate = donor.paused_until ? new Date(donor.paused_until) : null;
      if (!pausedUntilDate || pausedUntilDate.getTime() > now.getTime()) {
        countPaused++;
        excluded.push({
          donor_id: donor.id,
          donor_name_masked: maskedName,
          blood_group: donor.blood_group,
          category: "paused",
          reason: `Donor account is paused ${donor.paused_until ? `until ${donor.paused_until.split("T")[0]}` : "indefinitely"}`,
        });
        continue;
      }
    }

    // Rule 5: Distance (Haversine from hospital)
    let distanceKm = 0;
    if (donor.lat !== null && donor.lng !== null) {
      distanceKm = haversineDistanceKm(request.hospital_lat, request.hospital_lng, donor.lat, donor.lng);
    }

    if (distanceKm > maxRadius) {
      countTooFar++;
      excluded.push({
        donor_id: donor.id,
        donor_name_masked: maskedName,
        blood_group: donor.blood_group,
        category: "too_far",
        reason: `Distance (${distanceKm} km) exceeds maximum ${maxRadius} km radius for ${request.urgency} urgency`,
        details: { distance_km: distanceKm, max_radius_km: maxRadius },
      });
      continue;
    }

    // Rule 6: Notification Fatigue (Notified within last 24h OR declined this specific request)
    const hasDeclinedThisRequest = donor.declined_request_ids?.includes(request.id) ?? false;
    let notifiedInLast24h = false;
    if (donor.last_notified_at) {
      const lastNotifiedDate = new Date(donor.last_notified_at);
      const hoursSinceNotification = (now.getTime() - lastNotifiedDate.getTime()) / (1000 * 60 * 60);
      if (hoursSinceNotification < 24) {
        notifiedInLast24h = true;
      }
    }

    if (notifiedInLast24h || hasDeclinedThisRequest) {
      countRecentlyNotified++;
      const reasonText = hasDeclinedThisRequest
        ? "Donor declined this specific request"
        : `Donor was notified for another request in the last 24 hours`;
      excluded.push({
        donor_id: donor.id,
        donor_name_masked: maskedName,
        blood_group: donor.blood_group,
        category: "recently_notified",
        reason: reasonText,
        details: donor.last_notified_at ? { last_notified_at: donor.last_notified_at } : undefined,
      });
      continue;
    }

    // Survivor! Calculate distance and donation stats for ranking
    let daysSinceLastDonation: number | null = null;
    if (donor.last_donation_date) {
      const lastDate = new Date(donor.last_donation_date);
      daysSinceLastDonation = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    }

    survivors.push({
      donor,
      distance_km: distanceKm,
      is_exact_match: donor.blood_group === request.patient_blood_group,
      next_eligible_date: nextEligibleDate ? nextEligibleDate.toISOString().split("T")[0] : null,
      days_since_last_donation: daysSinceLastDonation,
    });
  }

  // ============================================================
  // RANKING OF SURVIVORS:
  // 1. Exact blood group match first
  // 2. Distance ascending
  // 3. Longest time since last donation (no last donation = highest/longest ago)
  // ============================================================
  survivors.sort((a, b) => {
    // 1. Exact match priority
    if (a.is_exact_match !== b.is_exact_match) {
      return a.is_exact_match ? -1 : 1;
    }
    // 2. Distance ascending
    if (a.distance_km !== b.distance_km) {
      return a.distance_km - b.distance_km;
    }
    // 3. Longest time since last donation
    const daysA = a.days_since_last_donation ?? Number.MAX_SAFE_INTEGER;
    const daysB = b.days_since_last_donation ?? Number.MAX_SAFE_INTEGER;
    return daysB - daysA;
  });

  return {
    eligible: survivors,
    excluded,
    summary: {
      total_in_district: allDonors.length,
      excluded_wrong_group: countWrongGroup,
      excluded_ineligible: countIneligibleDate,
      excluded_age: countAge,
      excluded_paused: countPaused,
      excluded_too_far: countTooFar,
      excluded_recently_notified: countRecentlyNotified,
      eligible_count: survivors.length,
    },
  };
}

// ============================================================
// BATCHING HELPER: Notify `units_needed * 3` donors (capped at 10)
// ============================================================
export function getBatchToNotify<T>(eligibleDonors: T[], unitsNeeded: number): T[] {
  const batchSize = Math.min(unitsNeeded * 3, 10);
  return eligibleDonors.slice(0, batchSize);
}
