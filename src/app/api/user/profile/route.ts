
// src/app/api/user/profile/route.ts
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import admin from '@/lib/firebase-admin';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const profileUpdateSchema = z.object({
  monthlyIncome: z.number().positive().optional(),
  cpf: z.string().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, "CPF inválido").nullable().optional(),
  cellphone: z.string().regex(/^\(\d{2}\) \d{5}-\d{4}$/, "Celular inválido").nullable().optional(),
  photoUrl: z.string().url("URL da foto inválida").or(z.string().startsWith("data:image/")).nullable().optional(),
  name: z.string().min(2).optional(), // For updating name in Firebase Auth and DB User model
});


export async function PUT(request: Request) {
  const authorization = headers().get('Authorization');
  if (!authorization?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized: No token provided' }, { status: 401 });
  }
  const idToken = authorization.split('Bearer ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const body = await request.json();
    const parsedBody = profileUpdateSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsedBody.error.flatten() }, { status: 400 });
    }
    
    const { name, ...profileData } = parsedBody.data;

    // Update Prisma UserProfile
    const userProfile = await prisma.userProfile.update({
      where: { userId: uid },
      data: {
        ...profileData,
        ...(profileData.photoUrl !== undefined && { photoUrl: profileData.photoUrl }), // Ensure photoUrl is explicitly set or cleared
      },
    });

    // Update Firebase Auth user if name or photoUrl is being changed
    const firebaseAuthUpdateData: { displayName?: string; photoURL?: string } = {};
    let userDbUpdateData: { name?: string; photoUrl?: string } = {};

    if (name && name !== decodedToken.name) {
        firebaseAuthUpdateData.displayName = name;
        userDbUpdateData.name = name;
    }
    if (profileData.photoUrl !== undefined && profileData.photoUrl !== decodedToken.picture) {
      // Only update Firebase photoURL if it's a new URL (not data URI directly, as Firebase expects a URL)
      // For simplicity, we'll update our DB User's photoUrl with the data URI or URL from client,
      // and only update Firebase Auth's photoURL if we have a *real* URL (not a data URI).
      // A more robust solution would upload data URIs to Firebase Storage and get a URL.
      userDbUpdateData.photoUrl = profileData.photoUrl;
      if (profileData.photoUrl && !profileData.photoUrl.startsWith("data:image/")) {
          firebaseAuthUpdateData.photoURL = profileData.photoUrl;
      } else if (profileData.photoUrl === null && decodedToken.picture) {
          // If user removed photo, attempt to clear it in Firebase Auth by setting to undefined or null
          firebaseAuthUpdateData.photoURL = undefined; // Or try null, Firebase behavior can vary.
      }
    }


    if (Object.keys(firebaseAuthUpdateData).length > 0) {
        await admin.auth().updateUser(uid, firebaseAuthUpdateData);
    }
    if (Object.keys(userDbUpdateData).length > 0) {
        await prisma.user.update({
            where: { id: uid },
            data: userDbUpdateData,
        });
    }


    return NextResponse.json(userProfile);

  } catch (error: any) {
    console.error('Error updating profile:', error);
     if (error.code === 'P2025') { // Prisma error for record not found
      return NextResponse.json({ error: 'User profile not found to update.' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to update profile', details: error.message }, { status: 500 });
  }
}

