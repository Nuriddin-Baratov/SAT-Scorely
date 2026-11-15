import { assertSameOrigin, handleError, json, removeMember, requireUser } from "@/shared/server";

/** O'qituvchi o'quvchini sinfdan chiqaradi */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string; userId: string }> }) {
  try {
    assertSameOrigin(request);
    const user = await requireUser("teacher");
    const { id, userId } = await params;
    await removeMember(user.id, id, userId);
    return json({ ok: true });
  } catch (error) {
    return handleError(error);
  }
}
