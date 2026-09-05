import { useQuery } from "@tanstack/react-query";
import { getSupportMasterList, getSupportMasterItemDetail } from "./services";

export const useSupportMasterList = (endpoint: string, payload?: any) => {
  return useQuery({
    queryKey: ["SUPPORT_MASTER_LIST", endpoint, payload],
    queryFn: () => getSupportMasterList(endpoint, payload),
    enabled: !!endpoint,
  });
};

export const useSupportMasterDetail = (endpoint: string, id: any) => {
  return useQuery({
    queryKey: ["SUPPORT_MASTER_DETAIL", endpoint, id],
    queryFn: () => getSupportMasterItemDetail(endpoint, id),
    enabled: !!endpoint && !!id,
  });
};
