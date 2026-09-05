import { apiClient } from "@/lib/api-client";

export const getTicketsList = async (params?: any) => {
  try {
    const res = await apiClient.get("/support/tickets/", { params });
    return res.data;
  } catch (err: any) {
    throw err?.response?.data || err;
  }
};

export const createTicket = async (payload: any) => {
  try {
    const res = await apiClient.post("/support/tickets/create/", payload);
    return res.data;
  } catch (err: any) {
    throw err?.response?.data || err;
  }
};

export const getTicketDetail = async (ticketNumber: string) => {
  try {
    const res = await apiClient.get(`/support/tickets/${ticketNumber}/`);
    return res.data;
  } catch (err: any) {
    throw err?.response?.data || err;
  }
};

export const getTicketMessages = async (ticketNumber: string) => {
  try {
    const res = await apiClient.get(
      `/support/tickets/${ticketNumber}/messages/`,
    );
    return res.data;
  } catch (err: any) {
    throw err?.response?.data || err;
  }
};

export const createTicketMessage = async (
  ticketNumber: string,
  payload: any,
) => {
  try {
    const res = await apiClient.post(
      `/support/tickets/${ticketNumber}/messages/`,
      payload,
    );
    return res.data;
  } catch (err: any) {
    throw err?.response?.data || err;
  }
};

export const updateTicketStatus = async (
  ticketNumber: string,
  payload: any,
) => {
  try {
    const res = await apiClient.patch(
      `/support/tickets/${ticketNumber}/`,
      payload,
    );
    return res.data;
  } catch (err: any) {
    throw err?.response?.data || err;
  }
};

export const getTicketStats = async () => {
  try {
    const res = await apiClient.get("/support/tickets/stats/");
    return res.data;
  } catch (err: any) {
    throw err?.response?.data || err;
  }
};
