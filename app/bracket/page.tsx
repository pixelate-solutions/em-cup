import { Bracket } from "@/components/bracket/bracket";
import { getMatches } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function BracketPage() {
  const matches = await getMatches();

  return (
    <div className="bg-slate-50">
      <div className="mx-auto max-w-450 space-y-4 px-4 py-5 sm:px-6 lg:px-6">
        <div className="max-w-3xl space-y-2 lg:pl-10 lg:pt-5">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-primary">Electro-Matic Golf Tournament</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-950">Official Bracket</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Follow the EM Cup field from Round 1 matches through the Blue Jacket final. Select any matchup for schedule, handicap, and result details.
          </p>
        </div>
        <Bracket matches={matches} />
        <p className="hidden max-w-3xl text-sm text-slate-500 lg:block">
          Round 1 winners advance to face the players already placed in the Round of 16. Open slots display TBD or Winner of the relevant match. Winners are highlighted in blue once results are entered.
        </p>
      </div>
    </div>
  );
}
