import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../services/firebase/firebaseConfig';
import { UserProfile, Student, Staff, UserRole, StudentRegistrationRequest } from '../types';
import {
  studentLogin as authStudentLogin,
  completeFirstLogin as authCompleteFirstLogin,
  staffLogin as authStaffLogin,
  masterAdminLogin as authMasterAdminLogin,
  quickLoginAsBoomika,
  universalLogin as authUniversalLogin,
  signOutUser,
  getLocalStudents,
  getLocalStaff,
  getStudentRegistrationRequests,
  submitStudentRegistrationRequest,
  approveStudentRegistrationRequest,
  rejectStudentRegistrationRequest,
} from '../services/firebase/authService';

interface AuthContextType {
  currentUser: UserProfile | null;
  studentData: Student | null;
  staffData: Staff | null;
  isLoading: boolean;
  universalLogin: (identifier: string, pwd: string) => Promise<{ requiresPasswordChange: boolean; student?: Student }>;
  loginAsAdminBoomikaQuick: () => Promise<void>;
  loginAsStudent: (regNo: string, pwd: string) => Promise<{ requiresPasswordChange: boolean; student: Student }>;
  completeFirstTimeLogin: (newPassword: string, updates: { mobile?: string; email?: string; profilePhotoUrl?: string; profilePhotoPublicId?: string }) => Promise<void>;
  loginAsStaff: (email: string, pwd: string) => Promise<void>;
  loginAsMasterAdmin: (pin: string) => Promise<void>;
  logout: () => Promise<void>;
  updateCurrentStudentProfile: (updates: Partial<Student>) => void;
  // Student registration request methods
  submitStudentRequest: (data: { registrationNumber: string; fullName: string; email: string; mobile: string; section: string }) => Promise<StudentRegistrationRequest>;
  getPendingStudentRequests: () => StudentRegistrationRequest[];
  approveStudentRequest: (requestId: string) => Promise<Student>;
  rejectStudentRequest: (requestId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const CURRENT_USER_STORAGE = 'signovanta_active_session';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [studentData, setStudentData] = useState<Student | null>(null);
  const [staffData, setStaffData] = useState<Staff | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on mount and sync with Firebase Auth
  useEffect(() => {
    try {
      const savedSession = localStorage.getItem(CURRENT_USER_STORAGE);
      if (savedSession) {
        const user: UserProfile = JSON.parse(savedSession);
        setCurrentUser(user);

        if (user.role === 'STUDENT' && user.registrationNumber) {
          const students = getLocalStudents();
          const std = students.find(s => s.registrationNumber.toUpperCase() === user.registrationNumber?.toUpperCase());
          if (std) {
            setStudentData(std);
            if (std.profilePhotoUrl && user.profilePhotoUrl !== std.profilePhotoUrl) {
              const updatedUser = { ...user, profilePhotoUrl: std.profilePhotoUrl };
              setCurrentUser(updatedUser);
              localStorage.setItem(CURRENT_USER_STORAGE, JSON.stringify(updatedUser));
            }
          }
        } else if (['STAFF', 'HOD', 'AHOD'].includes(user.role) && user.staffId) {
          const staffList = getLocalStaff();
          const stf = staffList.find(s => s.staffId.toUpperCase() === user.staffId?.toUpperCase());
          if (stf) {
            setStaffData(stf);
            if (stf.profilePhotoUrl && user.profilePhotoUrl !== stf.profilePhotoUrl) {
              const updatedUser = { ...user, profilePhotoUrl: stf.profilePhotoUrl };
              setCurrentUser(updatedUser);
              localStorage.setItem(CURRENT_USER_STORAGE, JSON.stringify(updatedUser));
            }
          }
        }
      }
    } catch (e) {
      console.warn('Failed to restore user session:', e);
    } finally {
      setIsLoading(false);
    }

    if (isFirebaseConfigured() && auth) {
      const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
        if (!fbUser) return;
        const savedSession = localStorage.getItem(CURRENT_USER_STORAGE);
        if (!savedSession) {
          if (fbUser.email === 'boomika@gmail.com') {
            const adminUser: UserProfile = {
              uid: fbUser.uid,
              email: 'boomika@gmail.com',
              displayName: localStorage.getItem('master_admin_name') || 'Boomika',
              role: 'MASTER_ADMIN',
              department: 'Electronics & Communication Engineering',
              designation: 'Head Administrator',
              status: 'ACTIVE',
              isFirstLogin: false,
              hasSetPassword: true,
              createdAt: '2026-01-01T00:00:00Z',
              lastLoginAt: new Date().toISOString(),
            };
            setCurrentUser(adminUser);
            localStorage.setItem(CURRENT_USER_STORAGE, JSON.stringify(adminUser));
          }
        }
      });
      return () => unsubscribe();
    }
  }, []);

  const universalLogin = async (identifier: string, pwd: string) => {
    setIsLoading(true);
    try {
      const res = await authUniversalLogin(identifier, pwd);
      setCurrentUser(res.user);
      if (res.student) {
        setStudentData(res.student);
        setStaffData(null);
      } else if (res.staff) {
        setStaffData(res.staff);
        setStudentData(null);
      } else {
        setStudentData(null);
        setStaffData(null);
      }

      if (!res.requiresPasswordChange) {
        localStorage.setItem(CURRENT_USER_STORAGE, JSON.stringify(res.user));
      }
      return { requiresPasswordChange: res.requiresPasswordChange, student: res.student };
    } finally {
      setIsLoading(false);
    }
  };

  const loginAsAdminBoomikaQuick = async () => {
    setIsLoading(true);
    try {
      const user = await quickLoginAsBoomika();
      setCurrentUser(user);
      setStudentData(null);
      setStaffData(null);
      localStorage.setItem(CURRENT_USER_STORAGE, JSON.stringify(user));
    } finally {
      setIsLoading(false);
    }
  };

  const loginAsStudent = async (regNo: string, pwd: string) => {
    setIsLoading(true);
    try {
      const { user, student, requiresPasswordChange } = await authStudentLogin(regNo, pwd);
      setCurrentUser(user);
      setStudentData(student);
      setStaffData(null);
      if (!requiresPasswordChange) {
        localStorage.setItem(CURRENT_USER_STORAGE, JSON.stringify(user));
      }
      return { requiresPasswordChange, student };
    } finally {
      setIsLoading(false);
    }
  };

  const completeFirstTimeLogin = async (
    newPassword: string,
    updates: { mobile?: string; email?: string; profilePhotoUrl?: string; profilePhotoPublicId?: string }
  ) => {
    if (!studentData || !currentUser?.registrationNumber) {
      throw new Error('No active student activation session.');
    }
    setIsLoading(true);
    try {
      const { user, student } = await authCompleteFirstLogin(
        studentData.id,
        currentUser.registrationNumber,
        newPassword,
        updates
      );
      setCurrentUser(user);
      setStudentData(student);
      localStorage.setItem(CURRENT_USER_STORAGE, JSON.stringify(user));
    } finally {
      setIsLoading(false);
    }
  };

  const loginAsStaff = async (email: string, pwd: string) => {
    setIsLoading(true);
    try {
      const { user, staff } = await authStaffLogin(email, pwd);
      setCurrentUser(user);
      setStaffData(staff);
      setStudentData(null);
      localStorage.setItem(CURRENT_USER_STORAGE, JSON.stringify(user));
    } finally {
      setIsLoading(false);
    }
  };

  const loginAsMasterAdmin = async (pin: string) => {
    setIsLoading(true);
    try {
      const user = await authMasterAdminLogin(pin);
      setCurrentUser(user);
      setStudentData(null);
      setStaffData(null);
      localStorage.setItem(CURRENT_USER_STORAGE, JSON.stringify(user));
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await signOutUser();
      setCurrentUser(null);
      setStudentData(null);
      setStaffData(null);
      localStorage.removeItem(CURRENT_USER_STORAGE);
    } finally {
      setIsLoading(false);
    }
  };

  const updateCurrentStudentProfile = (updates: Partial<Student>) => {
    if (!studentData) return;
    const updated = { ...studentData, ...updates };
    setStudentData(updated);
    if (currentUser) {
      const updatedUser = {
        ...currentUser,
        displayName: updated.fullName,
        profilePhotoUrl: updated.profilePhotoUrl,
      };
      setCurrentUser(updatedUser);
      localStorage.setItem(CURRENT_USER_STORAGE, JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        studentData,
        staffData,
        isLoading,
        universalLogin,
        loginAsAdminBoomikaQuick,
        loginAsStudent,
        completeFirstTimeLogin,
        loginAsStaff,
        loginAsMasterAdmin,
        logout,
        updateCurrentStudentProfile,
        submitStudentRequest: submitStudentRegistrationRequest,
        getPendingStudentRequests: getStudentRegistrationRequests,
        approveStudentRequest: approveStudentRegistrationRequest,
        rejectStudentRequest: rejectStudentRegistrationRequest,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

