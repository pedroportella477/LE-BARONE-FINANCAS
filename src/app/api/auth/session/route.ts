
// src/app/api/auth/session/route.ts
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import admin from '@/lib/firebase-admin'; // Admin SDK for verifying ID token
import prisma from '@/lib/prisma';
import { AppDefaultExpenseCategories, AppDefaultIncomeCategories, AppDefaultCategoryForAttachment } from '@/lib/store';


export async function GET(request: Request) {
  const authorization = headers().get('Authorization');
  if (!authorization?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized: No token provided' }, { status: 401 });
  }
  const idToken = authorization.split('Bearer ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;

    let user = await prisma.user.findUnique({
      where: { id: uid },
      include: {
        userProfile: true,
      },
    });

    if (!user) {
      // This case should ideally be handled by POST on first login,
      // but as a fallback, if user exists in Firebase Auth but not DB.
      // Or, simply return an error indicating user not found in DB.
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 });
    }
    
    // Ensure userProfile is not null before sending
    const userProfile = user.userProfile ?? { 
        id: '', // Provide default empty strings or appropriate defaults if null
        userId: uid, 
        monthlyIncome: 0, 
        photoUrl: user.photoUrl,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };


    return NextResponse.json({ user: { id: user.id, email: user.email, name: user.name, photoUrl: user.photoUrl }, userProfile });
  } catch (error) {
    console.error('Error verifying token or fetching user (GET):', error);
    return NextResponse.json({ error: 'Unauthorized: Invalid token or DB error' }, { status: 401 });
  }
}


export async function POST(request: Request) {
  const authorization = headers().get('Authorization');
  if (!authorization?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized: No token provided' }, { status: 401 });
  }
  const idToken = authorization.split('Bearer ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { uid, email, name, picture } = decodedToken;

    if (!email) {
        return NextResponse.json({ error: 'Email not available from token' }, { status: 400 });
    }
    
    const defaultCategoriesTx = [
        ...AppDefaultExpenseCategories.map(catName => 
            prisma.expenseCategory.create({ data: { name: catName, userId: uid } })
        ),
        prisma.expenseCategory.create({data: {name: AppDefaultCategoryForAttachment, userId: uid }}), // Ensure default attachment category
        ...AppDefaultIncomeCategories.map(catName => 
            prisma.incomeCategory.create({ data: { name: catName, userId: uid } })
        ),
    ];


    // Upsert user: find or create
    // Use a transaction to create user, profile, and default categories together
    const result = await prisma.$transaction(async (tx) => {
        let user = await tx.user.findUnique({
            where: { id: uid },
            include: { userProfile: true, expenseCategories: true, incomeCategories: true },
        });

        if (!user) {
            user = await tx.user.create({
                data: {
                    id: uid,
                    email: email,
                    name: name || email.split('@')[0], // Use name from token or derive from email
                    photoUrl: picture,
                    userProfile: {
                        create: {
                            monthlyIncome: 0, // Default monthly income
                            photoUrl: picture,
                        },
                    },
                },
                include: { userProfile: true, expenseCategories: true, incomeCategories: true },
            });
            
            // Create default categories only if the user is new and has no categories yet
             if (user.expenseCategories.length === 0 && user.incomeCategories.length === 0) {
                await Promise.all(AppDefaultExpenseCategories.map(catName =>
                    tx.expenseCategory.create({ data: { name: catName, userId: uid } })
                ));
                await tx.expenseCategory.create({ data: { name: AppDefaultCategoryForAttachment, userId: uid } });
                await Promise.all(AppDefaultIncomeCategories.map(catName =>
                    tx.incomeCategory.create({ data: { name: catName, userId: uid } })
                ));
            }

            // Re-fetch user to include the newly created profile and categories in the return
            user = await tx.user.findUniqueOrThrow({
                where: { id: uid },
                include: { userProfile: true },
            });
        }
        
        // Ensure userProfile is not null before sending
        const userProfile = user.userProfile ?? await tx.userProfile.create({
            data: {
                userId: uid,
                monthlyIncome: 0,
                photoUrl: picture,
            }
        });

        return { user, userProfile };
    });
    
    return NextResponse.json({ user: {id: result.user.id, email: result.user.email, name: result.user.name, photoUrl: result.user.photoUrl }, userProfile: result.userProfile });

  } catch (error: any) {
    console.error('Error verifying token or creating/fetching user (POST):', error);
     if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
      return NextResponse.json({ error: 'Email already in use by another authentication method.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}

