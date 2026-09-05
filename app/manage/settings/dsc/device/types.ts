import { ApiResponse } from '@/lib/types';

export type DSCResponseData = Record<string, unknown>;

export type DSCApiResponse = ApiResponse<DSCResponseData>;
export type DSCRequest = {
  device_id: number;
  cert_id: number;
  subject: string;
  issuer: string;
  serial: string;
  valid_from: string;
  valid_to: string;
  certificate: string;
};
