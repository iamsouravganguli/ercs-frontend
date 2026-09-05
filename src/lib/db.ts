import Dexie, { Table } from "dexie";
import { CourtDetailWriteRequest } from "./types";

export interface Case {
  case_number: string;
  case_nature_id: string;
  case_nature_name: string;
  appeal_type_id?: string;
  appeal_type_name?: string;
  court_level_id: string;
  court_level_name: string;
  state_code_census: string;
  state_name: string;
  mandal_code?: string;
  mandal_name?: string;
  district_code_census?: string;
  district_name?: string;
  tehsil_code_census?: string;
  tehsil_name?: string;
  court_id: string;
  court_name: string;
  court_location_id?: string;
  court_location_name?: string;
  act_id?: string;
  act_name?: string;
  section_id?: string;
  section_name?: string;
  created_by: string;
  created_at: string;
  updated_at?: string;
}

export interface Party {
  id?: number;
  case_number: string;
  name: string;
  is_mobile_verified: boolean;
  gender_id: string;
  gender_name: string;
  life_status_id: string;
  life_status_name: string;
  relation_type: string;
  relation_name?: string;
  mobile?: string;
  email?: string;
  address: string;
  pincode?: string;
  identity_proof_type_id: string;
  identity_proof_type_name: string;
  identity_proof_number: string;
  advocate_name?: string;
  advocate_registration_no?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Plaintiff extends Party {
  party_type: "plaintiff";
}

export interface Defendant extends Party {
  party_type: "defendant";
}

export type AnyParty = Plaintiff | Defendant;

export interface ActualOwner {
  name: string;
  father: string;
  address: string;
}

export interface LandRecord {
  id?: number;
  state_code_census: string;
  state_name: string;
  mandal_code?: string;
  mandal_name?: string;
  district_code_census?: string;
  district_name?: string;
  tehsil_code_census?: string;
  tehsil_name?: string;
  pargana_code?: string;
  pargana_name?: string;
  ricircle_code?: string;
  ricircle_name?: string;
  rsicircle_code?: string;
  rsicircle_name?: string;
  village_code_census?: string;
  village_name?: string;
  khata_number: string;
  khasra_no: string;
  land_type: string;
  land_type_desc: string;
  fasli_year: string;
  total_land: string;
  disputed_land: string;
  actual_owners: ActualOwner[];
  orders: string[];
  is_active: boolean;
}

export interface DocFile {
  id: string;
  case_number: string;
  name: string;
  original_name: string;
  type_of_doc: string;
  remarks?: string;
  status?: number;
  status_detail?: {
    id: number;
    name: string;
    name_en: string;
    code: string;
  };
  file?: File | null;
  file_url?: string;
  size: number;
  type: string;
  uploaded_at: string;
}

export interface CourtDetailDraft {
  case_number: string;
  payload: CourtDetailWriteRequest & { description?: string };
  updated_at: string;
}

export interface PartyDraft {
  id: string;
  case_number: string;
  party_type_code: string;
  party_nature_code: string;
  full_name: string;
  gender?: string;
  life_status: string;
  relation_type?: string;
  relation_name?: string;
  contact_phone?: string;
  contact_email?: string;
  contact_address?: string;
  contact_pincode?: string;
  identity_type?: string;
  identity_number?: string;
  is_phone_verified: boolean;
}

export interface LandDraft {
  id: string;
  case_number: string;
  state_code_census?: string | null;
  state_name?: string | null;
  mandal_code?: string | null;
  mandal_name?: string | null;
  district_code_census?: string | null;
  district_name?: string | null;
  tehsil_code_census?: string | null;
  tehsil_name?: string | null;
  tehsil_name_en?: string | null;
  pargana_code?: string | null;
  pargana_name?: string | null;
  ricircle_code?: string | null;
  rsicircle_code?: string | null;
  ricircle_name?: string | null;
  rsicircle_name?: string | null;
  village_code_census?: string | null;
  village_name?: string | null;
  khata_number?: string | null;
  land_type?: string | null;
  land_type_description?: string | null;
  fasli_year?: string | null;
  land_revenue_payable?: string | null;
  orders?: string[] | null;
  remarks?: string | null;
  khasra_no?: string | null;
  plots: string[];
  calculated_area?: number;
  disputed_land?: number;
  owners?: {
    name: string;
    father: string;
    address: string;
  }[];
}

class CaseDB extends Dexie {
  cases!: Table<Case>;
  parties!: Table<PartyDraft>;
  plaintiffs!: Table<Plaintiff>;
  defendants!: Table<Defendant>;
  land_records!: Table<LandRecord>;
  documents!: Table<DocFile>;
  court_details_drafts!: Table<CourtDetailDraft>;
  land_drafts!: Table<LandDraft>;

  constructor() {
    super("CaseDB");

    this.version(1).stores({
      cases: `
        case_number,
        created_at,
        case_nature_id,
        court_id,
        state_code_census,
        mandal_code,
        district_code_census,
        tehsil_code_census,
        [court_id+created_at],
        [district_code_census+case_nature_id],
        [court_id+case_nature_id]
      `,

      plaintiffs: `
        ++id,
        case_number,
        identity_proof_number,
        mobile,
        [case_number+identity_proof_number]
      `,

      defendants: `
        ++id,
        case_number,
        identity_proof_number,
        mobile,
        [case_number+identity_proof_number]
      `,

      land_records: `
        ++id,
        state_code_census,
        mandal_code,
        district_code_census,
        tehsil_code_census,
        pargana_code,
        ricircle_code,
        rsicircle_code,
        village_code_census,
        khata_number,
        khasra_no,
        fasli_year,
        is_active,
        [village_code_census+khata_number],
        [village_code_census+fasli_year],
        [village_code_census+khata_number+fasli_year],
        [district_code_census+tehsil_code_census+village_code_census]
      `,

      documents: `
        id,
        case_number,
        type_of_doc,
        uploaded_at
      `,
    });

    this.version(2).stores({
      court_details_drafts: `case_number, updated_at`,
    });

    this.version(3).stores({
      parties: `
        id,
        case_number,
        party_type_code,
        identity_number,
        contact_phone,
        [case_number+party_type_code]
      `,
    });

    this.version(4).stores({
      land_drafts: `
        id,
        case_number,
        village_code_census,
        khata_number
      `,
    });
  }
}

export const caseDB = new CaseDB();
