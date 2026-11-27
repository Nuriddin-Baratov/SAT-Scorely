import "server-only";

/** AI ustoz ishlashi uchun Anthropic API kaliti kerak (`ANTHROPIC_API_KEY`) */
export const aiConfigured = () => !!process.env.ANTHROPIC_API_KEY;
