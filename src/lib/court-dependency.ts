import { resolve } from "./utils";

type CourtDependencyInput = {
  courtLevel?: string;
};

export type CourtUIConfig = {
  showMandal: boolean;
  showDistrict: boolean;
  showTehsil: boolean;
  showCaseNature: boolean;
};

export function getCourtUIConfig(input: CourtDependencyInput): CourtUIConfig {
  return resolve<CourtDependencyInput, CourtUIConfig>(
    input,
    [
      {
        when: (d) => d.courtLevel === "BOARD_OF_REVENUE",
        then: () => ({
          showMandal: false,
          showDistrict: false,
          showTehsil: false,
          showCaseNature: true,
        }),
      },
      {
        when: (d) => d.courtLevel === "COMMISSIONARY",
        then: () => ({
          showMandal: true,
          showDistrict: false,
          showTehsil: false,
          showCaseNature: true,
        }),
      },
      {
        when: (d) => d.courtLevel === "DISTRICT",
        then: () => ({
          showMandal: true,
          showDistrict: true,
          showTehsil: false,
          showCaseNature: true,
        }),
      },
      {
        when: (d) => d.courtLevel === "SUB_DIVISION",
        then: () => ({
          showMandal: true,
          showDistrict: true,
          showTehsil: true,
          showCaseNature: true,
        }),
      },
      {
        when: (d) => d.courtLevel === "TEHSIL",
        then: () => ({
          showMandal: true,
          showDistrict: true,
          showTehsil: true,
          showCaseNature: true,
        }),
      },
    ],
    () => ({
      showMandal: false,
      showDistrict: false,
      showTehsil: false,
      showCaseNature: false,
    }),
  );
}
