'use client';

import { useEffect, useState } from 'react';
import { UserProfileForm } from '@/components/profile/user-profile-form';
import { getUserProfile } from '@/lib/store';
import type { UserProfile } from '@/types';

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setProfile(getUserProfile());
    setLoading(false);
  }, []);

  const handleSaveProfile = (updatedProfile: UserProfile) => {
    setProfile(updatedProfile);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-full"><p>Carregando perfil...</p></div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-primary">Configurações do Perfil</h1>
      <UserProfileForm initialProfile={profile} onSave={handleSaveProfile} />
    </div>
  );
}
