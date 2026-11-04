import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { useAuth } from './AuthContext';
import {
  setupUserPresence,
  subscribeToAllPresence,
  getStudentPresenceStatus,
  calculatePresenceSummary,
  PresenceData,
} from '../services/firebase/presenceService';
import { Student, PresenceStatus } from '../types';
import { getLocalStudents } from '../services/firebase/authService';

interface PresenceContextType {
  presenceMap: Record<string, PresenceData>;
  getStatus: (student: Student) => PresenceStatus;
  summary: {
    total: number;
    online: number;
    offline: number;
    notActivated: number;
    suspended: number;
  };
  refreshPresence: () => void;
}

const PresenceContext = createContext<PresenceContextType | undefined>(undefined);

export const PresenceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, studentData } = useAuth();
  const [presenceMap, setPresenceMap] = useState<Record<string, PresenceData>>({});
  const [students, setStudents] = useState<Student[]>([]);

  // Periodically refresh student records for directory accuracy
  const refreshStudents = () => {
    setStudents(getLocalStudents());
  };

  useEffect(() => {
    refreshStudents();
  }, [studentData]);

  // Subscribe to real-time presence
  useEffect(() => {
    const unsubscribe = subscribeToAllPresence((map) => {
      setPresenceMap(map);
    });
    return () => unsubscribe();
  }, []);

  // Bind current user's presence connection
  useEffect(() => {
    if (!currentUser) return;

    const cleanup = setupUserPresence(
      currentUser.uid,
      currentUser.registrationNumber,
      currentUser.displayName || 'User',
      currentUser.role,
      currentUser.status === 'ACTIVE'
    );

    return () => {
      cleanup();
    };
  }, [currentUser]);

  const getStatus = (student: Student): PresenceStatus => {
    return getStudentPresenceStatus(student, presenceMap);
  };

  const summary = useMemo(() => {
    return calculatePresenceSummary(students, presenceMap);
  }, [students, presenceMap]);

  return (
    <PresenceContext.Provider
      value={{
        presenceMap,
        getStatus,
        summary,
        refreshPresence: refreshStudents,
      }}
    >
      {children}
    </PresenceContext.Provider>
  );
};

export const usePresence = () => {
  const ctx = useContext(PresenceContext);
  if (!ctx) {
    throw new Error('usePresence must be used within a PresenceProvider');
  }
  return ctx;
};

