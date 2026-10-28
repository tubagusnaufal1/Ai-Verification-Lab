import React, { useState } from 'react';
import { UserRole, StudentIdentity } from '../utils/storageService';
import { GraduationCap, Crown, Sparkles, X, ShieldCheck, KeyRound, UserCheck } from 'lucide-react';

interface RoleLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeRole: UserRole;
  studentIdentity: StudentIdentity;
  onSwitchToMahasiswa: (identity: StudentIdentity) => void;
  onSwitchToMentor: () => void;
}

export const RoleLoginModal: React.FC<RoleLoginModalProps> = ({
  isOpen,
  onClose,
  activeRole,
  studentIdentity,
  onSwitchToMahasiswa,
  onSwitchToMentor,
}) => {
  const [selectedTab, setSelectedTab] = useState<UserRole>(activeRole);
  const [studentName, setStudentName] = useState(studentIdentity.name);
  const [studentNim, setStudentNim] = useState(studentIdentity.nim);
  const [mentorUser, setMentorUser] = useState('');
  const [mentorPass, setMentorPass] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSaveMahasiswa = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = studentName.trim() || 'Budi Santoso';
    const cleanNim = studentNim.trim() || '2401018821 · Mahasiswa';
    onSwitchToMahasiswa({ name: cleanName, nim: cleanNim });
    onClose();
  };

  const handleDemoMahasiswa = () => {
    const demoIdentity = {
      name: 'Budi Santoso',
      nim: '2401018821 · Kelas Sains & Teknologi A',
    };
    setStudentName(demoIdentity.name);
    setStudentNim(demoIdentity.nim);
    onSwitchToMahasiswa(demoIdentity);
    onClose();
  };

  const handleLoginMentor = (e: React.FormEvent) => {
    e.preventDefault();
    if (mentorUser.trim().toLowerCase() === 'mentor' && mentorPass.trim() === 'harfest2026') {
      setErrorMsg('');
      onSwitchToMentor();
      onClose();
    } else {
      setErrorMsg('Kredensial belum tepat. Gunakan username "mentor" & sandi "harfest2026".');
    }
  };

  const handleJuryAutoFill = () => {
    setMentorUser('mentor');
    setMentorPass('harfest2026');
    setErrorMsg('');
    setTimeout(() => {
      onSwitchToMentor();
      onClose();
    }, 180);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md no-print"
      role="dialog"
      aria-modal="true"
      aria-labelledby="role-modal-title"
    >
      <div className="animate-modal-in w-full max-w-lg bg-[#0b1120] border border-slate-700/90 rounded-2xl shadow-[0_25px_70px_rgba(0,0,0,0.85)] overflow-hidden">
        {/* Top Header */}
        <div className="px-6 py-4 bg-[#0f172a] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-blue-400" />
            <h2 id="role-modal-title" className="text-base font-extrabold text-white tracking-wide">
              Manajemen Peran &amp; Privasi Akses (Strict Role Privacy)
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-2 p-2 bg-[#020617] border-b border-slate-800 gap-2">
          <button
            type="button"
            onClick={() => {
              setSelectedTab('mahasiswa');
              setErrorMsg('');
            }}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              selectedTab === 'mahasiswa'
                ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]'
                : 'bg-[#0f172a] text-slate-400 hover:text-white'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            Peserta (Mahasiswa)
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedTab('mentor');
              setErrorMsg('');
            }}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              selectedTab === 'mentor'
                ? 'bg-amber-500 text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.4)]'
                : 'bg-[#0f172a] text-amber-400/80 hover:text-amber-300'
            }`}
          >
            <Crown className="w-4 h-4" />
            Penguji (Mentor / Dosen)
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6">
          {selectedTab === 'mahasiswa' ? (
            <form onSubmit={handleSaveMahasiswa} className="space-y-4">
              <div className="bg-blue-950/30 border border-blue-500/30 rounded-xl p-3.5 text-xs text-slate-300 leading-relaxed">
                Mode <strong className="text-blue-400">Peserta (Mahasiswa)</strong> memberikan akses
                ke pembelajaran, ujian Challenge, Lapor Kasus, dan tab{' '}
                <strong className="text-emerald-400">Riwayat Audit Saya</strong>. Kunci jawaban dan
                rekap nilai kelas dikunci rapat untuk menjaga kejujuran akademik.
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Nama Lengkap Peserta
                </label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Contoh: Budi Santoso"
                  required
                  className="w-full bg-[#0f172a] border border-slate-700 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  NIM / Kelas / Asal Perguruan Tinggi
                </label>
                <input
                  type="text"
                  value={studentNim}
                  onChange={(e) => setStudentNim(e.target.value)}
                  placeholder="Contoh: 2401018821 · Kelas A"
                  required
                  className="w-full bg-[#0f172a] border border-slate-700 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={handleDemoMahasiswa}
                  className="w-full inline-flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 font-bold text-xs rounded-xl py-3 px-3 transition-all cursor-pointer"
                >
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                  Akun Mahasiswa Demo (1-Klik)
                </button>
                <button
                  type="submit"
                  className="w-full bg-[#2563eb] hover:bg-[#3b82f6] text-white font-bold text-xs rounded-xl py-3 px-3 shadow-[0_0_20px_rgba(37,99,235,0.35)] transition-all cursor-pointer"
                >
                  Simpan &amp; Masuk Mode Peserta
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleLoginMentor} className="space-y-4">
              {/* Jury-Friendly Credentials Box */}
              <div className="bg-amber-950/30 border border-amber-500/40 rounded-xl p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5" />
                    Akses Penguji / Dewan Juri
                  </span>
                  <span className="text-[11px] font-semibold text-amber-200/90 bg-amber-500/20 px-2 py-0.5 rounded">
                    Jury-Friendly Access
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Membuka Scenario Builder (Generator Token Soal Base64), Rekap Diagnostik Kognitif
                  Kelas, dan Moderasi Kasus:
                </p>
                <div className="flex flex-wrap items-center gap-3 text-xs font-mono bg-[#020617]/80 px-3 py-2 rounded-lg border border-amber-500/20 text-amber-300">
                  <span>
                    Username: <strong className="text-white">mentor</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Password: <strong className="text-white">harfest2026</strong>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleJuryAutoFill}
                  className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-extrabold text-xs rounded-lg py-2.5 px-3 shadow-[0_0_20px_rgba(245,158,11,0.35)] transition-all cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  Auto-Fill &amp; Masuk Mode Mentor (1-Klik Khusus Juri)
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Username Penguji / Mentor
                </label>
                <input
                  type="text"
                  value={mentorUser}
                  onChange={(e) => setMentorUser(e.target.value)}
                  placeholder="Ketik: mentor"
                  className="w-full bg-[#0f172a] border border-slate-700 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Kata Sandi Akses
                </label>
                <input
                  type="password"
                  value={mentorPass}
                  onChange={(e) => setMentorPass(e.target.value)}
                  placeholder="Ketik: harfest2026"
                  className="w-full bg-[#0f172a] border border-slate-700 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none"
                />
              </div>

              {errorMsg && (
                <div className="text-xs font-semibold text-red-400 bg-red-950/40 border border-red-500/40 rounded-lg px-3 py-2">
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-[#0f172a] hover:bg-slate-800 border border-amber-500/50 text-amber-300 font-bold text-sm rounded-xl py-3 transition-all cursor-pointer"
              >
                Verifikasi Kredensial &amp; Buka Dashboard Mentor
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
