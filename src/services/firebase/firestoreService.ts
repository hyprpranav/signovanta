import {
  EventApplication,
  Team,
  TeamMember,
  ApprovalLog,
  AppNotification,
  EventCategory,
  AcademicSection,
  ApplicationStatus,
  UserRole,
} from '../../types';
import { INITIAL_CATEGORIES, INITIAL_SECTIONS } from '../../data/seedStudents';
import { db, isFirebaseConfigured } from './firebaseConfig';
import { collection, doc, getDocs, setDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';

const APPLICATIONS_KEY = 'signovanta_applications_cache';
const TEAMS_KEY = 'signovanta_teams_cache';
const APPROVALS_KEY = 'signovanta_approvals_cache';
const NOTIFICATIONS_KEY = 'signovanta_notifications_cache';
const CATEGORIES_KEY = 'signovanta_categories_cache';
const SECTIONS_KEY = 'signovanta_sections_cache';

/**
 * Recursively sanitize objects for Firestore:
 * Strips out any properties with `undefined` values, which Firestore rejects with:
 * "Unsupported field value: undefined"
 */
export function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }
  if (Array.isArray(data)) {
    return data
      .filter(item => item !== undefined)
      .map(item => sanitizeForFirestore(item)) as unknown as T;
  }
  if (typeof data === 'object' && !(data instanceof Date)) {
    const cleaned: Record<string, any> = {};
    for (const [key, val] of Object.entries(data as Record<string, any>)) {
      if (val !== undefined) {
        cleaned[key] = sanitizeForFirestore(val);
      }
    }
    return cleaned as T;
  }
  return data;
}

function mirrorToFirebase(collectionName: string, id: string, data: object): void {
  if (!isFirebaseConfigured() || !db) return;
  try {
    const cleanData = sanitizeForFirestore(data);
    void setDoc(doc(db, collectionName, id), { ...cleanData, updatedAt: serverTimestamp() }, { merge: true })
      .catch(error => console.warn(`[SIGNOVANTA] Failed to save ${collectionName}/${id} in Firebase:`, error));
  } catch (error) {
    console.warn(`[SIGNOVANTA] Error mirroring ${collectionName}/${id} to Firebase:`, error);
  }
}

// Helper to seed initial applications for demonstration (strictly ECE students only)
function getInitialApplications(): EventApplication[] {
  return [];
  /*
    {
      id: 'app-2026-001',
      applicationNumber: 'SIG-2026-0001',
      studentId: 'std_927624bec001',
      studentRegNo: '927624BEC001',
      studentName: 'AADITYA R',
      department: 'Electronics & Communication Engineering',
      academicYear: 'III Year',
      section: 'III Year ECE A',
      eventName: 'Smart India Hackathon 2026',
      eventCategory: 'Hackathon',
      organizerName: 'AICTE & MoE',
      institutionName: 'IIT Madras',
      eventLocation: 'Chennai, Tamil Nadu',
      startDate: '2026-11-20',
      endDate: '2026-11-22',
      eventMode: 'OFFLINE',
      eventWebsite: 'https://sih.gov.in',
      eventDescription: 'National level 36-hour hackathon to build an autonomous drone monitoring solution.',
      participationType: 'INDIVIDUAL',
      facultyCoordinator: 'Dr. Priya Sundaram',
      brochureUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600&auto=format&fit=crop&q=80',
      status: 'PRE_APPROVED',
      progressPercent: 50,
      preApprovedBy: 'staff-ahod-ece',
      preApprovedByName: 'Dr. Priya Sundaram',
      preApprovedRole: 'AHOD',
      preApprovedAt: '2026-11-03T10:30:00Z',
      preApprovalRemarks: 'Innovative problem statement and solid preparation. Pre-approval granted. Attend with safety measures.',
      createdAt: '2026-11-02T14:20:00Z',
      updatedAt: '2026-11-03T10:30:00Z',
    },
    {
      id: 'app-2026-002',
      applicationNumber: 'SIG-2026-0002',
      studentId: 'std_927624bec190',
      studentRegNo: '927624BEC190',
      studentName: 'SANJITH J P',
      department: 'Electronics & Communication Engineering',
      academicYear: 'III Year',
      section: 'III Year ECE D',
      eventName: 'IEEE National Circuit Design Expo',
      eventCategory: 'Technical Competition',
      organizerName: 'IEEE Student Branch',
      institutionName: 'NIT Trichy',
      eventLocation: 'Trichy, Tamil Nadu',
      startDate: '2026-10-15',
      endDate: '2026-10-16',
      eventMode: 'OFFLINE',
      eventDescription: 'FPGA embedded controller and VLSI high-speed signal processing showcase.',
      participationType: 'INDIVIDUAL',
      facultyCoordinator: 'Dr. M. Sangeetha',
      status: 'COMPLETED',
      progressPercent: 100,
      preApprovedBy: 'staff-hod-ece',
      preApprovedByName: 'Dr. M. Sangeetha',
      preApprovedRole: 'HOD',
      preApprovedAt: '2026-10-10T09:00:00Z',
      preApprovalRemarks: 'Approved for institutional representation with FPGA hardware kit.',
      actualParticipationDetails: 'Successfully presented FPGA architecture and demonstrated real-time oscilloscope testing.',
      actualAttendanceMarked: true,
      prizeWon: true,
      prizeCategory: '1st Prize (Gold Trophy)',
      achievementDescription: 'Awarded First Place out of 34 national engineering teams with a cash prize of Rs. 25,000.',
      winnerCertUrl: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=600&auto=format&fit=crop&q=80',
      participationCertUrl: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=600&auto=format&fit=crop&q=80',
      completedAt: '2026-10-20T11:45:00Z',
      completedBy: 'staff-hod-ece',
      completedByName: 'Dr. M. Sangeetha',
      createdAt: '2026-10-08T11:00:00Z',
      updatedAt: '2026-10-20T11:45:00Z',
    },
  ];
  */
}

// ------------------------------------------------------------------------------
// Applications Service
// ------------------------------------------------------------------------------
export function getAllApplications(): EventApplication[] {
  try {
    const raw = localStorage.getItem(APPLICATIONS_KEY);
    if (raw) {
      const parsed: EventApplication[] = JSON.parse(raw);
      const demoApplicationIds = new Set(['app-2026-001', 'app-2026-002']);
      const realApplications = parsed.filter(a => !demoApplicationIds.has(a.id));
      if (realApplications.length !== parsed.length) {
        localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(realApplications));
      }
      return realApplications;
    }
  } catch (e) {
    console.warn('Error reading applications:', e);
  }
  const initial = getInitialApplications();
  localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(initial));
  return initial;
}

export function saveAllApplications(apps: EventApplication[]): void {
  localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(apps));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('signovanta:data-updated'));
  }
}

export async function deleteApplication(applicationId: string): Promise<void> {
  const remaining = getAllApplications().filter(application => application.id !== applicationId);
  saveAllApplications(remaining);
  if (isFirebaseConfigured() && db) {
    try {
      await deleteDoc(doc(db, 'eventApplications', applicationId));
    } catch (error) {
      console.error('[SIGNOVANTA] Failed to delete event application from Firebase', error);
      throw new Error('The submission could not be deleted from Firebase.');
    }
  }
}

export function getApplicationsForStudent(studentRegNo: string): EventApplication[] {
  const norm = studentRegNo.toUpperCase().trim();
  const all = getAllApplications();
  return all.filter(a => a.studentRegNo.toUpperCase().trim() === norm);
}

export async function syncApplicationsFromFirebase(): Promise<EventApplication[]> {
  if (!isFirebaseConfigured() || !db) return getAllApplications();
  try {
    const snapshot = await getDocs(collection(db, 'eventApplications'));
    if (snapshot.empty) return getAllApplications();
    const remote = snapshot.docs.map(item => ({ id: item.id, ...item.data() })) as EventApplication[];
    saveAllApplications(remote);
    return remote;
  } catch (error) {
    console.error('[SIGNOVANTA] Failed to load event applications from Firebase', error);
    return getAllApplications();
  }
}

export function getApplicationById(id: string): EventApplication | null {
  const all = getAllApplications();
  return all.find(a => a.id === id) || null;
}

export function createApplication(
  data: Omit<EventApplication, 'id' | 'applicationNumber' | 'createdAt' | 'updatedAt' | 'progressPercent'>,
  isDraft = false
): EventApplication {
  const all = getAllApplications();
  const count = all.length + 1;
  const year = new Date().getFullYear();
  const applicationNumber = `SIG-${year}-${String(count).padStart(4, '0')}`;

  const cleanData = sanitizeForFirestore(data);

  const newApp: EventApplication = {
    ...cleanData,
    id: `app_${Date.now()}`,
    applicationNumber,
    status: isDraft ? 'DRAFT' : 'SUBMITTED',
    progressPercent: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const finalApp = sanitizeForFirestore(newApp);
  all.unshift(finalApp);
  saveAllApplications(all);
  mirrorToFirebase('eventApplications', finalApp.id, finalApp);

  // Create audit log
  createApprovalLog({
    applicationId: finalApp.id,
    applicationNumber: finalApp.applicationNumber,
    action: 'SUBMITTED',
    performedByUid: finalApp.studentId,
    performedByName: finalApp.studentName,
    performedByRole: 'STUDENT',
    remarks: isDraft ? 'Application saved as draft' : 'New event application submitted for verification',
  });

  return finalApp;
}

export function updateApplication(
  id: string,
  updates: Partial<EventApplication>
): EventApplication {
  const all = getAllApplications();
  const idx = all.findIndex(a => a.id === id);
  if (idx === -1) throw new Error('Application not found');

  const cleanUpdates = sanitizeForFirestore(updates);

  const updated: EventApplication = {
    ...all[idx],
    ...cleanUpdates,
    updatedAt: new Date().toISOString(),
  };

  const finalApp = sanitizeForFirestore(updated);
  all[idx] = finalApp;
  saveAllApplications(all);
  mirrorToFirebase('eventApplications', finalApp.id, finalApp);
  return finalApp;
}

export function editCompletedApplication(
  applicationId: string,
  updates: Pick<EventApplication, 'studentName' | 'eventName' | 'eventCategory' | 'organizerName' | 'institutionName' | 'eventLocation' | 'startDate' | 'endDate' | 'eventMode' | 'eventWebsite' | 'registrationLink' | 'eventDescription' | 'parentGuardianName' | 'parentGuardianMobile' | 'guideName' | 'participationType' | 'teamName' | 'teamSize' | 'teamMembers' | 'facultyCoordinator'>,
  editorUid: string,
  editorName: string,
  editorRole: UserRole
): EventApplication {
  const app = getApplicationById(applicationId);
  if (!app) throw new Error('Application not found');
  if (app.status !== 'COMPLETED') {
    throw new Error('This application can only be edited after 100% approval.');
  }

  const updated = updateApplication(applicationId, updates);
  createApprovalLog({
    applicationId: app.id,
    applicationNumber: app.applicationNumber,
    action: 'EDITED',
    performedByUid: editorUid,
    performedByName: editorName,
    performedByRole: editorRole,
    remarks: `Completed event details edited by ${editorRole === 'STUDENT' ? 'the student' : editorName}. Register number remains fixed.`,
  });
  return updated;
}

export function enableStudentApplicationEditing(
  applicationId: string,
  editorUid: string,
  editorName: string,
  editorRole: UserRole
): EventApplication {
  const app = getApplicationById(applicationId);
  if (!app) throw new Error('Application not found');
  if (app.status !== 'COMPLETED') {
    throw new Error('Student editing can only be enabled after 100% approval.');
  }

  const updated = updateApplication(applicationId, {
    studentEditEnabledAt: new Date().toISOString(),
    studentEditEnabledBy: editorUid,
    studentEditEnabledByName: editorName,
  });
  createApprovalLog({
    applicationId: app.id,
    applicationNumber: app.applicationNumber,
    action: 'STUDENT_EDIT_ENABLED',
    performedByUid: editorUid,
    performedByName: editorName,
    performedByRole: editorRole,
    remarks: 'Student editing enabled for this completed event application.',
  });
  createNotification({
    userId: app.studentId,
    title: 'Student Editing Enabled',
    message: `Editing has been enabled for your completed event application "${app.eventName}".`,
    type: 'INFO',
    linkUrl: '/student/applications',
  });
  return updated;
}

/**
 * Pre-Event Staff / HOD Approval (sets progress to 50%)
 */
export function preApproveApplication(
  applicationId: string,
  reviewerUid: string,
  reviewerName: string,
  reviewerRole: UserRole,
  remarks: string
): EventApplication {
  const app = getApplicationById(applicationId);
  if (!app) throw new Error('Application not found');

  const updated = updateApplication(applicationId, {
    status: 'PRE_APPROVED',
    progressPercent: 50,
    preApprovedBy: reviewerUid,
    preApprovedByName: reviewerName,
    preApprovedRole: reviewerRole,
    preApprovedAt: new Date().toISOString(),
    preApprovalRemarks: remarks,
  });

  createApprovalLog({
    applicationId: app.id,
    applicationNumber: app.applicationNumber,
    action: 'PRE_APPROVED',
    performedByUid: reviewerUid,
    performedByName: reviewerName,
    performedByRole: reviewerRole,
    remarks: remarks || 'Pre-approval granted. Student authorized to attend event.',
  });

  createNotification({
    userId: app.studentId,
    title: 'Pre-Event Approved (50% Complete)',
    message: `Your application ${app.applicationNumber} for "${app.eventName}" was pre-approved by ${reviewerName} (${reviewerRole}).`,
    type: 'SUCCESS',
    linkUrl: `/student/applications`,
  });

  return updated;
}

/**
 * Request Correction from Student
 */
export function requestCorrectionApplication(
  applicationId: string,
  reviewerUid: string,
  reviewerName: string,
  reviewerRole: UserRole,
  remarks: string
): EventApplication {
  const app = getApplicationById(applicationId);
  if (!app) throw new Error('Application not found');
  if (!remarks) throw new Error('Please provide specific remarks for the required correction.');

  const updated = updateApplication(applicationId, {
    status: 'CORRECTION_REQUIRED',
    correctionRemarks: remarks,
  });

  createApprovalLog({
    applicationId: app.id,
    applicationNumber: app.applicationNumber,
    action: 'CORRECTION_REQUESTED',
    performedByUid: reviewerUid,
    performedByName: reviewerName,
    performedByRole: reviewerRole,
    remarks,
  });

  createNotification({
    userId: app.studentId,
    title: 'Correction Required on Application',
    message: `${reviewerName} requested changes on "${app.eventName}": "${remarks}"`,
    type: 'WARNING',
    linkUrl: `/student/applications`,
  });

  return updated;
}

/**
 * Reject Application
 */
export function rejectApplication(
  applicationId: string,
  reviewerUid: string,
  reviewerName: string,
  reviewerRole: UserRole,
  remarks: string
): EventApplication {
  const app = getApplicationById(applicationId);
  if (!app) throw new Error('Application not found');
  if (!remarks) throw new Error('Please specify the reason for rejection.');

  const updated = updateApplication(applicationId, {
    status: 'REJECTED',
    rejectionRemarks: remarks,
  });

  createApprovalLog({
    applicationId: app.id,
    applicationNumber: app.applicationNumber,
    action: 'REJECTED',
    performedByUid: reviewerUid,
    performedByName: reviewerName,
    performedByRole: reviewerRole,
    remarks,
  });

  createNotification({
    userId: app.studentId,
    title: 'Application Rejected',
    message: `Application for "${app.eventName}" was rejected. Reason: ${remarks}`,
    type: 'ALERT',
    linkUrl: `/student/applications`,
  });

  return updated;
}

/**
 * Student Post-Event Document Submission (Progress stays at 50% until staff verifies)
 */
export function submitPostEventDocuments(
  applicationId: string,
  data: {
    actualParticipationDetails: string;
    actualAttendanceMarked: boolean;
    prizeWon: boolean;
    prizeCategory?: string;
    prizeName?: string;
    achievementDescription?: string;
    participationCertUrl?: string;
    winnerCertUrl?: string;
    eventPhotoUrls?: string[];
  }
): EventApplication {
  const app = getApplicationById(applicationId);
  if (!app) throw new Error('Application not found');

  if (data.prizeWon && !data.winnerCertUrl) {
    throw new Error('Winner Certificate is strictly required when Prize Won is marked Yes.');
  }
  if (!data.prizeWon && !data.participationCertUrl) {
    throw new Error('Participation Certificate is required to confirm event attendance.');
  }

  const cleanData = Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined)
  ) as Partial<EventApplication>;

  const updated = updateApplication(applicationId, {
    ...cleanData,
    status: 'CERTIFICATE_SUBMITTED',
    postEventSubmittedAt: new Date().toISOString(),
  });

  createApprovalLog({
    applicationId: app.id,
    applicationNumber: app.applicationNumber,
    action: 'CERTIFICATES_UPLOADED',
    performedByUid: app.studentId,
    performedByName: app.studentName,
    performedByRole: 'STUDENT',
    remarks: data.prizeWon
      ? `Uploaded Winner Certificate (${data.prizeCategory || 'Prize Won'})`
      : 'Uploaded Participation Certificate for faculty verification',
  });

  return updated;
}

/**
 * Final Staff / HOD Verification (marks progress as 100% COMPLETED)
 */
export function completeEventApplication(
  applicationId: string,
  verifierUid: string,
  verifierName: string,
  verifierRole: UserRole,
  remarks: string
): EventApplication {
  const app = getApplicationById(applicationId);
  if (!app) throw new Error('Application not found');
  if (!app.participationCertUrl || (app.prizeWon && !app.winnerCertUrl)) {
    throw new Error('Required certificates must be submitted before final verification.');
  }

  const updated = updateApplication(applicationId, {
    status: 'COMPLETED',
    progressPercent: 100,
    completedAt: new Date().toISOString(),
    completedBy: verifierUid,
    completedByName: verifierName,
  });

  createApprovalLog({
    applicationId: app.id,
    applicationNumber: app.applicationNumber,
    action: 'COMPLETED',
    performedByUid: verifierUid,
    performedByName: verifierName,
    performedByRole: verifierRole,
    remarks: remarks || 'Certificates successfully verified. Event marked 100% completed.',
  });

  createNotification({
    userId: app.studentId,
    title: 'Event Completed (100% Progress)',
    message: `Congratulations! Your certificates for "${app.eventName}" have been verified by ${verifierName}.`,
    type: 'SUCCESS',
    linkUrl: `/student/certificates`,
  });

  return updated;
}

// ------------------------------------------------------------------------------
// Team Management Service
// ------------------------------------------------------------------------------
export function getAllTeams(): Team[] {
  localStorage.setItem(TEAMS_KEY, JSON.stringify([]));
  return [];
  /*
  try {
    const raw = localStorage.getItem(TEAMS_KEY);
    if (raw) {
      const parsed: Team[] = JSON.parse(raw);
      const hasNonEce = parsed.some(t => t.members.some(m => m.department !== 'Electronics & Communication Engineering'));
      if (!hasNonEce && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Error reading teams:', e);
  }
  const defaultTeam: Team = {
    id: 'team-2026-001',
    teamName: 'CircuitCrafters',
    eventApplicationId: 'app-2026-001',
    leaderStudentId: 'std_927624bec001',
    leaderRegNo: '927624BEC001',
    leaderName: 'AADITYA R',
    leaderUid: 'uid_927624BEC001',
    maxMembers: 4,
    members: [
      {
        studentId: 'std_927624bec001',
        registrationNumber: '927624BEC001',
        fullName: 'AADITYA R',
        department: 'Electronics & Communication Engineering',
        academicYear: 'III Year',
        section: 'III Year ECE A',
        roleInTeam: 'LEADER',
        confirmationStatus: 'CONFIRMED',
        confirmedAt: '2026-11-04T08:15:00Z',
        invitedAt: '2026-11-04T08:15:00Z',
      },
      {
        studentId: 'std_927624bec002',
        registrationNumber: '927624BEC002',
        fullName: 'AAKASH V',
        department: 'Electronics & Communication Engineering',
        academicYear: 'III Year',
        section: 'III Year ECE A',
        roleInTeam: 'MEMBER',
        confirmationStatus: 'CONFIRMED',
        invitedAt: '2026-11-04T08:15:00Z',
      },
    ],
    createdAt: '2026-11-04T08:15:00Z',
    updatedAt: '2026-11-04T08:15:00Z',
  };
  localStorage.setItem(TEAMS_KEY, JSON.stringify([defaultTeam]));
  return [defaultTeam];
  */
}

export function saveAllTeams(teams: Team[]): void {
  localStorage.setItem(TEAMS_KEY, JSON.stringify(teams));
}

export function createTeam(teamData: Omit<Team, 'id' | 'createdAt' | 'updatedAt'>): Team {
  const teams = getAllTeams();
  const newTeam: Team = {
    ...teamData,
    id: `team_${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  teams.push(newTeam);
  saveAllTeams(teams);

  // Send notifications to invited members
  teamData.members.forEach((m) => {
    if (m.roleInTeam !== 'LEADER') {
      createNotification({
        userId: m.studentId,
        title: 'New Team Invitation',
        message: `${teamData.leaderName} invited you to join team "${teamData.teamName}". Please confirm your participation.`,
        type: 'INFO',
        linkUrl: '/student/team',
      });
    }
  });

  return newTeam;
}

export function respondToTeamInvitation(
  teamId: string,
  studentRegNo: string,
  accept: boolean
): Team {
  const teams = getAllTeams();
  const normReg = studentRegNo.toUpperCase().trim();
  const team = teams.find(t => t.id === teamId);
  if (!team) throw new Error('Team not found');

  const member = team.members.find(m => m.registrationNumber.toUpperCase().trim() === normReg);
  if (!member) throw new Error('You are not registered as an invited member of this team.');

  member.confirmationStatus = accept ? 'CONFIRMED' : 'REJECTED';
  member.confirmedAt = new Date().toISOString();
  team.updatedAt = new Date().toISOString();

  saveAllTeams(teams);

  // Notify leader
  createNotification({
    userId: team.leaderStudentId,
    title: accept ? 'Team Member Confirmed' : 'Team Invitation Declined',
    message: `${member.fullName} (${member.registrationNumber}) has ${accept ? 'confirmed' : 'declined'} joining "${team.teamName}".`,
    type: accept ? 'SUCCESS' : 'WARNING',
    linkUrl: '/student/team',
  });

  return team;
}

// ------------------------------------------------------------------------------
// Approvals & Audit Trail
// ------------------------------------------------------------------------------
export function getApprovalLogs(applicationId?: string): ApprovalLog[] {
  try {
    const raw = localStorage.getItem(APPROVALS_KEY);
    const logs: ApprovalLog[] = raw ? JSON.parse(raw) : [];
    if (applicationId) {
      return logs.filter(l => l.applicationId === applicationId);
    }
    return logs;
  } catch (e) {
    return [];
  }
}

export function createApprovalLog(logData: Omit<ApprovalLog, 'id' | 'timestamp'>): ApprovalLog {
  const logs = getApprovalLogs();
  const newLog: ApprovalLog = {
    ...logData,
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
  };
  logs.unshift(newLog);
  localStorage.setItem(APPROVALS_KEY, JSON.stringify(logs));
  mirrorToFirebase('approvals', newLog.id, newLog);
  return newLog;
}

// ------------------------------------------------------------------------------
// Notifications Service
// ------------------------------------------------------------------------------
export function getUserNotifications(userId: string): AppNotification[] {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_KEY);
    const all: AppNotification[] = raw ? JSON.parse(raw) : [];
    return all.filter(n => n.userId === userId || n.userId === 'ALL');
  } catch {
    return [];
  }
}

export function createNotification(data: Omit<AppNotification, 'id' | 'createdAt' | 'isRead'>): AppNotification {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_KEY);
    const all: AppNotification[] = raw ? JSON.parse(raw) : [];
    const notif: AppNotification = {
      ...data,
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    all.unshift(notif);
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(all));
    mirrorToFirebase('notifications', notif.id, notif);
    return notif;
  } catch (e) {
    console.warn('Failed to save notification:', e);
    return {} as AppNotification;
  }
}

export function createStaffAnnouncement(
  title: string,
  message: string,
  authorName: string,
  linkUrl = '/student/dashboard'
): AppNotification {
  const cleanTitle = title.trim();
  const cleanMessage = message.trim();
  if (!cleanTitle || !cleanMessage) {
    throw new Error('Announcement title and message are required.');
  }

  return createNotification({
    userId: 'ALL',
    title: cleanTitle,
    message: `${cleanMessage} — Posted by ${authorName}`,
    type: 'INFO',
    linkUrl,
  });
}

export function markNotificationAsRead(id: string): void {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_KEY);
    if (!raw) return;
    const all: AppNotification[] = JSON.parse(raw);
    const item = all.find(n => n.id === id);
    if (item) {
      item.isRead = true;
      localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(all));
    }
  } catch {
    // Ignore
  }
}

// ------------------------------------------------------------------------------
// Categories & Sections Catalogs
// ------------------------------------------------------------------------------
export function getCategories(): EventCategory[] {
  try {
    const raw = localStorage.getItem(CATEGORIES_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(INITIAL_CATEGORIES));
  return INITIAL_CATEGORIES;
}

export function saveCategories(categories: EventCategory[]): void {
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
}

export function getAcademicSections(): AcademicSection[] {
  try {
    const raw = localStorage.getItem(SECTIONS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  localStorage.setItem(SECTIONS_KEY, JSON.stringify(INITIAL_SECTIONS));
  return INITIAL_SECTIONS;
}

export function saveAcademicSections(sections: AcademicSection[]): void {
  localStorage.setItem(SECTIONS_KEY, JSON.stringify(sections));
}
