"use client";

const COLORS = ["#FF6B4A", "#FFB627", "#3DD68C", "#7C5CFF", "#2D7BF4", "#EC4899"];
const PIECES = Array.from({ length: 24 });

export function Confetti() {
  return (
    <div className="fixed inset-0 z-[100] pointer-events-none overflow-hidden mx-auto max-w-md">
      {PIECES.map((_, i) => {
        const x = (i / PIECES.length) * 100;
        const delay = (i % 6) * 0.05;
        const dur = 1.4 + (i % 4) * 0.2;
        const c = COLORS[i % COLORS.length];
        return (
          <div
            key={i}
            className="absolute w-2 h-3 rounded-sm"
            style={{
              left: `${x}%`,
              top: "40%",
              background: c,
              animation: `confetti-fall ${dur}s ease-in ${delay}s forwards`,
            }}
          />
        );
      })}
    </div>
  );
}

export function CelebrationOverlay() {
  return (
    <div className="fixed inset-0 z-[99] flex items-center justify-center pointer-events-none mx-auto max-w-md">
      <div
        className="bg-paper rounded-[28px] px-7 py-6 flex flex-col items-center gap-1.5 animate-pop-in"
        style={{ boxShadow: "0 20px 60px rgba(26,23,20,0.25)" }}
      >
        <div className="text-5xl">🎉</div>
        <div className="font-serif text-2xl text-ink tracking-tight">Saved!</div>
      </div>
    </div>
  );
}
