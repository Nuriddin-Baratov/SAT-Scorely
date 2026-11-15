import { createStorageStore } from "@/shared/lib/react";
import type { StudentProfile } from "./types";

/**
 * Profil repozitoriyasi. Hozircha brauzerda saqlanadi;
 * backend ulanganda faqat shu modulni API chaqiruvlariga almashtirish kifoya.
 */
const profileStore = createStorageStore<StudentProfile | null>("scorely.profile.v1", null);

export const studentRepository = {
  get: profileStore.get,
  save: (profile: StudentProfile) => profileStore.set(profile),
  remove: () => profileStore.clear(),
};

/** `undefined` — yuklanmoqda, `null` — profil yo'q */
export function useStudentProfile() {
  return profileStore.useValue();
}

export function firstName(profile: Pick<StudentProfile, "fullName">) {
  return profile.fullName.trim().split(/\s+/)[0] ?? "";
}
