import { ApiResponse } from '@/lib/types';
import { z } from "zod";
import { AddressUpdateSchema } from "./validations";

export type UUID = string;
export type ISODateString = string;

export type ChangeAddressData = null | undefined;

export type ChangeAddressResponse = ApiResponse<ChangeAddressData>;

export type ChangeAddressPayload = z.infer<typeof AddressUpdateSchema>;
