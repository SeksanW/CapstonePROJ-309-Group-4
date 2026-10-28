/* ---------------------------------------------------------
  Calls to the backend gateway (VITE_API_URL in .env.local).

  Errors from the API look like { error, details } — they are
  thrown as ApiError so screens can show the message, and the
  cart can list each problem in `details`.
   --------------------------------------------------------- */

export const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:8080").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

/* `token` is the shopper's Firebase ID token, for signed-in routes. */
export async function api(path, { method = "GET", body, token } = {}) {
  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        ...(body && { "Content-Type": "application/json" }),
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: body && JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, "Couldn't reach the store. Check your connection and try again.");
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(res.status, data?.error || `Request failed (${res.status})`, data?.details);
  }
  return data;
}
