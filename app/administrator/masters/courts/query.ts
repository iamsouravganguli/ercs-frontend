import { useQuery } from "@tanstack/react-query";
import { CourtListService, CourtDetailService } from "./services";

export const useCourtList = (payload?: any) => {
  return useQuery({
    queryKey: ["COURT_LIST_MASTER", payload],
    queryFn: () => CourtListService(payload),
  });
};

export const useCourtListDropdown = (payload?: any) => {
  return useQuery({
    queryKey: ["COURT_LIST_MASTER_DROPDOWN", payload],
    queryFn: () => CourtListService(payload),
  });
};

export const useCourtDetail = (id: string) => {
  return useQuery({
    queryKey: ["COURT_DETAIL_MASTER", id],
    queryFn: () => CourtDetailService(id),
    enabled: !!id,
  });
};
