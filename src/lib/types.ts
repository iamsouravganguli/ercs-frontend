export type Pagination = {
  count: number;
  page: number;
  pages: number;
  next: string | null;
  previous: string | null;
};


export type FieldErrorMap = Record<string, string[]>;


export type ApiErrors = FieldErrorMap & {
  non_field_errors?: string[];
};


export type ApiResponse<T> = {
  success: boolean;
  message: string;
  result: {
    data: T;
    pagination: Pagination | null;
    summary?: any;
  } | null;
  errors: ApiErrors | null;
};

export type CaptchaData = {
  captcha_key: string;
  captcha_image: string;
  expires_in: number;
  debug_text?: string;
};

export type OTPResponse = {
  otp_key: string;
  expires_in: number;
  debug_otp?: string;
};

export type OTPPayload = {
  identifier: string;
  purpose: string;
  channel: string;
};

export type SessionCheckData = {
  is_authenticated: boolean;
  username: string | null;
  role: string | null;
  court: number | null;
  role_detail?: any | null;
};

export type SingoutData = null | undefined;

export type ProfileData = {
  username: string;
  name: string;
  email: string | null;
  phone: string;

  bar_council_number: string | null;

  role: string;
  role_detail?: Record<string, unknown> | null;

  gender: "MALE" | "FEMALE" | "OTHER" | null;

  employee_id?: string | null;

  court?: string | null;
  court_detail?: (CourtMeta & Record<string, unknown>) | null;

  court_location_detail?: Record<string, unknown> | null;

  state_code_census?: string | null;
  state_name?: string | null;

  mandal_code?: string | null;
  mandal_name?: string | null;

  district_code_census?: string | null;
  district_name?: string | null;

  tehsil_code_census?: string | null;
  tehsil_name?: string | null;

  pargana_code?: string | null;
  pargana_name?: string | null;

  ricircle_code?: string | null;
  ricircle_name?: string | null;

  rsicircle_code?: string | null;
  rsicircle_name?: string | null;

  village_code_census?: string | null;
  village_name?: string | null;
};

export interface BaseMaster {
  id: number;
  code: string;
  name: string;
  name_en?: string | null;
  is_active: boolean;
  is_display: boolean;
  created_at: string;
  updated_at: string;
  display_order: number;
}
export type CourtLevel = BaseMaster;

export interface CaseNatureByCourtLevelData {
  id: number;
  court_level: number;
  case_nature: BaseMaster;
}

export type CaseNatureByCourtLevelResponse = ApiResponse<
  CaseNatureByCourtLevelData[]
>;

export interface CourtData extends BaseMaster {
  level: number;
}

export type CourtResponse = ApiResponse<CourtData[]>;

export interface CourtActMapping {
  id: number;
  court: number;
  act: number;
  act_detail: BaseMaster;
}

export type CourtActMappingResponse = ApiResponse<CourtActMapping[]>;

export interface CourtAndActWiseSectionMapping {
  id: number;
  court: number;
  act: number;
  section: number;
  section_detail: BaseMaster;
}

export type CourtAndActWiseSectionResponse = ApiResponse<
  CourtAndActWiseSectionMapping[]
>;

export interface ActSectionMapping {
  id: number;
  act: number;
  act_detail: BaseMaster;
  section: number;
  section_detail: BaseMaster;
  level: number;
  level_detail: {
    id: number;
    code: string;
    name: string;
    name_en?: string | null;
    level: string;
    hierarchy_order: number;
    is_active: boolean;
    is_display: boolean;
  };

  is_active: boolean;
  is_display: boolean;
  created_at: string;
}

export interface SummaryCase {
  filed: number;
  disposed: number;
  pending: number;
  in_progress: number;
  courts: number;
}
export type SummaryCaseResponse = ApiResponse<SummaryCase>;

export interface SummaryMaster {
  roles: {
    active: number;
    inactive: number;
  };
  permissions: {
    active: number;
    inactive: number;
  };
  courts: {
    active: number;
    inactive: number;
  };
  court_locations: {
    active: number;
    inactive: number;
  };
}
export type SummaryMasterResponse = ApiResponse<SummaryMaster>;
export type RoleCode = "SA" | "PO" | "CO" | "CC" | "RI" | "RSI" | "AD" | "CT";

export interface RoleStat {
  name: string;
  active: number;
  inactive: number;
}
export type RoleWiseStats = Record<RoleCode, RoleStat>;

export type SummaryAccountResponse = ApiResponse<RoleWiseStats>;

export type CaseNatureData = BaseMaster;
export type CaseNatureResponse = ApiResponse<CaseNatureData[]>;
export type AppealTypeData = BaseMaster;
export type AppealTypeResponse = ApiResponse<AppealTypeData[]>;

export type CourtLevelData = CourtLevel;
export type CourtLevelResponse = ApiResponse<CourtLevelData[]>;

export type CaseTypeData = BaseMaster;
export type CaseTypeResponse = ApiResponse<CaseTypeData[]>;

export type CourtLocationData = BaseMaster;
export type CourtLocationResponse = ApiResponse<CourtLocationData[]>;

export type ActSectionMappingData = ActSectionMapping;

export type ActSectionMappingResponse = ApiResponse<ActSectionMappingData[]>;

export interface PartyTypeData extends BaseMaster {
  order: number;
}

export type PartyTypeResponse = ApiResponse<PartyTypeData[]>;

export interface PartyNatureData extends BaseMaster {
  is_individual: boolean;
  is_organization: boolean;
  requires_representative: boolean;
}

export type PartyNatureResponse = ApiResponse<PartyNatureData[]>;

export type GenderData = BaseMaster;
export type GenderResponse = ApiResponse<GenderData[]>;

export type PaymentModeData = BaseMaster;
export type PaymentModeResponse = ApiResponse<PaymentModeData[]>;

export interface PaymentTypeData extends BaseMaster {
  entity_type: string;
  description: string;
  payment_mode: number | null;
}
export type PaymentTypeResponse = ApiResponse<PaymentTypeData[]>;

export type OrderTypeData = BaseMaster;
export type OrderTypeResponse = ApiResponse<OrderTypeData[]>;

export type HearingTypeData = BaseMaster;
export type HearingTypeResponse = ApiResponse<HearingTypeData[]>;

export type HearingStatusData = BaseMaster;
export type HearingStatusResponse = ApiResponse<HearingStatusData[]>;

export interface HearingOutcomeData extends BaseMaster {
  allowed_statuses: string;
  next_case_status_code?: string;
}
export type HearingOutcomeResponse = ApiResponse<HearingOutcomeData[]>;

export type IdentityProofTypeData = BaseMaster;
export type IdentityProofTypeResponse = ApiResponse<IdentityProofTypeData[]>;

export type LifeStatusesData = BaseMaster;
export type LifeStatusesResponse = ApiResponse<LifeStatusesData[]>;

export type RelationTypeData = BaseMaster;
export type RelationTypeResponse = ApiResponse<RelationTypeData[]>;

export interface CommunicationTypeData extends BaseMaster {
  display_order: number;
  is_service_report_required: boolean;
  is_party_required: boolean;
  is_document_upload_required: boolean;
  is_subject_required: boolean;
  is_content_required: boolean;
  is_sms_enabled: boolean;
  is_email_enabled: boolean;
  is_post_enabled: boolean;
  is_whatsapp_enabled: boolean;
  is_portal_enabled: boolean;
}
export type CommunicationTypeResponse = ApiResponse<CommunicationTypeData[]>;

export interface NoticeTemplateData extends BaseMaster {
  file_name: string;
  sort_order: number;
  communication_type: number;
}

export interface StatusesData extends BaseMaster {
  type: string;
  color: string;
}

export type StatusesResponse = ApiResponse<StatusesData[]>;

export type NoticeTemplateResponse = ApiResponse<NoticeTemplateData[]>;

export interface ServiceModeData extends BaseMaster {
  display_order: number;
  is_physical: boolean;
  is_digital: boolean;
  is_witness_required: boolean;
  is_receiver_required: boolean;
}

export type ServiceModeResponse = ApiResponse<ServiceModeData[]>;

export interface ReceiverRelationData extends BaseMaster {
  display_order: number;
  is_family: boolean;
  is_official: boolean;
}

export type ReceiverRelationResponse = ApiResponse<ReceiverRelationData[]>;

export interface ParentDetail {
  id: number;
  code: string;
  name: string;
}

export interface DSCertificateListData {
  id: number;
  code: string;
  username: string;
  user_role?: string;
  device_id: number;
  cert_id: number;
  serial: string;
  valid_from: string;
  valid_to: string;
  is_active: boolean;
  created_at: string;
}

export type DSCertificateListResponse = ApiResponse<DSCertificateListData[]>;
export type DSCertificateDetailResponse = ApiResponse<DSCertificateListData>;

export interface SessionListData {
  session_id: string;
  device: string;
  ip_address: string;
  user_agent: string;
  is_active: boolean;
  expires_at: string;
  last_used_at: string;
  created_at: string;
}
export type SessionListResponse = ApiResponse<SessionListData[]>;

export type DocUploadData = {
  id: number;
  file_name: string;
  file_size_mb: number;
  mime_type: string;
  file_checksum: string;
  file_url: string;
};

export type DocUploadResponse = ApiResponse<DocUploadData>;

export type DocQRSessionCreatePayload = {
  linked_model?: string;
  linked_object_id?: string;
  type_of_doc?: string;
  host?: string;
};
export type DocQRSessionData = {
  id: number;
  token: string;
  linked_model: string;
  linked_object_id: string;
  type_of_doc: string;
  status: string;
  expires_at: string;
  used_at: string | null;
  is_expired: boolean;
  qr_image?: string | null;
  doc: number | null;
  created_at: string;
};
export type DocQRSessionResponse = ApiResponse<DocQRSessionData>;


export interface DscSignatureData {
  id: number;
  linked_model: string;
  linked_object_id: string;
  doc: number | null;
  type_of_doc: string | null;
  signed_by: string | null;
  signed_by_detail?: { username: string; name: string } | null;
  dsc: number | null;
  dsc_detail?: { id: number; code: string; serial: string; subject: string | null } | null;
  signature_hash: string;
  document_hash: string | null;
  algorithm: string | null;
  signed_at: string | null;
  remarks: string | null;
  meta: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
export type DscSignatureListResponse = ApiResponse<DscSignatureData[]>;
export type DscSignatureDetailResponse = ApiResponse<DscSignatureData>;

export interface CaseCommunicationData {
  id: number;
  case: string;
  communication_id: string;
  communication_type: number;
  communication_type_detail?: (BaseMaster & { is_service_report_required?: boolean; is_party_required?: boolean; is_document_upload_required?: boolean; is_subject_required?: boolean; is_content_required?: boolean }) | null;
  status: number;
  status_detail?: (BaseMaster & { type?: string }) | null;
  subject: string | null;
  content: string | null;
  issue_date: string | null;
  remarks: string | null;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
}
export type CaseCommunicationListResponse = ApiResponse<CaseCommunicationData[]>;
export type CaseCommunicationDetailResponse = ApiResponse<CaseCommunicationData>;

export interface CaseCommunicationRecipientData {
  id: number;
  communication: number;
  party: number;
  party_detail?: { id: number; full_name: string } | null;
  address_snapshot: string | null;
  phone_snapshot: string | null;
  email_snapshot: string | null;
  remarks: string | null;
  created_by?: string | null;
}
export type CaseCommunicationRecipientListResponse = ApiResponse<CaseCommunicationRecipientData[]>;

export interface CaseCommunicationServiceReportData {
  id: number;
  recipient: number;
  status: number;
  status_detail?: (BaseMaster & { type?: string }) | null;
  service_mode_text: string | null;
  service_date: string | null;
  receiver_name: string | null;
  receiver_relation_text: string | null;
  remarks: string | null;
  served_by?: string | null;
  created_by?: string | null;
  created_at?: string;
}
export type CaseCommunicationServiceReportListResponse = ApiResponse<CaseCommunicationServiceReportData[]>;

export interface CaseCommunicationServiceWitnessData {
  id: number;
  service_report: number;
  full_name: string;
  phone: string | null;
  address: string | null;
  remarks: string | null;
  created_by?: string | null;
}
export type CaseCommunicationServiceWitnessListResponse = ApiResponse<CaseCommunicationServiceWitnessData[]>;

export interface CaseListData {
  case_number: string;
  court_level_detail: BaseMaster;
  court_detail: BaseMaster & {
    level: number;
    level_detail: {
      id: number;
      code: string;
      name: string;
      name_en: string | null;
    };
  };
  case_nature_detail: BaseMaster;
  created_at: string;
  updated_at: string;

  state_code_census: string | null;
  state_name: string | null;
  state_name_en: string | null;
  mandal_code: string | null;
  mandal_name: string | null;
  mandal_name_en: string | null;
  district_code_census: string | null;
  district_name: string | null;
  district_name_en: string | null;
  district_hq_name: string | null;
  district_hq_name_en: string | null;
  tehsil_code_census: string | null;
  tehsil_name: string | null;
  tehsil_name_en: string | null;
  pargana_code_census: string | null;
  pargana_name: string | null;
  pargana_name_en: string | null;
  ricircle_code: string | null;
  ricircle_name: string | null;
  ricircle_name_en: string | null;
  rsicircle_code: string | null;
  rsicircle_name: string | null;
  rsicircle_name_en: string | null;
  village_code_census: string | null;
  village_name: string | null;
  village_name_en: string | null;

  offline_case_number: string | null;
  legacy_court_id: string | null;
  legacy_court_name: string | null;
  legacy_case_transfer_id: string | null;
  legacy_mut_case_transfer_id: string | null;
  legacy_act_name: string | null;
  legacy_act_name_en: string | null;
  legacy_section_name: string | null;
  legacy_section_name_en: string | null;
  legacy_status_id: string | null;
  legacy_hearing_id: string | null;
  legacy_status_name: string | null;
  legacy_status_name_en: string | null;

  legacy_is_mutation_notice_created: boolean;
  legacy_is_mutation_report_created: boolean;
  legacy_is_deleted: boolean;
  legacy_is_niriksan_fee_paid: boolean;
  legacy_is_mutation_notice_fee_paid: boolean | null;
  legacy_fees_detail_id: string | null;

  sro_unique_no: string | null;
  sro_reg_no: string | null;
  sro_deed: string | null;
  sro_sub_deed: string | null;
  sro_mutation_office_code: string | null;
  sro_application_rec_date: string | null;
  sro_registration_date: string | null;
  sro_reg_by_user_id: string | null;

  legacy_created_by: string | null;
  case_nature: number;
  appeal_type: number | null;
  court_level: number;
  court: number;
  act: number | null;
  section: number | null;
  created_by: string | null;
  current_stage_detail?: BaseMaster | null;
  current_status_detail?:
    | (BaseMaster & { color?: string; type?: string })
    | null;
  act_detail?: BaseMaster | null;
}

export type CaseListResponse = ApiResponse<CaseListData[]>;

export type CaseInitResponseData = {
  case_number: string;
};

export type CaseInitApiResponse = ApiResponse<CaseInitResponseData>;

export type CaseNature = BaseMaster;
export type AppealType = BaseMaster;
export type CourtLevelMeta = BaseMaster & {
  level: string;
  parent: number | null;
  parent_detail: {
    id: number;
    code: string;
    name: string;
  } | null;
  hierarchy_order: number;
};
export type CourtMeta = BaseMaster & {
  level: number;
  level_detail: {
    id: number;
    code: string;
    name: string;
    level: string;
  };
};

export type ActMeta = BaseMaster;
export type SectionMeta = BaseMaster;

export type CourtDetailReadResponseData = {
  case_number: string;
  temp_number: string;

  case_nature: CaseNature;
  appeal_type: AppealType;

  court_level: CourtLevelMeta;
  court: CourtMeta;

  act: ActMeta;
  section: SectionMeta;

  state_code_census: string;
  state_name: string;

  mandal_code: string | null;
  mandal_name: string | null;

  district_code_census: string | null;
  district_name: string | null;

  tehsil_code_census: string | null;
  tehsil_name: string | null;
  tehsil_name_en: string | null;

  is_submitted: boolean;
  is_paid?: boolean;
  description?: string | null;

  current_stage_detail?: BaseMaster | null;
  current_status_detail?:
    | (BaseMaster & { color?: string; type?: string })
    | null;

  created_at: string;
  updated_at: string;
};

export type CourtDetailReadApiResponse =
  ApiResponse<CourtDetailReadResponseData>;

export interface CaseHearingData {
  id: number;
  case: number;
  hearing_date: string;
  hearing_expected_start_time: string;
  hearing_expected_end_time?: string;
  hearing_expected_duration?: number;
  status: "SCHEDULED" | "COMPLETED" | "ADJOURNED" | "CANCELLED" | string;
  status_detail?: {
    code: string;
    name: string;
    name_en: string;
  };
  remarks?: string;
  hearing_type?: number | null;
  hearing_type_detail?: HearingTypeData | null;
  hearing_status?: number | null;
  hearing_status_detail?: HearingStatusData | null;
  hearing_outcome?: number | null;
  hearing_outcome_detail?: HearingOutcomeData | null;
  documents?: number[];
  documents_detail?: any[];
  video_conference?: boolean;
  video_conference_link?: string;
  created_by?: number;
  created_by_detail?: {
    id: number;
    full_name: string;
    username: string;
  };
  created_at?: string;
  updated_at?: string;
}

export type CaseHearingListResponse = ApiResponse<CaseHearingData[]>;
export type CaseHearingDetailResponse = ApiResponse<CaseHearingData>;

export type CourtDetailWriteResponseData = {
  data: null;
};

export type CourtDetailWriteApiResponse =
  ApiResponse<CourtDetailWriteResponseData>;

export type CourtDetailWriteRequest = {
  court_level: number | null;
  case_nature: number | null;
  appeal_type?: number | null;
  court: number | null;
  act?: number | null;
  section?: number | null;
  state_code_census: string;
  state_name: string;
  mandal_code?: string | null;
  mandal_name?: string | null;
  district_code_census?: string | null;
  district_name?: string | null;
  tehsil_code_census?: string | null;
  tehsil_name?: string | null;
  tehsil_name_en?: string | null;
  description?: string | null;
};

export interface TimelineEvent {
  date: string;
  type: "REGISTRATION" | "STAGE_CHANGE" | "HEARING" | "ORDER" | "VC";
  title: string;
  description: string;
  meta: any;
}

export interface PartyDetail {
  id: number;
  full_name: string;
  relation_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  contact_address: string | null;
  contact_pincode: string | null;
  identity_number: string | null;
  is_phone_verified: boolean;
  party_type: number;
  party_type_detail: {
    id: number;
    name: string;
    name_en: string;
    code: string;
  } | null;
  gender: number | null;
  gender_detail: {
    id: number;
    name: string;
    name_en: string;
    code: string;
  } | null;
  life_status: number | null;
  life_status_detail: {
    id: number;
    name: string;
    name_en: string;
    code: string;
  } | null;
  relation_type: number | null;
  relation_type_detail: {
    id: number;
    name: string;
    name_en: string;
    code: string;
  } | null;
  identity_type: number | null;
  identity_type_detail: {
    id: number;
    name: string;
    name_en: string;
    code: string;
  } | null;
  status: number;
  status_detail: {
    id: number;
    name: string;
    name_en: string;
    code: string;
  } | null;
  created_at: string;
  updated_at: string;
}

export type CasePartyListResponse = ApiResponse<PartyDetail[]>;
export type CasePartyDetailResponse = ApiResponse<PartyDetail>;

export interface PartyPayload {
  party_type: number;
  full_name: string;
  gender: number | null;
  life_status: number | null;
  relation_type: number | null;
  relation_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  contact_address: string | null;
  contact_pincode: string | null;
  identity_type: number | null;
  identity_number: string | null;
  status?: number | null;
}

export interface LandDetail {
  id: number;
  case: string;
  state_code_census: string;
  state_name: string;
  mandal_code: string | null;
  mandal_name: string | null;
  district_code_census: string | null;
  district_name: string | null;
  tehsil_code_census: string | null;
  tehsil_name: string | null;
  pargana_code: string | null;
  pargana_name: string | null;
  ricircle_code: string | null;
  ricircle_name: string | null;
  ricircle_name_en: string | null;
  rsicircle_code: string | null;
  rsicircle_name: string | null;
  rsicircle_name_en: string | null;
  village_code_census: string | null;
  village_name: string | null;
  khata_number: string;
  khasra_no: string;
  land_type: string;
  land_type_desc: string;
  fasli_year: string;
  total_land: number;
  disputed_land: number;
  actual_owners: any[];
  orders: any[];
  ebhulekh: any[];
  is_active: boolean;
  is_submitted: boolean;
}

export interface LandPayload {
  khata_number: string;
  khasra_no: string;
  land_type: string;
  land_type_desc: string;
  fasli_year: string;
  total_land: number;
  disputed_land?: number;
  actual_owners?: any[];
  orders?: any[];
  ebhulekh?: any[];
  mandal_code?: string | null;
  mandal_name?: string | null;
  district_code_census?: string | null;
  district_name?: string | null;
  tehsil_code_census?: string | null;
  tehsil_name?: string | null;
  pargana_code?: string | null;
  pargana_name?: string | null;
  ricircle_code?: string | null;
  ricircle_name?: string | null;
  ricircle_name_en?: string | null;
  rsicircle_code?: string | null;
  rsicircle_name?: string | null;
  rsicircle_name_en?: string | null;
  village_code_census?: string | null;
  village_name?: string | null;
  is_active?: boolean;
}

export type CaseLandListResponse = ApiResponse<LandDetail[]>;
export type CaseLandDetailResponse = ApiResponse<LandDetail>;

export interface CreatePaymentOrderRequest {
  model: string;
  object_id: string;
  amount: number;
  description?: string;
  metadata?: any;
}

export interface CreatePaymentOrderResponseData {
  payment_order_id: number;
  razorpay_order_id: string;
  amount: number;
  currency: string;
  key: string;
}

export type CreatePaymentOrderApiResponse =
  ApiResponse<CreatePaymentOrderResponseData>;

export interface VerifyPaymentRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface PaymentOrderData {
  id: number;
  reference_no?: string;
  payment_number?: string;
  paid_by: string;
  object_type: string;
  object_id: string;
  description: string;
  amount: number;
  amount_in_inr?: number;
  currency: string;
  status: "CREATED" | "PAID" | "FAILED";
  status_detail?: {
    code: string;
    name: string;
    name_en: string;
  };
  razorpay_order_id: string;
  razorpay_key?: string;
  razorpay_payment_id: string | null;
  created_at: string;
  paid_at: string | null;
  metadata: any;
}

export type PaymentOrderListParams = {
  status?: string;
  object_id?: string;
  case_number?: string;
  search?: string;
  ordering?: string;
  page?: number;
  limit?: number;

  [key: string]: any;
};

export type PaymentOrderSummary = {
  total_debits: number;
  total_credits: number;
  net_balance_due: number;
  currency: string;
};

export type PaymentOrderListApiResponse = ApiResponse<PaymentOrderData[]> & {
  summary?: PaymentOrderSummary;
};

export type VerifyPaymentApiResponse = ApiResponse<PaymentOrderData>;
export type PaymentOrderDetailApiResponse = ApiResponse<PaymentOrderData>;

export interface CaseOrderData {
  id: number;
  case: number;
  hearing?: number | null;
  order_no: string;
  order_date: string;
  order_type: "INTERIM" | "FINAL" | "JUDGMENT" | "DIRECTION" | string;
  title: string;
  summary: string;
  remarks: string;
  passed_by: number;
  passed_by_detail?: {
    id: number;
    full_name: string;
    username: string;
  };
  created_at: string;
  updated_at: string;
}

export type CaseOrderListResponse = ApiResponse<CaseOrderData[]>;
export type CaseOrderDetailResponse = ApiResponse<CaseOrderData>;

export interface Announcement {
  id?: number;
  title: string;
  category: "news" | "update" | "publication";
  doc_url?: string | null;
  file_name?: string | null;
  external_url?: string | null;
  date: string;
  pinned?: boolean;
  created_at?: string;
  updated_at?: string;
}

export type AnnouncementListResponse = ApiResponse<Announcement[]>;
export type AnnouncementDetailResponse = ApiResponse<Announcement>;
