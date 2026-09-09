// Side-effect import must run before anything that touches DATABASE_URL.
import "./load-env";

import { db } from "../lib/db";
import {
  categories,
  tabMembers,
  tabs,
  transactionSplits,
  transactions,
  users,
} from "../lib/db/schema";
import {
  CATEGORIES as MOCK_CATEGORIES,
  TABS as MOCK_TABS,
  TXNS as MOCK_TRANSACTIONS,
} from "../lib/mock-data";

async function seed() {
  console.log("Wiping existing rows...");
  await db.delete(transactionSplits);
  await db.delete(transactions);
  await db.delete(tabMembers);
  await db.delete(tabs);
  await db.delete(categories);
  await db.delete(users);

  // Collect every unique member referenced across mock tabs
  const uniqueMembers = new Map<string, (typeof MOCK_TABS)[number]["members"][number]>();
  for (const tab of MOCK_TABS) {
    for (const m of tab.members) {
      if (!uniqueMembers.has(m.id)) uniqueMembers.set(m.id, m);
    }
  }

  console.log(`Inserting ${uniqueMembers.size} demo users...`);
  const userIdMap = new Map<string, string>(); // mock id ('me'|'sam'|...) -> uuid
  for (const m of uniqueMembers.values()) {
    const [row] = await db
      .insert(users)
      .values({
        clerkUserId: `demo-${m.id}`,
        email: `${m.id}@demo.local`,
        name: m.name,
        initials: m.initials,
        avatarColor: m.color,
      })
      .returning();
    userIdMap.set(m.id, row.id);
  }
  const ownerId = userIdMap.get("me");
  if (!ownerId) throw new Error("Mock data missing 'me' user");

  console.log(`Inserting ${MOCK_CATEGORIES.length} categories...`);
  const categoryIdMap = new Map<string, string>();
  for (let i = 0; i < MOCK_CATEGORIES.length; i++) {
    const c = MOCK_CATEGORIES[i];
    const [row] = await db
      .insert(categories)
      .values({
        userId: ownerId,
        name: c.name,
        emoji: c.emoji,
        color: c.color,
        sortOrder: i,
      })
      .returning();
    categoryIdMap.set(c.id, row.id);
  }

  console.log(`Inserting ${MOCK_TABS.length} tabs + memberships...`);
  const tabIdMap = new Map<string, string>();
  for (const t of MOCK_TABS) {
    const [row] = await db
      .insert(tabs)
      .values({
        name: t.name,
        emoji: t.emoji,
        color: t.color,
        budget: t.budget.toString(),
        currency: t.currency === "€" ? "EUR" : t.currency,
        createdBy: ownerId,
      })
      .returning();
    tabIdMap.set(t.id, row.id);

    for (const m of t.members) {
      await db.insert(tabMembers).values({
        tabId: row.id,
        userId: userIdMap.get(m.id)!,
        role: m.id === "me" ? "owner" : "member",
      });
    }
  }

  console.log(`Inserting ${MOCK_TRANSACTIONS.length} transactions + splits...`);
  for (const t of MOCK_TRANSACTIONS) {
    const [row] = await db
      .insert(transactions)
      .values({
        tabId: tabIdMap.get(t.tab)!,
        categoryId: categoryIdMap.get(t.cat)!,
        title: t.title,
        amount: t.amount.toString(),
        date: t.date,
        payerId: userIdMap.get(t.payer)!,
        createdBy: userIdMap.get(t.payer)!,
      })
      .returning();

    for (const memberMockId of t.split) {
      await db.insert(transactionSplits).values({
        transactionId: row.id,
        userId: userIdMap.get(memberMockId)!,
      });
    }
  }

  console.log("Seed complete.");
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
