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
  type SyncStats,
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
