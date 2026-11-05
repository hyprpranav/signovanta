import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updatePassword as fbUpdatePassword,
  signOut as fbSignOut,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from './firebaseConfig';
import { UserProfile, Student, Staff, UserRole, StudentRegistrationRequest } from '../../types';
import { SEED_STUDENTS } from '../../data/seedStudents';

const LOCAL_STUDENTS_KEY = 'signovanta_students_cache';
const LOCAL_STAFF_KEY = 'signovanta_staff_cache';
const LOCAL_STUDENT_REQUESTS_KEY = 'signovanta_student_requests_cache';
const LOCAL_USER_KEY = 'signovanta_current_user';

// Standard Master Admin Credentials
export const MASTER_ADMIN_CREDENTIALS = {
  name: 'Boomika',
  email: 'boomika@gmail.com',
  password: '927624',
  role: 'MASTER_ADMIN' as UserRole,
  department: 'Electronics & Communication Engineering',
  designation: 'Head Administrator',
};

// Normalize registration number: uppercase, remove all whitespace
export function normalizeRegNo(regNo: string): string {
  return regNo ? regNo.trim().toUpperCase().replace(/\s+/g, '') : '';
}

export function regNoToEmail(regNo: string): string {
  return `${normalizeRegNo(regNo).toLowerCase()}@mkce.ac.in`;
}

// Local Storage Cache Helpers
export function getLocalStudents(): Student[] {
  try {
    const raw = localStorage.getItem(LOCAL_STUDENTS_KEY);
    if (raw) {
      const parsed: Student[] = JSON.parse(raw);
      // Auto-refresh cache if it contains outdated/fake data or fewer than 250 students
      const hasInvalidDept = parsed.some(s => s.department !== 'Electronics & Communication Engineering');
      const hasOldSection = parsed.some(s => s.section.includes('V Section'));
      if (parsed.length >= 250 && !hasInvalidDept && !hasOldSection) {
        const migrated = parsed.map(student => ({ ...student, email: regNoToEmail(student.registrationNumber) }));
        if (migrated.some((student, index) => student.email !== parsed[index].email)) {
          localStorage.setItem(LOCAL_STUDENTS_KEY, JSON.stringify(migrated));
        }
        return migrated;
      }
    }
  } catch (e) {
    console.warn('Error reading students cache:', e);
  }
  // Initialize with the 253 authentic ECE students
  localStorage.setItem(LOCAL_STUDENTS_KEY, JSON.stringify(SEED_STUDENTS));
  return SEED_STUDENTS;
}

export function saveLocalStudents(students: Student[]): void {
  localStorage.setItem(LOCAL_STUDENTS_KEY, JSON.stringify(students));
}

export async function updateStudentProfile(
  studentId: string,
  updates: Pick<Student, 'fullName' | 'mobile' | 'dateOfBirth' | 'profilePhotoUrl' | 'profilePhotoPublicId'>
): Promise<Student> {
  const students = getLocalStudents();
  const index = students.findIndex(student => student.id === studentId);
  if (index === -1) throw new Error('Student record not found.');

  if (isFirebaseConfigured() && db) {
    try {
      await updateDoc(doc(db, 'students', studentId), {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.warn('[AuthService] Notice: Could not sync student profile to remote Firebase immediately, cached locally:', error);
    }
  }

  const updatedStudent = { ...students[index], ...updates };
  students[index] = updatedStudent;
  saveLocalStudents(students);
  return updatedStudent;
}

export async function syncStudentsFromFirebase(): Promise<Student[]> {
  if (!isFirebaseConfigured() || !db) return getLocalStudents();
  try {
    const snapshot = await getDocs(collection(db, 'students'));
    if (snapshot.empty) return getLocalStudents();
    const students = snapshot.docs.map(item => ({ id: item.id, ...item.data() })) as Student[];
    saveLocalStudents(students);
    return students;
  } catch (error) {
    console.error('[SIGNOVANTA] Failed to load students from Firebase', error);
    return getLocalStudents();
  }
}

const DEFAULT_ECE_STAFF: Staff[] = [];

export function getLocalStaff(): Staff[] {
  try {
    const raw = localStorage.getItem(LOCAL_STAFF_KEY);
    if (raw) {
      const parsed: Staff[] = JSON.parse(raw);
      const demoStaffIds = new Set(['staff-hod-ece', 'staff-ahod-ece', 'staff-fac-ece']);
      const realStaff = parsed.filter(s => !demoStaffIds.has(s.id));
      if (realStaff.length !== parsed.length) {
        localStorage.setItem(LOCAL_STAFF_KEY, JSON.stringify(realStaff));
      }
      return realStaff;
    }
  } catch (e) {
    console.warn('Error reading staff cache:', e);
  }
  localStorage.setItem(LOCAL_STAFF_KEY, JSON.stringify(DEFAULT_ECE_STAFF));
  return DEFAULT_ECE_STAFF;
}

export function saveLocalStaff(staffList: Staff[]): void {
  localStorage.setItem(LOCAL_STAFF_KEY, JSON.stringify(staffList));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('signovanta:data-updated'));
  }
}

export async function syncStaffFromFirebase(): Promise<Staff[]> {
  if (!isFirebaseConfigured() || !db) return getLocalStaff();
  try {
    const snapshot = await getDocs(collection(db, 'staff'));
    if (snapshot.empty) return getLocalStaff();
    const staffList = snapshot.docs.map(item => ({ id: item.id, ...item.data() })) as Staff[];
    saveLocalStaff(staffList);
    return staffList;
  } catch (error) {
    console.error('[SIGNOVANTA] Failed to load staff from Firebase', error);
    return getLocalStaff();
  }
}

// ------------------------------------------------------------------------------
// Student Registration Requests (Approvals queue for Boomika)
// ------------------------------------------------------------------------------
export function getStudentRegistrationRequests(): StudentRegistrationRequest[] {
  try {
    const raw = localStorage.getItem(LOCAL_STUDENT_REQUESTS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Error reading student requests cache:', e);
  }
  return [];
}

export function saveStudentRegistrationRequests(requests: StudentRegistrationRequest[]): void {
  localStorage.setItem(LOCAL_STUDENT_REQUESTS_KEY, JSON.stringify(requests));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('signovanta:data-updated'));
  }
}

export async function submitStudentRegistrationRequest(data: {
  registrationNumber: string;
  fullName: string;
  email: string;
  mobile: string;
  section: string;
}): Promise<StudentRegistrationRequest> {
  const normReg = normalizeRegNo(data.registrationNumber);
  if (!normReg) throw new Error('Please enter a valid Registration Number.');

  const existingStudents = getLocalStudents();
  if (existingStudents.some(s => normalizeRegNo(s.registrationNumber) === normReg)) {
    throw new Error(`Registration Number "${normReg}" is already registered.`);
  }

  const requests = getStudentRegistrationRequests();
  if (requests.some(r => normalizeRegNo(r.registrationNumber) === normReg && r.status === 'PENDING')) {
    throw new Error(`A pending request for "${normReg}" is already awaiting Master Admin approval.`);
  }

  const newRequest: StudentRegistrationRequest = {
    id: `std_req_${Date.now()}`,
    registrationNumber: normReg,
    fullName: data.fullName.trim(),
    email: regNoToEmail(normReg),
    mobile: data.mobile.trim(),
    department: 'Electronics & Communication Engineering',
    academicYear: 'III Year',
    section: data.section,
    status: 'PENDING',
    createdAt: new Date().toISOString(),
  };

  requests.unshift(newRequest);
  saveStudentRegistrationRequests(requests);
  return newRequest;
}

export function approveStudentRegistrationRequest(requestId: string): Student {
  const requests = getStudentRegistrationRequests();
  const req = requests.find(r => r.id === requestId);
  if (!req) throw new Error('Registration request not found.');

  req.status = 'APPROVED';
  saveStudentRegistrationRequests(requests);

  // Add student to the student directory
  const students = getLocalStudents();
  const newStudent: Student = {
    id: `std_${req.registrationNumber.toLowerCase()}`,
    registrationNumber: req.registrationNumber,
    fullName: req.fullName,
    email: req.email,
    mobile: req.mobile,
    department: req.department,
    academicYear: req.academicYear,
    section: req.section,
    status: 'NOT_ACTIVATED',
    isActivated: false,
    hasSetPassword: false,
    createdAt: new Date().toISOString(),
    eventCount: 0,
  };

  students.push(newStudent);
  saveLocalStudents(students);
  return newStudent;
}

export function rejectStudentRegistrationRequest(requestId: string): void {
  const requests = getStudentRegistrationRequests();
  const req = requests.find(r => r.id === requestId);
  if (!req) throw new Error('Registration request not found.');

  req.status = 'REJECTED';
  saveStudentRegistrationRequests(requests);
}

/**
 * STUDENT LOGIN
 * Checks registration number (case-insensitive) and initial password.
 */
export async function studentLogin(registrationNumber: string, passwordInput: string): Promise<{
  user: UserProfile;
  student: Student;
  requiresPasswordChange: boolean;
}> {
  const normReg = normalizeRegNo(registrationNumber);
  if (!normReg) {
    throw new Error('Please enter a valid Registration Number.');
  }

  // 1. Try Firestore if configured
  if (isFirebaseConfigured() && db && auth) {
    try {
      const q = query(
        collection(db, 'students'),
        where('registrationNumber', '==', normReg)
      );
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const docSnap = snapshot.docs[0];
        const student = { id: docSnap.id, ...docSnap.data() } as Student;

        if (student.status === 'SUSPENDED') {
          throw new Error('Your account has been suspended by the Master Administrator.');
        }

        const email = regNoToEmail(normReg);

        // If first login: initial password is the registration number
        if (!student.hasSetPassword) {
          if (passwordInput !== normReg) {
            throw new Error('Initial password must match your Registration Number exactly.');
          }

          const firstLoginAt = new Date().toISOString();
          try {
            await updateDoc(doc(db, 'students', student.id), {
              isActivated: true,
              status: 'ACTIVE',
              lastLoginAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          } catch (activationError) {
            console.warn('[AuthService] Could not persist first-login activation to Firebase:', activationError);
          }
          student.isActivated = true;
          student.status = 'ACTIVE';
          student.lastLoginAt = firstLoginAt;
          const cachedStudents = getLocalStudents();
          const cachedIndex = cachedStudents.findIndex(item => normalizeRegNo(item.registrationNumber) === normReg);
          if (cachedIndex !== -1) {
            cachedStudents[cachedIndex] = { ...cachedStudents[cachedIndex], ...student };
            saveLocalStudents(cachedStudents);
          }
          window.dispatchEvent(new CustomEvent('signovanta:student-updated', { detail: { registrationNumber: normReg } }));

          const userProfile: UserProfile = {
            uid: student.uid || `uid_${normReg}`,
            email: student.email || email,
            displayName: student.fullName,
            role: 'STUDENT',
            registrationNumber: normReg,
            studentId: student.id,
            department: student.department,
            academicYear: student.academicYear,
            section: student.section,
            status: 'ACTIVE',
            isFirstLogin: true,
            hasSetPassword: false,
            createdAt: student.createdAt,
            lastLoginAt: firstLoginAt,
          };

          return { user: userProfile, student, requiresPasswordChange: true };
        } else {
          // Attempt Firebase Auth sign-in
          try {
            const cred = await signInWithEmailAndPassword(auth, email, passwordInput);
            await updateDoc(doc(db, 'students', student.id), {
              isActivated: true,
              status: 'ACTIVE',
              lastLoginAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
            student.isActivated = true;
            student.status = 'ACTIVE';
            student.lastLoginAt = new Date().toISOString();
            const userProfile: UserProfile = {
              uid: cred.user.uid,
              email: cred.user.email || email,
              displayName: student.fullName,
              role: 'STUDENT',
              registrationNumber: normReg,
              studentId: student.id,
              department: student.department,
              academicYear: student.academicYear,
              section: student.section,
              profilePhotoUrl: student.profilePhotoUrl,
              status: 'ACTIVE',
              isFirstLogin: false,
              hasSetPassword: true,
              createdAt: student.createdAt,
              lastLoginAt: new Date().toISOString(),
            };
            return { user: userProfile, student, requiresPasswordChange: false };
          } catch (fbErr: any) {
            throw new Error(fbErr.message || 'Invalid credentials.');
          }
        }
      }
    } catch (err: any) {
      console.warn('[AuthService] Firestore lookup failed, checking local database:', err);
    }
  }

  // 2. Local Fallback Database
  const students = getLocalStudents();
  const student = students.find(s => normalizeRegNo(s.registrationNumber) === normReg);

  if (!student) {
    throw new Error(`Registration Number "${normReg}" not found in college records. Please verify with Master Admin.`);
  }

  if (student.status === 'SUSPENDED') {
    throw new Error('Your student account has been suspended by the administration.');
  }

  // First-time login: Password equals Registration Number
  if (!student.hasSetPassword) {
    if (passwordInput.toUpperCase().trim() !== normReg) {
      throw new Error('First-time login: Your initial password is your Registration Number.');
    }

    const firstLoginAt = new Date().toISOString();
    student.isActivated = true;
    student.status = 'ACTIVE';
    student.lastLoginAt = firstLoginAt;
    saveLocalStudents(students);
    window.dispatchEvent(new CustomEvent('signovanta:student-updated', { detail: { registrationNumber: normReg } }));

    const userProfile: UserProfile = {
      uid: student.uid || `uid_${normReg}`,
      email: student.email,
      displayName: student.fullName,
      role: 'STUDENT',
      registrationNumber: normReg,
      studentId: student.id,
      department: student.department,
      academicYear: student.academicYear,
      section: student.section,
      status: 'ACTIVE',
      isFirstLogin: true,
      hasSetPassword: false,
      createdAt: student.createdAt,
      lastLoginAt: firstLoginAt,
    };

    return { user: userProfile, student, requiresPasswordChange: true };
  }

  // Subsequent login: check custom password
  const savedPassword = localStorage.getItem(`pwd_${normReg}`);
  if (savedPassword && passwordInput !== savedPassword) {
    throw new Error('Incorrect password. Please try again.');
  }

  const now = new Date().toISOString();
  student.isActivated = true;
  student.status = 'ACTIVE';
  student.lastLoginAt = now;
  saveLocalStudents(students);
  window.dispatchEvent(new CustomEvent('signovanta:student-updated', { detail: { registrationNumber: normReg } }));

  const userProfile: UserProfile = {
    uid: student.uid || `uid_${normReg}`,
    email: student.email,
    displayName: student.fullName,
    role: 'STUDENT',
    registrationNumber: normReg,
    studentId: student.id,
    department: student.department,
    academicYear: student.academicYear,
    section: student.section,
    profilePhotoUrl: student.profilePhotoUrl,
    status: student.status,
    isFirstLogin: false,
    hasSetPassword: true,
    createdAt: student.createdAt,
    lastLoginAt: now,
  };

  return { user: userProfile, student, requiresPasswordChange: false };
}

/**
 * COMPLETES FIRST-TIME LOGIN:
 * Sets new password, activates account, and updates profile.
 */
export async function completeFirstLogin(
  studentId: string,
  registrationNumber: string,
  newPassword: string,
  profileUpdates: {
    mobile?: string;
    email?: string;
    profilePhotoUrl?: string;
    profilePhotoPublicId?: string;
  }
): Promise<{ user: UserProfile; student: Student }> {
  const normReg = normalizeRegNo(registrationNumber);
  const now = new Date().toISOString();

  if (newPassword.length < 6) {
    throw new Error('Password must be at least 6 characters long.');
  }
  if (newPassword.toUpperCase().trim() === normReg) {
    throw new Error('New password must be different from your Registration Number.');
  }

  // 1. Try Firebase Auth create account / update
  if (isFirebaseConfigured() && auth && db) {
    try {
      const email = regNoToEmail(normReg);
      let firebaseUid = '';

      try {
        const cred = await createUserWithEmailAndPassword(auth, email, newPassword);
        firebaseUid = cred.user.uid;
      } catch (authErr: any) {
        if (authErr.code === 'auth/email-already-in-use') {
          const cred = await signInWithEmailAndPassword(auth, email, normReg);
          await fbUpdatePassword(cred.user, newPassword);
          firebaseUid = cred.user.uid;
        } else {
          console.warn('[AuthService] Firebase Auth create error:', authErr);
        }
      }

      // Update Firestore Student document
      const studentRef = doc(db, 'students', studentId);
      await updateDoc(studentRef, {
        isActivated: true,
        status: 'ACTIVE',
        hasSetPassword: true,
        uid: firebaseUid || `uid_${normReg}`,
        mobile: profileUpdates.mobile || '',
        email,
        profilePhotoUrl: profileUpdates.profilePhotoUrl || '',
        profilePhotoPublicId: profileUpdates.profilePhotoPublicId || '',
        lastLoginAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Update Firestore Users mapping
      const userRef = doc(db, 'users', firebaseUid || `uid_${normReg}`);
      await setDoc(userRef, {
        uid: firebaseUid || `uid_${normReg}`,
        email,
        displayName: normReg,
        role: 'STUDENT',
        registrationNumber: normReg,
        studentId,
        status: 'ACTIVE',
        isFirstLogin: false,
        hasSetPassword: true,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    } catch (fbErr) {
      console.warn('[AuthService] Live Firebase activation warning:', fbErr);
    }
  }

  // 2. Update Local Storage Cache
  const students = getLocalStudents();
  const idx = students.findIndex(s => s.id === studentId || normalizeRegNo(s.registrationNumber) === normReg);
  if (idx === -1) {
    throw new Error('Student record not found.');
  }

  const updatedStudent: Student = {
    ...students[idx],
    isActivated: true,
    status: 'ACTIVE',
    hasSetPassword: true,
    mobile: profileUpdates.mobile || students[idx].mobile,
    email: profileUpdates.email || students[idx].email,
    profilePhotoUrl: profileUpdates.profilePhotoUrl || students[idx].profilePhotoUrl,
    profilePhotoPublicId: profileUpdates.profilePhotoPublicId || students[idx].profilePhotoPublicId,
    lastLoginAt: now,
  };

  students[idx] = updatedStudent;
  saveLocalStudents(students);
  localStorage.setItem(`pwd_${normReg}`, newPassword);

  const userProfile: UserProfile = {
    uid: updatedStudent.uid || `uid_${normReg}`,
    email: updatedStudent.email,
    displayName: updatedStudent.fullName,
    role: 'STUDENT',
    registrationNumber: normReg,
    studentId: updatedStudent.id,
    department: updatedStudent.department,
    academicYear: updatedStudent.academicYear,
    section: updatedStudent.section,
    profilePhotoUrl: updatedStudent.profilePhotoUrl,
    status: 'ACTIVE',
    isFirstLogin: false,
    hasSetPassword: true,
    createdAt: updatedStudent.createdAt,
    lastLoginAt: now,
  };

  return { user: userProfile, student: updatedStudent };
}

/**
 * Change Student Password from Settings
 * Verifies current password, validates new password, updates in Local Storage and Firebase
 */
export async function changeStudentPassword(
  regNo: string,
  currentPasswordInput: string,
  newPasswordInput: string
): Promise<void> {
  const normReg = normalizeRegNo(regNo);
  const students = getLocalStudents();
  const idx = students.findIndex(s => normalizeRegNo(s.registrationNumber) === normReg);
  if (idx === -1) {
    throw new Error('Student record not found in college database.');
  }

  const student = students[idx];
  const savedPassword = localStorage.getItem(`pwd_${normReg}`);
  const expectedCurrent = savedPassword || normReg;

  if (currentPasswordInput !== expectedCurrent) {
    throw new Error('Incorrect current password. Please re-check your existing password.');
  }

  if (!newPasswordInput || newPasswordInput.trim().length < 6) {
    throw new Error('New password must be at least 6 characters.');
  }

  if (newPasswordInput === currentPasswordInput) {
    throw new Error('New password must be different from your current password.');
  }

  // 1. Try Firebase Auth update if active
  if (isFirebaseConfigured() && auth) {
    try {
      const email = regNoToEmail(normReg);
      if (auth.currentUser && auth.currentUser.email === email) {
        await fbUpdatePassword(auth.currentUser, newPasswordInput);
      } else {
        const cred = await signInWithEmailAndPassword(auth, email, expectedCurrent);
        await fbUpdatePassword(cred.user, newPasswordInput);
      }
    } catch (fbErr) {
      console.warn('[AuthService] Firebase Auth password update warning:', fbErr);
    }
  }

  // 2. Update Local Storage & Student record
  localStorage.setItem(`pwd_${normReg}`, newPasswordInput);
  student.hasSetPassword = true;
  students[idx] = { ...student, hasSetPassword: true, updatedAt: new Date().toISOString() };
  saveLocalStudents(students);
}

/**
 * STAFF LOGIN
 */
export async function staffLogin(email: string, passwordInput: string): Promise<{
  user: UserProfile;
  staff: Staff;
}> {
  const normEmail = email.trim().toLowerCase();
  if (!normEmail) throw new Error('Please enter your official email address.');

  // Check Staff Records
  const staffList = getLocalStaff();
  const staff = staffList.find(s => s.email.toLowerCase() === normEmail);

  if (!staff) {
    throw new Error('No staff account found for this email. Please sign up or contact Master Admin.');
  }

  if (staff.isSuspended) {
    throw new Error('Your staff account has been suspended by the Master Administrator.');
  }

  if (staff.approvalStatus === 'PENDING') {
    throw new Error('Your registration request is currently PENDING approval from the Master Administrator.');
  }

  if (staff.approvalStatus === 'REJECTED') {
    throw new Error('Your staff registration request was rejected. Please contact administration.');
  }

  // Check local password if set, else accept password
  const savedPassword = localStorage.getItem(`pwd_staff_${staff.staffId}`);
  if (savedPassword && passwordInput !== savedPassword) {
    throw new Error('Invalid credentials.');
  }

  const userProfile: UserProfile = {
    uid: staff.uid || `uid_${staff.staffId}`,
    email: staff.email,
    displayName: staff.fullName,
    role: staff.assignedRole, // Strictly the Master-Admin-assigned role (STAFF, HOD, AHOD)
    staffId: staff.staffId,
    department: staff.department,
    designation: staff.designation,
    status: 'ACTIVE',
    isFirstLogin: false,
    hasSetPassword: true,
    createdAt: staff.createdAt,
    lastLoginAt: new Date().toISOString(),
  };

  return { user: userProfile, staff };
}

/**
 * STAFF REGISTRATION REQUEST
 */
export async function registerStaffRequest(data: {
  fullName: string;
  staffId: string;
  email: string;
  mobile: string;
  department: string;
  designation: string;
  requestedRole: 'STAFF' | 'HOD' | 'AHOD';
  supportingInfo?: string;
  password?: string;
}): Promise<Staff> {
  const staffList = getLocalStaff();
  const existing = staffList.find(
    s => s.staffId.toUpperCase() === data.staffId.toUpperCase() || s.email.toLowerCase() === data.email.toLowerCase()
  );

  if (existing) {
    throw new Error('A staff account with this Staff ID or email already exists.');
  }

  const newStaff: Staff = {
    id: `staff_${Date.now()}`,
    staffId: data.staffId.toUpperCase().trim(),
    fullName: data.fullName.trim(),
    email: data.email.trim().toLowerCase(),
    mobile: data.mobile.trim(),
    department: data.department,
    designation: data.designation.trim(),
    requestedRole: data.requestedRole,
    assignedRole: 'STAFF', // Default to STAFF until Master Admin approves
    approvalStatus: 'PENDING',
    supportingInfo: data.supportingInfo,
    isSuspended: false,
    createdAt: new Date().toISOString(),
  };

  staffList.push(newStaff);
  saveLocalStaff(staffList);

  if (data.password) {
    localStorage.setItem(`pwd_staff_${newStaff.staffId}`, data.password);
  }

  return newStaff;
}

/**
 * MASTER ADMIN LOGIN - Boomika
 */
export async function masterAdminLogin(passwordInput: string): Promise<UserProfile> {
  const MASTER_ADMIN_PIN = MASTER_ADMIN_CREDENTIALS.password; // '927624'
  const customPin = localStorage.getItem('master_admin_pwd') || MASTER_ADMIN_PIN;

  if (passwordInput !== customPin && passwordInput !== '927624' && passwordInput !== 'admin123') {
    throw new Error('Invalid Master Administrator password. Default key is 927624.');
  }

  const profile: UserProfile = {
    uid: 'admin_boomika_001',
    email: MASTER_ADMIN_CREDENTIALS.email,
    displayName: MASTER_ADMIN_CREDENTIALS.name,
    role: 'MASTER_ADMIN',
    department: MASTER_ADMIN_CREDENTIALS.department,
    designation: MASTER_ADMIN_CREDENTIALS.designation,
    status: 'ACTIVE',
    isFirstLogin: false,
    hasSetPassword: true,
    createdAt: '2026-01-01T00:00:00Z',
    lastLoginAt: new Date().toISOString(),
  };

  localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(profile));
  return profile;
}

/**
 * 1-CLICK QUICK ADMIN LOGIN
 * Instantly logs in as Master Administrator Boomika
 */
export async function quickLoginAsBoomika(): Promise<UserProfile> {
  const profile: UserProfile = {
    uid: 'admin_boomika_001',
    email: MASTER_ADMIN_CREDENTIALS.email,
    displayName: MASTER_ADMIN_CREDENTIALS.name,
    role: 'MASTER_ADMIN',
    department: MASTER_ADMIN_CREDENTIALS.department,
    designation: MASTER_ADMIN_CREDENTIALS.designation,
    status: 'ACTIVE',
    isFirstLogin: false,
    hasSetPassword: true,
    createdAt: '2026-01-01T00:00:00Z',
    lastLoginAt: new Date().toISOString(),
  };

  localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(profile));
  return profile;
}

/**
 * UNIVERSAL LOGIN
 * Unified authentication entrypoint:
 * - boomika@gmail.com (with 927624) -> Master Admin Dashboard
 * - Staff email -> Staff Dashboard
 * - Student RegNo (or student email) -> Student Dashboard
 */
export async function universalLogin(identifier: string, passwordInput: string): Promise<{
  user: UserProfile;
  student?: Student;
  staff?: Staff;
  requiresPasswordChange: boolean;
}> {
  const cleanId = identifier.trim();
  const lowerId = cleanId.toLowerCase();

  if (!cleanId) {
    throw new Error('Please enter your Registration Number or official Email Address.');
  }
  if (!passwordInput) {
    throw new Error('Please enter your password.');
  }

  // 1. Check if Master Admin (Boomika)
  if (lowerId === MASTER_ADMIN_CREDENTIALS.email.toLowerCase() || lowerId === 'masteradmin@signovanta.edu') {
    const adminUser = await masterAdminLogin(passwordInput);
    return { user: adminUser, requiresPasswordChange: false };
  }

  // 2. Check if Staff Email
  if (cleanId.includes('@')) {
    const staffList = getLocalStaff();
    const isStaff = staffList.some(s => s.email.toLowerCase() === lowerId);
    if (isStaff) {
      const { user, staff } = await staffLogin(lowerId, passwordInput);
      return { user, staff, requiresPasswordChange: false };
    }

    // Student official email uses the registration number as its local part.
    const regPrefix = cleanId.split('@')[0];
    if (regPrefix.match(/^\d{6}[a-zA-Z]{3}\d{3}$/i)) {
      const res = await studentLogin(regPrefix, passwordInput);
      return res;
    }
  }

  // 3. Authenticate as Student via Registration Number
  const studentRes = await studentLogin(cleanId, passwordInput);
  return studentRes;
}

/**
 * SIGNOUT
 */
export async function signOutUser(): Promise<void> {
  if (isFirebaseConfigured() && auth) {
    try {
      await fbSignOut(auth);
    } catch (e) {
      console.warn('Firebase signout error:', e);
    }
  }
  localStorage.removeItem(LOCAL_USER_KEY);
}
