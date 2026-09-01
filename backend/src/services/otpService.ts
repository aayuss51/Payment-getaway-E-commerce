const otpStore: Record<string, { otp: string; expires: number }> = {};

export const generateOtp = (email: string) => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expires = Date.now() + 10 * 60 * 1000; // 10 minutes
  otpStore[email] = { otp, expires };
  return otp;
};

export const verifyOtp = (email: string, otp: string) => {
  const stored = otpStore[email];
  if (!stored) return { valid: false, error: "No OTP found" };
  if (Date.now() > stored.expires) {
    delete otpStore[email];
    return { valid: false, error: "OTP expired" };
  }
  if (stored.otp !== otp) return { valid: false, error: "Invalid OTP" };

  delete otpStore[email];
  return { valid: true };
};
