"use client";

import { useEffect, useState } from "react";

import { Sheet } from "./Sheet";
import { useSheet } from "./sheet-controller";
import { Avatar } from "@/components/ui/Avatar";
import { PillButton } from "@/components/ui/PillButton";
import { useTab } from "@/lib/hooks/use-tab";
import { useTabs } from "@/lib/hooks/use-tabs";
import { useCurrentUser } from "@/lib/hooks/use-current-user";
import { useAddMember } from "@/lib/hooks/use-add-member";
import { useRemoveMember } from "@/lib/hooks/use-remove-member";

const SHARE_TARGETS = [
  { label: "Message", emoji: "💬", color: "#3DD68C" },
  { label: "Mail", emoji: "✉️", color: "#2D7BF4" },
  { label: "WhatsApp", emoji: "💚", color: "#3DD68C" },
  { label: "More", emoji: "•••", color: "#FAF6EE" },
];

export function InviteSheet() {
  const { state, close } = useSheet();
  const open = state.name === "invite";

  // Prefer the explicit tab id from the sheet params; otherwise fall back to
  // the first tab the user has so the sheet still has *something* to render
  // when triggered from a global UI affordance (e.g. profile/settings).
  const { data: tabs = [] } = useTabs();
  const explicitTabId = state.params?.tabId;
  const fallbackTabId = explicitTabId ?? tabs[0]?.id;
  const { data: tab } = useTab(fallbackTabId);
  const { data: me } = useCurrentUser();

  const tabId = tab?.id ?? "";
  const addMember = useAddMember(tabId);
  const removeMember = useRemoveMember(tabId);

  const [email, setEmail] = useState("");
  const [copied, setCopied] = useState(false);

  // Reset transient UI state each time the sheet opens.
  useEffect(() => {
    if (open) {
      setEmail("");
      setCopied(false);
      addMember.reset();
      removeMember.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const inviteSlug =
    tab?.name
      ?.toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") ?? "tab";
  const inviteLink = `budget.app/j/${inviteSlug}`;

  const myRole = tab?.members.find((m) => m.id === me?.id)?.role;
  const isOwner = myRole === "owner";

  const canAdd = email.trim().length > 0 && !addMember.isPending && !!tabId;

  const add = () => {
    if (!canAdd) return;
    addMember.mutate(
      { email: email.trim() },
      { onSuccess: () => setEmail("") }
    );
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`https://${inviteLink}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard unavailable (insecure context / permissions) — no-op.
    }
  };

  return (
    <Sheet open={open} onClose={close} title={tab ? `Invite to ${tab.name}` : "Invite"}>
      {!tab ? (
        <div className="text-[14px] text-ink/55 text-center py-12">
          Loading…
        </div>
      ) : (
        <>
          <div
            className="rounded-[22px] p-5 flex items-center gap-3.5"
            style={{ background: `${tab.color}18` }}
          >
            <div className="text-[36px]">{tab.emoji}</div>
            <div>
              <div className="font-serif text-[24px] text-ink leading-none tracking-tight">
                {tab.name}
              </div>
              <div className="text-[12px] font-medium text-ink/60 mt-1">
                {tab.members.length} members · €{tab.spent.toFixed(0)} spent
              </div>
            </div>
          </div>

          <div className="mt-4 text-[12px] font-bold uppercase tracking-wider text-ink/50">
            Add by email
          </div>
          <div className="mt-2 bg-bone rounded-2xl px-3.5 py-2.5 flex items-center gap-2.5">
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") add();
              }}
              type="email"
              inputMode="email"
              autoCapitalize="none"
              autoCorrect="off"
              placeholder="friend@email.com"
              className="flex-1 bg-transparent outline-none text-[14px] text-ink"
            />
            <button
              onClick={add}
              disabled={!canAdd}
              className="rounded-full bg-ink text-bone px-3.5 py-2 text-[12px] font-bold disabled:opacity-40"
            >
              {addMember.isPending ? "Adding…" : "Add"}
            </button>
          </div>
          {addMember.isError && (
            <div className="mt-2 text-[12px] font-semibold text-rust">
              {addMember.error.message}
            </div>
          )}

          <div className="mt-4 text-[12px] font-bold uppercase tracking-wider text-ink/50">
            Invite link
          </div>
          <div className="mt-2 bg-bone rounded-2xl px-3.5 py-3 flex items-center gap-2.5">
            <div
              className="flex-1 text-[12px] text-ink/70 truncate"
              style={{ fontFamily: "Geist Mono, ui-monospace, monospace" }}
            >
              {inviteLink}
            </div>
            <button
              onClick={copyLink}
              className="rounded-full bg-ink text-bone px-3.5 py-2 text-[12px] font-bold"
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>

          <div className="mt-5 text-[12px] font-bold uppercase tracking-wider text-ink/50">
            Or share via
          </div>
          <div className="flex gap-2.5 mt-2.5">
            {SHARE_TARGETS.map((it) => (
              <div
                key={it.label}
                className="flex-1 flex flex-col items-center gap-1.5"
              >
                <div
                  className="flex items-center justify-center text-[22px]"
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 18,
                    background: `${it.color}30`,
                  }}
                >
                  {it.emoji}
                </div>
                <div className="text-[11px] font-semibold text-ink/70">
                  {it.label}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 text-[12px] font-bold uppercase tracking-wider text-ink/50">
            Members
          </div>
          {removeMember.isError && (
            <div className="mt-2 text-[12px] font-semibold text-rust">
              {removeMember.error.message}
            </div>
          )}
          <div className="mt-2">
            {tab.members.map((m) => {
              const canRemove =
                isOwner && m.role !== "owner" && m.id !== me?.id;
              return (
                <div key={m.id} className="flex items-center gap-3 py-2.5">
                  <Avatar member={m} size={36} />
                  <div className="flex-1">
                    <div className="text-[14px] font-semibold text-ink">
                      {m.name}
                      {m.id === me?.id && (
                        <span className="text-ink/40 font-medium"> · you</span>
                      )}
                    </div>
                    <div className="text-[11px] font-medium text-ink/50">
                      {m.role === "owner" ? "Owner" : "Member"}
                    </div>
                  </div>
                  {canRemove && (
                    <button
                      onClick={() => removeMember.mutate(m.id)}
                      disabled={removeMember.isPending}
                      aria-label={`Remove ${m.name}`}
                      className="rounded-full w-8 h-8 flex items-center justify-center text-ink/40 hover:text-rust disabled:opacity-40"
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path
                          d="M2 2l10 10M12 2L2 12"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-5">
            <PillButton fullWidth onClick={close}>
              Done
            </PillButton>
          </div>
        </>
      )}
    </Sheet>
  );
}
