import type { Member } from "@/lib/types";

type AvatarProps = {
  member: Pick<Member, "initials" | "color">;
  size?: number;
  ring?: boolean;
};

export function Avatar({ member, size = 32, ring = false }: AvatarProps) {
  return (
    <div
      className="flex items-center justify-center rounded-full text-white font-bold tracking-tight shrink-0"
      style={{
        width: size,
        height: size,
        background: member.color,
        fontSize: size * 0.36,
        boxShadow: ring
          ? `0 0 0 2.5px #FAF6EE, 0 0 0 4px ${member.color}40`
          : undefined,
      }}
    >
      {member.initials}
    </div>
  );
}

type AvatarStackProps = {
  members: Member[];
  size?: number;
  max?: number;
};

export function AvatarStack({ members, size = 28, max = 4 }: AvatarStackProps) {
  const shown = members.slice(0, max);
  const extra = members.length - max;
  return (
    <div className="flex">
      {shown.map((m, i) => (
        <div
          key={m.id}
          style={{ marginLeft: i === 0 ? 0 : -size * 0.32 }}
        >
          <Avatar member={m} size={size} ring />
        </div>
      ))}
      {extra > 0 && (
        <div
          className="flex items-center justify-center rounded-full bg-ink text-bone font-bold"
          style={{
            width: size,
            height: size,
            fontSize: size * 0.34,
            marginLeft: -size * 0.32,
            boxShadow: "0 0 0 2.5px #FAF6EE",
          }}
        >
          +{extra}
        </div>
      )}
    </div>
  );
}
