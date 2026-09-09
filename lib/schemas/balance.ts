import { z } from "zod";

import { MemberDtoSchema } from "./tab";

// One suggested transfer: `from` should pay `to` exactly `amount` to settle.
export const SettlementSchema = z.object({
  from: MemberDtoSchema,
  to: MemberDtoSchema,
  amount: z.number().positive(),
});
export type Settlement = z.infer<typeof SettlementSchema>;

export const BalancesResponseSchema = z.object({
  // Net per member: positive = they're owed money, negative = they owe.
  netByMember: z.array(
    z.object({
      member: MemberDtoSchema,
      net: z.number(),
    })
  ),
  settlements: z.array(SettlementSchema),
});
export type BalancesResponse = z.infer<typeof BalancesResponseSchema>;
