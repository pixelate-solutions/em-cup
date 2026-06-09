import type { Match, Player, Prize, TournamentSetting } from "@/db/schema";

export type MatchWithPlayers = Match & {
  player1: Player | null;
  player2: Player | null;
  winner: Player | null;
  loser: Player | null;
};

export type PrizeWithWinner = Prize & {
  winner: Player | null;
};

export type TournamentData = {
  players: Player[];
  matches: MatchWithPlayers[];
  prizes: PrizeWithWinner[];
  settings: TournamentSetting[];
};
