// Faqat server (route handler'lar, server funksiyalari) uchun. Client komponentlardan import qilmang.
import "server-only";

export {
  AuthError,
  SESSION_COOKIE,
  deleteAccount,
  endSession,
  getCurrentUser,
  registerUser,
  requireUser,
  startSession,
  updateProfile,
  verifyCredentials,
  type PublicUser,
  type Role,
} from "./auth";
export { findCertificate, insertCertificate, listCertificates, uncertifiedTests, type CertificateRow } from "./certificates";
export { DatabaseUnavailableError, databaseConfigured, query, queryOne } from "./db";
export { assertSameOrigin, handleError, json, rateLimit, readJson } from "./http";
export {
  createClass,
  deleteClass,
  joinClass,
  leaderboard,
  leaveClass,
  loadSnapshot,
  removeMember,
  saveSnapshot,
  studentClasses,
  teacherClasses,
  type ClassMember,
  type LeaderRow,
} from "./progress";
export {
  claimLinkCode,
  createLinkCode,
  dailyRecipients,
  escapeHtml,
  linkByChat,
  linkStatus,
  recordAnswer,
  setDailyEnabled,
  telegramConfigured,
  tg,
  unlink,
} from "./telegram";
export { DAILY_XP_CAP, alreadyMastered, recordXp, refreshTestStats, tashkentDay, type XpEvent } from "./xp";
export { AI_LIMITS, aiConfigured, aiStatus, refundAiQuota, takeAiQuota, type Plan } from "./ai";
