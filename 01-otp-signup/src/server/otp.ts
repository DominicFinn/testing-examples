import { createHash, randomInt } from 'node:crypto';
import { OTP_LENGTH } from '../shared/otp.ts';

export function generateCode(): string {
  return randomInt(0, 10 ** OTP_LENGTH).toString().padStart(OTP_LENGTH, '0');
}

// We only ever store the hash, so a leaked database doesn't hand out working codes.
export function hashCode(code: string): string {
  return createHash('sha256').update(code).digest('hex');
}
