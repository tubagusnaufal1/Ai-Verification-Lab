import React, { useState } from 'react';
import { StudentIdentity } from '../utils/storageService';
import {
  GraduationCap,
  Crown,
  ShieldCheck,
  UserCheck,
  KeyRound,
  ArrowRight,
  Lock,
} from 'lucide-react';

interface InitialLoginGateProps {
  defaultStudentIdentity: StudentIdentity;
  onLoginStudent: (identity: StudentIdentity) => void;
  onLoginMentor: () => void;
}

export const InitialLoginGate: React.FC<InitialLoginGateProps> = ({
  defaultStudentIdentity,
  onLoginStudent,
  onLoginMentor,
}) => {
  const [studentName, setStudentName] = useState(defaultStudentIdentity.name || '');
  const [studentNim, setStudentNim] = useState(defaultStudentIdentity.nim || '');
  const [studentError, setStudentError] = useState('');

  const [mentorUsername, setMentorUsername] = useState('');
  const [mentorPassword, setMentorPassword] = useState('');
  const [mentorError, setMentorError] = useState('');

  const handleStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = studentName.trim();
    const cleanNim = studentNim.trim();
    if (!cleanName || !cleanNim) {
      setStudentError('Mohon isi Nama Lengkap dan NIM / Institusi terlebih dahulu.');
      return;
    }
    setStudentError('');
    onLoginStudent({ name: cleanName, nim: cleanNim });
  };

  const handleStartStudentDemo = () => {
    const demoIdentity: StudentIdentity = {
      name: 'Budi Santoso',
      nim: '2401018821 · Kelas Sains & Teknologi A',
    };
    setStudentName(demoIdentity.name);
    setStudentNim(demoIdentity.nim);
    setStudentError('');
    onLoginStudent(demoIdentity);
  };

  const handleMentorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      mentorUsername.trim().toLowerCase() === 'mentor' &&
      mentorPassword.trim() === 'harfest2026'
    ) {
      setMentorError('');
      onLoginMentor();
    } else {
      setMentorError(
        'Kredensial tidak sesuai. Gunakan username "mentor" dan password "harfest2026".'
      );
    }
  };

  const handleAutoFillMentor = () => {
    setMentorUsername('mentor');
    setMentorPassword('harfest2026');
    setMentorError('');
    onLoginMentor();
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col justify-between px-4 sm:px-6 lg:px-8 py-10 selection:bg-blue-600 selection:text-white">
      {/* Top Academic Header */}
      <header className="max-w-6xl w-full mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center text-white font-extrabold text-sm tracking-wider shadow-sm">
            LAB
          </div>
          <div>
            <div className="text-base sm:text-lg font-extrabold tracking-tight text-white">
              AI LITERACY LAB
            </div>
            <div className="text-xs text-slate-400">
              Verification-First Model · Asta Cita Nusantara Poin 4
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
          <span>Strict Role-Based Authentication · Calm Academic Design</span>
        </div>
      </header>

      {/* Center Role Gate Content */}
      <main className="max-w-6xl w-full mx-auto my-auto py-10 space-y-10">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="text-xs font-semibold tracking-widest uppercase text-blue-400">
            Gerbang Autentikasi Laboratorium Epistemik
          </div>
          <h1
            className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight"
            style={{ textWrap: 'balance' }}
          >
            Pilih Peran Akses Sesi Verifikasi Anda
          </h1>
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed font-editorial">
            Sistem memisahkan hak akses secara mutlak (100% terpisah) antara ruang belajar &amp;
            meja audit Peserta (Mahasiswa) dengan dashboard kendali soal serta diagnostik nilai
            kelas Penguji (Mentor / Dosen).
          </p>
        </div>

        {/* Two Role Option Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          {/* KOTAK OPSI 1: PESERTA (MAHASISWA) */}
          <section
            aria-labelledby="login-student-heading"
            className="bg-[#0b1120] border border-slate-800 hover:border-blue-500/40 rounded-2xl p-6 sm:p-8 flex flex-col justify-between transition-colors space-y-6"
          >
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-800/80">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-blue-950/80 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-blue-400">
                      Kartu Pilihan 01 · Role: STUDENT
                    </div>
                    <h2
                      id="login-student-heading"
                      className="text-xl sm:text-2xl font-extrabold text-white tracking-tight"
                    >
                      Masuk sebagai Peserta (Mahasiswa)
                    </h2>
                  </div>
                </div>
                <span className="text-xs font-mono text-slate-400">3 Menu Peserta</span>
              </div>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Akses ke <strong className="text-white">Beranda &amp; Asta Cita</strong>,{' '}
                <strong className="text-blue-300">Tanya AI &amp; Lab Audit Side-by-Side</strong> (6
                sumber Serper.dev + Sintesis Akademik + Sertifikat PDF A4), serta{' '}
                <strong className="text-emerald-300">Challenge &amp; Riwayat Saya</strong>.
              </p>

              <form id="student-login-form" onSubmit={handleStudentSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="gate-student-name"
                    className="block text-xs font-semibold text-slate-300 mb-1.5"
                  >
                    Nama Lengkap Peserta
                  </label>
                  <input
                    id="gate-student-name"
                    type="text"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="Contoh: Budi Santoso"
                    className="w-full bg-[#020617] border border-slate-700/90 focus:border-blue-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label
                    htmlFor="gate-student-nim"
                    className="block text-xs font-semibold text-slate-300 mb-1.5"
                  >
                    NIM / Institusi
                  </label>
                  <input
                    id="gate-student-nim"
                    type="text"
                    value={studentNim}
                    onChange={(e) => setStudentNim(e.target.value)}
                    placeholder="Contoh: 2401018821 · Kelas Sains & Teknologi A"
                    className="w-full bg-[#020617] border border-slate-700/90 focus:border-blue-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
                  />
                </div>

                {studentError && (
                  <div className="text-xs font-semibold text-red-300 bg-red-950/50 border border-red-500/40 rounded-xl px-3.5 py-2.5">
                    {studentError}
                  </div>
                )}

                <div className="pt-2 space-y-2.5">
                  <button
                    type="submit"
                    className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl py-3 px-4 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <span>Masuk sebagai Peserta</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={handleStartStudentDemo}
                    className="w-full inline-flex items-center justify-center gap-2 bg-[#0f172a] hover:bg-slate-800 border border-slate-700 text-emerald-300 hover:text-white font-bold text-xs sm:text-sm rounded-xl py-3 px-4 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Mulai Sesi Peserta Demo</span>
                  </button>
                </div>
              </form>
            </div>

            <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span>Privasi Peran: Akses Portal Mentor 100% Tersembunyi</span>
              <span className="font-mono text-blue-400">STUDENT MODE</span>
            </div>
          </section>

          {/* KOTAK OPSI 2: PENGUJI (MENTOR / DOSEN) */}
          <section
            aria-labelledby="login-mentor-heading"
            className="bg-[#0b1120] border border-slate-800 hover:border-amber-500/40 rounded-2xl p-6 sm:p-8 flex flex-col justify-between transition-colors space-y-6"
          >
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-800/80">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-amber-950/70 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                    <Crown className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-amber-400">
                      Kartu Pilihan 02 · Role: MENTOR
                    </div>
                    <h2
                      id="login-mentor-heading"
                      className="text-xl sm:text-2xl font-extrabold text-white tracking-tight"
                    >
                      Masuk sebagai Penguji (Mentor/Dosen)
                    </h2>
                  </div>
                </div>
                <span className="text-xs font-mono text-amber-400/90 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5" /> 3 Menu Penguji
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Langsung membuka <strong className="text-amber-300">Dashboard Mentor</strong>{' '}
                eksklusif: <strong className="text-white">1. Pembuat Soal (Scenario Builder)</strong>
                , <strong className="text-white">2. Rekap &amp; Diagnostik Nilai Kelas</strong>, dan{' '}
                <strong className="text-emerald-300">3. Moderasi Laporan Kasus</strong>.
              </p>

              <form id="mentor-login-form" onSubmit={handleMentorSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="gate-mentor-username"
                    className="block text-xs font-semibold text-slate-300 mb-1.5"
                  >
                    Username Penguji / Mentor
                  </label>
                  <input
                    id="gate-mentor-username"
                    type="text"
                    value={mentorUsername}
                    onChange={(e) => setMentorUsername(e.target.value)}
                    placeholder="Default: mentor"
                    className="w-full bg-[#020617] border border-slate-700/90 focus:border-amber-500 rounded-xl px-4 py-3 text-sm text-white font-mono placeholder-slate-500 focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label
                    htmlFor="gate-mentor-password"
                    className="block text-xs font-semibold text-slate-300 mb-1.5"
                  >
                    Password Rahasia
                  </label>
                  <input
                    id="gate-mentor-password"
                    type="password"
                    value={mentorPassword}
                    onChange={(e) => setMentorPassword(e.target.value)}
                    placeholder="Default: harfest2026"
                    className="w-full bg-[#020617] border border-slate-700/90 focus:border-amber-500 rounded-xl px-4 py-3 text-sm text-white font-mono placeholder-slate-500 focus:outline-none transition-colors"
                  />
                </div>

                <div className="bg-[#020617] border border-slate-800 rounded-xl px-3.5 py-2.5 flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span>Kredensial Default Penguji:</span>
                  <span className="text-amber-300">mentor / harfest2026</span>
                </div>

                {mentorError && (
                  <div className="text-xs font-semibold text-red-300 bg-red-950/50 border border-red-500/40 rounded-xl px-3.5 py-2.5">
                    {mentorError}
                  </div>
                )}

                <div className="pt-2 space-y-2.5">
                  <button
                    type="submit"
                    className="w-full inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm rounded-xl py-3 px-4 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <span>Masuk sebagai Penguji (Mentor)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={handleAutoFillMentor}
                    className="w-full inline-flex items-center justify-center gap-2 bg-[#0f172a] hover:bg-slate-800 border border-amber-500/40 text-amber-300 hover:text-white font-bold text-xs sm:text-sm rounded-xl py-3 px-4 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <KeyRound className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Auto-Fill Login Mentor (Juri)</span>
                  </button>
                </div>
              </form>
            </div>

            <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span>Zero Overlap · Tanpa Menu Ujian Peserta</span>
              <span className="font-mono text-amber-400">MENTOR MODE</span>
            </div>
          </section>
        </div>
      </main>

      {/* Quiet Academic Footer */}
      <footer className="max-w-6xl w-full mx-auto pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
        <div>AI Literacy Lab — Kerangka Pedagogis Verification-First</div>
        <div className="font-mono">Rubrik Evaluasi 4 × 25 Poin · Zero Overlap Architecture</div>
      </footer>
    </div>
  );
};
