import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, collection, query, where } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isVendor: boolean;
  vendorSlug: string | null;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isAdmin: false,
  isVendor: false,
  vendorSlug: null,
  logout: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [vendorSlug, setVendorSlug] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;
    let unsubscribeVendor: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        const docRef = doc(db, 'users', firebaseUser.uid);
        
        // Initial check and creation if not exists
        try {
          const docSnap = await getDoc(docRef);
          if (!docSnap.exists()) {
            const newProfile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || 'User',
              role: 'buyer',
              createdAt: new Date().toISOString(),
            };
            await setDoc(docRef, newProfile);
            setProfile(newProfile);
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
        }

        // Real-time listener for profile updates (e.g., role changes)
        unsubscribeProfile = onSnapshot(docRef, async (snapshot) => {
          if (snapshot.exists()) {
            const userData = snapshot.data() as UserProfile;
            setProfile(userData);

            // Fetch vendor slug if role is vendor
            if (userData.role === 'vendor') {
              const vendorsRef = collection(db, 'vendors');
              const q = query(vendorsRef, where('uid', '==', firebaseUser.uid));
              
              if (unsubscribeVendor) unsubscribeVendor();
              unsubscribeVendor = onSnapshot(q, (vSnapshot) => {
                if (!vSnapshot.empty) {
                  setVendorSlug(vSnapshot.docs[0].data().storeSlug || null);
                }
              });
            } else {
              setVendorSlug(null);
            }
          }
          setLoading(false);
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
          setLoading(false);
        });
      } else {
        setProfile(null);
        setVendorSlug(null);
        if (unsubscribeProfile) unsubscribeProfile();
        if (unsubscribeVendor) unsubscribeVendor();
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
      if (unsubscribeVendor) unsubscribeVendor();
    };
  }, []);

  const isAdmin = (!!user?.email && 
    ['sales@bazaar.com', 'admin@bazaar.np', 'bazaar@admin.com', 'admin@bazar.com', 'sapkotaaayush8848@gmail.com'].includes(user.email.toLowerCase().trim())) || 
    ['admin', 'customer_support', 'sales_manager'].includes(profile?.role || '');
  const isVendor = profile?.role === 'vendor';

  const logout = async () => {
    await auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAdmin, isVendor, vendorSlug, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);



