import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/superbaseAdmin";

function getTokenFromHeader(req: Request) {
  const auth = req.headers.get("authorization") || "";
  const parts = auth.split(" ");
  if (parts.length === 2 && parts[0] === "Bearer") return parts[1];
  return null;
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const token = getTokenFromHeader(req);
  if (!token) return new Response("Unauthorized", { status: 401 });

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  const user = data?.user;
  if (error || !user) return new Response("Unauthorized", { status: 401 });

  const task = await prisma.task.findUnique({ where: { id } });
  if (!task || task.userId !== user.id)
    return new Response("Not found or not authorized", { status: 404 });

  await prisma.task.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
