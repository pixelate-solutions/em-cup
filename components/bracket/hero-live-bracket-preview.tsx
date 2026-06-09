import { Badge } from "@/components/ui/badge";
import { getSlotDisplay } from "@/lib/bracket-utils";
import type { MatchWithPlayers } from "@/lib/types";

type BoxSpec = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  side: "left" | "right" | "center";
};

const boxes: BoxSpec[] = [
  { id: "L1", x: 24, y: 160, w: 104, h: 42, side: "left" },
  { id: "L2", x: 24, y: 250, w: 104, h: 42, side: "left" },
  { id: "L3", x: 24, y: 386, w: 104, h: 42, side: "left" },
  { id: "L4", x: 24, y: 476, w: 104, h: 42, side: "left" },
  { id: "L5", x: 164, y: 166, w: 104, h: 42, side: "left" },
  { id: "L6", x: 164, y: 256, w: 104, h: 42, side: "left" },
  { id: "L7", x: 164, y: 392, w: 104, h: 42, side: "left" },
  { id: "L8", x: 164, y: 482, w: 104, h: 42, side: "left" },
  { id: "L9", x: 304, y: 210, w: 104, h: 42, side: "left" },
  { id: "L10", x: 304, y: 438, w: 104, h: 42, side: "left" },
  { id: "L13", x: 444, y: 276, w: 100, h: 38, side: "left" },

  { id: "R1", x: 872, y: 148, w: 104, h: 42, side: "right" },
  { id: "R2", x: 872, y: 226, w: 104, h: 42, side: "right" },
  { id: "R3", x: 872, y: 328, w: 104, h: 42, side: "right" },
  { id: "R4", x: 872, y: 436, w: 104, h: 42, side: "right" },
  { id: "R8", x: 872, y: 526, w: 104, h: 42, side: "right" },
  { id: "R5", x: 732, y: 187, w: 104, h: 42, side: "right" },
  { id: "R6", x: 732, y: 334, w: 104, h: 42, side: "right" },
  { id: "R7", x: 732, y: 442, w: 104, h: 42, side: "right" },
  { id: "R8B", x: 732, y: 532, w: 104, h: 42, side: "right" },
  { id: "R9", x: 592, y: 260, w: 104, h: 42, side: "right" },
  { id: "R10", x: 592, y: 486, w: 104, h: 42, side: "right" },
  { id: "R13", x: 456, y: 410, w: 100, h: 38, side: "right" },
];

const connectors: Array<[string, string]> = [
  ["L1", "L5"],
  ["L2", "L6"],
  ["L3", "L7"],
  ["L4", "L8"],
  ["L5", "L9"],
  ["L6", "L9"],
  ["L7", "L10"],
  ["L8", "L10"],
  ["L9", "L13"],
  ["L10", "L13"],
  ["R1", "R5"],
  ["R2", "R5"],
  ["R3", "R6"],
  ["R4", "R7"],
  ["R8", "R8B"],
  ["R5", "R9"],
  ["R6", "R9"],
  ["R7", "R10"],
  ["R8B", "R10"],
  ["R9", "R13"],
  ["R10", "R13"],
];

const roundLabels = [
  { label: "Round 1", x: 76, y: 130 },
  { label: "Round of 16", x: 216, y: 130 },
  { label: "Quarterfinal", x: 356, y: 130 },
  { label: "Semifinal", x: 494, y: 130 },
  { label: "Quarterfinal", x: 644, y: 130 },
  { label: "Round of 16", x: 784, y: 130 },
  { label: "Round 1", x: 924, y: 130 },
];

export function HeroLiveBracketPreview({ matches }: { matches: MatchWithPlayers[] }) {
  const matchById = new Map(matches.map((match) => [match.id, match]));
  const final = matchById.get("F1");
  const champion = final?.winner?.name ?? "TBD";

  return (
    <div className="relative w-full rounded-[1.25rem] border border-primary/10 bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_48%,#e9f5e8_100%)] shadow-inner">
      <div className="flex items-center justify-between px-4 py-3">
        <Badge variant="outline" className="border-primary/20 bg-white text-primary">
          Official Bracket
        </Badge>
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Live Updates
        </span>
      </div>

      <div className="px-2 pb-2">
        <svg
          viewBox="0 0 1000 620"
          preserveAspectRatio="xMidYMid meet"
          className="block aspect-[1.62] w-full overflow-hidden rounded-2xl border border-primary/10 bg-white"
          role="img"
          aria-label="Live EM Cup bracket preview"
        >
          <defs>
            <linearGradient id="heroBracketBackground" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.96" />
              <stop offset="58%" stopColor="#f4f9ff" stopOpacity="0.88" />
              <stop offset="100%" stopColor="#edf8ef" stopOpacity="0.98" />
            </linearGradient>
            <radialGradient id="heroBracketGreen" cx="50%" cy="88%" r="44%">
              <stop offset="0%" stopColor="#9cc47a" stopOpacity="0.36" />
              <stop offset="100%" stopColor="#9cc47a" stopOpacity="0" />
            </radialGradient>
            <filter id="heroBracketShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="2.2" floodColor="#0f2745" floodOpacity="0.18" />
            </filter>
          </defs>

          <rect width="1000" height="620" rx="24" fill="url(#heroBracketBackground)" />
          <rect width="1000" height="620" rx="24" fill="url(#heroBracketGreen)" />

          <text x="500" y="44" textAnchor="middle" className="fill-primary" fontSize="14" fontWeight="800" letterSpacing="6">
            ELECTRO-MATIC GOLF TOURNAMENT
          </text>
          <text x="500" y="86" textAnchor="middle" className="fill-primary" fontSize="36" fontWeight="900">
            EM Cup
          </text>

          {roundLabels.map((item) => (
            <text
              key={`${item.label}-${item.x}`}
              x={item.x}
              y={item.y}
              textAnchor="middle"
              className="fill-primary"
              fontSize="15"
              fontWeight="900"
            >
              {item.label.toUpperCase()}
            </text>
          ))}

          <ConnectorLines />

          <g filter="url(#heroBracketShadow)">
            <rect x="442" y="336" width="116" height="58" rx="14" fill="#ffffff" stroke="#0b58b5" strokeWidth="2" />
            <text x="500" y="360" textAnchor="middle" className="fill-primary" fontSize="12" fontWeight="900">
              CHAMPION
            </text>
            <text x="500" y="380" textAnchor="middle" fill="#102033" fontSize="15" fontWeight="900">
              {compactText(champion, 13)}
            </text>
          </g>

          {boxes.map((box) => {
            const match = matchById.get(box.id);
            if (!match) return null;
            return <MiniMatch key={box.id} box={box} match={match} />;
          })}
        </svg>
      </div>
    </div>
  );
}

function ConnectorLines() {
  const boxById = new Map(boxes.map((box) => [box.id, box]));

  return (
    <g fill="none" stroke="#0b58b5" strokeLinecap="round" strokeWidth="2" opacity="0.76">
      {connectors.map(([fromId, toId]) => {
        const from = boxById.get(fromId);
        const to = boxById.get(toId);
        if (!from || !to) return null;

        const fromRight = from.side === "left";
        const startX = fromRight ? from.x + from.w : from.x;
        const startY = from.y + from.h / 2;
        const endX = fromRight ? to.x : to.x + to.w;
        const endY = to.y + to.h / 2;
        const midX = fromRight ? startX + 18 : startX - 18;

        return <path key={`${fromId}-${toId}`} d={`M ${startX} ${startY} H ${midX} V ${endY} H ${endX}`} />;
      })}
      <path d="M 494 314 V 326 H 500 V 336" />
      <path d="M 506 410 V 402 H 500 V 394" />
    </g>
  );
}

function MiniMatch({ box, match }: { box: BoxSpec; match: MatchWithPlayers }) {
  const slots = [
    { slot: "player1" as const, player: match.player1 },
    { slot: "player2" as const, player: match.player2 },
  ];

  return (
    <g filter="url(#heroBracketShadow)">
      <title>{`${match.roundLabel} ${match.id}`}</title>
      <rect x={box.x} y={box.y} width={box.w} height={box.h} rx="4" fill="#ffffff" stroke="#0b58b5" strokeWidth="1.4" />
      <line x1={box.x} y1={box.y + box.h / 2} x2={box.x + box.w} y2={box.y + box.h / 2} stroke="#b7cbe6" strokeWidth="1" />
      {slots.map(({ slot, player }, index) => {
        const isWinner = player?.id === match.winnerId;
        const isLoser = player?.id === match.loserId;
        const label = player?.name ?? miniPlaceholder(getSlotDisplay(match, slot));
        const rowY = box.y + (index === 0 ? box.h * 0.31 : box.h * 0.79);

        return (
          <g key={slot}>
            {isWinner ? (
              <rect
                x={box.x + 1}
                y={box.y + (index === 0 ? 1 : box.h / 2)}
                width={box.w - 2}
                height={box.h / 2 - 1}
                fill="#eaf4ff"
              />
            ) : null}
            <text
              x={box.x + box.w / 2}
              y={rowY}
              textAnchor="middle"
              fill={player ? (isLoser ? "#6b7a90" : "#102033") : "#4d78b5"}
              fontSize="8.4"
              fontStyle={player ? "normal" : "italic"}
              fontWeight={isWinner ? "900" : "800"}
            >
              {compactText(label, 15)}
            </text>
          </g>
        );
      })}
    </g>
  );
}

function miniPlaceholder(value: string) {
  if (value.startsWith("Winner of ")) return `${value.replace("Winner of ", "")} Winner`;
  return value;
}

function compactText(value: string, maxLength: number) {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;
}
