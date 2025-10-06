import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { supabaseAdmin } from '@/lib/superbaseAdmin';

function getTokenFromHeader(req: Request) {
  const auth = req.headers.get('authorization') || '';
  const parts = auth.split(' ');
  if (parts.length === 2 && parts[0] === 'Bearer') return parts[1];
  return null;
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const token = getTokenFromHeader(req);
  if (!token) return new Response('Unauthorized', { status: 401 });

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  const user = data?.user;
  if (error || !user) return new Response('Unauthorized', { status: 401 });

  const { id } = params;
  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) return new Response('Not found', { status: 404 });
  if (task.userId !== user.id) return new Response('Forbidden', { status: 403 });

  await prisma.task.delete({ where: { id } });

  return new Response(null, { status: 204 });
}
