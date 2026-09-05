import { apiClient } from "@/lib/api-client";
import {
  SingoutAllResponse,
  SingoutOnePayload,
  SingoutOneResponse,
} from "./types";

export const SignOutAllService = async (): Promise<SingoutAllResponse> => {
  try {
    const res = await apiClient.post("/sessions/logout-all/");
    return res.data;
  } catch (err: any) {
    throw err?.response?.data || err;
  }
};

export const SignOutOneService = async (
  payload: SingoutOnePayload,
): Promise<SingoutOneResponse> => {
  try {
    const res = await apiClient.post("/sessions/logout-one/", payload);
    return res.data;
  } catch (err: any) {
    throw err?.response?.data || err;
  }
};
