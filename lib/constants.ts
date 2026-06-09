export const SITE_NAME = "EM Cup";
export const SITE_SUBTITLE = "Electro-Matic Golf Tournament • Official Bracket";
export const BUY_IN_AMOUNT = 100;
export const PAYMENT_COPY = "$100 buy-in for Round of 16 players";
export const ACTUAL_PAYMENT_COPY = "$100 buy-in for all 25 players";
export const PRIZE_COPY =
  "Top 4 paid out. Champion receives the Blue Jacket unless they are a repeat winner, in which case a patch is added to the existing jacket.";

export const ROUND_DEADLINES = [
  { label: "Play-In", date: "2026-06-28" },
  { label: "Round of 16", date: "2026-07-19" },
  { label: "Quarterfinal", date: "2026-08-16" },
  { label: "Semifinal", date: "2026-09-13" },
  { label: "Final", date: "2026-10-04" },
] as const;

export const ROUND_LABELS = [
  "Play-In",
  "Round of 16",
  "Quarterfinal",
  "Semifinal",
  "Final",
] as const;
