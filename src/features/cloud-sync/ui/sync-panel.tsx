"use client";

import { useState } from "react";

import { localeTags, useI18n } from "@/shared/i18n";
import { applySnapshot, isSnapshot } from "@/shared/lib";
import { Button } from "@/shared/ui/button";
import { Icon } from "@/shared/ui/icon";

import { fingerprint, pullSnapshot, pushSnapshot, syncMeta } from "../model/sync";

/** Sozlamalarda: oxirgi sinxronizatsiya, “Hozir saqlash” va “Bulutdan tiklash” */
export function SyncPanel() {
  const { t, locale } = useI18n();
  const meta = syncMeta.useValue();
  const [busy, setBusy] = useState<"push" | "pull" | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function run(kind: "push" | "pull") {
    setBusy(kind);
    setMessage(null);
    try {
      if (kind === "push") {
        await pushSnapshot({ force: true });
        setMessage(t.sync.saved);
      } else {
        const remote = await pullSnapshot();
        if (!isSnapshot(remote.snapshot)) {
          setMessage(t.sync.nothing);
          return;
        }
        if (!window.confirm(t.sync.confirmPull)) return;
        applySnapshot(remote.snapshot);
        syncMeta.set({ ...syncMeta.get(), hash: fingerprint(remote.snapshot), lastSyncedAt: new Date().toISOString() });
        window.location.reload();
      }
    } catch {
      setMessage(t.sync.failed);
    } finally {
      setBusy(null);
    }
  }

  const last = meta?.lastSyncedAt
    ? new Intl.DateTimeFormat(localeTags[locale], { dateStyle: "medium", timeStyle: "short" }).format(new Date(meta.lastSyncedAt))
    : t.sync.never;

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">
        {t.sync.last}: <span className="font-medium text-fg">{last}</span>
      </p>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={() => run("push")} disabled={busy !== null}>
          <Icon name="refresh" className="size-4" /> {busy === "push" ? t.auth.wait : t.sync.push}
        </Button>
        <Button size="sm" variant="outline" onClick={() => run("pull")} disabled={busy !== null}>
          {busy === "pull" ? t.auth.wait : t.sync.pull}
        </Button>
      </div>
      {message && (
        <p role="status" className="text-sm text-muted">
          {message}
        </p>
      )}
    </div>
  );
}
