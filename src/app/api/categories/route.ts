
// src/app/api/categories/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { headers } from 'next/headers';
import admin from '@/lib/firebase-admin';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const categorySchema = z.object({
  name: z.string().min(1, "Nome da categoria é obrigatório."),
  type: z.enum(['expense', 'income']),
});

export async function GET(request: NextRequest) {
  const authorization = headers().get('Authorization');
  if (!authorization?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const idToken = authorization.split('Bearer ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const expenseCategories = await prisma.expenseCategory.findMany({
      where: { userId: uid },
      orderBy: { name: 'asc' },
    });
    const incomeCategories = await prisma.incomeCategory.findMany({
      where: { userId: uid },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ expenseCategories, incomeCategories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authorization = headers().get('Authorization');
  if (!authorization?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const idToken = authorization.split('Bearer ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const body = await request.json();
    const parsedBody = categorySchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsedBody.error.flatten() }, { status: 400 });
    }

    const { name, type } = parsedBody.data;
    let newCategory;

    if (type === 'expense') {
      // Check if category already exists for this user
      const existing = await prisma.expenseCategory.findFirst({ where: { userId: uid, name: name }});
      if (existing) {
        return NextResponse.json({ error: `Categoria de despesa "${name}" já existe.` }, { status: 409 });
      }
      newCategory = await prisma.expenseCategory.create({
        data: { name, userId: uid },
      });
    } else { // type === 'income'
      const existing = await prisma.incomeCategory.findFirst({ where: { userId: uid, name: name }});
       if (existing) {
        return NextResponse.json({ error: `Categoria de receita "${name}" já existe.` }, { status: 409 });
      }
      newCategory = await prisma.incomeCategory.create({
        data: { name, userId: uid },
      });
    }

    return NextResponse.json(newCategory, { status: 201 });
  } catch (error: any) {
    console.error('Error creating category:', error);
    if (error.code === 'P2002') { // Unique constraint violation
        return NextResponse.json({ error: `A categoria "${body.name}" já existe.` }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create category', details: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const authorization = headers().get('Authorization');
  if (!authorization?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const idToken = authorization.split('Bearer ')[1];
  
  const { searchParams } = new URL(request.url);
  const categoryId = searchParams.get('id');
  const categoryType = searchParams.get('type') as 'expense' | 'income' | null;

  if (!categoryId || !categoryType || !['expense', 'income'].includes(categoryType)) {
    return NextResponse.json({ error: 'Missing category ID or type, or invalid type' }, { status: 400 });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;

    if (categoryType === 'expense') {
      await prisma.expenseCategory.delete({
        where: { id: categoryId, userId: uid }, // Ensure user owns the category
      });
    } else { // type === 'income'
      await prisma.incomeCategory.delete({
        where: { id: categoryId, userId: uid },
      });
    }

    return NextResponse.json({ message: 'Category deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Error deleting category:', error);
     if (error.code === 'P2025') { // Record to delete not found
        return NextResponse.json({ error: 'Categoria não encontrada ou você não tem permissão para excluí-la.' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to delete category', details: error.message }, { status: 500 });
  }
}
