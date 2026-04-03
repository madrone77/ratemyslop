"use client";

import { useState, useTransition } from "react";
import { adminUpdateSettings } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AdminSettingsProps {
  settings: {
    id: string;
    announcement: string | null;
    submissions_open: boolean;
    updated_at: string;
  } | null;
}

export function AdminSettings({ settings }: AdminSettingsProps) {
  const [announcement, setAnnouncement] = useState(
    settings?.announcement || ""
  );
  const [submissionsOpen, setSubmissionsOpen] = useState(
    settings?.submissions_open ?? true
  );
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("announcement", announcement);
      formData.set("submissions_open", submissionsOpen.toString());
      const result = await adminUpdateSettings(formData);
      if (!result.error) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Site Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="announcement">Announcement Banner</Label>
          <Input
            id="announcement"
            placeholder="Welcome to the beta! Things might break."
            value={announcement}
            onChange={(e) => setAnnouncement(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Leave empty to hide the banner
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label>Submissions Open</Label>
            <p className="text-xs text-muted-foreground">
              Toggle to open/close project submissions
            </p>
          </div>
          <Switch
            checked={submissionsOpen}
            onCheckedChange={setSubmissionsOpen}
          />
        </div>

        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? "Saving..." : saved ? "Saved!" : "Save Settings"}
        </Button>
      </CardContent>
    </Card>
  );
}
