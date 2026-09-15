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
async function request<T>(path: string, body: Record<string, string | number | string[]>): Promise<T> {
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

/** Gets an API resource and returns its data payload or a client-safe message. */
export async function get<T>(path: string): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`);
  const payload = (await response.json()) as ApiResponse<T> & ApiErrorBody;
  if (!response.ok) {
    throw new Error(payload.error?.message ?? 'Unable to load this data.');
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

/** Describes the canonical booking confirmation returned by the booking API. */
export interface BookingConfirmationResponse {
  confirmationId: string;
  booking: { id: number; movie: string; theatre: string; seats: string[]; paymentMethod: 'CARD' | 'UPI'; totalPrice: number };
}

/** Posts a validated booking selection for the fixed journey actor. */
export function createBooking(input: { userId: number; movieId: number; theatreId: number; seats: string[]; paymentMethod: 'CARD' | 'UPI'; totalPrice: number }): Promise<BookingConfirmationResponse> {
  return request('/api/bookings', input);
}
