
'use client';

import type { User as FirebaseUserType } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth, googleProvider } from '@/lib/firebase';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut as firebaseSignOut,
  User as FirebaseUserAuth
} from 'firebase/auth';
import { useRouter, usePathname } from 'next/navigation';
import type { User, UserProfile, ExpenseCategory, IncomeCategory } from '@/types'; // App specific User type
import { Loader2 } from 'lucide-react';


interface AuthContextType {
  user: FirebaseUserAuth | null; // Firebase Auth User
  dbUser: User | null; // User from our DB
  dbUserProfile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshDbUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<FirebaseUserAuth | null>(null);
  const [dbUser, setDbUser] = useState<User | null>(null);
  const [dbUserProfile, setDbUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        setUser(firebaseUser);
        // Fetch or create user in DB
        try {
          const token = await firebaseUser.getIdToken();
          const res = await fetch('/api/auth/session', {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (res.ok) {
            const { user: appUser, userProfile } = await res.json();
            setDbUser(appUser);
            setDbUserProfile(userProfile);
          } else {
            console.error("Failed to fetch/create user session from DB", await res.text());
            setDbUser(null);
            setDbUserProfile(null);
            // Optionally sign out from Firebase if DB sync fails critically
            // await firebaseSignOut(auth);
            // setUser(null);
          }
        } catch (error) {
          console.error("Error during auth state change DB sync:", error);
          // Handle error appropriately
        }
      } else {
        setUser(null);
        setDbUser(null);
        setDbUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!loading && !user && pathname !== '/login') {
      router.push('/login');
    } else if (!loading && user && dbUser && pathname === '/login') {
      router.push('/');
    }
  }, [user, dbUser, loading, pathname, router]);

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;
      if (firebaseUser) {
        const token = await firebaseUser.getIdToken();
        // API route will handle user creation/retrieval in DB
        const res = await fetch('/api/auth/session', { 
          method: 'POST', // Indicate it's a login event
          headers: { Authorization: `Bearer ${token}` } 
        });
        if (res.ok) {
          const { user: appUser, userProfile } = await res.json();
          setDbUser(appUser);
          setDbUserProfile(userProfile);
          setUser(firebaseUser); // Update local Firebase user state
          router.push('/');
        } else {
          throw new Error('Failed to establish session with backend.');
        }
      }
    } catch (error) {
      console.error("Error signing in with Google:", error);
      // Handle error (e.g., show toast)
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setDbUser(null);
      setDbUserProfile(null);
      router.push('/login');
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const refreshDbUser = async () => {
    if (user) {
        setLoading(true);
        try {
            const token = await user.getIdToken();
            const res = await fetch('/api/auth/session', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const { user: appUser, userProfile } = await res.json();
                setDbUser(appUser);
                setDbUserProfile(userProfile);
            } else {
                console.error("Failed to refresh DB user session", await res.text());
            }
        } catch (error) {
            console.error("Error refreshing DB user session:", error);
        } finally {
            setLoading(false);
        }
    }
  };


  if (loading || (!user && pathname !== '/login')) {
    return (
      <div className="flex justify-center items-center h-screen w-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }


  return (
    <AuthContext.Provider value={{ user, dbUser, dbUserProfile, loading, signInWithGoogle, signOut, refreshDbUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
