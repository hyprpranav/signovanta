// ==============================================================================
// SIGNOVANTA - Complete TypeScript Type Definitions V2.0
// ==============================================================================

export type UserRole = 'STUDENT' | 'STAFF' | 'HOD' | 'AHOD' | 'MASTER_ADMIN';

export type AccountStatus = 'NOT_ACTIVATED' | 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';

export type PresenceStatus = 'ONLINE' | 'OFFLINE' | 'NOT_ACTIVATED' | 'SUSPENDED';

export type ApplicationStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'CORRECTION_REQUIRED'
  | 'REJECTED'
  | 'PRE_APPROVED'
  | 'AWAITING_POST_EVENT'
  | 'CERTIFICATE_SUBMITTED'
  | 'FINAL_VERIFICATION'
  | 'COMPLETED';

export type EventMode = 'ONLINE' | 'OFFLINE';

export type ParticipationType = 'INDIVIDUAL' | 'TEAM';

export type MemberConfirmationStatus =
  | 'INVITATION_SENT'
  | 'PENDING_CONFIRMATION'
  | 'CONFIRMED'
  | 'REJECTED'
  | 'REMOVED';

// ------------------------------------------------------------------------------
// User & Auth
// ------------------------------------------------------------------------------
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  registrationNumber?: string;
  studentId?: string;
  staffId?: string;
  department?: string;
  designation?: string;
  academicYear?: string;
  section?: string;
  profilePhotoUrl?: string;
  status: AccountStatus;
  isFirstLogin: boolean;
  hasSetPassword: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

// ------------------------------------------------------------------------------
// Student Entity
// ------------------------------------------------------------------------------
export interface Student {
  id: string;
  registrationNumber: string; // Stored in UPPERCASE without whitespace, e.g., 927624BEC066
  fullName: string;
  email: string;
  mobile: string;
  department: string;
  academicYear: string; // e.g., "III Year"
  section: string;      // e.g., "III Year V Section", "III Year A Section", "III Year C Section"
  profilePhotoUrl?: string;
  profilePhotoPublicId?: string;
  status: AccountStatus;
  isActivated: boolean;
  hasSetPassword: boolean;
  uid?: string;
  createdAt: string;
  lastLoginAt?: string;
  eventCount: number;
}

// ------------------------------------------------------------------------------
// Staff Entity & Signup Request
// ------------------------------------------------------------------------------
export interface Staff {
  id: string;
  staffId: string;
  fullName: string;
  email: string;
  mobile: string;
  department: string;
  designation: string;
  requestedRole: 'STAFF' | 'HOD' | 'AHOD';
  assignedRole: 'STAFF' | 'HOD' | 'AHOD';
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  supportingInfo?: string;
  isSuspended: boolean;
  uid?: string;
  createdAt: string;
  approvedAt?: string;
  approvedBy?: string;
}

// ------------------------------------------------------------------------------
// Event Application Entity
// ------------------------------------------------------------------------------
export interface EventApplication {
  id: string;
  applicationNumber: string; // e.g., "SIG-2026-0012"
  studentId: string;
  studentRegNo: string;
  studentName: string;
  department: string;
  academicYear: string;
  section: string;
  
  // Pre-Event Submission Details
  eventName: string;
  eventCategory: string;
  organizerName: string;
  institutionName: string;
  eventLocation: string;
  startDate: string;
  endDate: string;
  eventMode: EventMode;
  eventWebsite?: string;
  registrationLink?: string;
  eventDescription: string;
  participationType: ParticipationType;
  teamId?: string;
  teamName?: string;
  facultyCoordinator: string;
  brochureUrl?: string;
  brochurePublicId?: string;
  supportingDocUrls?: string[];
  
  // Workflow & Status Tracking
  status: ApplicationStatus;
  progressPercent: number; // 0 (Draft/Submitted), 50 (Pre-Approved), 100 (Completed)
  
  // Approvals & Reviews
  preApprovedBy?: string;
  preApprovedByName?: string;
  preApprovedRole?: string;
  preApprovedAt?: string;
  preApprovalRemarks?: string;
  correctionRemarks?: string;
  rejectionRemarks?: string;
  
  // Post-Event Verification Details
  actualParticipationDetails?: string;
  actualAttendanceMarked?: boolean;
  prizeWon?: boolean;
  prizeCategory?: string;
  achievementDescription?: string;
  participationCertUrl?: string;
  winnerCertUrl?: string;
  eventPhotoUrls?: string[];
  postEventSubmittedAt?: string;
  completedAt?: string;
  completedBy?: string;
  completedByName?: string;
  
  createdAt: string;
  updatedAt: string;
}

// ------------------------------------------------------------------------------
// Team & Team Memberships
// ------------------------------------------------------------------------------
export interface TeamMember {
  studentId: string;
  registrationNumber: string;
  fullName: string;
  department: string;
  academicYear: string;
  section: string;
  roleInTeam: 'LEADER' | 'MEMBER';
  confirmationStatus: MemberConfirmationStatus;
  confirmedAt?: string;
  invitedAt: string;
}

export interface Team {
  id: string;
  teamName: string;
  eventApplicationId: string;
  leaderStudentId: string;
  leaderRegNo: string;
  leaderName: string;
  leaderUid: string;
  maxMembers: number;
  members: TeamMember[];
  createdAt: string;
  updatedAt: string;
}

// ------------------------------------------------------------------------------
// Approvals & Audit Trail
// ------------------------------------------------------------------------------
export interface ApprovalLog {
  id: string;
  applicationId: string;
  applicationNumber: string;
  action:
    | 'SUBMITTED'
    | 'PRE_APPROVED'
    | 'CORRECTION_REQUESTED'
    | 'REJECTED'
    | 'CERTIFICATES_UPLOADED'
    | 'COMPLETED';
  performedByUid: string;
  performedByName: string;
  performedByRole: UserRole;
  remarks?: string;
  timestamp: string;
}

// ------------------------------------------------------------------------------
// Real-Time Presence
// ------------------------------------------------------------------------------
export interface RealTimePresence {
  uid: string;
  registrationNumber?: string;
  fullName: string;
  role: UserRole;
  isOnline: boolean;
  lastSeenAt: number;
  lastLoginAt: number;
  connectionId?: string;
}

// ------------------------------------------------------------------------------
// Notifications
// ------------------------------------------------------------------------------
export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ALERT';
  isRead: boolean;
  linkUrl?: string;
  createdAt: string;
}

// ------------------------------------------------------------------------------
// Event Categories Catalogue
// ------------------------------------------------------------------------------
export interface EventCategory {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
}

// ------------------------------------------------------------------------------
// Academic Sections Catalogue
// ------------------------------------------------------------------------------
export interface AcademicSection {
  id: string;
  year: string;    // e.g. "III Year"
  section: string; // e.g. "V Section", "A Section", "C Section"
  department: string;
}

