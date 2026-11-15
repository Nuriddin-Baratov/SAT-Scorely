import { localizedMetadata } from "@/shared/i18n";

export const generateMetadata = localizedMetadata("teacher", "/teacher", { robots: { index: false } });

export { TeacherPage as default } from "@/pages/teacher";
