import { ref, onValue, set, onDisconnect, serverTimestamp, Database } from 'firebase/database';
import { rtdb } from './firebaseConfig';
import { Student, PresenceStatus, UserRole } from '../../types';

export interface PresenceData {
  uid: string;
  registrationNumber?: string;
  fullName: string;
  role: UserRole;
  isOnline: boolean;
  lastSeenAt: number;
  lastLoginAt: number;
}

// Memory cache for presence when running locally or during disconnection
let localPresenceStore: Record<string, PresenceData> = {};
const presenceListeners: Set<(map: Record<string, PresenceData>) => void> = new Set();

function broadcastLocalPresence() {
  const snapshot = { ...localPresenceStore };
  presenceListeners.forEach(listener => listener(snapshot));
}

let heartbeatInterval: NodeJS.Timeout | null = null;

/**
 * Initializes and binds the user's presence state using Firebase Realtime Database
 * with onDisconnect triggers and client heartbeat.
 */
export function setupUserPresence(
  uid: string,
  registrationNumber: string | undefined,
  fullName: string,
  role: UserRole,
  isActivated: boolean
): () => void {
  const normRegNo = registrationNumber ? registrationNumber.toUpperCase().trim() : undefined;
  const now = Date.now();

  // 1. Setup local store entry
  const presenceRecord: PresenceData = {
    uid,
    registrationNumber: normRegNo,
    fullName,
    role,
    isOnline: true,
    lastSeenAt: now,
    lastLoginAt: now,
  };
  localPresenceStore[uid] = presenceRecord;
  if (normRegNo) {
    localPresenceStore[normRegNo] = presenceRecord;
  }
  broadcastLocalPresence();

  // 2. Setup Firebase RTDB presence if available
  if (rtdb) {
    try {
      const connectedRef = ref(rtdb, '.info/connected');
      const userPresenceRef = ref(rtdb, `presence/${uid}`);
      const connectionId = `conn_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const myConnectionRef = ref(rtdb, `presence/${uid}/connections/${connectionId}`);

      const unsubscribeConnected = onValue(connectedRef, (snap) => {
        if (snap.val() === true) {
          // Register connection and configure onDisconnect
          set(myConnectionRef, true);
          onDisconnect(myConnectionRef).remove();

          // On disconnect, mark offline and record last seen
          onDisconnect(userPresenceRef).update({
            isOnline: false,
            lastSeenAt: serverTimestamp(),
          });

          // Set active presence
          set(userPresenceRef, {
            uid,
            registrationNumber: normRegNo || '',
            fullName,
            role,
            isOnline: true,
            lastLoginAt: serverTimestamp(),
            lastSeenAt: serverTimestamp(),
          });
        }
      });

      // Heartbeat every 25 seconds
      heartbeatInterval = setInterval(() => {
        try {
          if (rtdb) {
            set(ref(rtdb, `presence/${uid}/lastSeenAt`), serverTimestamp());
          }
          if (localPresenceStore[uid]) {
            localPresenceStore[uid].lastSeenAt = Date.now();
          }
        } catch (e) {
          console.warn('[Presence] Heartbeat error:', e);
        }
      }, 25000);

      // Cleanup function on logout or unmount
      return () => {
        if (heartbeatInterval) clearInterval(heartbeatInterval);
        unsubscribeConnected();
        try {
          set(ref(rtdb, `presence/${uid}/isOnline`), false);
          set(ref(rtdb, `presence/${uid}/lastSeenAt`), serverTimestamp());
        } catch {
          // Ignore tear down errors
        }
        if (localPresenceStore[uid]) {
          localPresenceStore[uid].isOnline = false;
          localPresenceStore[uid].lastSeenAt = Date.now();
          broadcastLocalPresence();
        }
      };
    } catch (err) {
      console.warn('[Presence] RTDB setup error:', err);
    }
  }

  // Fallback cleanup
  return () => {
    if (heartbeatInterval) clearInterval(heartbeatInterval);
    if (localPresenceStore[uid]) {
      localPresenceStore[uid].isOnline = false;
      localPresenceStore[uid].lastSeenAt = Date.now();
      broadcastLocalPresence();
    }
  };
}

/**
 * Subscribes to real-time presence changes across all users.
 */
export function subscribeToAllPresence(
  callback: (presenceMap: Record<string, PresenceData>) => void
): () => void {
  presenceListeners.add(callback);
  // Send current cached state immediately
  callback({ ...localPresenceStore });

  let unsubscribeRtdb: (() => void) | null = null;

  if (rtdb) {
    try {
      const presenceRef = ref(rtdb, 'presence');
      unsubscribeRtdb = onValue(presenceRef, (snapshot) => {
        const val = snapshot.val();
        if (val && typeof val === 'object') {
          const map: Record<string, PresenceData> = { ...localPresenceStore };
          const STALE_THRESHOLD_MS = 90 * 1000; // 90 seconds
          const now = Date.now();

          Object.keys(val).forEach((key) => {
            const item = val[key];
            if (item && typeof item === 'object') {
              const lastSeen = Number(item.lastSeenAt) || 0;
              // Detect stale session if last seen is older than threshold
              const isStale = (now - lastSeen) > STALE_THRESHOLD_MS;
              const onlineStatus = item.isOnline === true && !isStale;

              const data: PresenceData = {
                uid: item.uid || key,
                registrationNumber: item.registrationNumber ? item.registrationNumber.toUpperCase().trim() : undefined,
                fullName: item.fullName || 'Student',
                role: item.role || 'STUDENT',
                isOnline: onlineStatus,
                lastSeenAt: lastSeen,
                lastLoginAt: Number(item.lastLoginAt) || lastSeen,
              };

              map[key] = data;
              if (data.registrationNumber) {
                map[data.registrationNumber] = data;
              }
            }
          });
          localPresenceStore = map;
          callback(map);
        }
      });
    } catch (err) {
      console.warn('[Presence] Subscribe error:', err);
    }
  }

  return () => {
    presenceListeners.delete(callback);
    if (unsubscribeRtdb) {
      unsubscribeRtdb();
    }
  };
}

/**
 * Computes exact presence status according to Section 5 requirements:
 * 1. SUSPENDED (Red Dot): Admin suspended account
 * 2. NOT_ACTIVATED (Yellow Dot): Never completed first login
 * 3. ONLINE (Green Dot): Active authenticated session
 * 4. OFFLINE (Grey Dot): Account is activated, but not currently online
 */
export function getStudentPresenceStatus(
  student: Student,
  presenceMap: Record<string, PresenceData>
): PresenceStatus {
  if (student.status === 'SUSPENDED') {
    return 'SUSPENDED';
  }
  if (!student.isActivated || student.status === 'NOT_ACTIVATED') {
    return 'NOT_ACTIVATED';
  }

  const normRegNo = student.registrationNumber.toUpperCase().trim();
  const presenceByUid = student.uid ? presenceMap[student.uid] : null;
  const presenceByReg = presenceMap[normRegNo];

  if ((presenceByUid && presenceByUid.isOnline) || (presenceByReg && presenceByReg.isOnline)) {
    return 'ONLINE';
  }

  return 'OFFLINE';
}

/**
 * Calculates summary metrics for real-time dashboard display:
 * Total Students, Online, Offline, Not Activated, Suspended
 */
export function calculatePresenceSummary(
  students: Student[],
  presenceMap: Record<string, PresenceData>
) {
  let online = 0;
  let offline = 0;
  let notActivated = 0;
  let suspended = 0;

  students.forEach((student) => {
    const status = getStudentPresenceStatus(student, presenceMap);
    if (status === 'ONLINE') online++;
    else if (status === 'OFFLINE') offline++;
    else if (status === 'NOT_ACTIVATED') notActivated++;
    else if (status === 'SUSPENDED') suspended++;
  });

  return {
    total: students.length,
    online,
    offline,
    notActivated,
    suspended,
  };
}

