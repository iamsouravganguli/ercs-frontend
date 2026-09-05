import { apiClient } from "@/lib/api-client";
import {
  RoleListResponse,
  RoleDetailResponse,
  PermissionDetailResponse,
  PermissionListResponse,
} from "./types";

export const RoleListService = async (
  payload?: any,
): Promise<RoleListResponse> => {
  try {
    const res = await apiClient.get("/master/roles/", {
      params: payload,
    });
    return res.data;
  } catch (err: any) {
    throw err?.response?.data || err;
  }
};
export const RoleCreateService = async (
  payload?: any,
): Promise<RoleDetailResponse> => {
  try {
    const res = await apiClient.post("/master/roles/create/", payload);
    return res.data;
  } catch (err: any) {
    throw err?.response?.data || err;
  }
};
export const RoleUpdateService = async (
  payload?: any,
  id?: string,
): Promise<RoleDetailResponse> => {
  try {
    const res = await apiClient.patch("/master/roles/" + id + "/", payload);
    return res.data;
  } catch (err: any) {
    throw err?.response?.data || err;
  }
};

export const RoleDetailService = async (
  id: string,
): Promise<RoleDetailResponse> => {
  try {
    const res = await apiClient.get("/master/roles/", {
      params: {
        "filters[id]": id,
      },
    });
    const listData = res.data;
    const singleData = {
      ...listData,
      result: listData.result
        ? {
            ...listData.result,
            data: listData.result.data?.[0] || null,
          }
        : null,
    };
    return singleData;
  } catch (err: any) {
    throw err?.response?.data || err;
  }
};


export const PermissionListService = async (
  payload?: any,
): Promise<PermissionListResponse> => {
  try {
    const res = await apiClient.get("/master/permissions/", {
      params: payload,
    });
    return res.data;
  } catch (err: any) {
    throw err?.response?.data || err;
  }
};
export const PermissionDetailService = async (
  id: string,
): Promise<PermissionDetailResponse> => {
  try {
    const res = await apiClient.get("/master/permissions/", {
      params: {
        "filters[id]": id,
      },
    });
    const listData = res.data;
    const singleData = {
      ...listData,
      result: listData.result
        ? {
            ...listData.result,
            data: listData.result.data?.[0] || null,
          }
        : null,
    };
    return singleData;
  } catch (err: any) {
    throw err?.response?.data || err;
  }
};
export const PermissionCreateService = async (
  payload?: any,
): Promise<PermissionDetailResponse> => {
  try {
    const res = await apiClient.post("/master/permissions/create/", payload);
    return res.data;
  } catch (err: any) {
    throw err?.response?.data || err;
  }
};
export const PermissionRoleUpdateService = async (
  payload?: any,
  id?: string,
): Promise<PermissionDetailResponse> => {
  try {
    const res = await apiClient.patch(
      "/master/permissions/" + id + "/",
      payload,
    );
    return res.data;
  } catch (err: any) {
    throw err?.response?.data || err;
  }
};


export const UserListService = async (payload?: any): Promise<any> => {
  try {
    const res = await apiClient.get("/users/", {
      params: payload,
    });
    return res.data;
  } catch (err: any) {
    throw err?.response?.data || err;
  }
};

export const UserStatusToggleService = async (
  username: string,
): Promise<any> => {
  try {
    const res = await apiClient.patch(`/users/${username}/status/`);
    return res.data;
  } catch (err: any) {
    throw err?.response?.data || err;
  }
};

export const UserCreateService = async (payload?: any): Promise<any> => {
  try {
    const res = await apiClient.post("/users/create/", payload);
    return res.data;
  } catch (err: any) {
    throw err?.response?.data || err;
  }
};

export const UserUpdateService = async (
  username: string,
  payload?: any,
): Promise<any> => {
  try {
    const res = await apiClient.put(`/users/${username}/update/`, payload);
    return res.data;
  } catch (err: any) {
    throw err?.response?.data || err;
  }
};

export const UserDetailService = async (username: string): Promise<any> => {
  try {
    const res = await apiClient.get(`/users/${username}/`);
    return res.data;
  } catch (err: any) {
    throw err?.response?.data || err;
  }
};
