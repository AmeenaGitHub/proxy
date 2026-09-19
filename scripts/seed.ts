/**
 * RaktSetu Seed Script
 *
 * Seeds the database with:
 * - ~150 donors across real Ernakulam pincodes/wards
 * - Realistic Malayali names
 * - Blood group distribution matching India stats
 * - Spread of last_donation_date for eligibility testing
 * - 6 real Kochi hospitals with coordinates
 * - 3 requests in different states
 *
 * Usage:
 *   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/seed.ts
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================================
// HELPERS
// ============================================================

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(daysAgoMin: number, daysAgoMax: number): string {
  const daysAgo = randomBetween(daysAgoMin, daysAgoMax);
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split("T")[0];
}

function generatePhone(): string {
  const prefixes = ["9847", "9846", "9495", "9496", "9745", "9744", "8281", "8289", "7012", "7025"];
  return "+91" + randomElement(prefixes) + String(randomBetween(100000, 999999));
}

// ============================================================
// DATA POOLS
// ============================================================

const maleFirstNames = [
  "Arun", "Vishnu", "Sreejith", "Rajeev", "Manoj", "Suresh", "Anoop", "Sajan", "Jithin", "Dileep",
  "Pradeep", "Renjith", "Shaiju", "Vinod", "Binu", "Rejin", "Sajith", "Ajith", "Midhun", "Nithin",
  "Shaji", "Joby", "Shibu", "Prasanth", "Aneesh", "Lijin", "Bibin", "Kiran", "Sandeep", "Deepak",
  "Rahul", "Sreekanth", "Jobin", "Jibin", "Anil", "Unnikrishnan", "Murali", "Girish", "Adarsh", "Aswin",
  "Vimal", "Jeevan", "Jayesh", "Nandhu", "Akhil", "Sreelal", "Vivek", "Manu", "Harikrishnan", "Sathish",
];

const femaleFirstNames = [
  "Anju", "Divya", "Sreeja", "Lekha", "Nimmi", "Shyama", "Deepa", "Kavitha", "Sruthy", "Manju",
  "Reshma", "Athira", "Aswathy", "Gopika", "Lakshmi", "Jisha", "Anitha", "Remya", "Soumya", "Neethu",
  "Parvathy", "Amritha", "Gayathri", "Vaishnavi", "Simi", "Priya", "Ranjini", "Saritha", "Sneha", "Meera",
];

const lastNames = [
  "Nair", "Menon", "Pillai", "Kumar", "Varma", "Das", "Krishnan", "Chandran", "Rajan", "Panicker",
  "Thomas", "Joseph", "George", "Mathew", "Abraham", "John", "Kurian", "Varghese", "Chacko", "Philip",
  "Sreenivasan", "Gopalakrishnan", "Padmanabhan", "Balakrishnan", "Subramaniam", "Kaimal", "Warrier",
  "Kartha", "Thampi", "Kurup",
];

// Blood group distribution: O+ ~37%, B+ ~32%, A+ ~21%, AB+ ~6%, negatives ~5% total
const bloodGroupWeights: [string, number][] = [
  ["O+", 37], ["B+", 32], ["A+", 21], ["AB+", 6],
  ["O-", 1.5], ["B-", 1.3], ["A-", 1], ["AB-", 0.2],
];

function weightedBloodGroup(): string {
  const totalWeight = bloodGroupWeights.reduce((sum, [, w]) => sum + w, 0);
  let r = Math.random() * totalWeight;
  for (const [group, weight] of bloodGroupWeights) {
    r -= weight;
    if (r <= 0) return group;
  }
  return "O+";
}

// Real Ernakulam pincodes and wards
const locations: { pincode: string; ward: string; lat: number; lng: number }[] = [
  { pincode: "682001", ward: "Fort Kochi", lat: 9.9639, lng: 76.2431 },
  { pincode: "682002", ward: "Mattancherry", lat: 9.9581, lng: 76.2588 },
  { pincode: "682011", ward: "Ernakulam North", lat: 9.9937, lng: 76.2988 },
  { pincode: "682016", ward: "Palarivattom", lat: 10.0073, lng: 76.3047 },
  { pincode: "682017", ward: "Edappally", lat: 10.0265, lng: 76.3085 },
  { pincode: "682018", ward: "Elamakkara", lat: 10.0147, lng: 76.3084 },
  { pincode: "682019", ward: "Vyttila", lat: 9.9717, lng: 76.3209 },
  { pincode: "682020", ward: "Kadavanthra", lat: 9.9727, lng: 76.2920 },
  { pincode: "682021", ward: "Kaloor", lat: 9.9945, lng: 76.2912 },
  { pincode: "682024", ward: "Tripunithura", lat: 9.9472, lng: 76.3491 },
  { pincode: "682025", ward: "Thevara", lat: 9.9567, lng: 76.2960 },
  { pincode: "682026", ward: "Panangad", lat: 9.9235, lng: 76.2919 },
  { pincode: "682028", ward: "Kalamassery", lat: 10.0513, lng: 76.3180 },
  { pincode: "682030", ward: "Aluva", lat: 10.1070, lng: 76.3515 },
  { pincode: "682031", ward: "Aluva West", lat: 10.1050, lng: 76.3450 },
  { pincode: "682301", ward: "Thrippunithura East", lat: 9.9500, lng: 76.3550 },
  { pincode: "682302", ward: "Maradu", lat: 9.9423, lng: 76.3069 },
  { pincode: "682303", ward: "Kakkanad", lat: 10.0155, lng: 76.3540 },
  { pincode: "682304", ward: "Thrikkakara", lat: 10.0303, lng: 76.3440 },
  { pincode: "682305", ward: "Vazhakkala", lat: 10.0220, lng: 76.3580 },
  { pincode: "683101", ward: "Angamaly", lat: 10.1930, lng: 76.3860 },
  { pincode: "683102", ward: "Angamaly South", lat: 10.1850, lng: 76.3800 },
  { pincode: "683501", ward: "Perumbavoor", lat: 10.1072, lng: 76.4750 },
  { pincode: "683502", ward: "Perumbavoor East", lat: 10.1100, lng: 76.4800 },
  { pincode: "683544", ward: "Muvattupuzha", lat: 9.9840, lng: 76.5740 },
  { pincode: "683561", ward: "Kothamangalam", lat: 10.0572, lng: 76.6280 },
  { pincode: "683572", ward: "Kolenchery", lat: 9.9997, lng: 76.4048 },
  { pincode: "682506", ward: "Cheranalloor", lat: 10.0100, lng: 76.3300 },
  { pincode: "682507", ward: "Chittethukara", lat: 10.0050, lng: 76.3350 },
  { pincode: "683104", ward: "Kalady", lat: 10.1677, lng: 76.4412 },
];

// 6 real Kochi hospitals
const hospitals = [
  { name: "Amrita Institute of Medical Sciences", lat: 10.0274, lng: 76.3071 },
  { name: "Lakeshore Hospital", lat: 9.9825, lng: 76.3007 },
  { name: "Lisie Hospital", lat: 9.9963, lng: 76.2908 },
  { name: "Ernakulam Medical Centre", lat: 10.0096, lng: 76.3042 },
  { name: "PVS Memorial Hospital", lat: 10.0033, lng: 76.3019 },
  { name: "Aster Medcity", lat: 9.9612, lng: 76.3321 },
];

// ============================================================
// GENERATE DONORS
// ============================================================

interface DonorRow {
  full_name: string;
  phone: string;
  blood_group: string;
  sex: string;
  date_of_birth: string;
  pincode: string;
  ward_name: string;
  district: string;
  lat: number;
  lng: number;
  last_donation_date: string | null;
  total_donations: number;
  is_paused: boolean;
  paused_until: string | null;
}

function generateDonors(count: number): DonorRow[] {
  const donors: DonorRow[] = [];
  const usedPhones = new Set<string>();

  for (let i = 0; i < count; i++) {
    const sex = Math.random() < 0.55 ? "M" : (Math.random() < 0.95 ? "F" : "other");
    const firstName = sex === "F"
      ? randomElement(femaleFirstNames)
      : randomElement(maleFirstNames);
    const lastName = randomElement(lastNames);
    const full_name = `${firstName} ${lastName}`;

    let phone: string;
    do { phone = generatePhone(); } while (usedPhones.has(phone));
    usedPhones.add(phone);

    const blood_group = weightedBloodGroup();
    const location = randomElement(locations);

    // Age 18-60, leaning 25-45
    const age = randomBetween(18, 60);
    const dob = new Date();
    dob.setFullYear(dob.getFullYear() - age);
    dob.setMonth(randomBetween(0, 11));
    dob.setDate(randomBetween(1, 28));

    // ~60% have donated before
    let last_donation_date: string | null = null;
    let total_donations = 0;
    if (Math.random() < 0.6) {
      // Spread: some recent (ineligible), some old (eligible)
      // ~30% donated within 90 days (will be ineligible for males)
      // ~20% donated 91-120 days ago (eligible for males, maybe not females)
      // ~50% donated 121+ days ago (eligible for both)
      const roll = Math.random();
      if (roll < 0.3) {
        last_donation_date = randomDate(10, 89); // recent - ineligible
      } else if (roll < 0.5) {
        last_donation_date = randomDate(90, 119); // edge zone
      } else {
        last_donation_date = randomDate(120, 600); // clearly eligible
      }
      total_donations = randomBetween(1, 12);
    }

    // ~5% are paused
    let is_paused = false;
    let paused_until: string | null = null;
    if (Math.random() < 0.05) {
      is_paused = true;
      if (Math.random() < 0.6) {
        const pu = new Date();
        pu.setDate(pu.getDate() + randomBetween(7, 60));
        paused_until = pu.toISOString();
      }
    }

    donors.push({
      full_name,
      phone,
      blood_group,
      sex,
      date_of_birth: dob.toISOString().split("T")[0],
      pincode: location.pincode,
      ward_name: location.ward,
      district: "Ernakulam",
      lat: location.lat + randomFloat(-0.005, 0.005),
      lng: location.lng + randomFloat(-0.005, 0.005),
      last_donation_date,
      total_donations,
      is_paused,
      paused_until,
    });
  }

  return donors;
}

// ============================================================
// SEED
// ============================================================

async function seed() {
  console.log("🩸 RaktSetu Seed Script\n");

  // Clear existing data (in order due to FK constraints)
  console.log("Clearing existing data...");
  await supabase.from("match_audit").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("contact_reveals").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("notifications").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("blood_requests").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("donors").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  // Seed donors
  console.log("Seeding 150 donors...");
  const donors = generateDonors(150);

  // Insert in batches of 50 to avoid payload limits
  for (let i = 0; i < donors.length; i += 50) {
    const batch = donors.slice(i, i + 50);
    const { error } = await supabase.from("donors").insert(batch);
    if (error) {
      console.error(`Error inserting donors batch ${i / 50 + 1}:`, error);
      process.exit(1);
    }
  }
  console.log(`  ✓ ${donors.length} donors inserted`);

  // Print blood group distribution
  const bgCounts: Record<string, number> = {};
  for (const d of donors) {
    bgCounts[d.blood_group] = (bgCounts[d.blood_group] || 0) + 1;
  }
  console.log("  Blood group distribution:", bgCounts);

  // Count recently donated (ineligible)
  const now = new Date();
  const ineligibleCount = donors.filter((d) => {
    if (!d.last_donation_date) return false;
    const diff = (now.getTime() - new Date(d.last_donation_date).getTime()) / (1000 * 60 * 60 * 24);
    return d.sex === "M" ? diff < 90 : diff < 120;
  }).length;
  console.log(`  ${ineligibleCount} donors currently ineligible (recent donation)`);

  // Get some donor IDs for notifications
  const { data: insertedDonors } = await supabase
    .from("donors")
    .select("id, blood_group, full_name")
    .limit(20);

  // Seed blood requests
  console.log("\nSeeding 3 blood requests...");

  const neededBy1 = new Date();
  neededBy1.setHours(neededBy1.getHours() + 6);

  const neededBy2 = new Date();
  neededBy2.setDate(neededBy2.getDate() + 2);

  const neededBy3 = new Date();
  neededBy3.setDate(neededBy3.getDate() - 1);

  const requests = [
    {
      requester_name: "Dr. Anand Sharma",
      requester_phone: "+919847100001",
      patient_blood_group: "O-",
      units_needed: 3,
      units_confirmed: 0,
      hospital_name: hospitals[0].name,
      hospital_lat: hospitals[0].lat,
      hospital_lng: hospitals[0].lng,
      pincode: "682041",
      district: "Ernakulam",
      urgency: "critical",
      needed_by: neededBy1.toISOString(),
      status: "open",
      notes: "Road accident victim, immediate requirement",
    },
    {
      requester_name: "Nurse Priya Thomas",
      requester_phone: "+919847100002",
      patient_blood_group: "B+",
      units_needed: 2,
      units_confirmed: 1,
      hospital_name: hospitals[2].name,
      hospital_lat: hospitals[2].lat,
      hospital_lng: hospitals[2].lng,
      pincode: "682018",
      district: "Ernakulam",
      urgency: "urgent",
      needed_by: neededBy2.toISOString(),
      status: "partially_fulfilled",
      notes: "Scheduled surgery, one unit already arranged",
    },
    {
      requester_name: "Dr. Meena Krishnan",
      requester_phone: "+919847100003",
      patient_blood_group: "A+",
      units_needed: 2,
      units_confirmed: 2,
      hospital_name: hospitals[5].name,
      hospital_lat: hospitals[5].lat,
      hospital_lng: hospitals[5].lng,
      pincode: "682019",
      district: "Ernakulam",
      urgency: "routine",
      needed_by: neededBy3.toISOString(),
      status: "fulfilled",
      notes: "Thalassemia patient, regular transfusion",
    },
  ];

  const { data: insertedRequests, error: reqError } = await supabase
    .from("blood_requests")
    .insert(requests)
    .select("id, status, patient_blood_group, urgency");

  if (reqError) {
    console.error("Error inserting requests:", reqError);
    process.exit(1);
  }

  console.log(`  ✓ ${insertedRequests?.length || 0} requests inserted`);
  for (const r of insertedRequests || []) {
    console.log(`    - ${r.patient_blood_group} (${r.urgency}) → ${r.status}`);
  }

  // Seed some notifications for the partially_fulfilled and fulfilled requests
  if (insertedRequests && insertedDonors) {
    const partiallyFulfilled = insertedRequests.find(r => r.status === "partially_fulfilled");
    const fulfilled = insertedRequests.find(r => r.status === "fulfilled");

    const notifications = [];
    const reveals = [];

    // For partially_fulfilled: 1 accepted, 2 pending, 1 declined
    if (partiallyFulfilled) {
      const bpDonors = insertedDonors.filter(d => ["B+", "B-", "O+", "O-"].includes(d.blood_group));
      if (bpDonors.length >= 4) {
        notifications.push(
          { request_id: partiallyFulfilled.id, donor_id: bpDonors[0].id, status: "accepted", responded_at: new Date().toISOString() },
          { request_id: partiallyFulfilled.id, donor_id: bpDonors[1].id, status: "pending" },
          { request_id: partiallyFulfilled.id, donor_id: bpDonors[2].id, status: "pending" },
          { request_id: partiallyFulfilled.id, donor_id: bpDonors[3].id, status: "declined", responded_at: new Date().toISOString(), decline_reason: "Not feeling well" },
        );
        reveals.push({ request_id: partiallyFulfilled.id, donor_id: bpDonors[0].id, revealed_to: "both" });
      }
    }

    // For fulfilled: 2 accepted
    if (fulfilled) {
      const apDonors = insertedDonors.filter(d => ["A+", "A-", "O+", "O-"].includes(d.blood_group));
      if (apDonors.length >= 2) {
        const respondedAt = new Date();
        respondedAt.setDate(respondedAt.getDate() - 1);
        notifications.push(
          { request_id: fulfilled.id, donor_id: apDonors[0].id, status: "accepted", responded_at: respondedAt.toISOString() },
          { request_id: fulfilled.id, donor_id: apDonors[1].id, status: "accepted", responded_at: respondedAt.toISOString() },
        );
        reveals.push(
          { request_id: fulfilled.id, donor_id: apDonors[0].id, revealed_to: "both" },
          { request_id: fulfilled.id, donor_id: apDonors[1].id, revealed_to: "both" },
        );
      }
    }

    if (notifications.length > 0) {
      const { error: notifError } = await supabase.from("notifications").insert(notifications);
      if (notifError) console.error("Error inserting notifications:", notifError);
      else console.log(`  ✓ ${notifications.length} notifications inserted`);
    }

    if (reveals.length > 0) {
      const { error: revealError } = await supabase.from("contact_reveals").insert(reveals);
      if (revealError) console.error("Error inserting reveals:", revealError);
      else console.log(`  ✓ ${reveals.length} contact reveals inserted`);
    }
  }

  console.log("\n🎉 Seeding complete!");
  console.log(`\nSummary:
  Donors:   ${donors.length}
  Requests: ${requests.length}
  Hospitals: ${hospitals.length} (embedded in request data)
  `);
}

seed().catch(console.error);
