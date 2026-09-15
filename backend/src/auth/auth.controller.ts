import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { ApiError } from '../middleware/error';
import { AuthService } from './auth.service';

const credentialsSchema = z.object({ mobile: z.string().min(1) }).strict();
const verificationSchema = z.object({ mobile: z.string().min(1), otp: z.string().min(1) }).strict();

/** Creates request handlers for the authentication flow. */
export function createAuthController(authService: AuthService) {
  /** Validates a login handoff without persisting a user. */
  const login = (request: Request, response: Response, next: NextFunction): void => {
    try {
      const parsed = credentialsSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new ApiError(400, 'INVALID_REQUEST', 'A mobile string is required.');
      }
      response.status(200).json({ data: authService.acceptLogin(parsed.data.mobile) });
    } catch (error) {
      next(error);
    }
  };

  /** Validates a one-time passcode and returns a signed demo token. */
  const verify = (request: Request, response: Response, next: NextFunction): void => {
    try {
      const parsed = verificationSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new ApiError(400, 'INVALID_REQUEST', 'Mobile and OTP strings are required.');
      }
      const result = authService.verifyOtp(parsed.data.mobile, parsed.data.otp);
      if (!result) {
        throw new ApiError(400, 'OTP_NOT_ACCEPTED', 'The one-time passcode was not accepted.');
      }
      response.status(200).json({ data: result });
    } catch (error) {
      next(error);
    }
  };

  return { login, verify };
}
