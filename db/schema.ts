import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  integer,
  numeric,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import type { AnyPgColumn } from "drizzle-orm/pg-core";

export const matchStatusEnum = pgEnum("match_status", [
  "pending",
  "scheduled",
  "completed",
]);

export const matchSideEnum = pgEnum("match_side", ["left", "right"]);
export const matchSlotEnum = pgEnum("match_slot", ["player1", "player2"]);

export const players = pgTable("players", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  handicapIndex: numeric("handicap_index", { precision: 4, scale: 1 }),
  isPreviousWinner: boolean("is_previous_winner").notNull().default(false),
  previousWins: integer("previous_wins").notNull().default(0),
  hasPaid: boolean("has_paid").notNull().default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const matches = pgTable("matches", {
  id: varchar("id", { length: 16 }).primaryKey(),
  round: integer("round").notNull(),
  roundLabel: varchar("round_label", { length: 40 }).notNull(),
  side: matchSideEnum("side"),
  sortOrder: integer("sort_order").notNull(),
  player1Id: integer("player1_id").references(() => players.id, {
    onDelete: "set null",
  }),
  player2Id: integer("player2_id").references(() => players.id, {
    onDelete: "set null",
  }),
  winnerId: integer("winner_id").references(() => players.id, {
    onDelete: "set null",
  }),
  loserId: integer("loser_id").references(() => players.id, {
    onDelete: "set null",
  }),
  nextMatchId: varchar("next_match_id", { length: 16 }).references(
    (): AnyPgColumn => matches.id,
    { onDelete: "set null" },
  ),
  nextSlot: matchSlotEnum("next_slot"),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
  location: text("location"),
  details: text("details"),
  status: matchStatusEnum("status").notNull().default("pending"),
  deadline: date("deadline"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const prizes = pgTable("prizes", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  description: text("description"),
  amount: numeric("amount", { precision: 8, scale: 2 }),
  winnerPlayerId: integer("winner_player_id").references(() => players.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const tournamentSettings = pgTable("tournament_settings", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 120 }).notNull().unique(),
  value: text("value").notNull(),
});

export const playersRelations = relations(players, ({ many }) => ({
  player1Matches: many(matches, { relationName: "player1" }),
  player2Matches: many(matches, { relationName: "player2" }),
  wonMatches: many(matches, { relationName: "winner" }),
  lostMatches: many(matches, { relationName: "loser" }),
  prizes: many(prizes),
}));

export const matchesRelations = relations(matches, ({ one }) => ({
  player1: one(players, {
    fields: [matches.player1Id],
    references: [players.id],
    relationName: "player1",
  }),
  player2: one(players, {
    fields: [matches.player2Id],
    references: [players.id],
    relationName: "player2",
  }),
  winner: one(players, {
    fields: [matches.winnerId],
    references: [players.id],
    relationName: "winner",
  }),
  loser: one(players, {
    fields: [matches.loserId],
    references: [players.id],
    relationName: "loser",
  }),
  nextMatch: one(matches, {
    fields: [matches.nextMatchId],
    references: [matches.id],
  }),
}));

export const prizesRelations = relations(prizes, ({ one }) => ({
  winner: one(players, {
    fields: [prizes.winnerPlayerId],
    references: [players.id],
  }),
}));

export type Player = typeof players.$inferSelect;
export type NewPlayer = typeof players.$inferInsert;
export type Match = typeof matches.$inferSelect;
export type NewMatch = typeof matches.$inferInsert;
export type Prize = typeof prizes.$inferSelect;
export type NewPrize = typeof prizes.$inferInsert;
export type TournamentSetting = typeof tournamentSettings.$inferSelect;
