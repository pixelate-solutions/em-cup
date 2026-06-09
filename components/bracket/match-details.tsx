"use client";

import { Calendar, MapPin, Trophy } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useMediaQuery } from "@/hooks/use-media-query";
import {
  calculateHandicapStrokes,
  getMatchDisplayName,
  getMatchHandicapParticipants,
  getMatchSlotHandicap,
  getSlotDisplay,
} from "@/lib/bracket-utils";
import type { MatchWithPlayers } from "@/lib/types";
import { formatDate, formatDateTime } from "@/lib/utils";

export function MatchDetails({
  match,
  open,
  onOpenChange,
}: {
  match: MatchWithPlayers | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  if (!match) return null;

  const participants = getMatchHandicapParticipants(match);
  const handicap = calculateHandicapStrokes(participants.player1, participants.player2);
  const content = <MatchDetailsContent match={match} handicapMessage={handicap.message} />;

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{getMatchDisplayName(match)}</DialogTitle>
            <DialogDescription>Match details, handicap strokes, schedule, and result.</DialogDescription>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{getMatchDisplayName(match)}</DrawerTitle>
          <DrawerDescription>Match details, handicap strokes, schedule, and result.</DrawerDescription>
        </DrawerHeader>
        <div className="overflow-y-auto px-4 pb-6">{content}</div>
      </DrawerContent>
    </Drawer>
  );
}

function MatchDetailsContent({
  match,
  handicapMessage,
}: {
  match: MatchWithPlayers;
  handicapMessage: string;
}) {
  return (
    <div className="space-y-5">
      <div className="grid gap-3">
        {(["player1", "player2"] as const).map((slot) => {
          const player = slot === "player1" ? match.player1 : match.player2;
          const isWinner = player?.id === match.winnerId;
          const handicap = getMatchSlotHandicap(match, slot);

          return (
            <div key={slot} className="flex items-center justify-between gap-3 rounded-2xl border border-white/70 bg-white/60 p-3 backdrop-blur">
              <div>
                <p className="font-medium">{player?.name ?? getSlotDisplay(match, slot)}</p>
                <p className="text-sm text-muted-foreground">
                  Handicap {handicap != null ? Number(handicap).toFixed(1) : "TBD"}
                </p>
              </div>
              {isWinner ? (
                <Badge variant="success" className="gap-1">
                  <Trophy className="h-3 w-3" />
                  Winner
                </Badge>
              ) : null}
            </div>
          );
        })}
      </div>

      <Separator />

      <div className="grid gap-3 text-sm">
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground">Handicap strokes</span>
          <span className="text-right font-medium">{handicapMessage}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            Date
          </span>
          <span className="text-right font-medium">{formatDateTime(match.scheduledAt)}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground">Deadline</span>
          <span className="font-medium">{formatDate(match.deadline)}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            Location
          </span>
          <span className="text-right font-medium">{match.location || "TBD"}</span>
        </div>
      </div>

      {match.details ? (
        <>
          <Separator />
          <div>
            <p className="text-sm font-medium">Notes</p>
            <p className="mt-1 text-sm text-muted-foreground">{match.details}</p>
          </div>
        </>
      ) : null}
    </div>
  );
}
