"use client";

import { useRef, useState } from "react";

import { useI18n } from "@/shared/i18n";
import { applySnapshot, clearSnapshot, collectSnapshot, isSnapshot, toISODate } from "@/shared/lib";
import { Button } from "@/shared/ui/button";
import { confirmDialog } from "@/shared/ui/confirm";
import { Icon } from "@/shared/ui/icon";

/** Progressni JSON faylga eksport qilish va boshqa qurilmada tiklash. */
export function BackupPanel() {
  const { t } = useI18n();
  const b = t.settings.backup;
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<{ tone: "success" | "danger"; text: string } | null>(null);

  function exportData() {
    const snapshot = collectSnapshot();
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `scorely-backup-${toISODate(new Date())}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage({ tone: "success", text: b.exported(Object.keys(snapshot.data).length) });
  }

  async function importData(file: File) {
    try {
      const parsed: unknown = JSON.parse(await file.text());
      if (!isSnapshot(parsed)) throw new Error("invalid");
      if (!(await confirmDialog({ title: b.confirmImport, tone: "warning", icon: "refresh" }))) return;
      applySnapshot(parsed);
      window.location.reload();
    } catch {
      setMessage({ tone: "danger", text: b.invalid });
    }
  }

  async function resetAll() {
    if (!(await confirmDialog({ title: b.confirmReset, tone: "danger" }))) return;
    clearSnapshot();
    window.location.reload();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <Button onClick={exportData}>
          <Icon name="arrowRight" className="size-4 rotate-90" /> {b.export}
        </Button>
        <Button variant="outline" onClick={() => fileRef.current?.click()}>
          <Icon name="arrowRight" className="size-4 -rotate-90" /> {b.import}
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void importData(file);
            e.target.value = "";
          }}
        />
        <Button variant="danger" onClick={resetAll}>
          <Icon name="trash" className="size-4" /> {b.reset}
        </Button>
      </div>
      {message && (
        <p role="status" className={message.tone === "success" ? "text-sm text-success" : "text-sm text-danger"}>
          {message.text}
        </p>
      )}
    </div>
  );
}
