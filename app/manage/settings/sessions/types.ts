import { ApiResponse } from '@/lib/types';

export type SingoutAllData = null | undefined;
export type SingoutOnePayload = {
  session_id: string;
};
export type SingoutOneData = null | undefined;
export type SingoutAllResponse = ApiResponse<SingoutAllData>;

export type SingoutOneResponse = ApiResponse<SingoutOneData>;
