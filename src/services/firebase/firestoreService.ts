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

const APPLICATIONS_KEY = 'signovanta_applications_cache';
const TEAMS_KEY = 'signovanta_teams_cache';
const APPROVALS_KEY = 'signovanta_approvals_cache';
const NOTIFICATIONS_KEY = 'signovanta_notifications_cache';
const CATEGORIES_KEY = 'signovanta_categories_cache';
const SECTIONS_KEY = 'signovanta_sections_cache';

// Helper to seed initial applications for demonstration
function getInitialApplications(): EventApplication[] {
  return [
    {
      id: 'app-2026-001',
      applicationNumber: 'SIG-2026-0001',
      studentId: 'std-927624bec014',
      studentRegNo: '927624BEC014',
      studentName: 'Ananya S',
      department: 'Electronics & Communication',
      academicYear: 'III Year',
      section: 'III Year V Section',
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
      studentId: 'std-927624bce003',
      studentRegNo: '927624BCE003',
      studentName: 'Akash Rajendran',
      department: 'Civil Engineering',
      academicYear: 'III Year',
      section: 'III Year C Section',
      eventName: 'National Concrete Design Championship',
      eventCategory: 'Technical Competition',
      organizerName: 'Indian Concrete Institute',
      institutionName: 'NIT Trichy',
      eventLocation: 'Trichy, Tamil Nadu',
      startDate: '2026-10-15',
      endDate: '2026-10-16',
      eventMode: 'OFFLINE',
      eventDescription: 'High-strength geopolymer concrete mix design optimization contest.',
      participationType: 'INDIVIDUAL',
      facultyCoordinator: 'Dr. Arun Kumar M',
      status: 'COMPLETED',
      progressPercent: 100,
      preApprovedBy: 'staff-hod-civil',
      preApprovedByName: 'Dr. Arun Kumar M',
      preApprovedRole: 'HOD',
      preApprovedAt: '2026-10-10T09:00:00Z',
      preApprovalRemarks: 'Approved for institutional representation.',
      actualParticipationDetails: 'Successfully tested concrete cubes and presented compressive stress graphs.',
      actualAttendanceMarked: true,
      prizeWon: true,
      prizeCategory: '1st Prize (Gold Trophy)',
      achievementDescription: 'Awarded First Place out of 34 national engineering teams with a cash prize of Rs. 25,000.',
      winnerCertUrl: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=600&auto=format&fit=crop&q=80',
      participationCertUrl: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=600&auto=format&fit=crop&q=80',
      completedAt: '2026-10-20T11:45:00Z',
      completedBy: 'staff-hod-civil',
      completedByName: 'Dr. Arun Kumar M',
      createdAt: '2026-10-08T11:00:00Z',
      updatedAt: '2026-10-20T11:45:00Z',
    },
    {
      id: 'app-2026-003',
      applicationNumber: 'SIG-2026-0003',
      studentId: 'std-927624bcs008',
      studentRegNo: '927624BCS008',
      studentName: 'Aravind Swaminathan',
      department: 'Computer Science & Engineering',
      academicYear: 'III Year',
      section: 'III Year A Section',
      eventName: 'Cloud Native & GenAI Summit 2026',
      eventCategory: 'Symposium',
      organizerName: 'Google Cloud Developer Group',
      institutionName: 'Bengaluru Tech Park',
      eventLocation: 'Bengaluru, Karnataka',
      startDate: '2026-11-28',
      endDate: '2026-11-29',
      eventMode: 'HYBRID' as any,
      eventDescription: 'Paper presentation on LLM distillation on resource-constrained microcontrollers.',
      participationType: 'TEAM',
      teamId: 'team-2026-001',
      teamName: 'NeuralCoders',
      facultyCoordinator: 'Prof. Ramesh K',
      status: 'UNDER_REVIEW',
      progressPercent: 0,
      createdAt: '2026-11-04T08:15:00Z',
      updatedAt: '2026-11-04T08:15:00Z',
    },
  ];
}

// ------------------------------------------------------------------------------
// Applications Service
// ------------------------------------------------------------------------------
export function getAllApplications(): EventApplication[] {
  try {
    const raw = localStorage.getItem(APPLICATIONS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Error reading applications:', e);
  }
  const initial = getInitialApplications();
  localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(initial));
  return initial;
}

export function saveAllApplications(apps: EventApplication[]): void {
  localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(apps));
}

export function getApplicationsForStudent(studentRegNo: string): EventApplication[] {
  const norm = studentRegNo.toUpperCase().trim();
  const all = getAllApplications();
  return all.filter(a => a.studentRegNo.toUpperCase().trim() === norm);
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

  const newApp: EventApplication = {
    ...data,
    id: `app_${Date.now()}`,
    applicationNumber,
    status: isDraft ? 'DRAFT' : 'SUBMITTED',
    progressPercent: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  all.unshift(newApp);
  saveAllApplications(all);

  // Create audit log
  createApprovalLog({
    applicationId: newApp.id,
    applicationNumber: newApp.applicationNumber,
    action: 'SUBMITTED',
    performedByUid: newApp.studentId,
    performedByName: newApp.studentName,
    performedByRole: 'STUDENT',
    remarks: isDraft ? 'Application saved as draft' : 'New event application submitted for verification',
  });

  return newApp;
}

export function updateApplication(
  id: string,
  updates: Partial<EventApplication>
): EventApplication {
  const all = getAllApplications();
  const idx = all.findIndex(a => a.id === id);
  if (idx === -1) throw new Error('Application not found');

  const updated: EventApplication = {
    ...all[idx],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  all[idx] = updated;
  saveAllApplications(all);
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

  const updated = updateApplication(applicationId, {
    ...data,
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
  try {
    const raw = localStorage.getItem(TEAMS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Error reading teams:', e);
  }
  const defaultTeam: Team = {
    id: 'team-2026-001',
    teamName: 'NeuralCoders',
    eventApplicationId: 'app-2026-003',
    leaderStudentId: 'std-927624bcs008',
    leaderRegNo: '927624BCS008',
    leaderName: 'Aravind Swaminathan',
    leaderUid: 'uid_927624BCS008',
    maxMembers: 4,
    members: [
      {
        studentId: 'std-927624bcs008',
        registrationNumber: '927624BCS008',
        fullName: 'Aravind Swaminathan',
        department: 'Computer Science & Engineering',
        academicYear: 'III Year',
        section: 'III Year A Section',
        roleInTeam: 'LEADER',
        confirmationStatus: 'CONFIRMED',
        confirmedAt: '2026-11-04T08:15:00Z',
        invitedAt: '2026-11-04T08:15:00Z',
      },
      {
        studentId: 'std-927624bec014',
        registrationNumber: '927624BEC014',
        fullName: 'Ananya S',
        department: 'Electronics & Communication',
        academicYear: 'III Year',
        section: 'III Year V Section',
        roleInTeam: 'MEMBER',
        confirmationStatus: 'PENDING_CONFIRMATION',
        invitedAt: '2026-11-04T08:15:00Z',
      },
    ],
    createdAt: '2026-11-04T08:15:00Z',
    updatedAt: '2026-11-04T08:15:00Z',
  };
  localStorage.setItem(TEAMS_KEY, JSON.stringify([defaultTeam]));
  return [defaultTeam];
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
    return notif;
  } catch (e) {
    console.warn('Failed to save notification:', e);
    return {} as AppNotification;
  }
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

