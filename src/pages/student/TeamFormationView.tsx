import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Team, TeamMember, Student } from '../../types';
import {
  getAllTeams,
  createTeam,
  respondToTeamInvitation,
  getAllApplications,
} from '../../services/firebase/firestoreService';
import { getLocalStudents } from '../../services/firebase/authService';
import { Button } from '../../components/common/Button';
import {
  Users,
  UserPlus,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Shield,
  AlertCircle,
  Trash2,
} from 'lucide-react';

export const TeamFormationView: React.FC = () => {
  const { currentUser, studentData } = useAuth();
  const allStudents = getLocalStudents();
  const [teams, setTeams] = useState<Team[]>(() => getAllTeams());
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New Team Form States
  const [newTeamName, setNewTeamName] = useState('');
  const [maxMembers, setMaxMembers] = useState(5);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<Student[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  if (!currentUser || !studentData) return null;

  const currentRegNo = studentData.registrationNumber.toUpperCase().trim();

  // Filter students for search dropdown (excluding self and already selected)
  const searchResults = allStudents.filter((s) => {
    const norm = s.registrationNumber.toUpperCase().trim();
    if (norm === currentRegNo) return false;
    if (selectedMembers.some(m => m.registrationNumber.toUpperCase().trim() === norm)) return false;

    const q = memberSearchQuery.toUpperCase().trim();
    if (!q) return false;
    return s.fullName.toUpperCase().includes(q) || norm.includes(q);
  });

  const handleAddMember = (student: Student) => {
    if (selectedMembers.length + 1 >= maxMembers) {
      alert(`Maximum team size of ${maxMembers} reached.`);
      return;
    }
    setSelectedMembers([...selectedMembers, student]);
    setMemberSearchQuery('');
  };

  const handleRemoveSelected = (regNo: string) => {
    setSelectedMembers(selectedMembers.filter(m => m.registrationNumber !== regNo));
  };

  const handleCreateTeamSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!newTeamName.trim()) {
      setFormError('Team Name is required.');
      return;
    }

    const now = new Date().toISOString();

    // Leader is auto-confirmed
    const leaderMember: TeamMember = {
      studentId: studentData.id,
      registrationNumber: studentData.registrationNumber,
      fullName: studentData.fullName,
      department: studentData.department,
      academicYear: studentData.academicYear,
      section: studentData.section,
      roleInTeam: 'LEADER',
      confirmationStatus: 'CONFIRMED',
      confirmedAt: now,
      invitedAt: now,
    };

    // Invited members start as PENDING_CONFIRMATION
    const invitedMembers: TeamMember[] = selectedMembers.map((s) => ({
      studentId: s.id,
      registrationNumber: s.registrationNumber,
      fullName: s.fullName,
      department: s.department,
      academicYear: s.academicYear,
      section: s.section,
      roleInTeam: 'MEMBER',
      confirmationStatus: 'PENDING_CONFIRMATION',
      invitedAt: now,
    }));

    try {
      const created = createTeam({
        teamName: newTeamName.trim(),
        eventApplicationId: `app_${Date.now()}`,
        leaderStudentId: studentData.id,
        leaderRegNo: studentData.registrationNumber,
        leaderName: studentData.fullName,
        leaderUid: currentUser.uid,
        maxMembers,
        members: [leaderMember, ...invitedMembers],
      });

      setTeams(getAllTeams());
      setShowCreateModal(false);
      setNewTeamName('');
      setSelectedMembers([]);
    } catch (err: any) {
      setFormError(err.message || 'Failed to create team.');
    }
  };

  const handleResponse = (teamId: string, accept: boolean) => {
    try {
      respondToTeamInvitation(teamId, studentData.registrationNumber, accept);
      setTeams(getAllTeams());
    } catch (err: any) {
      alert(err.message || 'Failed to update invitation status.');
    }
  };

  // Find teams where user is leader or invited member
  const myTeams = teams.filter((t) =>
    t.members.some(m => m.registrationNumber.toUpperCase().trim() === currentRegNo)
  );

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Collaborative Team Management</h1>
          <p className="text-xs text-slate-500">
            Create squads, invite students across sections, and confirm participation individually
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => setShowCreateModal(true)}
          leftIcon={<UserPlus size={16} />}
        >
          Form New Team
        </Button>
      </div>

      {/* Invitations / Team List */}
      <div className="space-y-4">
        {myTeams.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center text-slate-400">
            <Users size={32} className="mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-bold text-slate-700">No Active Team Memberships</p>
            <p className="text-xs text-slate-500 mt-1">
              You are not currently part of any event team. Click "Form New Team" to lead a squad.
            </p>
          </div>
        ) : (
          myTeams.map((team) => {
            const isLeader = team.leaderRegNo.toUpperCase().trim() === currentRegNo;
            const myMembership = team.members.find(
              m => m.registrationNumber.toUpperCase().trim() === currentRegNo
            );

            return (
              <div
                key={team.id}
                className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4"
              >
                {/* Team Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200">
                        {team.teamName}
                      </span>
                      <span className="text-xs text-slate-400">
                        • {team.members.length} / {team.maxMembers} Members
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Team Leader: <strong className="text-slate-800">{team.leaderName}</strong> ({team.leaderRegNo})
                    </p>
                  </div>

                  {/* If user has pending invite */}
                  {myMembership && myMembership.confirmationStatus === 'PENDING_CONFIRMATION' && (
                    <div className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded-2xl">
                      <span className="text-xs font-bold text-amber-900">Your Invitation:</span>
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => handleResponse(team.id, true)}
                        leftIcon={<CheckCircle2 size={14} />}
                      >
                        Accept
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResponse(team.id, false)}
                        leftIcon={<XCircle size={14} />}
                      >
                        Decline
                      </Button>
                    </div>
                  )}
                </div>

                {/* Team Members Confirmation Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
                        <th className="py-2 px-3">Member & Reg No</th>
                        <th className="py-2 px-3">Academic Section</th>
                        <th className="py-2 px-3">Role</th>
                        <th className="py-2 px-3">Confirmation Status</th>
                        <th className="py-2 px-3 text-right">Confirmed At</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {team.members.map((member) => (
                        <tr key={member.registrationNumber} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <span className="font-bold text-slate-900 block">{member.fullName}</span>
                            <span className="font-mono text-[11px] text-blue-700">
                              {member.registrationNumber}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap text-slate-600">
                            {member.section}
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            {member.roleInTeam === 'LEADER' ? (
                              <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                                LEADER
                              </span>
                            ) : (
                              <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                                MEMBER
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            {member.confirmationStatus === 'CONFIRMED' && (
                              <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                                <CheckCircle2 size={12} /> Confirmed
                              </span>
                            )}
                            {member.confirmationStatus === 'PENDING_CONFIRMATION' && (
                              <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                                <Clock size={12} /> Pending Acceptance
                              </span>
                            )}
                            {member.confirmationStatus === 'REJECTED' && (
                              <span className="inline-flex items-center gap-1 font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-200">
                                <XCircle size={12} /> Declined
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap text-right text-slate-400">
                            {member.confirmedAt
                              ? new Date(member.confirmedAt).toLocaleDateString()
                              : 'Waiting'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Form New Team Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Form New Event Team</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateTeamSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Team Name</label>
                <input
                  type="text"
                  required
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="e.g. Apex Engineers"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Maximum Team Size
                </label>
                <select
                  value={maxMembers}
                  onChange={(e) => setMaxMembers(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-medium"
                >
                  <option value={3}>3 Members</option>
                  <option value={4}>4 Members</option>
                  <option value={5}>5 Members</option>
                  <option value={6}>6 Members</option>
                </select>
              </div>

              {/* Search & Add Members */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  Search & Invite Members (By Name or Reg No)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={memberSearchQuery}
                    onChange={(e) => setMemberSearchQuery(e.target.value)}
                    placeholder="Type name (e.g. Ananya) or reg no (927624BEC...)"
                    className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                  <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
                </div>

                {/* Search Results Dropdown */}
                {searchResults.length > 0 && (
                  <div className="bg-white border border-slate-200 rounded-2xl shadow-lg max-h-40 overflow-y-auto divide-y divide-slate-100">
                    {searchResults.map((std) => (
                      <div
                        key={std.id}
                        onClick={() => handleAddMember(std)}
                        className="p-2.5 hover:bg-blue-50/60 cursor-pointer flex items-center justify-between transition-colors"
                      >
                        <div>
                          <span className="text-xs font-bold text-slate-900 block">{std.fullName}</span>
                          <span className="text-[11px] font-mono text-blue-700">
                            {std.registrationNumber} • {std.section}
                          </span>
                        </div>
                        <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200">
                          + Add
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected Invited Members Chips */}
              {selectedMembers.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Invited Members ({selectedMembers.length + 1} / {maxMembers})
                  </span>
                  <div className="space-y-1">
                    {/* Leader chip */}
                    <div className="flex items-center justify-between p-2 bg-purple-50 border border-purple-200 rounded-xl text-xs">
                      <span className="font-bold text-purple-900">
                        {studentData.fullName} (You - Team Leader)
                      </span>
                      <span className="text-[10px] font-bold text-purple-700 uppercase">Leader</span>
                    </div>
                    {/* Invited chips */}
                    {selectedMembers.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                      >
                        <div>
                          <span className="font-bold text-slate-800">{m.fullName}</span>
                          <span className="text-[11px] font-mono text-slate-500 ml-2">
                            ({m.registrationNumber})
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveSelected(m.registrationNumber)}
                          className="text-rose-500 hover:text-rose-700 p-1"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  Create Squad & Send Invites
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

