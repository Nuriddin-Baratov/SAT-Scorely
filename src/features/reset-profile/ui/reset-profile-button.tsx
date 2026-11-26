"use client";

import { studentRepository } from "@/entities/student";
import { progressRepository } from "@/entities/study-plan";
import { useI18n } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";
import { confirmDialog } from "@/shared/ui/confirm";
import { Icon } from "@/shared/ui/icon";

export function ResetProfileButton({ className }: { className?: string }) {
  const { t } = useI18n();
  return (
    <Button
      variant="ghost"
      size="sm"
      className={className}
      onClick={async () => {
        if (!(await confirmDialog({ title: t.dashboard.resetConfirm, tone: "danger" }))) return;
        progressRepository.reset();
        studentRepository.remove();
      }}
    >
      <Icon name="trash" className="size-4" />
      {t.dashboard.reset}
    </Button>
  );
}
