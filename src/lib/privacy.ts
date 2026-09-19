/**
 * RaktSetu — Privacy & Redaction Layer
 *
 * Strict server-side redaction helpers.
 * Phone numbers and surnames are masked by default UNLESS an explicit
 * contact_reveals audit row exists between the request and donor.
 */

export interface DonorPrivacyInput {
  id: string;
  full_name: string;
  phone: string;
  blood_group: string;
  sex: string;
  date_of_birth: string;
  pincode: string;
  ward_name?: string | null;
  district: string;
  lat?: number | null;
  lng?: number | null;
  last_donation_date?: string | null;
  total_donations?: number;
  is_paused?: boolean;
  paused_until?: string | null;
  created_at?: string;
}

export interface RequesterPrivacyInput {
  id: string;
  requester_name: string;
  requester_phone: string;
  patient_blood_group: string;
  units_needed: number;
  units_confirmed: number;
  hospital_name: string;
  hospital_lat: number;
  hospital_lng: number;
  pincode?: string | null;
  district: string;
  urgency: string;
  needed_by: string;
  status: string;
  notes?: string | null;
  created_at?: string;
}

/**
 * Redacts a phone number to standard format: "+91 9•••• ••23"
 */
export function maskPhone(phone: string): string {
  if (!phone) return "+91 9•••• ••00";
  // Strip non-digits except +
  const cleaned = phone.replace(/[^\d+]/g, "");
  
  if (cleaned.length >= 10) {
    const country = cleaned.startsWith("+91") ? "+91" : "+91";
    const digits = cleaned.replace(/^\+91/, "").replace(/^91/, "");
    if (digits.length >= 10) {
      const firstDigit = digits.charAt(0);
      const lastTwo = digits.slice(-2);
      return `${country} ${firstDigit}•••• ••${lastTwo}`;
    }
  }
  return "+91 9•••• ••99";
}

/**
 * Masks surname to initial (e.g. "Arun Kumar" -> "Arun K.")
 */
export function maskName(fullName: string): string {
  if (!fullName) return "Anonymous Donor";
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  const first = parts[0];
  const lastInitial = parts[parts.length - 1].charAt(0).toUpperCase() + ".";
  return `${first} ${lastInitial}`;
}

/**
 * Redacts donor object if contact is NOT revealed.
 */
export function redactDonor<T extends DonorPrivacyInput>(
  donor: T,
  isContactRevealed: boolean
): T {
  if (isContactRevealed) {
    return donor;
  }

  return {
    ...donor,
    full_name: maskName(donor.full_name),
    phone: maskPhone(donor.phone),
  };
}

/**
 * Redacts requester object if contact is NOT revealed.
 */
export function redactRequester<T extends RequesterPrivacyInput>(
  requester: T,
  isContactRevealed: boolean
): T {
  if (isContactRevealed) {
    return requester;
  }

  return {
    ...requester,
    requester_name: maskName(requester.requester_name),
    requester_phone: maskPhone(requester.requester_phone),
  };
}
