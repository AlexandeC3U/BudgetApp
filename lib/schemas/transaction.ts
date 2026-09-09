import { z } from "zod";

import { CategoryDtoSchema } from "./category";

// Mirrors the mock Transaction shape (tab/payer as ids, split as id list) but
// embeds the full category object so list rows can render without an extra
// /api/categories fetch.
export const TransactionDtoSchema = z.object({
  id: z.uuid(),
  tab: z.uuid(),
  category: CategoryDtoSchema.nullable(),
  title: z.string(),
  amount: z.number(),
  date: z.string(), // YYYY-MM-DD
  payer: z.uuid(),
  split: z.array(z.uuid()),
});
export type TransactionDto = z.infer<typeof TransactionDtoSchema>;

export const TransactionsResponseSchema = z.object({
  transactions: z.array(TransactionDtoSchema),
  // Opaque keyset cursor for the next page. Present only on paginated
  // (`?limit=`) requests; null when there are no more rows.
  nextCursor: z.string().nullable().optional(),
});
export type TransactionsResponse = z.infer<typeof TransactionsResponseSchema>;

// Input shape for creating a transaction. Server re-validates and rejects
// payer/split user ids that aren't members of the tab.
export const CreateTransactionInputSchema = z.object({
  tabId: z.uuid(),
  categoryId: z.uuid().nullable(),
  title: z.string().min(1).max(120),
  amount: z.number().positive().max(1_000_000),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  payerId: z.uuid(),
  splitUserIds: z.array(z.uuid()).min(1),
});
export type CreateTransactionInput = z.infer<typeof CreateTransactionInputSchema>;

export const CreateTransactionResponseSchema = z.object({
  transaction: TransactionDtoSchema,
});
export type CreateTransactionResponse = z.infer<typeof CreateTransactionResponseSchema>;

// Partial update — every field is optional. tabId/payerId aren't editable in
// v1 to keep membership invariants simple; if the caller wants to move a
// transaction across tabs they should delete and recreate.
export const UpdateTransactionInputSchema = z
  .object({
    categoryId: z.uuid().nullable().optional(),
    title: z.string().min(1).max(120).optional(),
    amount: z.number().positive().max(1_000_000).optional(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    splitUserIds: z.array(z.uuid()).min(1).optional(),
  })
  .strict();
export type UpdateTransactionInput = z.infer<typeof UpdateTransactionInputSchema>;

export const TransactionResponseSchema = z.object({
  transaction: TransactionDtoSchema,
});
export type TransactionResponse = z.infer<typeof TransactionResponseSchema>;
