import { assertSameOrigin, deleteClass, handleError, json, leaveClass, requireUser } from "@/shared/server";

/** O'qituvchi — sinfni o'chiradi; o'quvchi — sinfdan chiqadi */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const user = await requireUser();
    const { id } = await params;
    if (user.role === "teacher") await deleteClass(user.id, id);
    else await leaveClass(user.id, id);
    return json({ ok: true });
  } catch (error) {
    return handleError(error);
  }
}
