import { z } from "zod";

// A tab member as exposed via the API — tied to the DB user but trimmed to
// the fields the UI needs. Initials/color drive the colored avatar circles.
export const MemberDtoSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  initials: z.string(),
  color: z.string(),
  // Membership role within the tab. Optional because some endpoints (e.g.
  // balances) don't need to surface it; tab read paths always populate it.
  role: z.enum(["owner", "member"]).optional(),
});
export type MemberDto = z.infer<typeof MemberDtoSchema>;

// A tab plus its member list and rolled-up spent amount. The mockup's
// in-memory `Tab` type was the same shape — keep parity so the UI doesn't
// need to special-case mock vs real data while we transition.
export const TabDtoSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  emoji: z.string(),
  color: z.string(),
  budget: z.number(),
  spent: z.number(),
  currency: z.string(),
  members: z.array(MemberDtoSchema),
});
export type TabDto = z.infer<typeof TabDtoSchema>;

export const TabsResponseSchema = z.object({
  tabs: z.array(TabDtoSchema),
});
export type TabsResponse = z.infer<typeof TabsResponseSchema>;

// Single-tab response — shared by `GET/PATCH /api/tabs/[id]` and the
// member-management routes that return the refreshed tab.
export const TabResponseSchema = z.object({
  tab: TabDtoSchema,
});
export type TabResponse = z.infer<typeof TabResponseSchema>;

const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;
const CURRENCY_CODE = z.enum(["EUR", "USD", "GBP"]);

export const CreateTabInputSchema = z.object({
  name: z.string().min(1).max(60),
  emoji: z.string().min(1).max(8),
  color: z.string().regex(HEX_COLOR),
  budget: z.number().nonnegative().max(1_000_000_000),
  currency: CURRENCY_CODE.default("EUR"),
});
export type CreateTabInput = z.infer<typeof CreateTabInputSchema>;

// Every field optional — a PATCH may touch any subset. At least one is
// required so an empty body is rejected rather than silently no-op'ing.
export const UpdateTabInputSchema = z
  .object({
    name: z.string().min(1).max(60),
    emoji: z.string().min(1).max(8),
    color: z.string().regex(HEX_COLOR),
    budget: z.number().nonnegative().max(1_000_000_000),
    currency: CURRENCY_CODE,
  })
  .partial()
  .refine((v) => Object.keys(v).length > 0, {
    message: "No fields to update",
  });
export type UpdateTabInput = z.infer<typeof UpdateTabInputSchema>;

export const AddMemberInputSchema = z.object({
  email: z.string().email().max(254),
});
export type AddMemberInput = z.infer<typeof AddMemberInputSchema>;
