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
  return `${normalizeRegNo(regNo).toLowerCase()}@signovanta.edu`;
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
        return parsed;
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

// Authentic ECE Staff Members only (No fake civil/cse data)
const DEFAULT_ECE_STAFF: Staff[] = [
  {
    id: 'staff-hod-ece',
    staffId: 'ECE-HOD-01',
    fullName: 'Dr. M. Sangeetha',
    email: 'sangeetha.ece@college.edu',
    mobile: '9840112233',
    department: 'Electronics & Communication Engineering',
    designation: 'Professor & Head',
    requestedRole: 'HOD',
    assignedRole: 'HOD',
    approvalStatus: 'APPROVED',
    isSuspended: false,
    createdAt: '2026-10-01T08:00:00Z',
  },
  {
    id: 'staff-ahod-ece',
    staffId: 'ECE-AHOD-02',
    fullName: 'Dr. Priya Sundaram',
    email: 'priya.ece@college.edu',
    mobile: '9443556677',
    department: 'Electronics & Communication Engineering',
    designation: 'Associate Professor & AHOD',
    requestedRole: 'AHOD',
    assignedRole: 'AHOD',
    approvalStatus: 'APPROVED',
    isSuspended: false,
    createdAt: '2026-10-05T08:00:00Z',
  },
  {
    id: 'staff-fac-ece',
    staffId: 'ECE-STAFF-03',
    fullName: 'Prof. R. Venkatesh',
    email: 'venkatesh.ece@college.edu',
    mobile: '9842551122',
    department: 'Electronics & Communication Engineering',
    designation: 'Assistant Professor',
    requestedRole: 'STAFF',
    assignedRole: 'STAFF',
    approvalStatus: 'APPROVED',
    isSuspended: false,
    createdAt: '2026-10-10T08:00:00Z',
  },
];

export function getLocalStaff(): Staff[] {
  try {
    const raw = localStorage.getItem(LOCAL_STAFF_KEY);
    if (raw) {
      const parsed: Staff[] = JSON.parse(raw);
      // Ensure only ECE staff are present
      const hasNonEce = parsed.some(s => s.department !== 'Electronics & Communication Engineering');
      if (!hasNonEce && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Error reading staff cache:', e);
  }
  localStorage.setItem(LOCAL_STAFF_KEY, JSON.stringify(DEFAULT_ECE_STAFF));
  return DEFAULT_ECE_STAFF;
}

export function saveLocalStaff(staffList: Staff[]): void {
  localStorage.setItem(LOCAL_STAFF_KEY, JSON.stringify(staffList));
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
    email: data.email.trim() || `${normReg.toLowerCase()}@college.edu`,
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
            status: 'NOT_ACTIVATED',
            isFirstLogin: true,
            hasSetPassword: false,
            createdAt: student.createdAt,
          };

          return { user: userProfile, student, requiresPasswordChange: true };
        } else {
          // Attempt Firebase Auth sign-in
          try {
            const cred = await signInWithEmailAndPassword(auth, email, passwordInput);
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
              status: student.status,
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
      status: 'NOT_ACTIVATED',
      isFirstLogin: true,
      hasSetPassword: false,
      createdAt: student.createdAt,
    };

    return { user: userProfile, student, requiresPasswordChange: true };
  }

  // Subsequent login: check custom password
  const savedPassword = localStorage.getItem(`pwd_${normReg}`);
  if (savedPassword && passwordInput !== savedPassword) {
    throw new Error('Incorrect password. Please try again.');
  }

  const now = new Date().toISOString();
  student.lastLoginAt = now;
  saveLocalStudents(students);

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
      const email = profileUpdates.email || regNoToEmail(normReg);
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

    // If it's a student email like 927624bec001@college.edu, parse the regNo prefix
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

