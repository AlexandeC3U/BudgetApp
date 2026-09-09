import { z } from "zod";

import { MemberDtoSchema } from "./tab";

// Recording a payment: either settle one specific transfer, or settle the whole
// tab at once (server computes the outstanding transfers and records them all).
export const RecordSettlementInputSchema = z.union([
  z.object({ all: z.literal(true) }),
  z.object({
    fromUserId: z.uuid(),
    toUserId: z.uuid(),
    amount: z.number().positive().max(1_000_000_000),
  }),
]);
export type RecordSettlementInput = z.infer<typeof RecordSettlementInputSchema>;

// A recorded payment as returned by the history endpoint.
export const SettlementRecordSchema = z.object({
  id: z.uuid(),
  from: MemberDtoSchema,
  to: MemberDtoSchema,
  amount: z.number(),
  date: z.string(), // ISO timestamp
});
export type SettlementRecord = z.infer<typeof SettlementRecordSchema>;

export const SettlementsResponseSchema = z.object({
  settlements: z.array(SettlementRecordSchema),
});
export type SettlementsResponse = z.infer<typeof SettlementsResponseSchema>;
