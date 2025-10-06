
import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { supabaseAdmin } from '@/lib/superbaseAdmin';

function getTokenFromHeader(req: Request) {
  const auth = req.headers.get('authorization') || '';
  const parts = auth.split(' ');
  if (parts.length === 2 && parts[0] === 'Bearer') return parts[1];
  return null;
}

export async function GET(req: Request) {
  const token = getTokenFromHeader(req);
  if (!token) return new Response('Unauthorized', { status: 401 });

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  const user = data?.user;
  if (error || !user) return new Response('Unauthorized', { status: 401 });

  const tasks = await prisma.task.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' }
  });

  return NextResponse.json(tasks);
}

export async function POST(req: Request) {
  const token = getTokenFromHeader(req);
  if (!token) return new Response('Unauthorized', { status: 401 });

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  const user = data?.user;
  if (error || !user) return new Response('Unauthorized', { status: 401 });

  const body = await req.json();
  const { title, description } = body || {};
  if (!title || !description) return new Response('Invalid payload', { status: 400 });

  const created = await prisma.task.create({
    data: {
      title,
      description,
      userId: user.id
    }
  });

  return NextResponse.json(created, { status: 201 });
}
