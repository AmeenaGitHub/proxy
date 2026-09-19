"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { registerDonorAction } from "@/app/actions";
import { getNextEligibleDate, calculateAge, Sex } from "@/lib/matching";

export default function JoinPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states for interactive eligibility calculator
  const [sex, setSex] = useState<Sex>("M");
  const [dob, setDob] = useState<string>("1998-05-15");
  const [lastDonationDate, setLastDonationDate] = useState<string>("");
  const [phone, setPhone] = useState<string>("");

  // OTP Verification Modal State
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [sentOtp, setSentOtp] = useState("");
  const [pendingFormData, setPendingFormData] = useState<FormData | null>(null);

  // Calculate next eligible date in real time
  const nextEligibleDate = getNextEligibleDate(lastDonationDate || null, sex);
  const now = new Date();
  // Age rule: donors must be 18 to 65 years old
  const age = dob ? calculateAge(dob, now) : null;
  const ageOk = age === null || (age >= 18 && age <= 65);
  const isCurrentlyEligible = ageOk && (!nextEligibleDate || nextEligibleDate.getTime() <= now.getTime());

  // Handle form submit -> trigger OTP verification modal
  const handlePreSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);

    const formData = new FormData(e.currentTarget);
    const dobInput = formData.get("date_of_birth") as string;
    const enteredAge = dobInput ? calculateAge(dobInput, new Date()) : null;
    if (enteredAge === null || enteredAge < 18 || enteredAge > 65) {
      setErrorMsg("Donors must be between 18 and 65 years old. Please check the date of birth.");
      return;
    }

    const phoneInput = formData.get("phone") as string;
    if (!phoneInput || phoneInput.length < 10) {
      setErrorMsg("Please enter a valid 10-digit mobile number.");
      return;
    }

    // Generate demo 6-digit OTP code
    const generated = Math.floor(100000 + Math.random() * 900000).toString();
    setSentOtp(generated);
    setPendingFormData(formData);
    setShowOtpModal(true);
  };

  // Confirm OTP & execute Server Action
  const handleVerifyOtp = () => {
    if (!otpCode || otpCode.length !== 6) {
      setErrorMsg("Please enter any 6-digit OTP code.");
      return;
    }

    if (!pendingFormData) return;

    startTransition(async () => {
      const res = await registerDonorAction(pendingFormData);
      if (res.success) {
        setShowOtpModal(false);
        router.push("/donor");
      } else {
        setErrorMsg(res.error || "Failed to register. Please try again.");
        setShowOtpModal(false);
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
          <span className="badge badge-success mb-2">Step 1 of 2 — Free Registration</span>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Become a Verified Blood Donor
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Join Ernakulam district's private blood donor network. Your phone number is never shared without your explicit consent.
          </p>
        </div>

        {errorMsg && (
          <div className="mt-6 rounded-xl border border-crimson/30 bg-crimson-light/20 p-4 text-sm text-crimson">
            {errorMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handlePreSubmit} className="mt-8 space-y-6">
          {/* Full Name */}
          <div>
            <label htmlFor="full_name" className="block text-sm font-medium text-foreground">
              Full Name <span className="text-crimson">*</span>
            </label>
            <input
              type="text"
              id="full_name"
              name="full_name"
              required
              placeholder="e.g. Arun Kumar"
              className="mt-1 w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground focus-visible:outline-crimson"
            />
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-foreground">
              Mobile Phone Number <span className="text-crimson">*</span>
            </label>
            <div className="mt-1 flex rounded-xl border border-border bg-card">
              <span className="inline-flex items-center rounded-l-xl bg-subtle px-3 text-sm text-muted font-mono">
                +91
              </span>
              <input
                type="tel"
                id="phone"
                name="phone"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="98470 12345"
                className="w-full rounded-r-xl border-0 bg-transparent px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-0"
              />
            </div>
            <p className="mt-1 text-xs text-muted">
              Used for OTP verification. Kept 100% private until you accept a request.
            </p>
          </div>

          {/* Blood Group & Sex */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="blood_group" className="block text-sm font-medium text-foreground">
                Blood Group <span className="text-crimson">*</span>
              </label>
              <select
                id="blood_group"
                name="blood_group"
                required
                className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-foreground focus-visible:outline-crimson"
              >
                <option value="O+">O+ (Positive)</option>
                <option value="O-">O- (Universal Donor)</option>
                <option value="A+">A+ (Positive)</option>
                <option value="A-">A- (Negative)</option>
                <option value="B+">B+ (Positive)</option>
                <option value="B-">B- (Negative)</option>
                <option value="AB+">AB+ (Positive)</option>
                <option value="AB-">AB- (Negative)</option>
              </select>
            </div>

            <div>
              <label htmlFor="sex" className="block text-sm font-medium text-foreground">
                Sex <span className="text-crimson">*</span>
              </label>
              <select
                id="sex"
                name="sex"
                required
                value={sex}
                onChange={(e) => setSex(e.target.value as Sex)}
                className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-foreground focus-visible:outline-crimson"
              >
                <option value="M">Male (90-day interval)</option>
                <option value="F">Female (120-day interval)</option>
                <option value="other">Other (120-day interval)</option>
              </select>
            </div>
          </div>

          {/* Date of Birth */}
          <div>
            <label htmlFor="date_of_birth" className="block text-sm font-medium text-foreground">
              Date of Birth <span className="text-crimson">*</span>
            </label>
            <input
              type="date"
              id="date_of_birth"
              name="date_of_birth"
              required
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground focus-visible:outline-crimson"
            />
            <p className="mt-1 text-xs text-muted">Must be between 18 and 65 years of age.</p>
          </div>

          {/* Last Donation Date & LIVE ELIGIBILITY CALCULATOR WIDGET */}
          <div className="card p-5 border-l-4 border-l-crimson">
            <div className="flex items-center justify-between">
              <label htmlFor="last_donation_date" className="block text-sm font-semibold text-foreground">
                Last Blood Donation Date
              </label>
              <span className="text-xs text-muted">Optional</span>
            </div>
            <input
              type="date"
              id="last_donation_date"
              name="last_donation_date"
              value={lastDonationDate}
              onChange={(e) => setLastDonationDate(e.target.value)}
              className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground focus-visible:outline-crimson"
            />

            {/* Real-time eligibility calculator result card */}
            <div className="mt-4 rounded-xl bg-subtle p-3.5 text-sm">
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${!ageOk ? "bg-crimson" : isCurrentlyEligible ? "bg-green animate-pulse" : "bg-amber-500"}`} />
                <span className="font-semibold text-foreground">
                  Eligibility Calculator Status:
                </span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-muted">
                {!ageOk ? (
                  <span className="text-crimson font-medium">
                    Donors must be between 18 and 65 years old. With this date of birth you are {age}, so you cannot register as a donor.
                  </span>
                ) : isCurrentlyEligible ? (
                  <span className="text-green font-medium">
                    ✓ You are eligible to donate blood today!
                  </span>
                ) : (
                  <span>
                    You can next donate on{" "}
                    <strong className="text-foreground">
                      {nextEligibleDate?.toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </strong>{" "}
                    ({sex === "M" ? "90-day" : "120-day"} NBTC India guidance interval enforced).
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Location / Pincode */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="pincode" className="block text-sm font-medium text-foreground">
                Pincode <span className="text-crimson">*</span>
              </label>
              <input
                type="text"
                id="pincode"
                name="pincode"
                required
                placeholder="682017"
                defaultValue="682017"
                className="mt-1 w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground focus-visible:outline-crimson font-mono"
              />
            </div>
            <div>
              <label htmlFor="ward_name" className="block text-sm font-medium text-foreground">
                Ward / Area Name
              </label>
              <input
                type="text"
                id="ward_name"
                name="ward_name"
                placeholder="Palarivattom"
                defaultValue="Palarivattom"
                className="mt-1 w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground focus-visible:outline-crimson"
              />
            </div>
          </div>

          <input type="hidden" name="district" value="Ernakulam" />

          {/* Submit */}
          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-xl bg-crimson py-3 text-base font-medium text-white transition-base hover:opacity-90 focus-visible:outline-crimson disabled:opacity-50"
          >
            {isPending ? "Registering..." : "Verify & Join Network →"}
          </button>
        </form>

        {/* OTP Modal */}
        {showOtpModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="card w-full max-w-md p-6 shadow-lg">
              <h2 className="text-lg font-semibold text-foreground">
                Enter Mobile OTP Code
              </h2>
              <p className="mt-1 text-sm text-muted">
                Sent to <strong className="text-foreground">+91 {phone}</strong>
              </p>

              {/* Dev Panel displaying sent OTP */}
              <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                <div className="font-semibold flex items-center gap-1.5">
                  <span className="inline-block h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                  Dev Panel / Demo Mode SMS Log:
                </div>
                <p className="mt-1">
                  Sent OTP Code: <strong className="font-mono text-sm underline">{sentOtp}</strong> (or enter any 6-digit code).
                </p>
              </div>

              <div className="mt-4">
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-center text-2xl tracking-widest font-mono text-foreground focus-visible:outline-crimson"
                />
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowOtpModal(false)}
                  className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground transition-base hover:bg-surface-hover"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleVerifyOtp}
                  disabled={isPending || otpCode.length !== 6}
                  className="rounded-xl bg-crimson px-5 py-2 text-sm font-medium text-white transition-base hover:opacity-90 disabled:opacity-50"
                >
                  {isPending ? "Verifying..." : "Confirm Login"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
