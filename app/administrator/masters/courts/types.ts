import { ApiResponse, BaseMaster } from "@/lib";

export interface CourtData extends BaseMaster {
  level: number;
}

export type CourtListResponse = ApiResponse<CourtData[]>;
export type CourtDetailResponse = ApiResponse<CourtData>;
export type MiniCourtDetail = {
  id: number;
  code: string;
  name: string | null;
  name_en: string | null;
};
