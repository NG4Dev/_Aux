export type UserType =
  | "client"
  | "internal"
  | "test"
  | "merchant_staff"
  | "browser";

export type Persona = "consumer" | "merchant" | "platform_admin";

const INTERNAL_DOMAINS = ["bravegroup.co.za", "forgebybrave.ai", "ng4.dev"];
const TEST_DOMAINS = ["maildrop.cc"];
const TEST_EMAIL_PATTERNS = [
  /@kwifa\.com$/i,
  /@mailinator\.com$/i,
  /@tempmail/i,
  /@guerrillamail/i,
  /@yopmail\.com$/i,
  /@sharklasers\.com$/i,
  /@10minutemail/i,
  /@throwaway/i,
  /@trashmail/i,
  /undefined/i,
  /\+test@/i,
];

const getAllowlistedInternalEmails = (): Set<string> => {
  const raw = process.env.EXPO_PUBLIC_INTERNAL_EMAILS || "";
  return new Set(
    raw
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
};

const getEmailDomain = (email: string): string => {
  const at = email.lastIndexOf("@");
  if (at < 0) return "";
  return email.slice(at + 1).toLowerCase();
};

export const classifyUserType = (
  emailAddress?: string | null,
  opts?: { isMerchantStaff?: boolean },
): UserType => {
  if (!emailAddress || !emailAddress.includes("@")) {
    return "browser";
  }
  const email = emailAddress.trim().toLowerCase();
  const domain = getEmailDomain(email);
  if (
    getAllowlistedInternalEmails().has(email) ||
    INTERNAL_DOMAINS.some((d) => domain === d || domain.endsWith(`.${d}`))
  ) {
    return "internal";
  }
  if (
    TEST_DOMAINS.some((d) => domain === d || domain.endsWith(`.${d}`)) ||
    TEST_EMAIL_PATTERNS.some((pattern) => pattern.test(email))
  ) {
    return "test";
  }
  if (opts?.isMerchantStaff) return "merchant_staff";
  return "client";
};

export const toAnalyticsUserType = (userType: UserType): string =>
  userType === "browser" ? "website_browser" : userType;
