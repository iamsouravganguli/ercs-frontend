import { useQuery } from "@tanstack/react-query";
import {
  RoleListService,
  RoleDetailService,
  PermissionListService,
  PermissionDetailService,
  UserListService,
  UserDetailService,
} from "./services";

export const useRoleList = (payload?: any) => {
  return useQuery({
    queryKey: ["ROLE_LIST", payload],
    queryFn: async () => RoleListService(payload),
  });
};
export const usePermissionList = (payload?: any) => {
  return useQuery({
    queryKey: ["PERMISSION_LIST", payload],
    queryFn: async () => PermissionListService(payload),
  });
};
export const usePermissionDetail = (id: string) => {
  return useQuery({
    queryKey: ["PERMISSION_DETAIL", id],
    queryFn: async () => PermissionDetailService(id),
    enabled: !!id,
  });
};
export const useUserList = (payload?: any) => {
  return useQuery({
    queryKey: ["USER_LIST", payload],
    queryFn: async () => UserListService(payload),
  });
};
export const useUserDetail = (username: string) => {
  return useQuery({
    queryKey: ["USER_DETAIL", username],
    queryFn: async () => UserDetailService(username),
    enabled: !!username,
  });
};

export const useRoleDetail = (id: string) => {
  return useQuery({
    queryKey: ["ROLE_DETAIL", id],
    queryFn: async () => RoleDetailService(id),
    enabled: !!id,
  });
};
