"use client";

import { useState } from "react";

import { refreshSession, type TelegramStatus } from "@/entities/user";
import { api } from "@/shared/api";
import { useI18n } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";
import { confirmDialog } from "@/shared/ui/confirm";
import { Icon } from "@/shared/ui/icon";
import { Badge } from "@/shared/ui/primitives";

/** Akkauntni Telegram botga ulash / uzish */
export function TelegramPanel({ status }: { status: TelegramStatus }) {
  const { t, locale } = useI18n();
  const tt = t.telegram;
  const [link, setLink] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!status.available) {
    return <p className="text-sm text-muted">{tt.notConfigured}</p>;
  }

  async function connect() {
    setBusy(true);
    setError(null);
    try {
      const { url } = await api<{ url: string }>("/api/telegram/link", { method: "POST", json: { locale } });
      setLink(url);
      window.open(url, "_blank", "noopener");
    } catch {
      setError(tt.failed);
    } finally {
      setBusy(false);
    }
  }

  async function disconnect() {
    if (!(await confirmDialog({ title: tt.confirmUnlink, tone: "danger", icon: "x" }))) return;
    setBusy(true);
    try {
      await api("/api/telegram/link", { method: "DELETE" });
      await refreshSession();
      setLink(null);
    } finally {
      setBusy(false);
    }
  }

  if (status.linked) {
    return (
      <div className="space-y-3">
        <p className="flex items-center gap-2 text-sm">
          <Badge tone="success">
            <Icon name="check" className="size-3" /> {tt.linked}
          </Badge>
          {status.bot && <span className="text-muted">@{status.bot}</span>}
        </p>
        <p className="text-sm text-muted">{status.dailyEnabled ? tt.dailyOn : tt.dailyOff}</p>
        <Button size="sm" variant="danger" onClick={disconnect} disabled={busy}>
          {tt.unlink}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">{tt.description}</p>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={connect} disabled={busy}>
          <Icon name="bolt" className="size-4" /> {busy ? t.auth.wait : tt.connect}
        </Button>
        {link && (
          <Button size="sm" variant="outline" onClick={() => refreshSession()}>
            <Icon name="refresh" className="size-4" /> {tt.checkStatus}
          </Button>
        )}
      </div>
      {link && (
        <p className="text-xs text-muted">
          {tt.openHint}{" "}
          <a href={link} target="_blank" rel="noreferrer" className="font-medium text-accent hover:underline">
            {link.replace("https://", "")}
          </a>
        </p>
      )}
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
