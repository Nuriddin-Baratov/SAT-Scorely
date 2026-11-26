"use client";

import { useMemo } from "react";

import { domainPerformance, useTestAttempts } from "@/entities/practice-test";
import type { StudentProfile } from "@/entities/student";
import { generateStudyPlan, type DomainAccuracy } from "@/entities/study-plan";
import { useI18n } from "@/shared/i18n";

/** O'quvchi rejasi: kamida 3 ta savol yechilgan mavzular natijasiga moslashadi */
export function useStudyPlan(profile: StudentProfile) {
  const { locale } = useI18n();
  const attempts = useTestAttempts();
  const performance = useMemo(() => {
    const result: DomainAccuracy = {};
    let questions = 0;
    for (const [id, stat] of Object.entries(domainPerformance(attempts ?? []))) {
      if (!stat || stat.total < 3) continue;
      result[id as keyof DomainAccuracy] = stat.correct / stat.total;
      questions += stat.total;
    }
    return { accuracy: result, questions };
  }, [attempts]);
  const plan = useMemo(() => generateStudyPlan(profile, locale, performance.accuracy), [profile, locale, performance]);
  return { plan, adaptedFrom: performance.questions };
}
