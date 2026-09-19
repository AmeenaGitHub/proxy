"use server";

import { createServerClient } from "@/lib/supabase/server";
import { findEligibleDonors, getBatchToNotify, calculateAge, BloodGroup, Sex, Urgency } from "@/lib/matching";
import { setSession, clearSession, getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

/**
 * Register a new donor
 */
export async function registerDonorAction(formData: FormData) {
  const full_name = (formData.get("full_name") as string)?.trim();
  const phone = (formData.get("phone") as string)?.trim();
  const blood_group = formData.get("blood_group") as BloodGroup;
  const sex = formData.get("sex") as Sex;
  const date_of_birth = formData.get("date_of_birth") as string;
  const pincode = (formData.get("pincode") as string)?.trim();
  const ward_name = (formData.get("ward_name") as string)?.trim() || null;
  const district = (formData.get("district") as string)?.trim() || "Ernakulam";
  const last_donation_date = (formData.get("last_donation_date") as string)?.trim() || null;

  if (!full_name || !phone || !blood_group || !sex || !date_of_birth || !pincode) {
    return { success: false, error: "Please fill in all required fields." };
  }

  // Age rule (NBTC): donors must be 18 to 65 years old
  if (isNaN(new Date(date_of_birth).getTime())) {
    return { success: false, error: "Please enter a valid date of birth." };
  }
  const donorAge = calculateAge(date_of_birth, new Date());
  if (donorAge < 18 || donorAge > 65) {
    return { success: false, error: "Donors must be between 18 and 65 years old." };
  }

  // Lat/lng lookup fallback for Kochi pincodes
  let lat = 9.9937;
  let lng = 76.2988;
  if (pincode === "682017") { lat = 10.0265; lng = 76.3085; }
  else if (pincode === "682019") { lat = 9.9717; lng = 76.3209; }
  else if (pincode === "682303") { lat = 10.0155; lng = 76.3540; }

  const supabase = createServerClient();

  // Check if donor already exists by phone
  const { data: existing } = await supabase
    .from("donors")
    .select("id, full_name, phone")
    .eq("phone", phone)
    .single();

  if (existing) {
    // Log them in directly
    await setSession({
      donorId: existing.id,
      phone: existing.phone,
      full_name: existing.full_name,
      isLoggedIn: true,
    });
    return { success: true, donorId: existing.id, isExisting: true };
  }

  const newDonor = {
    full_name,
    phone,
    blood_group,
    sex,
    date_of_birth,
    pincode,
    ward_name,
    district,
    lat,
    lng,
    last_donation_date,
    total_donations: last_donation_date ? 1 : 0,
    is_paused: false,
  };

  const { data: inserted, error } = await supabase
    .from("donors")
    .insert(newDonor)
    .select("id, full_name, phone")
    .single();

  if (error || !inserted) {
    console.error("Error registering donor:", error);
    return { success: false, error: error?.message || "Failed to register donor." };
  }

  // Set auth session
  await setSession({
    donorId: inserted.id,
    phone: inserted.phone,
    full_name: inserted.full_name,
    isLoggedIn: true,
  });

  revalidatePath("/donor");
  return { success: true, donorId: inserted.id };
}

/**
 * Login donor by phone
 */
export async function loginDonorByPhoneAction(phone: string) {
  const cleanedPhone = phone.trim();
  const supabase = createServerClient();

  const { data: donor } = await supabase
    .from("donors")
    .select("id, full_name, phone")
    .eq("phone", cleanedPhone)
    .single();

  if (!donor) {
    return { success: false, error: "No registered donor found with this phone number." };
  }

  await setSession({
    donorId: donor.id,
    phone: donor.phone,
    full_name: donor.full_name,
    isLoggedIn: true,
  });

  return { success: true, donorId: donor.id };
}

/**
 * Logout donor
 */
export async function logoutAction() {
  await clearSession();
  revalidatePath("/donor");
  return { success: true };
}

/**
 * Create a new blood request & trigger matching engine
 */
export async function createRequestAction(formData: FormData) {
  const requester_name = (formData.get("requester_name") as string)?.trim();
  const requester_phone = (formData.get("requester_phone") as string)?.trim();
  const patient_blood_group = formData.get("patient_blood_group") as BloodGroup;
  const units_needed = parseInt(formData.get("units_needed") as string || "1", 10);
  const hospital_name = (formData.get("hospital_name") as string)?.trim();
  const hospital_lat = parseFloat(formData.get("hospital_lat") as string || "9.9937");
  const hospital_lng = parseFloat(formData.get("hospital_lng") as string || "76.2988");
  const urgency = (formData.get("urgency") as string || "urgent") as Urgency;
  const needed_by_hours = parseInt(formData.get("needed_by_hours") as string || "24", 10);
  const notes = (formData.get("notes") as string)?.trim() || null;

  if (!requester_name || !requester_phone || !patient_blood_group || !hospital_name) {
    return { success: false, error: "Please fill in all required request fields." };
  }

  const neededByDate = new Date();
  neededByDate.setHours(neededByDate.getHours() + needed_by_hours);

  const supabase = createServerClient();

  // 1. Insert Request
  const { data: newRequest, error: reqErr } = await supabase
    .from("blood_requests")
    .insert({
      requester_name,
      requester_phone,
      patient_blood_group,
      units_needed,
      units_confirmed: 0,
      hospital_name,
      hospital_lat,
      hospital_lng,
      district: "Ernakulam",
      urgency,
      needed_by: neededByDate.toISOString(),
      status: "open",
      notes,
    })
    .select("id")
    .single();

  if (reqErr || !newRequest) {
    console.error("Error creating request:", reqErr);
    return { success: false, error: reqErr?.message || "Failed to create request." };
  }

  const requestId = newRequest.id;

  // 2. Fetch all district donors to run pure matching engine
  const { data: allDonorsRaw } = await supabase
    .from("donors")
    .select("*")
    .eq("district", "Ernakulam");

  // Fetch recent notifications to pass notification fatigue history to engine
  const { data: recentNotifs } = await supabase
    .from("notifications")
    .select("donor_id, sent_at, status, request_id");

  const donorFatigueMap: Record<string, { lastNotifiedAt?: string; declinedReqs: string[] }> = {};
  for (const n of recentNotifs || []) {
    if (!donorFatigueMap[n.donor_id]) {
      donorFatigueMap[n.donor_id] = { declinedReqs: [] };
    }
    if (n.sent_at) {
      const prev = donorFatigueMap[n.donor_id].lastNotifiedAt;
      if (!prev || new Date(n.sent_at) > new Date(prev)) {
        donorFatigueMap[n.donor_id].lastNotifiedAt = n.sent_at;
      }
    }
    if (n.status === "declined") {
      donorFatigueMap[n.donor_id].declinedReqs.push(n.request_id);
    }
  }

  const donorsForEngine = (allDonorsRaw || []).map((d) => ({
    id: d.id,
    full_name: d.full_name,
    phone: d.phone,
    blood_group: d.blood_group as BloodGroup,
    sex: d.sex,
    date_of_birth: d.date_of_birth,
    lat: d.lat,
    lng: d.lng,
    last_donation_date: d.last_donation_date,
    is_paused: d.is_paused,
    paused_until: d.paused_until,
    last_notified_at: donorFatigueMap[d.id]?.lastNotifiedAt || null,
    declined_request_ids: donorFatigueMap[d.id]?.declinedReqs || [],
  }));

  const requestInput = {
    id: requestId,
    patient_blood_group,
    units_needed,
    hospital_lat,
    hospital_lng,
    urgency,
    district: "Ernakulam",
  };

  const matchResult = findEligibleDonors(requestInput, donorsForEngine, new Date());

  // 3. Log match audit
  const batchToNotify = getBatchToNotify(matchResult.eligible, units_needed);

  await supabase.from("match_audit").insert({
    request_id: requestId,
    total_donors_in_district: matchResult.summary.total_in_district,
    excluded_wrong_group: matchResult.summary.excluded_wrong_group,
    excluded_ineligible: matchResult.summary.excluded_ineligible,
    excluded_paused: matchResult.summary.excluded_paused,
    excluded_too_far: matchResult.summary.excluded_too_far,
    excluded_recently_notified: matchResult.summary.excluded_recently_notified,
    notified_count: batchToNotify.length,
    payload: {
      excluded_details: matchResult.excluded,
      eligible_count: matchResult.eligible.length,
      notified_batch_size: batchToNotify.length,
    },
  });

  // 4. Create notification rows for first batch
  if (batchToNotify.length > 0) {
    const notifRows = batchToNotify.map((rd) => ({
      request_id: requestId,
      donor_id: rd.donor.id,
      channel: "in_app",
      status: "pending",
      sent_at: new Date().toISOString(),
    }));

    await supabase.from("notifications").insert(notifRows);
  }

  revalidatePath(`/request/${requestId}`);
  return { success: true, requestId, notifiedCount: batchToNotify.length };
}

/**
 * Respond to notification (Accept / Decline)
 */
export async function respondToNotificationAction(
  notificationId: string,
  responseStatus: "accepted" | "declined",
  declineReason?: string
) {
  const supabase = createServerClient();

  const { data: notif, error: nErr } = await supabase
    .from("notifications")
    .select("id, request_id, donor_id, status")
    .eq("id", notificationId)
    .single();

  if (nErr || !notif) {
    return { success: false, error: "Notification not found." };
  }

  // Only the donor this notification was sent to may answer it
  const session = await getSession();
  if (!session?.donorId || session.donorId !== notif.donor_id) {
    return { success: false, error: "Please log in as this donor to respond." };
  }

  // Each notification can be answered only once, and only while it is still pending
  if (notif.status !== "pending") {
    return { success: false, error: "This request was already answered or is no longer needed." };
  }

  const now = new Date().toISOString();

  // Update notification status
  await supabase
    .from("notifications")
    .update({
      status: responseStatus,
      responded_at: now,
      decline_reason: declineReason || null,
    })
    .eq("id", notificationId);

  if (responseStatus === "accepted") {
    // 1. Create audit contact_reveals row
    await supabase.from("contact_reveals").insert({
      request_id: notif.request_id,
      donor_id: notif.donor_id,
      revealed_to: "both",
      revealed_at: now,
    });

    // 2. Fetch request to check units_confirmed
    const { data: req } = await supabase
      .from("blood_requests")
      .select("id, units_needed, units_confirmed, status")
      .eq("id", notif.request_id)
      .single();

    if (req) {
      const newConfirmed = req.units_confirmed + 1;
      const newStatus = newConfirmed >= req.units_needed ? "fulfilled" : "partially_fulfilled";

      await supabase
        .from("blood_requests")
        .update({
          units_confirmed: newConfirmed,
          status: newStatus,
        })
        .eq("id", notif.request_id);

      // If fulfilled, mark remaining pending notifications as expired
      if (newStatus === "fulfilled") {
        await supabase
          .from("notifications")
          .update({ status: "expired" })
          .eq("request_id", notif.request_id)
          .eq("status", "pending");
      }
    }
  }

  revalidatePath(`/request/${notif.request_id}`);
  revalidatePath("/donor");
  return { success: true };
}

/**
 * Mark unit received manually by requester
 */
export async function markUnitReceivedAction(requestId: string) {
  const supabase = createServerClient();

  const { data: req } = await supabase
    .from("blood_requests")
    .select("id, units_needed, units_confirmed")
    .eq("id", requestId)
    .single();

  if (!req) return { success: false, error: "Request not found." };

  const newConfirmed = req.units_confirmed + 1;
  const newStatus = newConfirmed >= req.units_needed ? "fulfilled" : "partially_fulfilled";

  await supabase
    .from("blood_requests")
    .update({
      units_confirmed: newConfirmed,
      status: newStatus,
    })
    .eq("id", requestId);

  if (newStatus === "fulfilled") {
    await supabase
      .from("notifications")
      .update({ status: "expired" })
      .eq("request_id", requestId)
      .eq("status", "pending");
  }

  revalidatePath(`/request/${requestId}`);
  return { success: true, newConfirmed, isFulfilled: newStatus === "fulfilled" };
}

/**
 * Toggle Donor Pause State
 */
export async function togglePauseDonorAction(donorId: string, isPaused: boolean, pausedUntil?: string | null) {
  const supabase = createServerClient();

  const { error } = await supabase
    .from("donors")
    .update({
      is_paused: isPaused,
      paused_until: isPaused ? (pausedUntil || null) : null,
    })
    .eq("id", donorId);

  if (error) return { success: false, error: error.message };
  revalidatePath("/donor");
  return { success: true };
}

/**
 * Delete Donor Account
 */
export async function deleteDonorAccountAction(donorId: string) {
  const supabase = createServerClient();

  // Delete notifications first
  await supabase.from("notifications").delete().eq("donor_id", donorId);
  await supabase.from("donors").delete().eq("id", donorId);
  await clearSession();

  revalidatePath("/donor");
  return { success: true };
}
