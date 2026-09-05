import { apiClient } from "@/lib/api-client";
import { ApiResponse } from "./types";


export type KhataDetailPayload = {
  khata_number: string;
  village_code_census: string;
};

export type SearchKhasraPayload = {
  village_code_census?: string;
  khasra_no?: string;
};

export type State = {
  state_code_census: string;
  state_name: string;
};

export type Mandal = {
  mandal_code: string;
  mandal_name: string;
};

export type District = {
  district_code_census: string;
  district_name: string;
  mandal_code: string;
};

export type Tehsil = {
  tehsil_code_census: string;
  district_code_census: string;
  tehsil_name: string;
  tehsil_name_en: string;
};

export type Khata = {
  khata_number: string;
  land_type: string;
};

export type Village = {
  tehsil_code_census: string;
  tehsil_name: string;
  ricircle_code: string;
  rsicircle_code: string;
  ricircle_name: string;
  rsicircle_name: string;
  village_code_census: string;
  vname: string;
  pargana_code_new: string;
  pargana_name: string;
};

export type Pargana = {
  pargana_code_new: string;
  pargana_name: string;
};

export type RI = {
  ricircle_code: string;
  ricircle_name: string;
};
export type RSI = {
  rsicircle_code: string;
  rsicircle_name: string;
};

export type SearchKhasra = {
  khata_number: string;
  khasra_no: string;
  area: number;
};

export interface LandResponse {
  max_range: number[];
  village_name: string;
  pargana_name: string;
  tehsil_name: string;
  district_name: string;
  fasli_year: string;
  khata_number: string;
  landRevenuePayable: number;
  currentDate: string;
  currentTime: string;
  signed_by: string;
  landType: string;
  landTypeDesc: string;
  owners: {
    name: string;
    father: string;
    address: string;
  }[];
  orders: string[];
  remarks: string[];
  plots: {
    khasra_no: string;
    area: number;
    yr_co_ten: string;
  }[];
  total_area: string;
  qr_code_data_uri: string;
  part: string;
  is_archive: boolean;
}


export const BhulekhService = {
  async getTehsilList(districtCodeCensus?: string): Promise<Tehsil[]> {
    if (!districtCodeCensus) return [];
    const res = await apiClient.get<ApiResponse<Tehsil[]>>(
      "/master/location/tehsils/",
      {
        params: { district_code_census: districtCodeCensus },
      },
    );
    return res.data?.result?.data || [];
  },

  async getVillageFullDetail(tehsilCodeCensus?: string): Promise<Village[]> {
    if (!tehsilCodeCensus) return [];
    const res = await apiClient.get<ApiResponse<Village[]>>(
      "/master/location/villages/",
      {
        params: { tehsil_code_census: tehsilCodeCensus },
      },
    );
    return res.data?.result?.data || [];
  },

  async getKhataList(villageCodeCensus?: string): Promise<Khata[]> {
    if (!villageCodeCensus) return [];
    const res = await apiClient.get<ApiResponse<Khata[]>>(
      "/master/land/khatas/",
      {
        params: { village_code_census: villageCodeCensus },
      },
    );
    return res.data?.result?.data || [];
  },

  async getKhataDetail({
    khata_number,
    village_code_census,
  }: KhataDetailPayload): Promise<LandResponse> {
    if (!khata_number || !village_code_census) {
      throw new Error("Missing required parameters for Khata detail");
    }

    const res = await apiClient.get<ApiResponse<LandResponse>>(
      "/master/land/khata-details/",
      {
        params: { khata_number, village_code_census },
      },
    );

    if (!res.data?.result?.data) {
      throw new Error("Khata details not found");
    }
    return res.data.result.data;
  },

  async getSearchKhasra({
    village_code_census,
    khasra_no,
  }: SearchKhasraPayload): Promise<SearchKhasra[]> {
    if (!village_code_census || !khasra_no) return [];

    const res = await apiClient.get<ApiResponse<SearchKhasra[]>>(
      "/master/land/khasra-search/",
      {
        params: { village_code_census, khasra_no },
      },
    );
    return res.data?.result?.data || [];
  },
};


export async function getStates(query?: string): Promise<State[]> {
  const res = await apiClient.get<ApiResponse<State[]>>(
    "/master/location/states/",
    {
      params: { query },
    },
  );
  return res.data?.result?.data || [];
}

export async function getStateByCode(
  stateCodeCensus: string,
): Promise<State | undefined> {
  const states = await getStates();
  return states.find((s) => s.state_code_census === stateCodeCensus);
}


export async function getMandals(query?: string): Promise<Mandal[]> {
  const res = await apiClient.get<ApiResponse<Mandal[]>>(
    "/master/location/mandals/",
    {
      params: { query },
    },
  );
  return res.data?.result?.data || [];
}

export async function getMandalByCode(
  mandalCode: string,
): Promise<Mandal | undefined> {
  const mandals = await getMandals();
  return mandals.find((m) => m.mandal_code === mandalCode);
}


export async function getDistricts(mandalCode?: string): Promise<District[]> {
  const res = await apiClient.get<ApiResponse<District[]>>(
    "/master/location/districts/",
    {
      params: { mandal_code: mandalCode },
    },
  );
  return res.data?.result?.data || [];
}

export async function getDistrictByCode(
  districtCodeCensus: string,
): Promise<District | undefined> {
  const res = await apiClient.get<ApiResponse<District[]>>(
    "/master/location/districts/",
  );
  const districts = res.data?.result?.data || [];
  return districts.find((d) => d.district_code_census === districtCodeCensus);
}


export async function getTehsilByCode(
  districtCodeCensus: string,
  tehsilCodeCensus: string,
): Promise<Tehsil | undefined> {
  const list: Tehsil[] = await BhulekhService.getTehsilList(districtCodeCensus);
  return list.find((t) => t.tehsil_code_census === tehsilCodeCensus);
}


export async function getVillageByCode(
  tehsilCodeCensus: string,
  villageCodeCensus: string,
): Promise<Village | undefined> {
  const list: Village[] =
    await BhulekhService.getVillageFullDetail(tehsilCodeCensus);
  return list.find((v) => v.village_code_census === villageCodeCensus);
}

export async function getParganaByTehsil(tehsilCodeCensus?: string) {
  const data: Village[] =
    await BhulekhService.getVillageFullDetail(tehsilCodeCensus);

  return data
    .filter((item) => item.tehsil_code_census === tehsilCodeCensus)
    .map((item) => ({
      pargana_code_new: item.pargana_code_new,
      pargana_name: item.pargana_name,
    }));
}

export async function getRIByTehsil(tehsilCodeCensus?: string) {
  const data: Village[] =
    await BhulekhService.getVillageFullDetail(tehsilCodeCensus);

  return data
    .filter((item) => item.tehsil_code_census === tehsilCodeCensus)
    .map((item) => ({
      ricircle_code: item.ricircle_code,
      ricircle_name: item.ricircle_name,
    }));
}

export async function getRSIByRI(
  ricircle_code?: string,
  tehsilCodeCensus?: string,
) {
  const data: Village[] =
    await BhulekhService.getVillageFullDetail(tehsilCodeCensus);

  return data
    .filter(
      (item) =>
        item.ricircle_code === ricircle_code &&
        item.tehsil_code_census === tehsilCodeCensus,
    )
    .map((item) => ({
      rsicircle_code: item.rsicircle_code,
      rsicircle_name: item.rsicircle_name,
    }));
}
