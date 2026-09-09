import type { Tab, Category, Transaction, Member } from "./types";

export const TABS: Tab[] = [
  {
    id: "home",
    name: "Home",
    emoji: "🏡",
    color: "#FF6B4A",
    members: [
      { id: "me", name: "You", initials: "YO", color: "#FF6B4A" },
      { id: "sam", name: "Sam", initials: "SA", color: "#7C5CFF" },
    ],
    budget: 2400,
    spent: 1647.32,
    currency: "€",
  },
  {
    id: "vacation",
    name: "Lisbon",
    emoji: "🌴",
    color: "#FFB627",
    members: [
      { id: "me", name: "You", initials: "YO", color: "#FF6B4A" },
      { id: "sam", name: "Sam", initials: "SA", color: "#7C5CFF" },
      { id: "mia", name: "Mia", initials: "MI", color: "#3DD68C" },
      { id: "leo", name: "Leo", initials: "LE", color: "#2D7BF4" },
    ],
    budget: 1500,
    spent: 892.14,
    currency: "€",
  },
  {
    id: "friends",
    name: "Friends",
    emoji: "🍻",
    color: "#3DD68C",
    members: [
      { id: "me", name: "You", initials: "YO", color: "#FF6B4A" },
      { id: "sam", name: "Sam", initials: "SA", color: "#7C5CFF" },
      { id: "mia", name: "Mia", initials: "MI", color: "#3DD68C" },
    ],
    budget: 400,
    spent: 218.5,
    currency: "€",
  },
];

export const CATEGORIES: Category[] = [
  { id: "food", name: "Food", emoji: "🍜", color: "#FF6B4A" },
  { id: "rent", name: "Rent", emoji: "🏠", color: "#7C5CFF" },
  { id: "travel", name: "Travel", emoji: "✈️", color: "#FFB627" },
  { id: "fun", name: "Fun", emoji: "🎉", color: "#3DD68C" },
  { id: "grocery", name: "Groceries", emoji: "🛒", color: "#2D7BF4" },
  { id: "coffee", name: "Coffee", emoji: "☕", color: "#C2410C" },
  { id: "gas", name: "Transport", emoji: "🚌", color: "#0EA5E9" },
  { id: "health", name: "Health", emoji: "💊", color: "#EC4899" },
];

export const TXNS: Transaction[] = [
  { id: "t1", tab: "home", cat: "rent", title: "April rent", amount: 950, date: "2026-04-26", payer: "me", split: ["me", "sam"] },
  { id: "t2", tab: "home", cat: "grocery", title: "Albert Heijn", amount: 67.42, date: "2026-04-25", payer: "sam", split: ["me", "sam"] },
  { id: "t3", tab: "vacation", cat: "food", title: "Pastéis de Belém", amount: 32.1, date: "2026-04-25", payer: "mia", split: ["me", "sam", "mia", "leo"] },
  { id: "t4", tab: "home", cat: "coffee", title: "Toki coffee", amount: 4.8, date: "2026-04-25", payer: "me", split: ["me"] },
  { id: "t5", tab: "vacation", cat: "travel", title: "Tram day pass", amount: 18.4, date: "2026-04-24", payer: "me", split: ["me", "sam", "mia", "leo"] },
  { id: "t6", tab: "friends", cat: "fun", title: "Bar tab — Cafe Belga", amount: 84.0, date: "2026-04-23", payer: "sam", split: ["me", "sam", "mia"] },
  { id: "t7", tab: "home", cat: "food", title: "Sushi takeaway", amount: 38.5, date: "2026-04-22", payer: "me", split: ["me", "sam"] },
  { id: "t8", tab: "vacation", cat: "fun", title: "Fado night", amount: 56.0, date: "2026-04-21", payer: "leo", split: ["me", "sam", "mia", "leo"] },
  { id: "t9", tab: "home", cat: "gas", title: "NS train", amount: 12.4, date: "2026-04-20", payer: "me", split: ["me"] },
  { id: "t10", tab: "home", cat: "health", title: "Pharmacy", amount: 14.2, date: "2026-04-19", payer: "me", split: ["me"] },
  { id: "t11", tab: "friends", cat: "food", title: "Pizza night", amount: 42.0, date: "2026-04-18", payer: "mia", split: ["me", "sam", "mia"] },
  { id: "t12", tab: "vacation", cat: "food", title: "Tasca dinner", amount: 78.2, date: "2026-04-17", payer: "me", split: ["me", "sam", "mia", "leo"] },
];

export const findCat = (id: string): Category | undefined =>
  CATEGORIES.find((c) => c.id === id);

export const findTab = (id: string): Tab | undefined =>
  TABS.find((t) => t.id === id);

export const findMember = (tab: Tab, id: string): Member | undefined =>
  tab.members.find((m) => m.id === id);

export type Balance = { owed: number; owe: number; net: number };

export function computeBalance(txns: Transaction[]): Balance {
  let owed = 0;
  let owe = 0;
  txns.forEach((t) => {
    const share = t.amount / t.split.length;
    if (t.payer === "me" && t.split.includes("me")) {
      owed += t.amount - share;
    } else if (t.payer !== "me" && t.split.includes("me")) {
      owe += share;
    } else if (t.payer === "me" && !t.split.includes("me")) {
      owed += t.amount;
    }
  });
  return { owed, owe, net: owed - owe };
}

export type CategorySpend = Category & { cat: string; total: number };

export function spendByCategory(
  tabId: string | null,
  txns: Transaction[]
): CategorySpend[] {
  const filtered = tabId ? txns.filter((t) => t.tab === tabId) : txns;
  const byCat: Record<string, number> = {};
  filtered.forEach((t) => {
    byCat[t.cat] = (byCat[t.cat] || 0) + t.amount;
  });
  return Object.entries(byCat)
    .map(([cat, total]) => {
      const c = findCat(cat);
      if (!c) return null;
      return { cat, total, ...c };
    })
    .filter((x): x is CategorySpend => x !== null)
    .sort((a, b) => b.total - a.total);
}
