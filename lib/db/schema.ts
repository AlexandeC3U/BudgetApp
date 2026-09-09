import { relations } from "drizzle-orm";
import {
  pgTable,
  uuid,
  text,
  timestamp,
  numeric,
  integer,
  primaryKey,
  date,
  varchar,
  index,
} from "drizzle-orm/pg-core";

// ─────── Users ───────
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkUserId: text("clerk_user_id").notNull().unique(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  initials: varchar("initials", { length: 4 }).notNull(),
  avatarColor: varchar("avatar_color", { length: 9 }).notNull().default("#FF6B4A"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─────── Tabs ───────
export const tabs = pgTable("tabs", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  emoji: text("emoji").notNull().default("🏷️"),
  color: varchar("color", { length: 9 }).notNull().default("#FF6B4A"),
  budget: numeric("budget", { precision: 12, scale: 2 }).notNull().default("0"),
  currency: varchar("currency", { length: 4 }).notNull().default("EUR"),
  createdBy: uuid("created_by").references(() => users.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─────── Tab membership (m2m) ───────
export const tabMembers = pgTable(
  "tab_members",
  {
    tabId: uuid("tab_id")
      .notNull()
      .references(() => tabs.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role", { enum: ["owner", "member"] }).notNull().default("member"),
    joinedAt: timestamp("joined_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.tabId, t.userId] }),
    // The composite PK is (tabId, userId), so "all tabs for a user" can't use
    // it — index userId on its own for getTabsForUser + membership checks.
    index("tab_members_user_id_idx").on(t.userId),
  ]
);

// ─────── Categories (per user) ───────
export const categories = pgTable(
  "categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    emoji: text("emoji").notNull(),
    color: varchar("color", { length: 9 }).notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  // Every category read filters by owner (GET /api/categories, ownership checks).
  (t) => [index("categories_user_id_idx").on(t.userId)]
);

// ─────── Transactions ───────
export const transactions = pgTable(
  "transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tabId: uuid("tab_id")
      .notNull()
      .references(() => tabs.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id").references(() => categories.id, {
      onDelete: "set null",
    }),
    title: text("title").notNull(),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    date: date("date").notNull(),
    payerId: uuid("payer_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdBy: uuid("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // Hottest path: spent rollups, balances, and the per-tab list all filter by
    // tabId and order by date. Composite (tabId, date) serves both.
    index("transactions_tab_id_date_idx").on(t.tabId, t.date),
    index("transactions_payer_id_idx").on(t.payerId),
    index("transactions_category_id_idx").on(t.categoryId),
  ]
);

// ─────── Transaction splits (m2m, with optional unequal share) ───────
export const transactionSplits = pgTable(
  "transaction_splits",
  {
    transactionId: uuid("transaction_id")
      .notNull()
      .references(() => transactions.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    // null → equal split with the other rows for this transaction
    shareAmount: numeric("share_amount", { precision: 12, scale: 2 }),
  },
  (t) => [
    primaryKey({ columns: [t.transactionId, t.userId] }),
    // PK is (transactionId, userId); index userId alone for "is this member in
    // any split?" (member-removal guard).
    index("transaction_splits_user_id_idx").on(t.userId),
  ]
);

// ─────── Settlements (recorded payments that pay down a tab's balances) ───────
export const settlements = pgTable(
  "settlements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tabId: uuid("tab_id")
      .notNull()
      .references(() => tabs.id, { onDelete: "cascade" }),
    fromUserId: uuid("from_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    toUserId: uuid("to_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    createdBy: uuid("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("settlements_tab_id_idx").on(t.tabId)]
);

// ─────── Relations (for Drizzle's relational query builder) ───────
export const usersRelations = relations(users, ({ many }) => ({
  tabMemberships: many(tabMembers),
  categories: many(categories),
  paidTransactions: many(transactions, { relationName: "payer" }),
  splits: many(transactionSplits),
}));

export const tabsRelations = relations(tabs, ({ one, many }) => ({
  creator: one(users, {
    fields: [tabs.createdBy],
    references: [users.id],
  }),
  members: many(tabMembers),
  transactions: many(transactions),
  settlements: many(settlements),
}));

export const settlementsRelations = relations(settlements, ({ one }) => ({
  tab: one(tabs, { fields: [settlements.tabId], references: [tabs.id] }),
  from: one(users, {
    fields: [settlements.fromUserId],
    references: [users.id],
    relationName: "settlementFrom",
  }),
  to: one(users, {
    fields: [settlements.toUserId],
    references: [users.id],
    relationName: "settlementTo",
  }),
}));

export const tabMembersRelations = relations(tabMembers, ({ one }) => ({
  tab: one(tabs, { fields: [tabMembers.tabId], references: [tabs.id] }),
  user: one(users, { fields: [tabMembers.userId], references: [users.id] }),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  user: one(users, {
    fields: [categories.userId],
    references: [users.id],
  }),
  transactions: many(transactions),
}));

export const transactionsRelations = relations(transactions, ({ one, many }) => ({
  tab: one(tabs, { fields: [transactions.tabId], references: [tabs.id] }),
  category: one(categories, {
    fields: [transactions.categoryId],
    references: [categories.id],
  }),
  payer: one(users, {
    fields: [transactions.payerId],
    references: [users.id],
    relationName: "payer",
  }),
  splits: many(transactionSplits),
}));

export const transactionSplitsRelations = relations(transactionSplits, ({ one }) => ({
  transaction: one(transactions, {
    fields: [transactionSplits.transactionId],
    references: [transactions.id],
  }),
  user: one(users, {
    fields: [transactionSplits.userId],
    references: [users.id],
  }),
}));

// ─────── Type exports (inferred from schema) ───────
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Tab = typeof tabs.$inferSelect;
export type NewTab = typeof tabs.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
export type Settlement = typeof settlements.$inferSelect;
export type NewSettlement = typeof settlements.$inferInsert;
