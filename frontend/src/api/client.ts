/** Describes a standard API response wrapper. */
interface ApiResponse<T> {
  data: T;
}

/** Describes the error body returned by the backend. */
interface ApiErrorBody {
  error?: { message?: string };
}

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';

/** Sends an API request and returns its data payload or a client-safe message. */
async function request<T>(path: string, body: Record<string, string>): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const payload = (await response.json()) as ApiResponse<T> & ApiErrorBody;
  if (!response.ok) {
    throw new Error(payload.error?.message ?? 'Unable to complete this request.');
  }
  return payload.data;
}

/** Accepts a mobile identifier before OTP entry. */
export function login(mobile: string): Promise<{ accepted: true; mobile: string }> {
  return request('/api/auth/login', { mobile });
}

/** Verifies an OTP and returns the backend-issued token. */
export function verify(mobile: string, otp: string): Promise<{ verified: true; token: string; flowMobile: string; actor: { id: number } }> {
  return request('/api/auth/verify', { mobile, otp });
}
