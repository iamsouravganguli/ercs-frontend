import { apiClient, publicClient } from "@/lib/api-client";
import {
  ActSectionMappingResponse,
  ApiResponse,
  AppealTypeResponse,
  CaptchaData,
  CaseTypeResponse,
  CourtLevelResponse,
  CourtLocationResponse,
  CourtResponse,
  DSCertificateListResponse,
  DSCertificateDetailResponse,
  GenderResponse,
  PaymentModeResponse,
  PaymentTypeResponse,
  CaseHearingListResponse,
  CaseHearingDetailResponse,
  CaseOrderListResponse,
  CaseOrderDetailResponse,
  OrderTypeResponse,
  HearingTypeResponse,
  HearingStatusResponse,
  HearingOutcomeResponse,
  IdentityProofTypeResponse,
  LifeStatusesResponse,
  OTPPayload,
  OTPResponse,
  PartyTypeResponse,
  PartyNatureResponse,
  ProfileData,
  SummaryMasterResponse,
  RelationTypeResponse,
  SessionCheckData,
  SessionListResponse,
  SingoutData,
  SummaryAccountResponse,
  DocUploadResponse,
  CommunicationTypeResponse,
  NoticeTemplateResponse,
  ServiceModeResponse,
  ReceiverRelationData,
  StatusesResponse,
  CourtDetailWriteRequest,
  CaseNatureByCourtLevelResponse,
  CourtActMappingResponse,
  CourtAndActWiseSectionResponse,
  SummaryCaseResponse,
  CaseListResponse,
  CourtDetailReadApiResponse,
  CasePartyListResponse,
  CasePartyDetailResponse,
  PartyPayload,
  CaseLandListResponse,
  CaseLandDetailResponse,
  LandPayload,
  CreatePaymentOrderRequest,
  CreatePaymentOrderApiResponse,
  VerifyPaymentRequest,
  VerifyPaymentApiResponse,
  PaymentOrderListApiResponse,
  PaymentOrderListParams,
  PaymentOrderDetailApiResponse,
  Announcement,
  AnnouncementListResponse,
  AnnouncementDetailResponse,
} from "./types";


export namespace CommonsApiServices {
  export const generateCaptcha = async (): Promise<
    ApiResponse<CaptchaData>
  > => {
    try {
      const { data } =
        await apiClient.get<ApiResponse<CaptchaData>>("/auth/captcha/");
      return data;
    } catch (err: any) {
      const rawMsg: string = err?.response?.data?.message || err?.message || "";
      const isRedis =
        rawMsg.includes("6379") ||
        rawMsg.includes("Connection refused") ||
        rawMsg.includes("Redis");
      if (isRedis) {
        throw {
          success: false,
          message:
            "Captcha service is temporarily unavailable. Please click refresh to try again.",
          errors: { detail: "Service temporarily unavailable" },
        };
      }
      throw err?.response?.data || err;
    }
  };

  export const generateOTP = async (
    payload?: OTPPayload,
  ): Promise<ApiResponse<OTPResponse>> => {
    try {
      const { data } = await apiClient.post<ApiResponse<OTPResponse>>(
        "/auth/otp/generate/",
        payload,
      );
      return data;
    } catch (err: any) {
      const rawMsg: string = err?.response?.data?.message || err?.message || "";
      const isInfra =
        rawMsg.includes("6379") ||
        rawMsg.includes("Connection refused") ||
        rawMsg.toLowerCase().includes("redis") ||
        rawMsg.includes("ECONNREFUSED");
      if (isInfra) {
        throw {
          success: false,
          message:
            "Service is temporarily unavailable. Please try again in a moment.",
          errors: { detail: "Service temporarily unavailable" },
        };
      }
      throw err?.response?.data || err;
    }
  };

  export const sessionCheck = async (): Promise<
    ApiResponse<SessionCheckData>
  > => {
    try {
      const res = await apiClient.get<ApiResponse<SessionCheckData>>(
        "/auth/session-check/",
      );
      return res.data;
    } catch (err: any) {
      throw err?.response?.data || err;
    }
  };

  export const signout = async (): Promise<ApiResponse<SingoutData>> => {
    try {
      const res =
        await apiClient.post<ApiResponse<SingoutData>>("/auth/logout/");
      return res.data;
    } catch (err: any) {
      throw err?.response?.data || err;
    }
  };

  export const passkeyRegisterChallenge = async (): Promise<any> => {
    try {
      const res = await apiClient.post("/auth/passkey/register-challenge/");
      return res.data;
    } catch (err: any) {
      throw err?.response?.data || err;
    }
  };

  export const passkeyRegisterVerify = async (payload: any): Promise<any> => {
    try {
      const res = await apiClient.post(
        "/auth/passkey/register-verify/",
        payload,
      );
      return res.data;
    } catch (err: any) {
      throw err?.response?.data || err;
    }
  };

  export const passkeySigninVerify = async (payload: any): Promise<any> => {
    try {
      const res = await apiClient.post("/auth/passkey/signin-verify/", payload);
      return res.data;
    } catch (err: any) {
      throw err?.response?.data || err;
    }
  };

  export const passkeyDelete = async (payload: {
    passkey_id: number;
    otp_key: string;
    otp_value: string;
  }): Promise<any> => {
    try {
      const res = await apiClient.post("/auth/passkey/delete/", payload);
      return res.data;
    } catch (err: any) {
      throw err?.response?.data || err;
    }
  };

  export const mfaOtpVerify = async (payload: {
    otp_key: string;
    otp_value: string;
  }): Promise<any> => {
    try {
      const res = await apiClient.post("/auth/mfa/otp-verify/", payload);
      return res.data;
    } catch (err: any) {
      throw err?.response?.data || err;
    }
  };

  export const ProfileDetailService = async (): Promise<
    ApiResponse<ProfileData>
  > => {
    try {
      const res = await apiClient.get("/profile/");
      return res.data;
    } catch (err: any) {
      throw err?.response?.data || err;
    }
  };

  export const PreferencesService = async (): Promise<
    ApiResponse<{ preferred_language: string; preferred_theme: string }>
  > => {
    try {
      const res = await apiClient.get("/preferences/");
      return res.data;
    } catch (err: any) {
      throw err?.response?.data || err;
    }
  };

  export const UpdatePreferencesService = async (payload: {
    preferred_language?: string;
    preferred_theme?: string;
  }): Promise<ApiResponse<any>> => {
    try {
      const res = await apiClient.patch("/preferences/", payload);
      return res.data;
    } catch (err: any) {
      throw err?.response?.data || err;
    }
  };

  export const ProfileDSCList = async (
    payload?: any,
  ): Promise<DSCertificateListResponse> => {
    try {
      const res = await apiClient.get("/dsc/", {
        params: payload,
      });
      return res.data;
    } catch (err: any) {
      throw err?.response?.data || err;
    }
  };
  export const ProfileDSCDetail = async (
    id: number,
  ): Promise<DSCertificateDetailResponse> => {
    try {
      const res = await apiClient.get(`/dsc/${id}/`);
      return res.data;
    } catch (err: any) {
      throw err?.response?.data || err;
    }
  };
  export const ProfileDSCActivate = async (id: number): Promise<any> => {
    try {
      const res = await apiClient.patch(`/dsc/${id}/activate/`);
      return res.data;
    } catch (err: any) {
      throw err?.response?.data || err;
    }
  };
  export const ProfileDSCDeactivate = async (id: number): Promise<any> => {
    try {
      const res = await apiClient.patch(`/dsc/${id}/deactivate/`);
      return res.data;
    } catch (err: any) {
      throw err?.response?.data || err;
    }
  };
  export const AdminDSCList = async (
    payload?: any,
  ): Promise<DSCertificateListResponse> => {
    try {
      const res = await apiClient.get("/admin/dsc/", {
        params: payload,
      });
      return res.data;
    } catch (err: any) {
      throw err?.response?.data || err;
    }
  };
  export const UpdateAdminDSC = async (
    id: number,
    data: { is_active: boolean },
  ): Promise<DSCertificateDetailResponse> => {
    try {
      const res = await apiClient.patch(`/admin/dsc/${id}/`, data);
      return res.data;
    } catch (err: any) {
      throw err?.response?.data || err;
    }
  };
  export const DeleteAdminDSC = async (id: number): Promise<any> => {
    try {
      const res = await apiClient.delete(`/admin/dsc/${id}/`);
      return res.data;
    } catch (err: any) {
      throw err?.response?.data || err;
    }
  };
  export const SessionList = async (
    payload?: any,
  ): Promise<SessionListResponse> => {
    try {
      const res = await apiClient.get("/sessions/", {
        params: payload,
      });
      return res.data;
    } catch (err: any) {
      throw err?.response?.data || err;
    }
  };

  export const CaseTypeList = async (
    payload?: any,
  ): Promise<CaseTypeResponse> => {
    try {
      const res = await apiClient.get("/master/case-types/", {
        params: payload,
      });
      return res.data;
    } catch (err: any) {
      throw err?.response?.data || err;
    }
  };

  export const AppealTypeList = async (
    payload?: any,
  ): Promise<AppealTypeResponse> => {
    try {
      const res = await apiClient.get("/master/appeal-types/", {
        params: payload,
      });
      return res.data;
    } catch (err: any) {
      throw err?.response?.data || err;
    }
  };
  export const CourtLevelList = async (
    payload?: any,
  ): Promise<CourtLevelResponse> => {
    try {
      const res = await apiClient.get("/master/court-levels/", {
        params: payload,
      });
      return res.data;
    } catch (err: any) {
      throw err?.response?.data || err;
    }
  };

  export const CourtList = async (payload?: any): Promise<CourtResponse> => {
    try {
      const res = await apiClient.get("/master/courts/", {
        params: payload,
      });
      return res.data;
    } catch (err: any) {
      throw err?.response?.data || err;
    }
  };
  export const ActList = async (payload?: any): Promise<any> => {
    try {
      const res = await apiClient.get("/master/acts/", {
        params: payload,
      });
      return res.data;
    } catch (err: any) {
      throw err?.response?.data || err;
    }
  };
  export const ActAndSectionList = async (
    payload?: any,
  ): Promise<ActSectionMappingResponse> => {
    try {
      const res = await apiClient.get("/master/act-section-mappings/", {
        params: payload,
      });
      return res.data;
    } catch (err: any) {
      throw err?.response?.data || err;
    }
  };

  export const CourtLocationList = async (
    payload?: any,
  ): Promise<CourtLocationResponse> => {
    try {
      const res = await apiClient.get("/master/court-locations/", {
        params: payload,
      });
      return res.data;
    } catch (err: any) {
      throw err?.response?.data || err;
    }
  };

  export const PartyTypeList = async (
    payload?: any,
  ): Promise<PartyTypeResponse> => {
    try {
      const res = await apiClient.get("/master/party-types/?limit=100", {
        params: payload,
      });
      return res.data;
    } catch (err: any) {
      throw err?.response?.data || err;
    }
  };

  export const PartyNatureList = async (
    payload?: any,
  ): Promise<PartyNatureResponse> => {
    try {
      const res = await apiClient.get("/master/party-nature/?limit=100", {
        params: payload,
      });
      return res.data;
    } catch (err: any) {
      throw err?.response?.data || err;
    }
  };

  export const GenderList = async (payload?: any): Promise<GenderResponse> => {
    try {
      const res = await apiClient.get("/master/genders/", {
        params: payload,
      });
      return res.data;
    } catch (err: any) {
      throw err?.response?.data || err;
    }
  };
  export const IdentityProofTypeList = async (
    payload?: any,
  ): Promise<IdentityProofTypeResponse> => {
    try {
      const res = await apiClient.get("/master/identity-proof-type/", {
        params: payload,
      });
      return res.data;
    } catch (err: any) {
      throw err?.response?.data || err;
    }
  };
  export const LifeStatusList = async (
    payload?: any,
  ): Promise<LifeStatusesResponse> => {
    try {
      const res = await apiClient.get("/master/life-statuses/", {
        params: payload,
      });
      return res.data;
    } catch (err: any) {
      throw err?.response?.data || err;
    }
  };

  export const RelationtTypesList = async (
    payload?: any,
  ): Promise<RelationTypeResponse> => {
    try {
      const res = await apiClient.get("/master/relation-types/", {
        params: payload,
      });
      return res.data;
    } catch (err: any) {
      throw err?.response?.data || err;
    }
  };

  export const NoticeTypeList = async (payload?: any): Promise<any> => {
    try {
      const res = await apiClient.get("/master/notice-types/", {
        params: payload,
      });
      return res.data;
    } catch (err: any) {
      throw err?.response?.data || err;
    }
  };

  export const NoticeDeliveryModeList = async (payload?: any): Promise<any> => {
    try {
      const res = await apiClient.get("/master/notice-delivery-modes/", {
        params: payload,
      });
      return res.data;
    } catch (err: any) {
      throw err?.response?.data || err;
    }
  };

  export const SummaryMasterStats =
    async (): Promise<SummaryMasterResponse> => {
      try {
        const res = await apiClient.get("/master/summary/");
        return res.data;
      } catch (err: any) {
        throw err?.response?.data || err;
      }
    };
  export const SummaryAccountStats =
    async (): Promise<SummaryAccountResponse> => {
      try {
        const res = await apiClient.get("/accounts/summary/");
        return res.data;
      } catch (err: any) {
        throw err?.response?.data || err;
      }
    };

  export const uploadDocument = async (
    file: File,
    extraData?: Record<string, any>,
  ): Promise<DocUploadResponse> => {
    try {
      const formData = new FormData();

      formData.append("file", file, file.name);


      if (extraData) {
        Object.keys(extraData).forEach((key) => {
          formData.append(key, extraData[key]);
        });
      }


      const res = await apiClient.post("/doc/upload/", formData);

      return res.data;
    } catch (err: any) {
      throw err?.response?.data || err;
    }
  };
  export const StatusList = async (
    payload?: any,
  ): Promise<StatusesResponse> => {
    try {
      const res = await apiClient.get("/master/statuses/", {
        params: { ...payload, limit: 100 },
      });
      return res.data;
    } catch (err: any) {
      throw err?.response?.data || err;
    }
  };
  export const CaseStageList = async (payload?: any): Promise<any> => {
    try {
      const res = await apiClient.get("/master/case-stages/", {
        params: { ...payload, limit: 100 },
      });
      return res.data;
    } catch (err: any) {
      throw err?.response?.data || err;
    }
  };
  export const CaseStatusList = async (payload?: any): Promise<any> => {
    try {
      const res = await apiClient.get("/master/case-statuses/", {
        params: { ...payload, limit: 100 },
      });
      return res.data;
    } catch (err: any) {
      throw err?.response?.data || err;
    }
  };
  export const CommunicationTypeList = async (
    payload?: any,
  ): Promise<CommunicationTypeResponse> => {
    try {
      const res = await apiClient.get("/master/communication-types/", {
        params: { ...payload, limit: 100 },
      });
      return res.data;
    } catch (err: any) {
      throw err?.response?.data || err;
    }
  };
  export const NoticeTemplateList = async (
    payload?: any,
  ): Promise<NoticeTemplateResponse> => {
    try {
      const res = await apiClient.get("/master/notice-templates/", {
        params: { ...payload, limit: 100 },
      });
      return res.data;
    } catch (err: any) {
      throw err?.response?.data || err;
    }
  };
  export const ServiceModeList = async (
    payload?: any,
  ): Promise<ServiceModeResponse> => {
    try {
      const res = await apiClient.get("/master/service-modes/", {
        params: { ...payload, limit: 100 },
      });
      return res.data;
    } catch (err: any) {
      throw err?.response?.data || err;
    }
  };
  export const ReceiverRelationList = async (
    payload?: any,
  ): Promise<ReceiverRelationData> => {
    try {
      const res = await apiClient.get("/master/receiver-relations/", {
        params: { ...payload, limit: 100 },
      });
      return res.data;
    } catch (err: any) {
      throw err?.response?.data || err;
    }
  };

  export const CaseTimelineService = async (case_no: string): Promise<any> => {
    try {
      const res = await apiClient.get("/case/" + case_no + "/timeline/");
      return res.data;
    } catch (err: any) {
      throw err?.response?.data || err;
    }
  };

  export const CaseTransitionService = async (
    case_no: string,
    payload: { stage?: string; status?: string; remarks?: string },
  ): Promise<any> => {
    try {
      const res = await apiClient.post(
        "/case/" + case_no + "/transition/",
        payload,
      );
      return res.data;
    } catch (err: any) {
      throw err?.response?.data || err;
    }
  };
  export const CaseDocumentUploadService = async (
    case_no: string,
    file: File,
    doc_type: string,
    remarks?: string,
  ): Promise<any> => {
    try {
      const formData = new FormData();
      formData.append("file", file, file.name);
      formData.append("type_of_doc", doc_type);
      if (remarks) {
        formData.append("remarks", remarks);
      }


      const res = await apiClient.post(
        `/doc/linked/CaseModel/${case_no}/upload/`,
        formData,
      );
      return res.data;
    } catch (err: any) {
      throw err?.response?.data || err;
    }
  };

  export const CaseDocumentListService = async (
    case_no: string,
  ): Promise<any> => {
    try {
      const res = await apiClient.get(`/doc/linked/CaseModel/${case_no}/`);
      return res.data;
    } catch (err: any) {
      throw err?.response?.data || err;
    }
  };

  export const CaseDocumentDeleteService = async (
    doc_id: string | number,
  ): Promise<any> => {
    try {
      const res = await apiClient.delete(`/doc/${doc_id}/delete/`);
      return res.data;
    } catch (err: any) {
      throw err?.response?.data || err;
    }
  };

  export const CaseDocumentUpdateStatusService = async (
    doc_id: string | number,
    status_id: number,
  ): Promise<any> => {
    try {
      const res = await apiClient.patch(`/doc/${doc_id}/status/`, {
        status: status_id,
      });
      return res.data;
    } catch (err: any) {
      throw err?.response?.data || err;
    }
  };


  export const DocumentSignService = async (
    doc_id: string | number,
    payload: {
      signature_hash: string;
      document_hash: string;
    },
  ): Promise<any> => {
    try {
      const res = await apiClient.post(`/doc/${doc_id}/sign/`, payload);
      return res.data;
    } catch (err: any) {
      throw err?.response?.data || err;
    }
  };

  export const DocumentVerifyService = async (
    doc_id: string | number,
  ): Promise<any> => {
    try {
      const res = await apiClient.post(`/doc/${doc_id}/verify/`);
      return res.data;
    } catch (err: any) {
      throw err?.response?.data || err;
    }
  };


  export const DscSignatureList = async (
    linked_model: string,
    linked_object_id: string | number,
    params?: any,
  ): Promise<any> => {
    try {
      const res = await apiClient.get(`/doc/signatures/linked/${linked_model}/${linked_object_id}/`, { params });
      return res.data;
    } catch (err: any) {
      throw err?.response?.data || err;
    }
  };

  export const DscSignatureSign = async (
    linked_model: string,
    linked_object_id: string | number,
    payload: { signature_hash: string; document_hash?: string; algorithm?: string; remarks?: string; meta?: any; type_of_doc?: string },
  ): Promise<any> => {
    try {
      const res = await apiClient.post(`/doc/signatures/linked/${linked_model}/${linked_object_id}/sign/`, payload);
      return res.data;
    } catch (err: any) {
      throw err?.response?.data || err;
    }
  };

  export const DscSignatureDetail = async (pk: string | number): Promise<any> => {
    try {
      const res = await apiClient.get(`/doc/signatures/${pk}/`);
      return res.data;
    } catch (err: any) {
      throw err?.response?.data || err;
    }
  };

  export const DscSignatureVerify = async (pk: string | number): Promise<any> => {
    try {
      const res = await apiClient.post(`/doc/signatures/${pk}/verify/`);
      return res.data;
    } catch (err: any) {
      throw err?.response?.data || err;
    }
  };

  export const DscSignatureVerifyLatest = async (
    linked_model: string,
    linked_object_id: string | number,
  ): Promise<any> => {
    try {
      const res = await apiClient.post(`/doc/signatures/linked/${linked_model}/${linked_object_id}/verify/`);
      return res.data;
    } catch (err: any) {
      throw err?.response?.data || err;
    }
  };

  export const DscSignatureDelete = async (pk: string | number): Promise<any> => {
    try {
      const res = await apiClient.delete(`/doc/signatures/${pk}/delete/`);
      return res.data;
    } catch (err: any) {
      throw err?.response?.data || err;
    }
  };

  export interface ActivitySignaturePayload {
    entity_type: string;
    entity_id: string | number;
    signature_hash: string;
    document_hash: string;
    algorithm?: string;
    serial?: string;
    signed_at?: string;
    metadata?: Record<string, any>;
  }

  export const RecordDSCSignatureService = async (
    payload: ActivitySignaturePayload,
  ): Promise<any> => {
    try {
      const res = await apiClient.post("/dsc/signatures/", payload);
      return res.data;
    } catch (err: any) {
      throw err?.response?.data || err;
    }
  };

  export const DocumentUpdateService = async (
    doc_id: string | number,
    payload: {
      meta?: any;
      remarks?: string;
    },
  ): Promise<any> => {
    try {
      const res = await apiClient.patch(`/doc/${doc_id}/update/`, payload);
      return res.data;
    } catch (err: any) {
      throw err?.response?.data || err;
    }
  };

  export const DocQRSessionCreateService = async (payload: any): Promise<any> => {
    const res = await apiClient.post("/doc/qr/session/create/", payload);
    return res.data;
  };

  export const DocQRSessionDetailService = async (token: string): Promise<any> => {
    const res = await publicClient.get(`/doc/qr/session/${token}/`);
    return res.data;
  };
  export const DocQRSessionExpireService = async (token: string): Promise<any> => {
    const res = await apiClient.post(`/doc/qr/session/${token}/expire/`);
    return res.data;
  };


  export const LandDocumentUploadService = async (
    land_id: string | number,
    file: File,
    doc_type: string,
    remarks?: string,
  ): Promise<any> => {
    try {
      const formData = new FormData();
      formData.append("file", file, file.name);
      formData.append("type_of_doc", doc_type);
      if (remarks) {
        formData.append("remarks", remarks);
      }


      const res = await apiClient.post(
        `/doc/linked/LandModel/${land_id}/upload/`,
        formData,
      );
      return res.data;
    } catch (err: any) {
      throw err?.response?.data || err;
    }
  };

  export const LandDocumentListService = async (
    land_id: string | number,
  ): Promise<any> => {
    try {
      const res = await apiClient.get(`/doc/linked/LandModel/${land_id}/`);
      return res.data;
    } catch (err: any) {
      throw err?.response?.data || err;
    }
  };

  export const CourtNatureByCourtLevelList = async (
    payload?: any,
  ): Promise<CaseNatureByCourtLevelResponse> => {
    try {
      const res = await apiClient.get("/master/court-nature-by-court-level/", {
        params: payload,
      });
      return res.data;
    } catch (err: any) {
      throw err?.response?.data || err;
    }
  };

  export const CourtActMappingList = async (
    payload?: any,
  ): Promise<CourtActMappingResponse> => {
    try {
      const res = await apiClient.get("/master/court-act-mappings/", {
        params: payload,
      });
      return res.data;
    } catch (err: any) {
      throw err?.response?.data || err;
    }
  };

  export const CourtAndActWiseSectionList = async (
    payload?: any,
  ): Promise<CourtAndActWiseSectionResponse> => {
    try {
      const res = await apiClient.get(
        "/master/court-act-wise-section-mappings/",
        {
          params: payload,
        },
      );
      return res.data;
    } catch (err: any) {
      throw err?.response?.data || err;
    }
  };

  export const SummaryCaseStats = async (
    payload?: any,
  ): Promise<SummaryCaseResponse> => {
    try {
      const res = await apiClient.get("/case/summary/", {
        params: payload,
      });
      return res.data;
    } catch (err: any) {
      throw err?.response?.data || err;
    }
  };

  export const CaseStats = async (payload?: any): Promise<any> => {
    try {
      const res = await apiClient.get("/case/stats/", {
        params: payload,
      });
      return res.data;
    } catch (err: any) {
      throw err?.response?.data || err;
    }
  };

  export const CaseListService = async (
    payload?: any,
    signal?: AbortSignal,
  ): Promise<CaseListResponse> => {
    try {
      const res = await apiClient.get("/case/list/", {
        params: payload,
        signal,
      });
      return res.data;
    } catch (err: any) {
      throw err?.response?.data || err;
    }
  };

  export const PublicCaseListService = async (
    payload?: any,
    signal?: AbortSignal,
  ): Promise<CaseListResponse> => {
    try {
      const res = await publicClient.get("/case/list/", {
        params: payload,
        signal,
      });
      return res.data;
    } catch (err: any) {
      throw err?.response?.data || err;
    }
  };

  export const CourtDetailReadService = async (
    case_no: string,
  ): Promise<CourtDetailReadApiResponse> => {
    try {
      const res = await apiClient.get("/case/" + case_no + "/detail/");
      return res.data;
    } catch (err: any) {
      throw err?.response?.data || err;
    }
  };

  export const CaseInitService = async (payload?: any): Promise<any> => {
    try {
      const res = await apiClient.post("/case/init/", payload || {});
      return res.data;
    } catch (err: any) {
      throw err?.response?.data || err;
    }
  };

  export const CaseDetailWriteService = async (
    payload: CourtDetailWriteRequest,
    case_no: string,
  ): Promise<any> => {
    try {
      const res = await apiClient.put("/case/" + case_no + "/detail/", payload);
      return res.data;
    } catch (err: any) {
      throw err?.response?.data || err;
    }
  };

  export const CasePartyListService = async (
    case_no: string,
  ): Promise<CasePartyListResponse> => {
    try {
      const res = await apiClient.get<CasePartyListResponse>(
        "/case/" + case_no + "/party/",
      );
      return res.data;
    } catch (err: any) {
      throw err?.response?.data || err;
    }
  };

  export const CasePartyDetailService = async (
    case_no: string,
    pk: number | string,
  ): Promise<CasePartyDetailResponse> => {
    try {
      const res = await apiClient.get<CasePartyDetailResponse>(
        "/case/" + case_no + "/party/" + pk + "/",
      );
      return res.data;
    } catch (err: any) {
      throw err?.response?.data || err;
    }
  };

  export const CasePartyCreateService = async (
    case_no: string,
    payload: PartyPayload,
  ): Promise<CasePartyDetailResponse> => {
    try {
      const res = await apiClient.post<CasePartyDetailResponse>(
        "/case/" + case_no + "/party/",
        payload,
      );
      return res.data;
    } catch (err: unknown) {
      const e = err as any;
      throw e?.response?.data || e;
    }
  };

  export const CasePartyUpdateService = async (
    case_no: string,
    pk: number | string,
    payload: PartyPayload,
  ): Promise<CasePartyDetailResponse> => {
    try {
      const res = await apiClient.put<CasePartyDetailResponse>(
        "/case/" + case_no + "/party/" + pk + "/",
        payload,
      );
      return res.data;
    } catch (err: unknown) {
      const e = err as any;
      throw e?.response?.data || e;
    }
  };

  export const CasePartyDeleteService = async (
    case_no: string,
    pk: number | string,
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await apiClient.delete<{ success: boolean; message: string }>(
        "/case/" + case_no + "/party/" + pk + "/",
      );
      return res.data;
    } catch (err: unknown) {
      const e = err as any;
      throw e?.response?.data || e;
    }
  };

  export const CasePartyVerifyOTPService = async (
    case_no: string,
    pk: number | string,
    payload: { otp_key: string; otp: string },
  ): Promise<CasePartyDetailResponse> => {
    try {
      const res = await apiClient.post<CasePartyDetailResponse>(
        "/case/" + case_no + "/party/" + pk + "/verify-otp/",
        payload,
      );
      return res.data;
    } catch (err: unknown) {
      const e = err as any;
      throw e?.response?.data || e;
    }
  };

  export const CaseLandListService = async (
    case_no: string,
  ): Promise<CaseLandListResponse> => {
    try {
      const res = await apiClient.get<CaseLandListResponse>(
        "/case/" + case_no + "/land/",
      );
      return res.data;
    } catch (err: any) {
      throw err?.response?.data || err;
    }
  };

  export const CaseLandDetailService = async (
    case_no: string,
    pk: number | string,
  ): Promise<CaseLandDetailResponse> => {
    try {
      const res = await apiClient.get<CaseLandDetailResponse>(
        "/case/" + case_no + "/land/" + pk + "/",
      );
      return res.data;
    } catch (err: any) {
      throw err?.response?.data || err;
    }
  };

  export const CaseLandCreateService = async (
    case_no: string,
    payload: LandPayload,
  ): Promise<CaseLandDetailResponse> => {
    try {
      const res = await apiClient.post<CaseLandDetailResponse>(
        "/case/" + case_no + "/land/",
        payload,
      );
      return res.data;
    } catch (err: any) {
      throw err?.response?.data || err;
    }
  };

  export const CaseLandUpdateService = async (
    case_no: string,
    pk: number | string,
    payload: LandPayload,
  ): Promise<CaseLandDetailResponse> => {
    try {
      const res = await apiClient.put<CaseLandDetailResponse>(
        "/case/" + case_no + "/land/" + pk + "/",
        payload,
      );
      return res.data;
    } catch (err: any) {
      throw err?.response?.data || err;
    }
  };

  export const CaseLandDeleteService = async (
    case_no: string,
    pk: number | string,
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await apiClient.delete<{ success: boolean; message: string }>(
        "/case/" + case_no + "/land/" + pk + "/",
      );
      return res.data;
    } catch (err: any) {
      throw err?.response?.data || err;
    }
  };

  export const CreatePaymentOrder = async (
    payload: CreatePaymentOrderRequest,
  ): Promise<CreatePaymentOrderApiResponse> => {
    try {
      const res = await apiClient.post<CreatePaymentOrderApiResponse>(
        "/payments/create/",
        payload,
      );
      return res.data;
    } catch (err: any) {
      throw err?.response?.data || err;
    }
  };

  export const VerifyPayment = async (
    payload: VerifyPaymentRequest,
  ): Promise<VerifyPaymentApiResponse> => {
    try {
      const res = await apiClient.post<VerifyPaymentApiResponse>(
        "/payments/verify/",
        payload,
      );
      return res.data;
    } catch (err: any) {
      throw err?.response?.data || err;
    }
  };

  export const UpdatePaymentOrder = async (
    pk: number | string,
    payload: any,
  ): Promise<PaymentOrderDetailApiResponse> => {
    const res = await apiClient.patch<PaymentOrderDetailApiResponse>(
      `/payments/${pk}/`,
      payload,
    );
    return res.data;
  };

  export const PaymentOrderList = async (
    params?: PaymentOrderListParams,
  ): Promise<PaymentOrderListApiResponse> => {
    try {
      const res = await apiClient.get<PaymentOrderListApiResponse>(
        "/payments/",
        { params },
      );
      return res.data;
    } catch (err: any) {
      throw err?.response?.data || err;
    }
  };

  export const CasePaymentList = async (
    caseNumber: string,
    params?: PaymentOrderListParams,
  ): Promise<PaymentOrderListApiResponse> => {
    try {
      const res = await apiClient.get<PaymentOrderListApiResponse>(
        `/case/${encodeURIComponent(caseNumber)}/payment/`,
        { params },
      );
      return res.data;
    } catch (err: any) {
      throw err?.response?.data || err;
    }
  };

  export const PaymentModeList = async (): Promise<PaymentModeResponse> => {
    try {
      const res = await apiClient.get<PaymentModeResponse>("/master/payment-modes/", {
        params: { limit: 100 },
      });
      return res.data;
    } catch (err: any) {
      throw err?.response?.data || err;
    }
  };

  export const PaymentTypeList = async (): Promise<PaymentTypeResponse> => {
    try {
      const res = await apiClient.get<PaymentTypeResponse>("/master/payment-types/", {
        params: { limit: 100 },
      });
      return res.data;
    } catch (err: any) {
      throw err?.response?.data || err;
    }
  };

  export const OrderTypeList = async (
    payload?: any,
  ): Promise<OrderTypeResponse> => {
    try {
      const res = await apiClient.get<OrderTypeResponse>(
        "/master/order-types/",
        {
          params: payload,
        },
      );
      return res.data;
    } catch (err: any) {
      throw err?.response?.data || err;
    }
  };

  export const HearingTypeList = async (
    payload?: any,
  ): Promise<HearingTypeResponse> => {
    try {
      const res = await apiClient.get<HearingTypeResponse>(
        "/master/hearing-types/",
        {
          params: payload,
        },
      );
      return res.data;
    } catch (err: any) {
      throw err?.response?.data || err;
    }
  };

  export const HearingStatusList = async (
    payload?: any,
  ): Promise<HearingStatusResponse> => {
    try {
      const res = await apiClient.get<HearingStatusResponse>(
        "/master/hearing-statuses/",
        {
          params: payload,
        },
      );
      return res.data;
    } catch (err: any) {
      throw err?.response?.data || err;
    }
  };

  export const HearingOutcomeList = async (
    payload?: any,
  ): Promise<HearingOutcomeResponse> => {
    try {
      const res = await apiClient.get<HearingOutcomeResponse>(
        "/master/hearing-outcomes/",
        {
          params: payload,
        },
      );
      return res.data;
    } catch (err: any) {
      throw err?.response?.data || err;
    }
  };

  export const PaymentOrderDetail = async (
    pk: number | string,
  ): Promise<PaymentOrderDetailApiResponse> => {
    try {
      const res = await apiClient.get<PaymentOrderDetailApiResponse>(
        "/payments/" + pk + "/",
      );
      return res.data;
    } catch (err: any) {
      throw err?.response?.data || err;
    }
  };

  export const SubmitChallan = async (
    pk: number | string,
    payload: { challan_no: string; challan_date: string; bank_name: string },
  ): Promise<any> => {
    try {
      const res = await apiClient.post(
        "/payments/" + pk + "/submit-challan/",
        payload,
      );
      return res.data;
    } catch (err: any) {
      throw err?.response?.data || err;
    }
  };

  export const VerifyChallan = async (
    pk: number | string,
    action: "approve" | "reject",
  ): Promise<any> => {
    try {
      const res = await apiClient.post("/payments/" + pk + "/verify-challan/", {
        action,
      });
      return res.data;
    } catch (err: any) {
      throw err?.response?.data || err;
    }
  };


  export const CaseHearingList = async (
    caseNumber: string,
  ): Promise<CaseHearingListResponse> => {
    try {
      const res = await apiClient.get<CaseHearingListResponse>(
        `/case/${encodeURIComponent(caseNumber)}/hearing/`,
      );
      return res.data;
    } catch (err: any) {
      throw err?.response?.data || err;
    }
  };

  export const CaseHearingDetail = async (
    caseNumber: string,
    pk: number | string,
  ): Promise<CaseHearingDetailResponse> => {
    try {
      const res = await apiClient.get<CaseHearingDetailResponse>(
        `/case/${encodeURIComponent(caseNumber)}/hearing/${pk}/`,
      );
      return res.data;
    } catch (err: any) {
      throw err?.response?.data || err;
    }
  };

  export const CaseHearingCreate = async (
    caseNumber: string,
    payload: Record<string, any>,
  ): Promise<CaseHearingDetailResponse> => {
    try {
      const res = await apiClient.post<CaseHearingDetailResponse>(
        `/case/${encodeURIComponent(caseNumber)}/hearing/`,
        payload,
      );
      return res.data;
    } catch (err: any) {
      throw err?.response?.data || err;
    }
  };

  export const CaseHearingUpdate = async (
    caseNumber: string,
    pk: number | string,
    payload: Record<string, any>,
  ): Promise<CaseHearingDetailResponse> => {
    try {
      const res = await apiClient.patch<CaseHearingDetailResponse>(
        `/case/${encodeURIComponent(caseNumber)}/hearing/${pk}/`,
        payload,
      );
      return res.data;
    } catch (err: any) {
      throw err?.response?.data || err;
    }
  };

  export const CaseHearingDelete = async (
    caseNumber: string,
    pk: number | string,
  ): Promise<ApiResponse<null>> => {
    try {
      const res = await apiClient.delete<ApiResponse<null>>(
        `/case/${encodeURIComponent(caseNumber)}/hearing/${pk}/`,
      );
      return res.data;
    } catch (err: any) {
      throw err?.response?.data || err;
    }
  };

  export const GenerateVideoMeeting = async (): Promise<
    ApiResponse<{ meeting_id: string; meeting_link: string; token: string }>
  > => {
    try {
      const res =
        await apiClient.post<
          ApiResponse<{
            meeting_id: string;
            meeting_link: string;
            token: string;
          }>
        >("/case/vc/token/");
      return res.data;
    } catch (err: any) {
      throw err?.response?.data || err;
    }
  };

  export const CourtHearingsList = async (params?: { date?: string; case_number?: string }): Promise<ApiResponse<any[]>> => {
    try {
      const res = await apiClient.get<ApiResponse<any[]>>("/case/hearings/all/", { params });
      return res.data;
    } catch (err: any) {
      throw err?.response?.data || err;
    }
  };


  export const CaseCommunicationList = async (caseNumber: string): Promise<import("./types").CaseCommunicationListResponse> => {
    const res = await apiClient.get<import("./types").CaseCommunicationListResponse>(`/case/${encodeURIComponent(caseNumber)}/communication/`);
    return res.data;
  };
  export const CaseCommunicationDetail = async (caseNumber: string, pk: number | string): Promise<import("./types").CaseCommunicationDetailResponse> => {
    const res = await apiClient.get<import("./types").CaseCommunicationDetailResponse>(`/case/${encodeURIComponent(caseNumber)}/communication/${pk}/`);
    return res.data;
  };
  export const CaseCommunicationCreate = async (caseNumber: string, payload: Record<string, any>): Promise<import("./types").CaseCommunicationDetailResponse> => {
    const res = await apiClient.post<import("./types").CaseCommunicationDetailResponse>(`/case/${encodeURIComponent(caseNumber)}/communication/`, payload);
    return res.data;
  };
  export const CaseCommunicationUpdate = async (caseNumber: string, pk: number | string, payload: Record<string, any>): Promise<import("./types").CaseCommunicationDetailResponse> => {
    const res = await apiClient.patch<import("./types").CaseCommunicationDetailResponse>(`/case/${encodeURIComponent(caseNumber)}/communication/${pk}/`, payload);
    return res.data;
  };
  export const CaseCommunicationDelete = async (caseNumber: string, pk: number | string): Promise<ApiResponse<null>> => {
    const res = await apiClient.delete<ApiResponse<null>>(`/case/${encodeURIComponent(caseNumber)}/communication/${pk}/`);
    return res.data;
  };
  export const CaseCommunicationRecipientList = async (caseNumber: string, commPk: number | string): Promise<import("./types").CaseCommunicationRecipientListResponse> => {
    const res = await apiClient.get<import("./types").CaseCommunicationRecipientListResponse>(`/case/${encodeURIComponent(caseNumber)}/communication/${commPk}/recipients/`);
    return res.data;
  };
  export const CaseCommunicationRecipientCreate = async (caseNumber: string, commPk: number | string, payload: any): Promise<any> => {
    const res = await apiClient.post(`/case/${encodeURIComponent(caseNumber)}/communication/${commPk}/recipients/`, payload);
    return res.data;
  };
  export const CaseCommunicationServiceReportList = async (caseNumber: string, recipientPk: number | string): Promise<import("./types").CaseCommunicationServiceReportListResponse> => {
    const res = await apiClient.get<import("./types").CaseCommunicationServiceReportListResponse>(`/case/${encodeURIComponent(caseNumber)}/recipients/${recipientPk}/service-reports/`);
    return res.data;
  };
  export const CaseCommunicationServiceReportCreate = async (caseNumber: string, recipientPk: number | string, payload: Record<string, any>): Promise<import("./types").CaseCommunicationServiceReportListResponse> => {
    const res = await apiClient.post(`/case/${encodeURIComponent(caseNumber)}/recipients/${recipientPk}/service-reports/`, payload);
    return res.data;
  };
  export const CaseCommunicationServiceWitnessList = async (caseNumber: string, reportPk: number | string): Promise<import("./types").CaseCommunicationServiceWitnessListResponse> => {
    const res = await apiClient.get<import("./types").CaseCommunicationServiceWitnessListResponse>(`/case/${encodeURIComponent(caseNumber)}/service-reports/${reportPk}/witnesses/`);
    return res.data;
  };
  export const CaseCommunicationServiceWitnessCreate = async (caseNumber: string, reportPk: number | string, payload: Record<string, any>): Promise<import("./types").CaseCommunicationServiceWitnessListResponse> => {
    const res = await apiClient.post(`/case/${encodeURIComponent(caseNumber)}/service-reports/${reportPk}/witnesses/`, payload);
    return res.data;
  };


  export const CaseOrderList = async (
    caseNumber: string,
  ): Promise<CaseOrderListResponse> => {
    try {
      const res = await apiClient.get<CaseOrderListResponse>(
        `/case/${encodeURIComponent(caseNumber)}/order/`,
      );
      return res.data;
    } catch (err: any) {
      throw err?.response?.data || err;
    }
  };

  export const CaseOrderDetail = async (
    caseNumber: string,
    pk: number | string,
  ): Promise<CaseOrderDetailResponse> => {
    try {
      const res = await apiClient.get<CaseOrderDetailResponse>(
        `/case/${encodeURIComponent(caseNumber)}/order/${pk}/`,
      );
      return res.data;
    } catch (err: any) {
      throw err?.response?.data || err;
    }
  };

  export const CaseOrderCreate = async (
    caseNumber: string,
    payload: Record<string, any>,
  ): Promise<CaseOrderDetailResponse> => {
    try {
      const res = await apiClient.post<CaseOrderDetailResponse>(
        `/case/${encodeURIComponent(caseNumber)}/order/`,
        payload,
      );
      return res.data;
    } catch (err: any) {
      throw err?.response?.data || err;
    }
  };

  export const CaseOrderUpdate = async (
    caseNumber: string,
    pk: number | string,
    payload: Record<string, any>,
  ): Promise<CaseOrderDetailResponse> => {
    try {
      const res = await apiClient.patch<CaseOrderDetailResponse>(
        `/case/${encodeURIComponent(caseNumber)}/order/${pk}/`,
        payload,
      );
      return res.data;
    } catch (err: any) {
      throw err?.response?.data || err;
    }
  };

  export const CaseOrderDelete = async (
    caseNumber: string,
    pk: number | string,
  ): Promise<ApiResponse<null>> => {
    try {
      const res = await apiClient.delete<ApiResponse<null>>(
        `/case/${encodeURIComponent(caseNumber)}/order/${pk}/`,
      );
      return res.data;
    } catch (err: any) {
      throw err?.response?.data || err;
    }
  };

  export const AnnouncementList = async (
    payload?: any,
  ): Promise<AnnouncementListResponse> => {
    try {
      const res = await publicClient.get<AnnouncementListResponse>(
        "/master/announcements/",
        {
          params: payload,
        },
      );
      return res.data;
    } catch (err: any) {
      throw err?.response?.data || err;
    }
  };

  export const AnnouncementCreate = async (
    payload: Omit<Announcement, "id">,
  ): Promise<AnnouncementDetailResponse> => {
    try {
      const res = await apiClient.post<AnnouncementDetailResponse>(
        "/master/announcements/create/",
        payload,
      );
      return res.data;
    } catch (err: any) {
      throw err?.response?.data || err;
    }
  };

  export const AnnouncementUpdate = async (
    pk: number | string,
    payload: Partial<Announcement>,
  ): Promise<AnnouncementDetailResponse> => {
    try {
      const res = await apiClient.patch<AnnouncementDetailResponse>(
        `/master/announcements/${pk}/`,
        payload,
      );
      return res.data;
    } catch (err: any) {
      throw err?.response?.data || err;
    }
  };

  export const AnnouncementDelete = async (
    pk: number | string,
  ): Promise<ApiResponse<null>> => {
    try {
      const res = await apiClient.delete<ApiResponse<null>>(
        `/master/announcements/${pk}/`,
      );
      return res.data;
    } catch (err: any) {
      throw err?.response?.data || err;
    }
  };

  export const AnnouncementDetail = async (
    pk: number | string,
  ): Promise<AnnouncementDetailResponse> => {
    try {
      const res = await apiClient.get<AnnouncementDetailResponse>(
        `/master/announcements/${pk}/`,
      );
      return res.data;
    } catch (err: any) {
      throw err?.response?.data || err;
    }
  };
}
