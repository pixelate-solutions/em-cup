"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { toast } from "sonner";

import { updateSettingAction } from "@/actions/admin";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { TournamentSetting } from "@/db/schema";

export function AdminSettingsEditor({ settings }: { settings: TournamentSetting[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const map = new Map(settings.map((setting) => [setting.name, setting.value]));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          action={(formData) => {
            const updates = ["tournament_name", "organizer_email", "finals_location_default"].map((name) => ({
              name,
              value: String(formData.get(name) || ""),
            }));

            startTransition(async () => {
              try {
                await Promise.all(updates.map((update) => updateSettingAction(update)));
                toast.success("Settings updated");
                router.refresh();
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Settings update failed");
              }
            });
          }}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tournament_name">Tournament name</Label>
              <Input id="tournament_name" name="tournament_name" defaultValue={map.get("tournament_name") ?? "EM Cup"} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="organizer_email">Organizer email</Label>
              <Input id="organizer_email" name="organizer_email" type="email" defaultValue={map.get("organizer_email") ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="finals_location_default">Finals location default</Label>
              <Input id="finals_location_default" name="finals_location_default" defaultValue={map.get("finals_location_default") ?? "Great Oaks"} />
            </div>
            <div className="space-y-2">
              <Label>Admin password</Label>
              <Input value="Managed by ADMIN_PASSWORD" readOnly />
            </div>
          </div>
          <Alert>
            <AlertDescription>Admin password changes are made through the ADMIN_PASSWORD environment variable, not this UI.</AlertDescription>
          </Alert>
          <Button type="submit" disabled={isPending}>
            <Save className="h-4 w-4" />
            Save settings
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
