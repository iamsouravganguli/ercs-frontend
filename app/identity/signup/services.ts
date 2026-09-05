import { apiClient } from "@/lib/api-client";
import { SignupApiResponse, SignupRequest } from "./types";

export const SignupService = async (
  payload: SignupRequest,
): Promise<SignupApiResponse> => {
  try {
    const res = await apiClient.post("/auth/signup/", payload);
    return res.data;
  } catch (err: any) {
    throw err?.response?.data || err;
  }
};
