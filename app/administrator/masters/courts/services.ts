import { apiClient } from "@/lib/api-client";
import { CourtListResponse, CourtDetailResponse } from "./types";

export const CourtListService = async (
  payload?: any,
): Promise<CourtListResponse> => {
  try {
    const res = await apiClient.get("/master/courts/", {
      params: payload,
    });
    return res.data;
  } catch (err: any) {
    throw err?.response?.data || err;
  }
};
export const CourtCreateService = async (
  payload?: any,
): Promise<CourtDetailResponse> => {
  try {
    const res = await apiClient.post("/master/courts/create/", payload);
    return res.data;
  } catch (err: any) {
    throw err?.response?.data || err;
  }
};
export const CourtUpdateService = async (
  payload?: any,
  id?: string,
): Promise<CourtDetailResponse> => {
  try {
    const res = await apiClient.patch("/master/courts/" + id + "/", payload);
    return res.data;
  } catch (err: any) {
    throw err?.response?.data || err;
  }
};

export const CourtDetailService = async (
  id: string,
): Promise<CourtDetailResponse> => {
  try {
    const res = await apiClient.get("/master/courts/" + id + "/");
    return res.data;
  } catch (err: any) {
    throw err?.response?.data || err;
  }
};

