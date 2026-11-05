import React, { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import {
  Flame,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Database,
  Radio,
  Copy,
  Check,
  AlertTriangle,
} from 'lucide-react';
import {
  saveFirebaseConfig,
  getSavedFirebaseConfig,
  clearSavedFirebaseConfig,
  FirebaseConfigOptions,
} from '../../services/firebase/firebaseConfig';
import {
  saveCloudinaryConfig,
  getSavedCloudinaryConfig,
  CloudinaryConfig,
} from '../../services/cloudinary/cloudinaryService';

interface FirebaseSetupGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FirebaseSetupGuideModal: React.FC<FirebaseSetupGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'guide' | 'connect'>('connect');
  const [copiedStep, setCopiedStep] = useState<number | null>(null);

  // Form states
  const savedFb = getSavedFirebaseConfig();
  const savedCld = getSavedCloudinaryConfig();

  const [apiKey, setApiKey] = useState(savedFb?.apiKey || '');
  const [authDomain, setAuthDomain] = useState(savedFb?.authDomain || '');
  const [databaseURL, setDatabaseURL] = useState(savedFb?.databaseURL || '');
  const [projectId, setProjectId] = useState(savedFb?.projectId || '');
  const [storageBucket, setStorageBucket] = useState(savedFb?.storageBucket || '');
  const [messagingSenderId, setMessagingSenderId] = useState(savedFb?.messagingSenderId || '');
  const [appId, setAppId] = useState(savedFb?.appId || '');

  const [cloudName, setCloudName] = useState(savedCld?.cloudName || '');
  const [uploadPreset, setUploadPreset] = useState(savedCld?.uploadPreset || 'signovanta_uploads');

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [testResult, setTestResult] = useState<{ status: 'idle' | 'testing' | 'success' | 'error'; message?: string }>({
    status: 'idle',
  });

  const handleCopy = (text: string, stepIndex: number) => {
    navigator.clipboard.writeText(text);
    setCopiedStep(stepIndex);
    setTimeout(() => setCopiedStep(null), 2000);
  };

  const handleSaveConfig = () => {
    if (!apiKey || !projectId) {
      alert('Please provide at least the Firebase API Key and Project ID.');
      return;
    }
    if (!cloudName.trim() || !uploadPreset.trim()) {
      alert('Please provide the Cloudinary Cloud Name and unsigned Upload Preset. Media uploads will not use local fallback storage.');
      return;
    }
    const fbConfig: FirebaseConfigOptions = {
      apiKey: apiKey.trim(),
      authDomain: authDomain.trim() || `${projectId.trim()}.firebaseapp.com`,
      databaseURL: databaseURL.trim() || `https://${projectId.trim()}-default-rtdb.firebaseio.com`,
      projectId: projectId.trim(),
      storageBucket: storageBucket.trim() || `${projectId.trim()}.firebasestorage.app`,
      messagingSenderId: messagingSenderId.trim(),
      appId: appId.trim(),
    };
    saveFirebaseConfig(fbConfig);

    const cldConfig: CloudinaryConfig = {
      cloudName: cloudName.trim(),
      uploadPreset: uploadPreset.trim(),
    };
    saveCloudinaryConfig(cldConfig);

    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      window.location.reload();
    }, 1200);
  };

  const handleClearConfig = () => {
    if (confirm('Clear custom credentials and return to Local Simulation Mode?')) {
      clearSavedFirebaseConfig();
      localStorage.removeItem('signovanta_cloudinary_config');
      window.location.reload();
    }
  };

  const STEPS = [
    {
      num: 1,
      title: 'Create Firebase Project',
      desc: 'Visit console.firebase.google.com and click "Add project". Name it "signovanta-college". Disable Google Analytics for now.',
      link: 'https://console.firebase.google.com/',
    },
    {
      num: 2,
      title: 'Register Web Application',
      desc: 'In the Firebase project overview, click the Web icon (</>). Name your app "SIGNOVANTA Web", check "Firebase Hosting", and click "Register app".',
    },
    {
      num: 3,
      title: 'Copy Firebase Configuration',
      desc: 'Copy the firebaseConfig object fields (apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId).',
    },
    {
      num: 4,
      title: 'Firebase SDK (Pre-Installed)',
      desc: 'The official Firebase SDK 10.14.1 is already installed in this project.',
      code: 'npm install firebase',
    },
    {
      num: 5,
      title: 'Enable Email/Password Authentication',
      desc: 'Go to Firebase Console -> Build -> Authentication -> Sign-in method -> Click Email/Password -> Enable -> Save.',
    },
    {
      num: 6,
      title: 'Create Cloud Firestore Database',
      desc: 'Go to Build -> Firestore Database -> Click "Create database" -> Select location (e.g. asia-south1 Mumbai) -> Start in Production mode.',
    },
    {
      num: 7,
      title: 'Create Firebase Realtime Database (For Presence)',
      desc: 'Go to Build -> Realtime Database -> Click "Create Database" -> Choose location -> Start in Locked mode. Copy the Database URL.',
    },
    {
      num: 8,
      title: 'Deploy Security Rules',
      desc: 'Rules files are already created in your workspace (firestore.rules and database.rules.json). Run CLI deploy command:',
      code: 'npx firebase-tools deploy --only firestore:rules,database',
    },
    {
      num: 9,
      title: 'Cloudinary Setup for Media Uploads',
      desc: 'Sign up for free at cloudinary.com. In Settings -> Upload -> Add upload preset -> Name it "signovanta_uploads" -> Set Signing mode to "Unsigned" -> Save.',
      link: 'https://cloudinary.com/',
    },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Firebase & Cloud Services Connection Center"
      subtitle="Interactive Step-by-Step Setup & Live Credential Gateway"
      maxWidth="2xl"
    >
      <div className="space-y-5">
        {/* Navigation Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('connect')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'connect'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Connect Credentials
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'guide'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            17-Step Walkthrough Guide
          </button>
        </div>

        {activeTab === 'connect' ? (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-xs text-blue-900 flex items-start gap-3">
              <Flame className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold mb-1">Dual-Mode Persistence Architecture Active</p>
                <p className="text-blue-700 leading-relaxed">
                  SIGNOVANTA runs immediately with authentic preloaded 3rd-year cohort data even before entering Firebase keys. To link your live Firebase & Cloudinary cloud instances, paste your configuration below.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                1. Firebase Web Configuration
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">apiKey</label>
                  <input
                    type="text"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">projectId</label>
                  <input
                    type="text"
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    placeholder="signovanta-app"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">authDomain</label>
                  <input
                    type="text"
                    value={authDomain}
                    onChange={(e) => setAuthDomain(e.target.value)}
                    placeholder="signovanta-app.firebaseapp.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    databaseURL (Realtime Database for Presence)
                  </label>
                  <input
                    type="text"
                    value={databaseURL}
                    onChange={(e) => setDatabaseURL(e.target.value)}
                    placeholder="https://signovanta-app-default-rtdb.firebaseio.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">storageBucket</label>
                  <input
                    type="text"
                    value={storageBucket}
                    onChange={(e) => setStorageBucket(e.target.value)}
                    placeholder="signovanta-app.firebasestorage.app"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">appId</label>
                  <input
                    type="text"
                    value={appId}
                    onChange={(e) => setAppId(e.target.value)}
                    placeholder="1:123456789:web:abcdef"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                2. Cloudinary Media Storage Configuration
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Cloud Name</label>
                  <input
                    type="text"
                    value={cloudName}
                    onChange={(e) => setCloudName(e.target.value)}
                    placeholder="e.g. mycollegecdn"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Upload Preset</label>
                  <input
                    type="text"
                    value={uploadPreset}
                    onChange={(e) => setUploadPreset(e.target.value)}
                    placeholder="signovanta_uploads"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs"
                  />
                </div>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-500">
                In Cloudinary, create an <strong>unsigned</strong> upload preset and copy its exact name here.
                Uploads are now Cloudinary-only; if this configuration is missing or invalid, the app will show an error instead of storing files locally.
              </p>
            </div>

            {saveSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 size={16} /> Configuration saved! Reloading application...
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={handleClearConfig}
                className="text-xs text-rose-600 hover:underline font-semibold cursor-pointer"
              >
                Reset to Local Mode
              </button>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={onClose}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" onClick={handleSaveConfig}>
                  Save & Connect Services
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {STEPS.map((step) => (
              <div
                key={step.num}
                className="p-3.5 bg-slate-50 hover:bg-slate-100/70 border border-slate-200 rounded-2xl transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {step.num}
                    </span>
                    <div>
                      <h5 className="text-xs font-bold text-slate-900">{step.title}</h5>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">{step.desc}</p>
                      {step.code && (
                        <div className="mt-2 flex items-center justify-between bg-slate-900 text-slate-100 px-3 py-1.5 rounded-lg font-mono text-[11px]">
                          <span>{step.code}</span>
                          <button
                            onClick={() => handleCopy(step.code!, step.num)}
                            className="text-slate-400 hover:text-white p-1"
                          >
                            {copiedStep === step.num ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  {step.link && (
                    <a
                      href={step.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 p-1 shrink-0"
                    >
                      <ExternalLink size={16} />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
};
