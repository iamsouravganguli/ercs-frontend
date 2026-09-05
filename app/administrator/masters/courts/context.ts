import { atom } from "jotai";
import { CourtData } from "./types";
import { atomWithReset } from "jotai/utils";

export const CourtAddModalAtom = atom(false);
export const CourtEditModalAtom = atom(false);

export const CourtDetailAtom = atomWithReset<CourtData | null>(null);
