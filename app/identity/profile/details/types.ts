import { ApiResponse } from '@/lib/types';

export type ProfileResponseData = {
  username: string;
  name: string;
  email: string | null;
  phone: string;

  bar_council_number: string | null;

  role: string;
  role_detail?: any | null;

  gender: "MALE" | "FEMALE" | "OTHER" | null;

  employee_id?: string | null;

  court?: string | null;
  court_detail?: any | null;

  court_location?: string | null;
  court_location_detail?: any | null;

  state_code_census?: string | null;
  state_name?: string | null;

  mandal_code?: string | null;
  mandal_name?: string | null;

  district_code_census?: string | null;
  district_name?: string | null;

  tehsil_code_census?: string | null;
  tehsil_name?: string | null;

  pargana_code?: string | null;
  pargana_name?: string | null;

  ricircle_code?: string | null;
  ricircle_name?: string | null;

  rsicircle_code?: string | null;
  rsicircle_name?: string | null;

  village_code_census?: string | null;
  village_name?: string | null;
};

export type ProfileApiResponse = ApiResponse<ProfileResponseData>;

