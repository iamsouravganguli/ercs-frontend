"use client";

export { caseDB } from "./db";
export type { Device, Certificate } from "./dsc-sdk";


export { apiClient, publicClient } from "./api-client";
export { useDSCSigner } from "./dsc-signer";
export { useUserRole } from "./useUserRole";
export {
  getLabel,
  formatDate,
  getStatus,
  getExpiryStatus,
  getExpired,
  parseDevice,
  maskSerial,
  getFileUrl,
} from "./utils";
export { getCourtUIConfig } from "./court-dependency";
export {
  resolveCaseRoute,
  isCitizenAdvocate,
  caseRouteUrl,
} from "./case-routing";
export {
  useConfirm,
  useQueryParams,
  withDefault,
  StringParam,
  NumberParam,
  queryClient,
} from "../providers";
export { isDev, WEBSITE, ACCOUNT, COURT, CP } from "./index";
export type {
  SessionListData,
  DSCertificateListData,
  CaseListData,
  OTPPayload,
  OTPResponse,
  Pagination,
  PaymentOrderData,
  CourtDetailWriteRequest,
} from "./types";
export {
  serializeRegistrationResponse,
  serializeAssertionResponse,
  coerceRegistrationOptions,
  coerceAuthenticationOptions,
} from "./webauthn";
import {
  BhulekhService,
  getDistrictByCode,
  getDistricts,
  getMandalByCode,
  getMandals,
  getParganaByTehsil,
  getRIByTehsil,
  getRSIByRI,
  getStateByCode,
  getStates,
  getTehsilByCode,
  getVillageByCode,
  Khata,
  KhataDetailPayload,
  Pargana,
  RI,
  RSI,
  SearchKhasraPayload,
  Tehsil,
  Village,
} from ".";
import { getCertificateList, getDeviceList } from "./dsc.service";
import { CommonsApiServices } from "./services";
import { useEffect, useState } from "react";
import {
  UseQueryResult,
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  CasePartyListResponse,
  CasePartyDetailResponse,
  PartyPayload,
  CaseLandListResponse,
  CaseLandDetailResponse,
  LandPayload,
  Announcement,
} from "./types";
export type {
  CasePartyListResponse,
  CasePartyDetailResponse,
  PartyDetail,
  PartyPayload,
  CaseLandListResponse,
  CaseLandDetailResponse,
  LandDetail,
  LandPayload,
  Announcement,
} from "./types";

export function useCaptcha() {
  return useQuery({
    queryKey: ["captcha"],
    queryFn: CommonsApiServices.generateCaptcha,
    staleTime: 0,
    refetchOnWindowFocus: false,
    retry: 1,
    retryDelay: 1200,

    throwOnError: false,
  });
}
export function useSessionCheck() {
  const query = useQuery({
    queryKey: ["SESSION_CHECK"],
    queryFn: CommonsApiServices.sessionCheck,
    refetchOnWindowFocus: true,
    retry: true,
    meta: {
      sessionCheck: true,
    },
  });


  const [cachedData, setCachedData] = useState<any>(undefined);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem("rccms_session");
    if (!saved) return;

    const serverSaysUnauthEarly =
      (query.data as any)?.result?.data?.is_authenticated === false;
    const hasAuthErrorEarly = (() => {
      const err: any = (query as any).error;
      const s = err?.response?.status ?? err?.status;
      return s === 401 || s === 403;
    })();
    if (serverSaysUnauthEarly || hasAuthErrorEarly) {
      try { localStorage.removeItem("rccms_session"); } catch {}
      return;
    }
    try {
      const parsed = JSON.parse(saved);

      if (parsed?.result?.data?.is_authenticated === false) {
        try { localStorage.removeItem("rccms_session"); } catch {}
        return;
      }
      setCachedData(parsed);
    } catch {

    }
  }, []);


  useEffect(() => {
    if (typeof window === "undefined") return;
    const d: any = (query.data as any)?.result?.data;
    if (d && d.is_authenticated === false) {
      try { localStorage.removeItem("rccms_session"); } catch {}
      if (cachedData) setCachedData(undefined);
      return;
    }
    if (d) {
      try { localStorage.setItem("rccms_session", JSON.stringify(query.data)); } catch {}
    }
  }, [query.data]);


  useEffect(() => {
    if (typeof window === "undefined") return;
    const err: any = (query as any).error;
    const status = err?.response?.status ?? err?.status;
    if (status === 401 || status === 403) {
      try { localStorage.removeItem("rccms_session"); } catch {}
      if (cachedData) setCachedData(undefined);
    }
  }, [(query as any).error]);


  const hasAuthError = (() => {
    const err: any = (query as any).error;
    const s = err?.response?.status ?? err?.status;
    return s === 401 || s === 403;
  })();
  const serverSaysUnauth =
    (query.data as any)?.result?.data?.is_authenticated === false;
  const useCache = !hasAuthError && !serverSaysUnauth && !!cachedData;
  const effectiveData = useCache ? (query.data || cachedData) : query.data;
  const isEffectivePending = query.isPending && !effectiveData;
  const isEffectiveLoading = query.isLoading && !effectiveData;

  return {
    ...query,
    data: effectiveData,
    isPending: isEffectivePending,
    isLoading: isEffectiveLoading,
    isQueryPending: query.isPending,
  } as any;
}

function clearAuthCookiesClientSide() {
  if (typeof document === "undefined") return;
  const names = ["access_token", "refresh_token", "sessionid", "csrftoken"];
  const paths = ["/", ""];


  for (const name of names) {
    for (const p of paths) {
      const base = `${name}=; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=${p || "/"}`;
      try { document.cookie = base; } catch {}
      try { document.cookie = `${base}; SameSite=Lax`; } catch {}
      try { document.cookie = `${base}; SameSite=None; Secure`; } catch {}
    }
  }
}

function clearLocalState(queryClient: ReturnType<typeof useQueryClient>) {
  if (typeof window !== "undefined") {
    try { localStorage.removeItem("rccms_session"); } catch {}
    try { sessionStorage.clear(); } catch {}
    clearAuthCookiesClientSide();


    try { localStorage.setItem("rccms_session", ""); } catch {}
    try { localStorage.removeItem("rccms_session"); } catch {}
  }
  try { queryClient.clear(); } catch {}
  try { queryClient.removeQueries({ queryKey: ["SESSION_CHECK"] }); } catch {}
}

export function useSignout() {
  const queryClient = useQueryClient();

  const clearLocalAndRedirect = (href = "/") => {
    clearLocalState(queryClient);


    window.location.href = href;
  };

  return useMutation({
    mutationFn: CommonsApiServices.signout,

    onSuccess: () => {
      clearLocalAndRedirect("/");
    },

    onError: (error) => {


      console.error("Signout failed, clearing local state anyway:", error);
      clearLocalAndRedirect("/");
    },
  });
}

export function usePasskeyRegisterChallenge() {
  return useMutation({
    mutationFn: CommonsApiServices.passkeyRegisterChallenge,
  });
}

export function usePasskeyRegisterVerify() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: CommonsApiServices.passkeyRegisterVerify,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["PROFILE_DETAIL"] });
    },
  });
}

export function usePasskeySigninVerify() {
  return useMutation({
    mutationFn: CommonsApiServices.passkeySigninVerify,
  });
}

export function usePasskeyDelete() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: CommonsApiServices.passkeyDelete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["PROFILE_DETAIL"] });
    },
  });
}

export function useMfaOtpVerify() {
  return useMutation({
    mutationFn: CommonsApiServices.mfaOtpVerify,
  });
}

export function useProfileDetail() {
  return useQuery({
    queryKey: ["PROFILE_DETAIL"],
    queryFn: CommonsApiServices.ProfileDetailService,
    staleTime: 0,
    refetchOnWindowFocus: false,
    retry: true,
  });
}

export function usePreferences() {
  return useQuery({
    queryKey: ["PREFERENCES"],
    queryFn: CommonsApiServices.PreferencesService,
    staleTime: 0,
    refetchOnWindowFocus: false,
    retry: true,
  });
}

export function useUpdatePreferences() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: CommonsApiServices.UpdatePreferencesService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["PREFERENCES"] });
      queryClient.invalidateQueries({ queryKey: ["PROFILE_DETAIL"] });
    },
  });
}
export function useProfileDSCList(payload?: any) {
  return useQuery({
    queryKey: ["PROFILE_DSC_LIST", payload],
    queryFn: () => CommonsApiServices.ProfileDSCList(payload),
    staleTime: 0,
    refetchOnWindowFocus: false,
    retry: true,
  });
}
export function useProfileDSCDetail(id: number) {
  return useQuery({
    queryKey: ["PROFILE_DSC_DETAIL", id],
    queryFn: () => CommonsApiServices.ProfileDSCDetail(id),
    staleTime: 0,
    refetchOnWindowFocus: false,
    retry: true,
    enabled: !!id,
  });
}
export function useProfileDSCActivate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => CommonsApiServices.ProfileDSCActivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["PROFILE_DSC_LIST"] });
    },
  });
}
export function useProfileDSCDeactivate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => CommonsApiServices.ProfileDSCDeactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["PROFILE_DSC_LIST"] });
    },
  });
}
export function useAdminDSCList(payload?: any) {
  return useQuery({
    queryKey: ["ADMIN_DSC_LIST", payload],
    queryFn: () => CommonsApiServices.AdminDSCList(payload),
    staleTime: 0,
    refetchOnWindowFocus: false,
    retry: true,
  });
}
export function useUpdateAdminDSC() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { is_active: boolean } }) =>
      CommonsApiServices.UpdateAdminDSC(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ADMIN_DSC_LIST"] });
    },
  });
}
export function useDeleteAdminDSC() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => CommonsApiServices.DeleteAdminDSC(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ADMIN_DSC_LIST"] });
    },
  });
}
export function useSessionList(payload?: any) {
  return useQuery({
    queryKey: ["SESSION_LIST", payload],
    queryFn: () => CommonsApiServices.SessionList(payload),
    staleTime: 0,
    refetchOnWindowFocus: false,
    retry: true,
  });
}
export function useDSCDevices(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["dsc", "devices"],
    queryFn: getDeviceList,
    staleTime: 5 * 60 * 1000,
    enabled: options?.enabled ?? true,
  });
}
export function useDSCCertificates(
  deviceId?: number,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: ["dsc", "certificates", deviceId],
    queryFn: () => getCertificateList(deviceId!),
    enabled: (!!deviceId && (options?.enabled ?? true)) as boolean,
    staleTime: 5 * 60 * 1000,
  });
}


export function useDscSignatureList(linked_model: string, linked_object_id: string | number, params?: any) {
  return useQuery({
    queryKey: ["DSC_SIGNATURE_LIST", linked_model, String(linked_object_id), params],
    queryFn: () => CommonsApiServices.DscSignatureList(linked_model, String(linked_object_id), params),
    enabled: !!linked_model && !!String(linked_object_id),
    staleTime: 0,
    placeholderData: keepPreviousData,
  });
}

export function useDscSignatureSign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ linked_model, linked_object_id, payload }: { linked_model: string; linked_object_id: string | number; payload: any }) =>
      CommonsApiServices.DscSignatureSign(linked_model, String(linked_object_id), payload),
    onSuccess: (_data: any, vars: any) => {
      queryClient.invalidateQueries({ queryKey: ["DSC_SIGNATURE_LIST", vars.linked_model, String(vars.linked_object_id)] });
    },
  });
}

export function useDscSignatureVerify() {
  return useMutation({
    mutationFn: (pk: string | number) => CommonsApiServices.DscSignatureVerify(pk),
  });
}

export function useDscSignatureVerifyLatest() {
  return useMutation({
    mutationFn: ({ linked_model, linked_object_id }: { linked_model: string; linked_object_id: string | number }) =>
      CommonsApiServices.DscSignatureVerifyLatest(linked_model, String(linked_object_id)),
  });
}
export function useStates(query?: string) {
  return useQuery({
    queryKey: ["STATE_LIST", query],
    queryFn: () => getStates(query),
    staleTime: 0,
    refetchOnWindowFocus: false,
    retry: true,
  });
}
export function useStateDetail(stateCodeCensus: string) {
  return useQuery({
    queryKey: ["STATE_DETAIL", stateCodeCensus],
    queryFn: () => getStateByCode(stateCodeCensus),
    staleTime: 0,
    refetchOnWindowFocus: false,
    retry: true,
  });
}
export function useMandal(query?: string) {
  return useQuery({
    queryKey: ["MANDAL_LIST", query],
    queryFn: () => getMandals(query),
    staleTime: 0,
    refetchOnWindowFocus: false,
    retry: true,
  });
}
export function useMandalDetail(mandalCode: string) {
  return useQuery({
    queryKey: ["MANDAL_DETAIL", mandalCode],
    queryFn: () => getMandalByCode(mandalCode),
    staleTime: 0,
    refetchOnWindowFocus: false,
    retry: true,
  });
}
export function useDistrict(mandalCode?: string) {
  return useQuery({
    queryKey: ["DISTRICT_LIST", mandalCode],
    queryFn: () => getDistricts(mandalCode),
    staleTime: 0,
    refetchOnWindowFocus: false,
    retry: true,
  });
}
export function useDistrictDetail(districtCodeCensus: string) {
  return useQuery({
    queryKey: ["DISTRICT_DETAIL", districtCodeCensus],
    queryFn: () => getDistrictByCode(districtCodeCensus),
    staleTime: 0,
    refetchOnWindowFocus: false,
    retry: true,
  });
}
export function useTehsil(districtCodeCensus?: string) {
  return useQuery({
    queryKey: ["TEHSIL_LIST", districtCodeCensus],
    queryFn: (): Promise<Tehsil[]> =>
      BhulekhService.getTehsilList(districtCodeCensus),
    enabled: !!districtCodeCensus,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    retry: true,
  });
}
export function useTehsilDetail(
  districtCodeCensus: string,
  tehsilCodeCensus: string,
) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ["TEHSIL_DETAIL", districtCodeCensus, tehsilCodeCensus],
    queryFn: () => getTehsilByCode(districtCodeCensus, tehsilCodeCensus),
    initialData: () => {
      const list = queryClient.getQueryData<Tehsil[]>([
        "TEHSIL_LIST",
        districtCodeCensus,
      ]);
      return list?.find((t) => t.tehsil_code_census === tehsilCodeCensus);
    },
    enabled: !!districtCodeCensus && !!tehsilCodeCensus,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    retry: true,
  });
}
export function useVillage(tehsilCodeCensus: string) {
  return useQuery({
    queryKey: ["VILLAGE_LIST", tehsilCodeCensus],
    queryFn: (): Promise<Village[]> =>
      BhulekhService.getVillageFullDetail(tehsilCodeCensus),
    enabled: !!tehsilCodeCensus,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    retry: true,
  });
}
export function usePargana(tehsilCodeCensus: string) {
  return useQuery({
    queryKey: ["PARGANA_LIST", tehsilCodeCensus],
    queryFn: (): Promise<Pargana[]> => getParganaByTehsil(tehsilCodeCensus),
    enabled: !!tehsilCodeCensus,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    retry: true,
  });
}
export function useRI(tehsilCodeCensus: string) {
  return useQuery({
    queryKey: ["RI_LIST", tehsilCodeCensus],
    queryFn: (): Promise<RI[]> => getRIByTehsil(tehsilCodeCensus),
    enabled: !!tehsilCodeCensus,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    retry: true,
  });
}
export function useRSI(ricircleCode: string, tehsilCodeCensus: string) {
  return useQuery({
    queryKey: ["RSI_LIST", ricircleCode],
    queryFn: (): Promise<RSI[]> => getRSIByRI(ricircleCode, tehsilCodeCensus),
    enabled: !!ricircleCode,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    retry: true,
  });
}
export function useKhataByKhasraSearch({
  village_code_census,
  khasra_no,
}: SearchKhasraPayload) {
  return useQuery({
    queryKey: ["KHASRA_SEARCH", village_code_census, khasra_no],
    queryFn: () =>
      BhulekhService.getSearchKhasra({
        khasra_no,
        village_code_census,
      }),
    enabled:
      !!village_code_census && !!khasra_no && khasra_no.trim().length > 0,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    retry: false,
  });
}
export function useKhataDetail({
  village_code_census,
  khata_number,
}: KhataDetailPayload) {
  return useQuery({
    queryKey: ["KHAATA_DETAIL", village_code_census, khata_number],
    queryFn: () =>
      BhulekhService.getKhataDetail({
        khata_number,
        village_code_census,
      }),
    enabled:
      !!village_code_census && !!khata_number && khata_number.trim().length > 0,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    retry: false,
  });
}
export function useKhataList(villageCodeCensus?: string) {
  return useQuery({
    queryKey: ["KHATA_LIST", villageCodeCensus],
    queryFn: (): Promise<Khata[]> =>
      BhulekhService.getKhataList(villageCodeCensus),
    enabled: !!villageCodeCensus,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    retry: true,
  });
}
export function useVillageDetail(
  tehsilCodeCensus: string,
  villageCodeCensus: string,
) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ["VILLAGE_DETAIL", tehsilCodeCensus, villageCodeCensus],
    queryFn: () => getVillageByCode(tehsilCodeCensus, villageCodeCensus),
    initialData: () => {
      const list = queryClient.getQueryData<Village[]>([
        "VILLAGE_LIST",
        tehsilCodeCensus,
      ]);
      return list?.find((v) => v.village_code_census === villageCodeCensus);
    },
    enabled: !!tehsilCodeCensus && !!villageCodeCensus,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    retry: true,
  });
}
export function useCourtLevelList(payload?: any) {
  return useQuery({
    queryKey: ["COURT_LEVEL", payload],
    queryFn: () => CommonsApiServices.CourtLevelList(payload),
    staleTime: 0,
    refetchOnWindowFocus: false,
    retry: true,
  });
}
export function useCourtNatureByCourtLevelList(
  payload?: any,
  p0?: { enabled: boolean },
) {
  return useQuery({
    queryKey: ["COURT_NATURE_BY_COURT_LEVEL", payload],
    queryFn: () => CommonsApiServices.CourtNatureByCourtLevelList(payload),
    enabled: p0?.enabled,
  });
}
export function useAppealTypeList(payload?: any) {
  return useQuery({
    queryKey: ["APPEAL_TYPES", payload],
    queryFn: () => CommonsApiServices.AppealTypeList(payload),
    staleTime: 0,
    refetchOnWindowFocus: false,
    retry: true,
  });
}
export function useCourtList(payload?: any, p0?: { enabled: boolean }) {
  return useQuery({
    queryKey: ["COURTS", payload],
    queryFn: () => CommonsApiServices.CourtList(payload),
    enabled: p0?.enabled,
  });
}
export function useActList(payload?: any, p0?: { enabled: boolean }) {
  return useQuery({
    queryKey: ["ACTS", payload],
    queryFn: () => CommonsApiServices.ActList(payload),
    enabled: p0?.enabled ?? true,
  });
}
export function useCourtActMappingList(
  payload?: any,
  p0?: { enabled: boolean },
) {
  return useQuery({
    queryKey: ["COURT_ACT_MAPPING", payload],
    queryFn: () => CommonsApiServices.CourtActMappingList(payload),
    enabled: p0?.enabled,
  });
}
export function useCourtActWiseSectionMappingList(
  payload?: any,
  p0?: { enabled: boolean },
) {
  return useQuery({
    queryKey: ["COURT_ACT_WISE_SECTION", payload],
    queryFn: () => CommonsApiServices.CourtAndActWiseSectionList(payload),
    enabled: p0?.enabled,
  });
}
export function useActSectionList(payload?: any, _p0?: { enabled: boolean }) {
  return useQuery({
    queryKey: ["ACT_SECTION", payload],
    queryFn: () => CommonsApiServices.ActAndSectionList(payload),
    enabled: false,
  });
}
export function usePartyTypeList(payload?: any) {
  return useQuery({
    queryKey: ["PARTY_TYPES", payload],
    queryFn: () => CommonsApiServices.PartyTypeList(payload),
    staleTime: 0,
    refetchOnWindowFocus: false,
    retry: true,
  });
}
export function usePartyNatureList(payload?: any) {
  return useQuery({
    queryKey: ["PARTY_NATURES", payload],
    queryFn: () => CommonsApiServices.PartyNatureList(payload),
    staleTime: 0,
    refetchOnWindowFocus: false,
    retry: true,
  });
}
export function useGenderList(payload?: any) {
  return useQuery({
    queryKey: ["GENDER_LIST", payload],
    queryFn: () => CommonsApiServices.GenderList(payload),
    staleTime: 0,
    refetchOnWindowFocus: false,
    retry: true,
  });
}
export function useIdentityProofTypeList(payload?: any) {
  return useQuery({
    queryKey: ["IDENTITY_PROOF_TYPES", payload],
    queryFn: () => CommonsApiServices.IdentityProofTypeList(payload),
    staleTime: 0,
    refetchOnWindowFocus: false,
    retry: true,
  });
}
export function useLifeStatusList(payload?: any) {
  return useQuery({
    queryKey: ["MASTER", "LIFE_STATUS", payload],
    queryFn: () => CommonsApiServices.LifeStatusList(payload),
    staleTime: 60 * 1000 * 5,
    refetchOnWindowFocus: false,
    retry: false,
  });
}
export function useRelationtTypeList(payload?: any) {
  return useQuery({
    queryKey: ["RELATIONT_TYPES", payload],
    queryFn: () => CommonsApiServices.RelationtTypesList(payload),
    staleTime: 0,
    refetchOnWindowFocus: false,
    retry: true,
  });
}
export function useNoticeTypeList(payload?: any) {
  return useQuery({
    queryKey: ["MASTER", "NOTICE_TYPE", payload],
    queryFn: () => CommonsApiServices.NoticeTypeList(payload),
    staleTime: 60 * 1000 * 5,
    refetchOnWindowFocus: false,
    retry: false,
  });
}
export function useNoticeDeliveryModeList(payload?: any) {
  return useQuery({
    queryKey: ["MASTER", "NOTICE_DELIVERY_MODE", payload],
    queryFn: () => CommonsApiServices.NoticeDeliveryModeList(payload),
    staleTime: 60 * 1000 * 5,
    refetchOnWindowFocus: false,
    retry: false,
  });
}
export function useSummaryMasterStats() {
  return useQuery({
    queryKey: ["MASTER_STATS"],
    queryFn: () => CommonsApiServices.SummaryMasterStats(),
    staleTime: 0,
    refetchOnWindowFocus: false,
    retry: true,
  });
}
export function useSummaryCaseStats(payload?: any) {
  return useQuery({
    queryKey: ["CASE_STATS", payload],
    queryFn: () => CommonsApiServices.SummaryCaseStats(payload),
  });
}
export function useCaseStats(payload?: any) {
  return useQuery({
    queryKey: ["CASE_STAGE_STATUS_STATS", payload],
    queryFn: () => CommonsApiServices.CaseStats(payload),
  });
}
export function useSummaryAccountStats() {
  return useQuery({
    queryKey: ["ACCOUNT_STATS"],
    queryFn: () => CommonsApiServices.SummaryAccountStats(),
    staleTime: 0,
    refetchOnWindowFocus: false,
    retry: true,
  });
}
export function useStatusList(payload?: any) {
  return useQuery({
    queryKey: ["STATUS_LIST", payload],
    queryFn: () => CommonsApiServices.StatusList(payload),
    staleTime: 0,
    refetchOnWindowFocus: false,
    retry: true,
  });
}
export function useCaseStageList(payload?: any) {
  return useQuery({
    queryKey: ["CASE_STAGE_LIST", payload],
    queryFn: () => CommonsApiServices.CaseStageList(payload),
    staleTime: 0,
    refetchOnWindowFocus: false,
    retry: true,
  });
}
export function useCaseStatusList(payload?: any) {
  return useQuery({
    queryKey: ["CASE_STATUS_LIST", payload],
    queryFn: () => CommonsApiServices.CaseStatusList(payload),
    staleTime: 0,
    refetchOnWindowFocus: false,
    retry: true,
  });
}
export function useCommunicationTypeList(payload?: any) {
  return useQuery({
    queryKey: ["COMMUNICATION_TYPE_LIST", payload],
    queryFn: () => CommonsApiServices.CommunicationTypeList(payload),
    staleTime: 0,
    refetchOnWindowFocus: false,
    retry: true,
  });
}
export function useNoticeTemplateList(payload?: any) {
  return useQuery({
    queryKey: ["NOTICE_TEMPLATE_LIST", payload],
    queryFn: () => CommonsApiServices.NoticeTemplateList(payload),
    staleTime: 0,
    refetchOnWindowFocus: false,
    retry: true,
  });
}
export function useServiceModeList(payload?: any) {
  return useQuery({
    queryKey: ["SERVICE_MODE_LIST", payload],
    queryFn: () => CommonsApiServices.ServiceModeList(payload),
    staleTime: 0,
    refetchOnWindowFocus: false,
    retry: true,
  });
}
export function useReceiverRelationList(payload?: any) {
  return useQuery({
    queryKey: ["RECEIVER_RELATION_LIST", payload],
    queryFn: () => CommonsApiServices.ReceiverRelationList(payload),
    staleTime: 0,
    refetchOnWindowFocus: false,
    retry: true,
  });
}
export const useCaseList = (payload?: any) => {
  return useQuery({
    queryKey: ["CASE_LIST", payload],
    queryFn: ({ signal }) =>
      CommonsApiServices.CaseListService(payload, signal),
    staleTime: 10_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    retry: 1,
    placeholderData: keepPreviousData,
  });
};

export const usePublicCaseList = (payload?: any) => {
  return useQuery({
    queryKey: ["PUBLIC_CASE_LIST", payload],
    queryFn: ({ signal }) =>
      CommonsApiServices.PublicCaseListService(payload, signal),
    staleTime: 10_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    retry: 1,
    placeholderData: keepPreviousData,
  });
};

export function useCaseDetail(case_number: string) {
  return useQuery({
    queryKey: ["CASE_DETAIL", case_number],
    queryFn: () => CommonsApiServices.CourtDetailReadService(case_number),
    enabled: !!case_number,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
}

export function useCaseTimeline(case_number: string) {
  return useQuery({
    queryKey: ["CASE_TIMELINE", case_number],
    queryFn: () => CommonsApiServices.CaseTimelineService(case_number),
    enabled: !!case_number,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
}

export function useCaseTransition(case_number: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["CASE_TRANSITION", case_number],
    mutationFn: (payload: {
      stage?: string;
      status?: string;
      remarks?: string;
    }) => CommonsApiServices.CaseTransitionService(case_number, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["CASE_DETAIL", case_number] });
      queryClient.invalidateQueries({
        queryKey: ["CASE_TIMELINE", case_number],
      });
    },
  });
}
export function useCaseDocumentList(case_no: string, options?: any) {
  return useQuery({
    queryKey: ["case", case_no, "documents"],
    queryFn: () => CommonsApiServices.CaseDocumentListService(case_no),
    enabled: !!case_no,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    ...options,
  });
}

export function useCasePartyList(
  case_no: string,
  options?: any,
): UseQueryResult<CasePartyListResponse, Error> {
  return useQuery<CasePartyListResponse, Error>({
    queryKey: ["case", case_no, "parties"],
    queryFn: () => CommonsApiServices.CasePartyListService(case_no),
    enabled: !!case_no,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    ...options,
  });
}

export function useCasePartyDetail(
  case_no: string,
  pk: string,
  options?: any,
): UseQueryResult<CasePartyDetailResponse, Error> {
  return useQuery<CasePartyDetailResponse, Error>({
    queryKey: ["case", case_no, "parties", pk],
    queryFn: () => CommonsApiServices.CasePartyDetailService(case_no, pk),
    enabled: !!case_no && !!pk,
    ...options,
  });
}

export function useCasePartyCreate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      case_no,
      payload,
    }: {
      case_no: string;
      payload: PartyPayload;
    }) => CommonsApiServices.CasePartyCreateService(case_no, payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["case", variables.case_no, "parties"],
      });
    },
  });
}

export function useCasePartyUpdate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      case_no,
      pk,
      payload,
    }: {
      case_no: string;
      pk: string | number;
      payload: PartyPayload;
    }) => CommonsApiServices.CasePartyUpdateService(case_no, pk, payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["case", variables.case_no, "parties"],
      });
    },
  });
}

export function useCasePartyDelete() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ case_no, pk }: { case_no: string; pk: string | number }) =>
      CommonsApiServices.CasePartyDeleteService(case_no, pk),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["case", variables.case_no, "parties"],
      });
    },
  });
}

export function useCaseLandList(
  case_no: string,
  options?: any,
): UseQueryResult<CaseLandListResponse, Error> {
  return useQuery<CaseLandListResponse, Error>({
    queryKey: ["case", case_no, "lands"],
    queryFn: () => CommonsApiServices.CaseLandListService(case_no),
    enabled: !!case_no,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    ...options,
  });
}

export function useCaseLandDetail(
  case_no: string,
  pk: string | number,
  options?: any,
): UseQueryResult<CaseLandDetailResponse, Error> {
  return useQuery<CaseLandDetailResponse, Error>({
    queryKey: ["case", case_no, "lands", pk],
    queryFn: () => CommonsApiServices.CaseLandDetailService(case_no, pk),
    enabled: !!case_no && !!pk,
    ...options,
  });
}

export function useCaseLandCreate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      case_no,
      payload,
    }: {
      case_no: string;
      payload: LandPayload;
    }) => CommonsApiServices.CaseLandCreateService(case_no, payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["case", variables.case_no, "lands"],
      });
    },
  });
}

export function useCaseLandUpdate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      case_no,
      pk,
      payload,
    }: {
      case_no: string;
      pk: string | number;
      payload: LandPayload;
    }) => CommonsApiServices.CaseLandUpdateService(case_no, pk, payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["case", variables.case_no, "lands"],
      });
    },
  });
}

export function useCaseLandDelete() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ case_no, pk }: { case_no: string; pk: string | number }) =>
      CommonsApiServices.CaseLandDeleteService(case_no, pk),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["case", variables.case_no, "lands"],
      });
    },
  });
}

export function usePaymentOrderList(
  params?: import("./types").PaymentOrderListParams,
) {
  return useQuery({
    queryKey: ["payments", params],
    queryFn: () => CommonsApiServices.PaymentOrderList(params),
    staleTime: 5000,
  });
}

export function useCasePaymentList(
  caseNumber: string,
  params?: { status?: string },
) {
  return useQuery({
    queryKey: ["case-payments", caseNumber, params],
    queryFn: () => CommonsApiServices.CasePaymentList(caseNumber, params),
    enabled: !!caseNumber,
    staleTime: 5000,
  });
}

export function usePaymentModeList() {
  return useQuery({
    queryKey: ["payment-modes"],
    queryFn: CommonsApiServices.PaymentModeList,
    staleTime: 60000,
  });
}

export function usePaymentTypeList() {
  return useQuery({
    queryKey: ["payment-types"],
    queryFn: CommonsApiServices.PaymentTypeList,
    staleTime: 60000,
  });
}

export function useOrderTypeList(payload?: any) {
  return useQuery({
    queryKey: ["order-types", payload],
    queryFn: () => CommonsApiServices.OrderTypeList(payload),
    staleTime: 60000,
  });
}

export function useHearingTypeList(payload?: any) {
  return useQuery({
    queryKey: ["hearing-types", payload],
    queryFn: () => CommonsApiServices.HearingTypeList(payload),
    staleTime: 60000,
  });
}

export function useHearingStatusList(payload?: any) {
  return useQuery({
    queryKey: ["hearing-statuses", payload],
    queryFn: () => CommonsApiServices.HearingStatusList(payload),
    staleTime: 60000,
  });
}

export function useHearingOutcomeList(payload?: any) {
  return useQuery({
    queryKey: ["hearing-outcomes", payload],
    queryFn: () => CommonsApiServices.HearingOutcomeList(payload),
    staleTime: 60000,
  });
}

export function usePaymentOrderDetail(pk: number | string) {
  return useQuery({
    queryKey: ["payments", pk],
    queryFn: () => CommonsApiServices.PaymentOrderDetail(pk),
    enabled: !!pk,
  });
}

export function useCreatePaymentOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: CommonsApiServices.CreatePaymentOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
    },
  });
}

export function useUpdatePaymentOrder() {
  return useMutation({
    mutationFn: ({ pk, payload }: { pk: number | string; payload: any }) =>
      CommonsApiServices.UpdatePaymentOrder(pk, payload),
  });
}

export function useVerifyPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: CommonsApiServices.VerifyPayment,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      if (data?.result?.data?.object_id) {
        queryClient.invalidateQueries({
          queryKey: ["case", data.result.data.object_id],
        });
      }
    },
  });
}

export function useSubmitChallan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: {
      pk: number | string;
      payload: { challan_no: string; challan_date: string; bank_name: string };
    }) => CommonsApiServices.SubmitChallan(variables.pk, variables.payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
    },
  });
}

export function useVerifyChallan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: {
      pk: number | string;
      action: "approve" | "reject";
    }) => CommonsApiServices.VerifyChallan(variables.pk, variables.action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
    },
  });
}


export function useCaseHearingList(caseNumber: string) {
  return useQuery({
    queryKey: ["case-hearings", caseNumber],
    queryFn: () => CommonsApiServices.CaseHearingList(caseNumber),
    enabled: !!caseNumber,
    staleTime: 5000,
  });
}

export function useCaseHearingDetail(
  caseNumber: string,
  pk: number | string,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: ["case-hearing-detail", caseNumber, pk],
    queryFn: () => CommonsApiServices.CaseHearingDetail(caseNumber, pk),
    enabled:
      options?.enabled !== undefined ? options.enabled : !!(caseNumber && pk),
    staleTime: 5000,
  });
}

export function useCaseHearingCreate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: {
      caseNumber: string;
      payload: Record<string, any>;
    }) =>
      CommonsApiServices.CaseHearingCreate(
        variables.caseNumber,
        variables.payload,
      ),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["case-hearings", variables.caseNumber],
      });
      queryClient.invalidateQueries({
        queryKey: ["case", variables.caseNumber],
      });
      queryClient.invalidateQueries({ queryKey: ["court-hearings-all"] });
    },
  });
}

export function useCaseHearingUpdate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: {
      caseNumber: string;
      pk: number | string;
      payload: Record<string, any>;
    }) =>
      CommonsApiServices.CaseHearingUpdate(
        variables.caseNumber,
        variables.pk,
        variables.payload,
      ),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["case-hearings", variables.caseNumber],
      });
      queryClient.invalidateQueries({
        queryKey: ["case-hearing-detail", variables.caseNumber, variables.pk],
      });
      queryClient.invalidateQueries({
        queryKey: ["case", variables.caseNumber],
      });
      queryClient.invalidateQueries({ queryKey: ["court-hearings-all"] });
    },
  });
}

export function useCaseHearingDelete() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: { caseNumber: string; pk: number | string }) =>
      CommonsApiServices.CaseHearingDelete(variables.caseNumber, variables.pk),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["case-hearings", variables.caseNumber],
      });
      queryClient.invalidateQueries({
        queryKey: ["case", variables.caseNumber],
      });
      queryClient.invalidateQueries({ queryKey: ["court-hearings-all"] });
    },
  });
}

export function useGenerateVideoMeeting() {
  return useMutation({
    mutationFn: () => CommonsApiServices.GenerateVideoMeeting(),
  });
}

export function useCourtHearingsList(
  params?: { date?: string; case_number?: string },
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: ["court-hearings-all", params],
    queryFn: () => CommonsApiServices.CourtHearingsList(params),
    enabled: options?.enabled !== undefined ? options.enabled : true,
    staleTime: 5000,
  });
}


export function useCaseOrderList(caseNumber: string) {
  return useQuery({
    queryKey: ["case-orders", caseNumber],
    queryFn: () => CommonsApiServices.CaseOrderList(caseNumber),
    enabled: !!caseNumber,
    staleTime: 5000,
  });
}

export function useCaseOrderDetail(
  caseNumber: string,
  pk: number | string,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: ["case-order-detail", caseNumber, pk],
    queryFn: () => CommonsApiServices.CaseOrderDetail(caseNumber, pk),
    enabled:
      options?.enabled !== undefined ? options.enabled : !!(caseNumber && pk),
    staleTime: 5000,
  });
}

export function useCaseOrderCreate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: {
      caseNumber: string;
      payload: Record<string, any>;
    }) =>
      CommonsApiServices.CaseOrderCreate(
        variables.caseNumber,
        variables.payload,
      ),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["case-orders", variables.caseNumber],
      });
      queryClient.invalidateQueries({
        queryKey: ["case", variables.caseNumber],
      });
    },
  });
}

export function useCaseOrderUpdate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: {
      caseNumber: string;
      pk: number | string;
      payload: Record<string, any>;
    }) =>
      CommonsApiServices.CaseOrderUpdate(
        variables.caseNumber,
        variables.pk,
        variables.payload,
      ),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["case-orders", variables.caseNumber],
      });
      queryClient.invalidateQueries({
        queryKey: ["case-order-detail", variables.caseNumber, variables.pk],
      });
      queryClient.invalidateQueries({
        queryKey: ["case", variables.caseNumber],
      });
    },
  });
}

export function useCaseOrderDelete() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: { caseNumber: string; pk: number | string }) =>
      CommonsApiServices.CaseOrderDelete(variables.caseNumber, variables.pk),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["case-orders", variables.caseNumber],
      });
      queryClient.invalidateQueries({
        queryKey: ["case", variables.caseNumber],
      });
    },
  });
}


export function useAnnouncements(payload?: any) {
  return useQuery({
    queryKey: ["announcements", payload],
    queryFn: () => CommonsApiServices.AnnouncementList(payload),
    staleTime: 5000,
  });
}

export function useCreateAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Omit<Announcement, "id">) =>
      CommonsApiServices.AnnouncementCreate(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
    },
  });
}

export function useUpdateAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: {
      pk: number | string;
      payload: Partial<Announcement>;
    }) =>
      CommonsApiServices.AnnouncementUpdate(variables.pk, variables.payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
    },
  });
}

export function useDeleteAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (pk: number | string) =>
      CommonsApiServices.AnnouncementDelete(pk),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
    },
  });
}

export function useUploadDocument() {
  return useMutation({
    mutationFn: (variables: { file: File; extraData?: Record<string, any> }) =>
      CommonsApiServices.uploadDocument(variables.file, variables.extraData),
  });
}
export function useDocQRSessionCreate() {
  return useMutation({ mutationFn: CommonsApiServices.DocQRSessionCreateService });
}
export function useDocQRSessionDetail(token: string, enabled = true) {
  return useQuery({
    queryKey: ["doc-qr-session", token],
    queryFn: () => CommonsApiServices.DocQRSessionDetailService(token),
    enabled: !!token && enabled,

    refetchInterval: (q: any) => {
      const s: any = q.state.data;
      const d: any = s?.result?.data ?? s?.result ?? s;
      if (d?.status === "EXPIRED") return false;
      if (q.state.error) return false;
      return enabled && !!token ? 2500 : false;
    },
    refetchIntervalInBackground: true,
    retry: (count, err: any) => {

      if (err?.response?.status === 410) return false;
      return count < 2;
    },
  });
}
export function useDocQRSessionExpire() {
  return useMutation({ mutationFn: (token: string) => CommonsApiServices.DocQRSessionExpireService(token) });
}

export function useAnnouncementDetail(
  pk: number | string,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: ["announcement-detail", pk],
    queryFn: () => CommonsApiServices.AnnouncementDetail(pk),
    enabled: options?.enabled !== undefined ? options.enabled : !!pk,
    staleTime: 5000,
  });
}


export function useCaseCommunicationList(caseNumber: string) {
  return useQuery({
    queryKey: ["CASE_COMMUNICATION_LIST", caseNumber],
    queryFn: () => CommonsApiServices.CaseCommunicationList(caseNumber),
    enabled: !!caseNumber,
    staleTime: 5000,
  });
}
export function useCaseCommunicationDetail(caseNumber: string, pk: number | string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["CASE_COMMUNICATION_DETAIL", caseNumber, pk],
    queryFn: () => CommonsApiServices.CaseCommunicationDetail(caseNumber, pk),
    enabled: options?.enabled !== undefined ? options.enabled : !!(caseNumber && pk),
    staleTime: 5000,
  });
}
export function useCaseCommunicationCreate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { caseNumber: string; payload: Record<string, any> }) => CommonsApiServices.CaseCommunicationCreate(v.caseNumber, v.payload),
    onSuccess: (_, v) => { qc.invalidateQueries({ queryKey: ["CASE_COMMUNICATION_LIST", v.caseNumber] }); qc.invalidateQueries({ queryKey: ["case", v.caseNumber] }); },
  });
}
export function useCaseCommunicationUpdate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { caseNumber: string; pk: number | string; payload: Record<string, any> }) => CommonsApiServices.CaseCommunicationUpdate(v.caseNumber, v.pk, v.payload),
    onSuccess: (_, v) => { qc.invalidateQueries({ queryKey: ["CASE_COMMUNICATION_LIST", v.caseNumber] }); qc.invalidateQueries({ queryKey: ["CASE_COMMUNICATION_DETAIL", v.caseNumber, v.pk] }); },
  });
}
export function useCaseCommunicationDelete() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { caseNumber: string; pk: number | string }) => CommonsApiServices.CaseCommunicationDelete(v.caseNumber, v.pk),
    onSuccess: (_, v) => { qc.invalidateQueries({ queryKey: ["CASE_COMMUNICATION_LIST", v.caseNumber] }); },
  });
}
export function useCaseCommunicationRecipientList(caseNumber: string, commPk: number | string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["CASE_COMMUNICATION_RECIPIENTS", caseNumber, commPk],
    queryFn: () => CommonsApiServices.CaseCommunicationRecipientList(caseNumber, commPk),
    enabled: options?.enabled !== undefined ? options.enabled : !!(caseNumber && commPk),
    staleTime: 5000,
  });
}
export function useCaseCommunicationRecipientCreate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { caseNumber: string; commPk: number | string; payload: any }) => CommonsApiServices.CaseCommunicationRecipientCreate(v.caseNumber, v.commPk, v.payload),
    onSuccess: (_, v) => { qc.invalidateQueries({ queryKey: ["CASE_COMMUNICATION_RECIPIENTS", v.caseNumber, v.commPk] }); },
  });
}
export function useCaseCommunicationServiceReportList(caseNumber: string, recipientPk: number | string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["CASE_COMMUNICATION_SERVICE_REPORTS", caseNumber, recipientPk],
    queryFn: () => CommonsApiServices.CaseCommunicationServiceReportList(caseNumber, recipientPk),
    enabled: options?.enabled !== undefined ? options.enabled : !!(caseNumber && recipientPk),
    staleTime: 5000,
  });
}
export function useCaseCommunicationServiceReportCreate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { caseNumber: string; recipientPk: number | string; payload: Record<string, any> }) => CommonsApiServices.CaseCommunicationServiceReportCreate(v.caseNumber, v.recipientPk, v.payload),
    onSuccess: (_, v) => { qc.invalidateQueries({ queryKey: ["CASE_COMMUNICATION_SERVICE_REPORTS", v.caseNumber, v.recipientPk] }); },
  });
}
export function useCaseCommunicationServiceWitnessList(caseNumber: string, reportPk: number | string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["CASE_COMMUNICATION_WITNESSES", caseNumber, reportPk],
    queryFn: () => CommonsApiServices.CaseCommunicationServiceWitnessList(caseNumber, reportPk),
    enabled: options?.enabled !== undefined ? options.enabled : !!(caseNumber && reportPk),
    staleTime: 5000,
  });
}
export function useCaseCommunicationServiceWitnessCreate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { caseNumber: string; reportPk: number | string; payload: Record<string, any> }) => CommonsApiServices.CaseCommunicationServiceWitnessCreate(v.caseNumber, v.reportPk, v.payload),
    onSuccess: (_, v) => { qc.invalidateQueries({ queryKey: ["CASE_COMMUNICATION_WITNESSES", v.caseNumber, v.reportPk] }); },
  });
}
