import { useQuery } from "@tanstack/react-query";
import {
  getTicketsList,
  getTicketDetail,
  getTicketMessages,
  getTicketStats,
} from "./services";

export const useTicketsList = (params?: any) => {
  return useQuery({
    queryKey: ["SUPPORT_TICKETS_LIST", params],
    queryFn: () => getTicketsList(params),
  });
};

export const useTicketDetail = (ticketNumber: string) => {
  return useQuery({
    queryKey: ["SUPPORT_TICKETS_DETAIL", ticketNumber],
    queryFn: () => getTicketDetail(ticketNumber),
    enabled: !!ticketNumber,
  });
};

export const useTicketMessages = (ticketNumber: string) => {
  return useQuery({
    queryKey: ["SUPPORT_TICKETS_MESSAGES", ticketNumber],
    queryFn: () => getTicketMessages(ticketNumber),
    enabled: !!ticketNumber,
  });
};

export const useTicketStats = () => {
  return useQuery({
    queryKey: ["SUPPORT_TICKETS_STATS"],
    queryFn: getTicketStats,
  });
};
