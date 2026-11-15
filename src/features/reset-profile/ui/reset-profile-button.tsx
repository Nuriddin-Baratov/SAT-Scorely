"use client";

import { studentRepository } from "@/entities/student";
import { progressRepository } from "@/entities/study-plan";
import { useI18n } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";
import { Icon } from "@/shared/ui/icon";

export function ResetProfileButton({ className }: { className?: string }) {
  const { t } = useI18n();
  return (
    <Button
      variant="ghost"
      size="sm"
      className={className}
      onClick={() => {
        if (!window.confirm(t.dashboard.resetConfirm)) return;
        progressRepository.reset();
        studentRepository.remove();
      }}
    >
      <Icon name="trash" className="size-4" />
      {t.dashboard.reset}
    </Button>
  );
}
