import React, { useState } from 'react';
import {
  Trophy,
  Award,
  ArrowRight,
  ShieldCheck,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  Calendar,
  Users,
  Compass,
  FileCheck,
  ChevronRight,
  Menu,
  X,
  ExternalLink,
  Layers,
  Cpu,
} from 'lucide-react';
import { getAllApplications } from '../../services/firebase/firestoreService';
import { getLocalStudents } from '../../services/firebase/authService';

interface LandingPageProps {
  onGoToLogin: () => void;
  onOpenRegister: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onGoToLogin,
  onOpenRegister,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const applications = getAllApplications();
  const students = getLocalStudents();

  // Filter winners for the live Hall of Fame preview
  const recentWinners = applications
    .filter((a) => a.prizeWon || (a.status === 'COMPLETED' && a.winnerCertUrl))
    .slice(0, 4);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* 1. TOP ANNOUNCEMENT TICKER */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-900 text-white text-[11px] font-bold py-2 px-4 text-center border-b border-white/10 flex items-center justify-center gap-2">
        <Sparkles size={13} className="text-amber-300 animate-pulse" />
        <span>M. Kumarasamy College of Engineering (Autonomous), Karur • Department of Electronics and Communication Engineering</span>
        <span className="hidden sm:inline">• Official III Year ECE Event Gateway</span>
      </div>

      {/* 2. NAVIGATION BAR WITH THREE LOGO SLOTS */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Logo Group */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Slot 1: College Logo */}
            <div
              className="flex items-center gap-2 p-1.5 rounded-2xl bg-white/5 border border-white/10 hover:border-blue-500/40 transition-colors"
              title="M. Kumarasamy College of Engineering, Karur"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center font-black text-white text-xs shadow-md shrink-0">
                MKCE
              </div>
              <div className="hidden lg:block text-left pr-1">
                <span className="block text-[11px] font-black tracking-tight text-white leading-tight">
                  M. KUMARASAMY
                </span>
                <span className="block text-[9px] font-semibold text-blue-300 uppercase tracking-widest leading-none">
                  College of Engineering
                </span>
              </div>
            </div>

            {/* Divider */}
            <span className="hidden sm:block text-slate-700">/</span>

            {/* Slot 2: Department Logo */}
            <div
              className="flex items-center gap-2 p-1.5 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/40 transition-colors"
              title="Department of Electronics and Communication Engineering"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center font-black text-white text-xs shadow-md shrink-0">
                <Cpu size={18} />
              </div>
              <div className="hidden xl:block text-left pr-1">
                <span className="block text-[11px] font-black tracking-tight text-white leading-tight">
                  DEPARTMENT OF ECE
                </span>
                <span className="block text-[9px] font-semibold text-purple-300 uppercase tracking-wider leading-none">
                  Electronics & Comm.
                </span>
              </div>
            </div>

            {/* Divider */}
            <span className="hidden md:block text-slate-700">/</span>

            {/* Slot 3: Platform Logo (SIGNOVANTA) */}
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center font-black text-white text-lg shadow-md shrink-0">
                S
              </div>
              <div>
                <span className="font-black text-base tracking-tight text-white block leading-none">
                  SIGNOVANTA
                </span>
                <span className="text-[10px] text-emerald-400 font-bold tracking-wider">
                  v2.0
                </span>
              </div>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-slate-300">
            <a href="#overview" className="hover:text-white transition-colors">Overview</a>
            <a href="#cohort" className="hover:text-white transition-colors">III Year Cohort</a>
            <a href="#workflow" className="hover:text-white transition-colors">Workflow</a>
            <a href="#hall-of-fame" className="hover:text-white transition-colors">Hall of Fame</a>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={onOpenRegister}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-xl transition-all cursor-pointer"
            >
              <span>Register</span>
            </button>

            <button
              type="button"
              onClick={onGoToLogin}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-black bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
            >
              <span>Sign In</span>
              <ArrowRight size={14} />
            </button>

            {/* Mobile Hamburger */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-400 hover:text-white bg-slate-800 rounded-xl cursor-pointer"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden pt-4 pb-2 border-t border-slate-800 mt-3 space-y-2 text-xs font-bold">
            <a
              href="#overview"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-slate-300 hover:bg-slate-800 rounded-lg"
            >
              Overview
            </a>
            <a
              href="#cohort"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-slate-300 hover:bg-slate-800 rounded-lg"
            >
              III Year Cohort (ECE A, B, C, D)
            </a>
            <a
              href="#workflow"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-slate-300 hover:bg-slate-800 rounded-lg"
            >
              Approval Workflow
            </a>
            <a
              href="#hall-of-fame"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-slate-300 hover:bg-slate-800 rounded-lg"
            >
              Hall of Fame & Winners
            </a>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenRegister();
              }}
              className="w-full text-left px-3 py-2 text-purple-400 hover:bg-slate-800 rounded-lg"
            >
              Submit Registration Request
            </button>
          </div>
        )}
      </header>

      {/* 3. HERO SECTION */}
      <section id="overview" className="relative py-16 sm:py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Ambient Gradient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-blue-600/20 via-purple-600/20 to-pink-600/20 blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center space-y-6 relative z-10">
          {/* Institutional Badge */}
          <div className="inline-flex flex-wrap items-center justify-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-700 text-slate-300 text-xs font-semibold shadow-inner">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-bold text-white">M. Kumarasamy College of Engineering</span>
            <span className="text-slate-500">•</span>
            <span className="text-blue-400">Department of ECE</span>
            <span className="text-slate-500">•</span>
            <span className="text-purple-400 font-bold">III Year Academic Cohort</span>
          </div>

          {/* Main Title */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight sm:leading-none">
            Every Event. Every Approval.{' '}
            <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
              One Unified Platform.
            </span>
          </h1>

          {/* Minimal Subtitle */}
          <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-400 font-medium leading-relaxed">
            The institutional event participation, multi-tier pre-approval, and certificate verification gateway designed exclusively for the <strong className="text-white">3rd Year ECE</strong> cohort at M. Kumarasamy College of Engineering, Karur.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
            <button
              type="button"
              onClick={onGoToLogin}
              className="w-full sm:w-auto px-7 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-sm rounded-2xl shadow-xl shadow-blue-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Access Student / Staff Portal</span>
              <ArrowRight size={16} />
            </button>

            <button
              type="button"
              onClick={onOpenRegister}
              className="w-full sm:w-auto px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold text-sm border border-slate-700 rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles size={16} className="text-amber-400" />
              <span>New Registration Request</span>
            </button>
          </div>
        </div>
      </section>

      {/* 4. REAL-TIME COHORT METRICS BAR */}
      <section id="cohort" className="py-8 bg-slate-900/60 border-y border-slate-800 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 text-center">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800/80">
            <span className="text-2xl sm:text-3xl font-black text-white block">{students.length || 253}</span>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1 block">
              3rd Year ECE Students
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800/80">
            <span className="text-2xl sm:text-3xl font-black text-blue-400 block">4 Sections</span>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1 block">
              ECE A, ECE B, ECE C, ECE D
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800/80">
            <span className="text-2xl sm:text-3xl font-black text-amber-400 block">50% & 100%</span>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1 block">
              Two-Tier Verified Milestones
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800/80">
            <span className="text-2xl sm:text-3xl font-black text-emerald-400 block">
              {applications.filter(a => a.prizeWon).length}+
            </span>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1 block">
              Trophies & Prizes Won
            </span>
          </div>
        </div>
      </section>

      {/* 5. 3-STEP APPROVAL WORKFLOW */}
      <section id="workflow" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-10">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">
            Streamlined Academic Governance
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            How SIGNOVANTA Verification Works
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
            From initial event application to faculty pre-approval and trophy verification.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-3 relative">
            <div className="w-12 h-12 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-black text-lg border border-blue-500/30">
              01
            </div>
            <h3 className="text-base font-bold text-white">Pre-Event Submission</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Students submit upcoming Hackathons, Symposiums, or Expos along with event brochure, dates, and coordinator selection.
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-3 relative">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-black text-lg border border-indigo-500/30">
              02
            </div>
            <h3 className="text-base font-bold text-white">50% Faculty Pre-Approval</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Faculty / HOD reviews the objective and grants official pre-approval, granting 50% milestone authorization to represent the college.
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-3 relative">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center font-black text-lg border border-emerald-500/30">
              03
            </div>
            <h3 className="text-base font-bold text-white">100% Certificate Verification</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Upload participation and winner certificates. Faculty validates and records trophy achievements in the institutional Hall of Fame.
            </p>
          </div>
        </div>
      </section>

      {/* 6. HALL OF FAME PREVIEW */}
      <section id="hall-of-fame" className="py-16 bg-slate-900/40 border-t border-slate-800 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                <Trophy size={14} />
                <span>III Year ECE Achievements</span>
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
                Recent Winners & Trophies
              </h2>
            </div>
            <button
              type="button"
              onClick={onGoToLogin}
              className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              <span>Sign in to view full directory</span>
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {recentWinners.map((app) => (
              <div
                key={app.id}
                className="bg-slate-900 border border-slate-800 hover:border-amber-500/40 p-4 rounded-2xl space-y-3 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-blue-400 bg-blue-950/80 px-2 py-0.5 rounded border border-blue-800">
                    {app.studentRegNo}
                  </span>
                  <span className="text-[10px] font-bold text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800">
                    🏆 {app.prizeCategory || 'Won'}
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white truncate">{app.studentName}</h4>
                  <p className="text-[11px] text-slate-400">{app.section}</p>
                </div>
                <div className="pt-2 border-t border-slate-800 text-xs">
                  <span className="text-slate-300 font-medium block truncate">{app.eventName}</span>
                  <span className="text-[11px] text-slate-500 truncate block">{app.institutionName}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. FOOTER WITH CREATOR ATTRIBUTION (Boomika) */}
      <footer className="mt-auto bg-slate-950 border-t border-slate-800 py-10 px-4 sm:px-6 lg:px-8 text-xs text-slate-400">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="space-y-1.5">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <span className="font-black text-white text-sm tracking-tight">M. KUMARASAMY COLLEGE OF ENGINEERING</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-900/60 text-blue-300 border border-blue-800 font-bold">Autonomous</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Department of Electronics and Communication Engineering (ECE) • Thalavapalayam, Karur - 639 113.
            </p>
            <p className="text-[11px] text-slate-500">
              SIGNOVANTA Platform • Dedicated to 3rd Year ECE Cohort (Sections A, B, C, D)
            </p>
          </div>

          {/* Prominent Creator Attribution */}
          <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800 text-center md:text-right space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
              Platform Architecture & Design
            </span>
            <p className="text-xs font-black text-slate-200">
              Crafted with Pride by <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 font-extrabold text-sm">Boomika</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
