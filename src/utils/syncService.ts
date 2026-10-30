import { ChallengeScenario } from './verificationLogic';
import {
  StudentScoreEntry,
  CrowdsourcedReport,
  normalizeStudentScoreEntry,
} from './storageService';

export const DEFAULT_ROOM_CODE = 'HARFEST2026';

export interface RoomSyncPayload {
  roomCode: string;
  submissions: StudentScoreEntry[];
  customScenarios: ChallengeScenario[];
  communityReports: CrowdsourcedReport[];
  updatedAt: string;
}

export async function fetchRoomState(
  roomCode: string = DEFAULT_ROOM_CODE
): Promise<RoomSyncPayload | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`/api/room/${encodeURIComponent(roomCode)}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || typeof data !== 'object') return null;

    return {
      roomCode: data.roomCode || roomCode,
      submissions: Array.isArray(data.submissions)
        ? data.submissions.map((item: Partial<StudentScoreEntry>, i: number) =>
            normalizeStudentScoreEntry(item, i)
          )
        : [],
      customScenarios: Array.isArray(data.customScenarios) ? data.customScenarios : [],
      communityReports: Array.isArray(data.communityReports) ? data.communityReports : [],
      updatedAt: data.updatedAt || new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export async function pushSubmissionToRoom(
  entry: StudentScoreEntry,
  roomCode: string = DEFAULT_ROOM_CODE
): Promise<RoomSyncPayload | null> {
  try {
    const res = await fetch(`/api/room/${encodeURIComponent(roomCode)}/submission`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ submission: normalizeStudentScoreEntry(entry, 0) }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      roomCode: data.roomCode || roomCode,
      submissions: Array.isArray(data.submissions)
        ? data.submissions.map((item: Partial<StudentScoreEntry>, i: number) =>
            normalizeStudentScoreEntry(item, i)
          )
        : [],
      customScenarios: Array.isArray(data.customScenarios) ? data.customScenarios : [],
      communityReports: Array.isArray(data.communityReports) ? data.communityReports : [],
      updatedAt: data.updatedAt || new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export async function pushScenarioToRoom(
  scenario: ChallengeScenario,
  roomCode: string = DEFAULT_ROOM_CODE
): Promise<RoomSyncPayload | null> {
  try {
    const res = await fetch(`/api/room/${encodeURIComponent(roomCode)}/scenario`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      roomCode: data.roomCode || roomCode,
      submissions: Array.isArray(data.submissions)
        ? data.submissions.map((item: Partial<StudentScoreEntry>, i: number) =>
            normalizeStudentScoreEntry(item, i)
          )
        : [],
      customScenarios: Array.isArray(data.customScenarios) ? data.customScenarios : [],
      communityReports: Array.isArray(data.communityReports) ? data.communityReports : [],
      updatedAt: data.updatedAt || new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export async function pushReportToRoom(
  report: CrowdsourcedReport,
  roomCode: string = DEFAULT_ROOM_CODE
): Promise<RoomSyncPayload | null> {
  try {
    const res = await fetch(`/api/room/${encodeURIComponent(roomCode)}/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ report }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      roomCode: data.roomCode || roomCode,
      submissions: Array.isArray(data.submissions)
        ? data.submissions.map((item: Partial<StudentScoreEntry>, i: number) =>
            normalizeStudentScoreEntry(item, i)
          )
        : [],
      customScenarios: Array.isArray(data.customScenarios) ? data.customScenarios : [],
      communityReports: Array.isArray(data.communityReports) ? data.communityReports : [],
      updatedAt: data.updatedAt || new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export async function resetRoomStateOnServer(
  mode: 'default' | 'clear',
  roomCode: string = DEFAULT_ROOM_CODE
): Promise<RoomSyncPayload | null> {
  try {
    const res = await fetch(`/api/room/${encodeURIComponent(roomCode)}/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      roomCode: data.roomCode || roomCode,
      submissions: Array.isArray(data.submissions)
        ? data.submissions.map((item: Partial<StudentScoreEntry>, i: number) =>
            normalizeStudentScoreEntry(item, i)
          )
        : [],
      customScenarios: Array.isArray(data.customScenarios) ? data.customScenarios : [],
      communityReports: Array.isArray(data.communityReports) ? data.communityReports : [],
      updatedAt: data.updatedAt || new Date().toISOString(),
    };
  } catch {
    return null;
  }
}
