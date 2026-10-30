import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { CHALLENGE_SCENARIOS, ChallengeScenario } from './src/utils/verificationLogic';
import {
  INITIAL_STUDENT_SCORES,
  INITIAL_CROWDSOURCED_REPORTS,
  StudentScoreEntry,
  CrowdsourcedReport,
  normalizeStudentScoreEntry,
} from './src/utils/storageService';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SERPER_API_KEY = '3f025a5c0bca7e27ec6d12be8a3d2a74e9c49a5b';
const GEMINI_MODEL = 'gemini-2.5-flash';
const DEFAULT_ROOM_CODE = 'HARFEST2026';
const ROOM_STORE_FILE = path.join(__dirname, '.room-sync-store.json');

interface ServerRoomState {
  roomCode: string;
  submissions: StudentScoreEntry[];
  customScenarios: ChallengeScenario[];
  communityReports: CrowdsourcedReport[];
  updatedAt: string;
}

const roomMemoryStore = new Map<string, ServerRoomState>();

function createDefaultRoomState(roomCode: string): ServerRoomState {
  return {
    roomCode,
    submissions: INITIAL_STUDENT_SCORES.map((s, idx) => normalizeStudentScoreEntry(s, idx)),
    customScenarios: [...CHALLENGE_SCENARIOS],
    communityReports: [...INITIAL_CROWDSOURCED_REPORTS],
    updatedAt: new Date().toISOString(),
  };
}

function loadRoomsFromDisk(): void {
  try {
    if (fs.existsSync(ROOM_STORE_FILE)) {
      const raw = fs.readFileSync(ROOM_STORE_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        for (const [key, val] of Object.entries(parsed)) {
          const roomVal = val as Partial<ServerRoomState>;
          roomMemoryStore.set(key.toUpperCase(), {
            roomCode: key.toUpperCase(),
            submissions: Array.isArray(roomVal.submissions)
              ? roomVal.submissions.map((s, i) => normalizeStudentScoreEntry(s, i))
              : [...INITIAL_STUDENT_SCORES],
            customScenarios:
              Array.isArray(roomVal.customScenarios) && roomVal.customScenarios.length > 0
                ? roomVal.customScenarios
                : [...CHALLENGE_SCENARIOS],
            communityReports: Array.isArray(roomVal.communityReports)
              ? roomVal.communityReports
              : [...INITIAL_CROWDSOURCED_REPORTS],
            updatedAt: roomVal.updatedAt || new Date().toISOString(),
          });
        }
      }
    }
  } catch {
    // ignore read errors and start fresh
  }
  if (!roomMemoryStore.has(DEFAULT_ROOM_CODE)) {
    roomMemoryStore.set(DEFAULT_ROOM_CODE, createDefaultRoomState(DEFAULT_ROOM_CODE));
    persistRoomsToDisk();
  }
}

function persistRoomsToDisk(): void {
  try {
    const obj: Record<string, ServerRoomState> = {};
    for (const [key, val] of roomMemoryStore.entries()) {
      obj[key] = val;
    }
    fs.writeFileSync(ROOM_STORE_FILE, JSON.stringify(obj, null, 2), 'utf-8');
  } catch {
    // ignore write errors in read-only environments
  }
}

function getOrInitRoom(rawCode?: string): ServerRoomState {
  const roomCode = (rawCode || DEFAULT_ROOM_CODE).trim().toUpperCase() || DEFAULT_ROOM_CODE;
  let room = roomMemoryStore.get(roomCode);
  if (!room) {
    room = createDefaultRoomState(roomCode);
    roomMemoryStore.set(roomCode, room);
    persistRoomsToDisk();
  }
  return room;
}

function upsertRoomSubmission(
  prevScores: StudentScoreEntry[],
  newEntry: StudentScoreEntry
): StudentScoreEntry[] {
  const safePrev = Array.isArray(prevScores)
    ? prevScores.map((item, i) => normalizeStudentScoreEntry(item, i))
    : [];
  const normalizedNew = normalizeStudentScoreEntry(newEntry, 0);
  const cleanName = (normalizedNew.studentName || '').trim().toLowerCase();
  const cleanNim = (normalizedNew.studentNim || '').trim().toLowerCase();
  const baseScenarioTitle = (normalizedNew.scenarioTitle || 'Audit Mandiri Output AI')
    .replace(/\s*\(Percobaan\s*#\d+\)\s*$/i, '')
    .trim();

  const existingIndex = safePrev.findIndex((item) => {
    const itemBaseTitle = (item?.scenarioTitle || '')
      .replace(/\s*\(Percobaan\s*#\d+\)\s*$/i, '')
      .trim()
      .toLowerCase();
    const sameStudent =
      (item?.studentNim || '').trim().toLowerCase() === cleanNim ||
      (item?.studentName || '').trim().toLowerCase() === cleanName;
    return sameStudent && itemBaseTitle === baseScenarioTitle.toLowerCase();
  });

  if (existingIndex === -1) {
    const firstAttemptEntry: StudentScoreEntry = {
      ...normalizedNew,
      attemptCount: normalizedNew.attemptCount || 1,
      scenarioTitle: `${baseScenarioTitle} (Percobaan #${normalizedNew.attemptCount || 1})`,
    };
    return [firstAttemptEntry, ...safePrev];
  }

  const existing = safePrev[existingIndex];
  const nextAttemptCount = Math.max(
    (existing?.attemptCount || 1) + 1,
    normalizedNew.attemptCount || 1
  );
  const updatedEntry: StudentScoreEntry = {
    ...normalizedNew,
    attemptCount: nextAttemptCount,
    scenarioTitle: `${baseScenarioTitle} (Percobaan #${nextAttemptCount})`,
  };

  const remaining = safePrev.filter((_, idx) => idx !== existingIndex);
  return [updatedEntry, ...remaining];
}

loadRoomsFromDisk();

function getGenAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
    return null;
  }
  return new GoogleGenAI({ apiKey });
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '2mb' }));

  // ============================================================================
  // MULTI-DEVICE ROOM SYNC ENDPOINTS (Spec 1a: /api/room/:roomCode)
  // ============================================================================
  app.get('/api/room/:roomCode', (req, res) => {
    const room = getOrInitRoom(req.params.roomCode);
    return res.json(room);
  });

  app.post('/api/room/:roomCode/submission', (req, res) => {
    const room = getOrInitRoom(req.params.roomCode);
    const incoming = req.body?.submission || req.body;
    if (!incoming || typeof incoming !== 'object') {
      return res.status(400).json({ error: 'Invalid submission payload' });
    }
    room.submissions = upsertRoomSubmission(room.submissions, incoming as StudentScoreEntry);
    room.updatedAt = new Date().toISOString();
    persistRoomsToDisk();
    return res.json(room);
  });

  app.post('/api/room/:roomCode/scenario', (req, res) => {
    const room = getOrInitRoom(req.params.roomCode);
    const incoming = (req.body?.scenario || req.body) as ChallengeScenario | undefined;
    if (!incoming || !incoming.title) {
      return res.status(400).json({ error: 'Invalid scenario payload' });
    }
    const existingIdx = room.customScenarios.findIndex(
      (s) => s.id === incoming.id || s.title.toLowerCase() === incoming.title.toLowerCase()
    );
    if (existingIdx === -1) {
      room.customScenarios = [incoming, ...room.customScenarios];
    } else {
      room.customScenarios = room.customScenarios.map((s, idx) =>
        idx === existingIdx ? incoming : s
      );
    }
    room.updatedAt = new Date().toISOString();
    persistRoomsToDisk();
    return res.json(room);
  });

  app.post('/api/room/:roomCode/report', (req, res) => {
    const room = getOrInitRoom(req.params.roomCode);
    const incoming = (req.body?.report || req.body) as CrowdsourcedReport | undefined;
    if (!incoming || !incoming.id) {
      return res.status(400).json({ error: 'Invalid report payload' });
    }
    const existingIdx = room.communityReports.findIndex((r) => r.id === incoming.id);
    if (existingIdx === -1) {
      room.communityReports = [incoming, ...room.communityReports];
    } else {
      room.communityReports = room.communityReports.map((r, idx) =>
        idx === existingIdx ? { ...r, ...incoming } : r
      );
    }
    room.updatedAt = new Date().toISOString();
    persistRoomsToDisk();
    return res.json(room);
  });

  app.post('/api/room/:roomCode/reset', (req, res) => {
    const room = getOrInitRoom(req.params.roomCode);
    const mode = req.body?.mode === 'clear' ? 'clear' : 'default';
    if (mode === 'clear') {
      room.submissions = [];
    } else {
      room.submissions = INITIAL_STUDENT_SCORES.map((s, idx) => normalizeStudentScoreEntry(s, idx));
    }
    room.updatedAt = new Date().toISOString();
    persistRoomsToDisk();
    return res.json(room);
  });

  // 0. Endpoint: Server-side Serper.dev Search Proxy
  app.post('/api/serper/search', async (req, res) => {
    const { q, gl = 'id', hl = 'id' } = req.body as {
      q?: string;
      gl?: string;
      hl?: string;
    };
    if (!q) {
      return res.json({ organic: [], fallback: true });
    }
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const response = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: {
          'X-API-KEY': SERPER_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ q, gl, hl, num: 10 }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        return res.json({ organic: [], fallback: true });
      }
      const data = await response.json();
      return res.json({
        organic: Array.isArray(data?.organic) ? data.organic : [],
        fallback: false,
      });
    } catch {
      return res.json({ organic: [], fallback: true });
    }
  });

  // 1. Endpoint: Synthesize Academic Summary from 6 Serper References
  app.post('/api/gemini/synthesize', async (req, res) => {
    try {
      const { query, references } = req.body as {
        query?: string;
        references?: Array<{ id: number; title: string; snippet: string; domain: string }>;
      };

      const ai = getGenAIClient();
      if (!ai || !query || !Array.isArray(references) || references.length === 0) {
        return res.json({ synthesis: null, fallback: true });
      }

      const refContext = references
        .slice(0, 6)
        .map(
          (r, idx) =>
            `[${idx + 1}] Judul: ${r.title}\nDomain: ${r.domain}\nKutipan Bukti: ${r.snippet}`
        )
        .join('\n\n');

      const prompt = `Anda adalah asisten riset akademik AI Literacy Lab (Verification-First Model).
Tugas Anda: Berdasarkan 6 referensi ilmiah berikut, tuliskan rangkuman sintesis akademik yang utuh, kohesif, dan mendalam untuk menjawab topik: "${query}".

DAFTAR REFERENSI:
${refContext}

ATURAN WAJIB:
1. Tulis minimal 2 paragraf yang mengalir secara akademik dalam Bahasa Indonesia yang baku dan jelas (pisahkan paragraf dengan baris kosong \\n\\n).
2. JANGAN PERNAH menggunakan tanda elipsis ("...") atau memotong kalimat di tengah jalan. Setiap kalimat harus utuh dan selesai.
3. Wajib menyertakan sitasi inline bernomor seperti [1], [2], [3], [4], [5], [6] yang merujuk pada daftar referensi di atas.
4. Sajikan angka statistik, korelasi, dan konteks metodologi secara proporsional sesuai isi bukti tanpa melakukan over-claim.`;

      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
      });

      const text = response.text?.trim() || '';
      return res.json({ synthesis: text || null, fallback: !text });
    } catch {
      return res.json({ synthesis: null, fallback: true });
    }
  });

  // 2. Endpoint: Controlled Hallucination Injection for Audit Practice Mode
  app.post('/api/gemini/inject-hallucination', async (req, res) => {
    try {
      const { cleanSynthesis, query, targetVerdict = 'PARTIALLY SUPPORTED' } = req.body as {
        cleanSynthesis?: string;
        query?: string;
        targetVerdict?: 'PARTIALLY SUPPORTED' | 'UNSUPPORTED';
      };

      const ai = getGenAIClient();
      if (!ai || !cleanSynthesis) {
        return res.json({ result: null, fallback: true });
      }

      const prompt = `Anda adalah Instruktur Penguji di AI Literacy Lab.
Berikut adalah teks sintesis akademik yang akurat mengenai "${query || 'topik riset'}":
"""
${cleanSynthesis}
"""

Tugas Anda: Modifikasi teks di atas untuk "Mode Latihan Audit" dengan kunci jawaban Verdict = "${targetVerdict}".
- Jika "${targetVerdict}" adalah "PARTIALLY SUPPORTED": Biarkan paragraf pertama tetap akurat sesuai bukti [1][2][3], tetapi pelintir paragraf kedua secara halus dengan menyisipkan Over-Generalisasi ("100% populasi nasional"), Distorsi Statistik, dan 1 sitasi tambahan yang tidak ada di referensi asli.
- Jika "${targetVerdict}" adalah "UNSUPPORTED": Sisipkan klaim kausalitas palsu yang ekstrem serta sitasi jurnal fiktif (Ghost Citation) lengkap dengan nama profesor dan tahun fiktif.
- JANGAN gunakan tanda elipsis ("..."). Kembalikan dalam JSON.`;

      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              manipulatedText: { type: Type.STRING },
              calibrationHint: { type: Type.STRING },
            },
            required: ['manipulatedText', 'calibrationHint'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      return res.json({ result: parsed, fallback: false });
    } catch {
      return res.json({ result: null, fallback: true });
    }
  });

  // 3. Endpoint: Semantic Grading of Student Analytical Justification (Stage 4 V-Score)
  app.post('/api/gemini/grade-justification', async (req, res) => {
    try {
      const { justification, claimText, expectedVerdict, chosenVerdict } = req.body as {
        justification?: string;
        claimText?: string;
        expectedVerdict?: string;
        chosenVerdict?: string;
      };

      const ai = getGenAIClient();
      if (!ai || !justification || !claimText) {
        return res.json({ scoreOutOf25: null, feedback: null, fallback: true });
      }

      const prompt = `Anda adalah Penilai Otomatis (Semantic Grader) pada AI Literacy Lab.
Evaluasi kualitas argumen verifikasi mahasiswa berikut (Skor Maksimal: 25 Poin).

Klaim AI yang Diuji: "${claimText}"
Kunci Jawaban Verdict: ${expectedVerdict}
Verdict Pilihan Mahasiswa: ${chosenVerdict}
Argumen Tertulis Mahasiswa: "${justification}"

Aturan Penilaian (0 - 25 Poin):
- Berikan 0 poin jika argumen berupa huruf acak/gibberish (misal "asdasd", "qwerty"), spam pengulangan kata, atau sama sekali tidak nyambung.
- Berikan 10-17 poin jika argumen bermakna namun masih umum dan belum menyebutkan bukti spesifik/metodologi.
- Berikan 20-25 poin jika argumen secara logis mengkritisi statistik, sampel populasi, kausalitas, sitasi, atau merujuk pada bukti primer.`;

      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              scoreOutOf25: { type: Type.NUMBER },
              feedback: { type: Type.STRING },
            },
            required: ['scoreOutOf25', 'feedback'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      return res.json({
        scoreOutOf25: typeof parsed.scoreOutOf25 === 'number' ? parsed.scoreOutOf25 : null,
        feedback: parsed.feedback || null,
        fallback: false,
      });
    } catch {
      return res.json({ scoreOutOf25: null, feedback: null, fallback: true });
    }
  });

  // 4. Endpoint: Auto-Generate Hallucination Scenario for Mentor Portal
  app.post('/api/gemini/generate-scenario', async (req, res) => {
    try {
      const { topic, level } = req.body as { topic?: string; level?: string };
      const ai = getGenAIClient();
      if (!ai || !topic) {
        return res.json({ scenario: null, fallback: true });
      }

      const prompt = `Anda adalah Desainer Kurikulum AI Literacy Lab (Verification-First Model).
Buatlah 1 studi kasus soal uji verifikasi AI bertema: "${topic}" dengan tingkat kesulitan "${level || 'LEVEL: MENENGAH'}".
Kasus ini harus melatih mahasiswa mendeteksi patologi AI (Distorsi Statistik, Sitasi Fiktif / Ghost Citation, Kausalitas Palsu, atau Over-Generalisasi).
Pastikan teks aiOutputText terdiri dari 2-3 kalimat utuh tanpa elipsis ("..."), dan sediakan 6 referensi bukti pembanding.`;

      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              category: { type: Type.STRING },
              description: { type: Type.STRING },
              aiOutputText: { type: Type.STRING },
              searchQuery: { type: Type.STRING },
              expectedVerdict: {
                type: Type.STRING,
                enum: ['VERIFIED', 'PARTIALLY SUPPORTED', 'UNSUPPORTED'],
              },
              calibrationHint: { type: Type.STRING },
              references: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    snippet: { type: Type.STRING },
                    domain: { type: Type.STRING },
                  },
                  required: ['title', 'snippet', 'domain'],
                },
              },
            },
            required: [
              'title',
              'category',
              'description',
              'aiOutputText',
              'searchQuery',
              'expectedVerdict',
              'calibrationHint',
              'references',
            ],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      return res.json({ scenario: parsed, fallback: false });
    } catch {
      return res.json({ scenario: null, fallback: true });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*all', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AI Literacy Lab Server running on http://localhost:${PORT}`);
  });
}

startServer();
