import { AddressUpdateSchema } from "@/app/identity/profile/details/change-address/validations";
import z from "zod";

export type AddressForm = z.infer<typeof AddressUpdateSchema>;
