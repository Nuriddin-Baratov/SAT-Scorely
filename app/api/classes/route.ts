import { connection } from "next/server";
import { assertSameOrigin, createClass, handleError, json, readJson, requireUser, studentClasses, teacherClasses } from "@/shared/server";

/** O'qituvchi: sinflar va o'quvchilar statistikasi. O'quvchi: a'zo bo'lgan sinflar. */
export async function GET() {
  // Har doim so'rov vaqtida bajariladi (prerender qilinmaydi)
  await connection();
  try {
    const user = await requireUser();
    if (user.role === "teacher") return json({ role: "teacher", classes: await teacherClasses(user.id) });
    return json({ role: "student", classes: await studentClasses(user.id) });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireUser("teacher");
    const body = await readJson<{ name?: string }>(request, 5_000);
    return json(await createClass(user.id, String(body.name ?? "")), 201);
  } catch (error) {
    return handleError(error);
  }
}
