export const ADMIN_COOKIE_NAME = "bnc_admin_session";

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  return atob(base64);
}

/**
 * Fast Edge-compatible token validation for middleware routing
 */
export function isEdgeAdminTokenValid(token: string | undefined | null): boolean {
  if (!token || typeof token !== "string") return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;

  const [payloadBase64] = parts;
  try {
    const payloadStr = base64UrlDecode(payloadBase64);
    const payload = JSON.parse(payloadStr);
    if (payload.role !== "admin") return false;
    if (typeof payload.exp !== "number" || payload.exp < Date.now()) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}
