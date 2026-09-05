import { apiClient } from "@/lib/api-client";
import { ProfileApiResponse } from "./types";

export const ProfileDetailService = async (): Promise<ProfileApiResponse> => {
  try {
    const res = await apiClient.get("/profile/");
    return res.data;
  } catch (err: any) {
    throw err?.response?.data || err;
  }
};
