import { apiClient } from "@/lib/api-client";

export const getSupportMasterList = async (endpoint: string, params?: any) => {
  try {
    const res = await apiClient.get(`/master/${endpoint}/`, { params });
    return res.data;
  } catch (err: any) {
    throw err?.response?.data || err;
  }
};

export const createSupportMasterItem = async (
  endpoint: string,
  payload: any,
) => {
  try {
    const res = await apiClient.post(`/master/${endpoint}/create/`, payload);
    return res.data;
  } catch (err: any) {
    throw err?.response?.data || err;
  }
};

export const updateSupportMasterItem = async (
  endpoint: string,
  id: any,
  payload: any,
) => {
  try {
    const res = await apiClient.patch(`/master/${endpoint}/${id}/`, payload);
    return res.data;
  } catch (err: any) {
    throw err?.response?.data || err;
  }
};

export const getSupportMasterItemDetail = async (endpoint: string, id: any) => {
  try {
    const res = await apiClient.get(`/master/${endpoint}/${id}/`);
    return res.data;
  } catch (err: any) {
    throw err?.response?.data || err;
  }
};
