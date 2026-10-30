import React, { useState } from 'react';
import { NavTabId } from './Navbar';
import { VSCORE_RUBRIC_100, AI_PATHOLOGY_TAXONOMY } from '../utils/verificationLogic';
import {
  ShieldCheck,
  Search,
  FileCheck2,
  Compass,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Layers,
  Award,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';

interface BerandaViewProps {
  onNavigate: (tab: NavTabId) => void;
  onDownloadStandaloneHtml: () => void;
}

const VERIFY_STAGES = [
  {
    code: 'Tahap 1 · Claim & Pathology',
    title: 'Claim & Pathology Audit',
    weight: '25 Poin',
    subtitle: 'Isolasi Klaim Faktual & Deteksi 7 Patologi AI',
    description:
      'Membedah paragraf fasih AI menjadi 3–4 unit klaim substantif, memeriksa peringatan Ghost Citation, serta memberikan vonis mikro (Sesuai Bukti / Distorsi / Halusinasi).',
    example:
      'Contoh: Mendeteksi klaim sitasi fiktif "(Prof. Zimmerman, 2025)" melalui pemindai Ghost Citation otomatis.',
    icon: Search,
  },
  {
    code: 'Tahap 2 · Source Verification',
    title: 'Source & Reference Matching',
    weight: '25 Poin',
    subtitle: 'Validasi 5–6 Bukti Primer & Rujukan Nomor Bukti',
    description:
      'Memeriksa minimal 3 sumber referensi aktual (Clean Scholar Filter) di kolom kanan dan mencocokkan nomor rujukan bukti (#1–#6) pada setiap unit klaim.',
    example:
      'Contoh: Menautkan Klaim #1 ke Bukti #1 (Laporan Registri IDAI 2023) dan menandai Klaim #2 sebagai Tidak Ada Bukti.',
    icon: ShieldCheck,
  },
  {
    code: 'Tahap 3 · Verdict Accuracy',
    title: 'Final Verdict Calibration',
    weight: '25 Poin',
    subtitle: 'Ketepatan Vonis Akhir Sesuai Kunci Bukti',
    description:
      'Menentukan vonis akhir secara presisi antara VERIFIED, PARTIALLY SUPPORTED, atau UNSUPPORTED (Tepat = 25 poin, Meleset 1 tingkat = 10 poin, Salah = 0 poin).',
    example:
      'Contoh: Memilih PARTIALLY SUPPORTED ketika data dasar benar namun kesimpulan kausalitasnya mengalami distorsi 100%.',
    icon: FileCheck2,
  },
  {
    code: 'Tahap 4 · Analytical Context',
    title: 'Context & Anti-Gibberish Justification',
    weight: '25 Poin',
    subtitle: 'Evaluasi Kualitas Argumen Tertulis & Anti-Spam',
    description:
      'Menyusun argumen analitis minimal 8 kata bermakna yang mengkritisi sampel, metodologi, dan bukti primer (dilindungi filter Anti-Gibberish & Anti-Basa-Basi).',
    example:
      'Contoh: Menjelaskan bahwa studi berskala lokal tidak sah digeneralisasi menjadi klaim mutlak 100% populasi nasional.',
    icon: Compass,
  },
];

const ASTA_CITA_PUBLIC_PILLARS = [
  {
    title: '1. Kedaulatan Epistemik & Ketahanan Informasi Pemuda',
    metric: 'Target: 88% Akurasi Deteksi Halusinasi',
    description:
      'Membekali generasi muda Indonesia dengan protokol verifikasi ilmiah berlapis (Claim, Source, Evidence, Context) agar tidak terjebak disinformasi maupun sitasi fiktif AI.',
  },
  {
    title: '2. Transformasi dari Konsumen Pasif (Knowing) ke Penguji Aktif (Doing)',
    metric: 'Rubrik Kuantitatif V-Score 4 × 25 Poin',
    description:
      'Mengubah pola interaksi mahasiswa dengan AI generatif dari sekadar menyalin jawaban menjadi audit bukti primer berbasis pangkalan data jurnal terindeks.',
  },
  {
    title: '3. Ekosistem Riset & Pendidikan Tinggi Berintegritas (Asta Cita Poin 4)',
    metric: 'Integrasi Kurikulum Nasional & Portal Mentor',
    description:
      'Menyediakan instrumen evaluasi terukur bagi dosen dan institusi pendidikan untuk memetakan kelemahan kognitif kelas dan mencetak talenta sains-teknologi unggul.',
  },
];

export const BerandaView: React.FC<BerandaViewProps> = ({
  onNavigate,
  onDownloadStandaloneHtml,
}) => {
  const [selectedStageIndex, setSelectedStageIndex] = useState<number>(0);
  const [simScores, setSimScores] = useState<Record<string, number>>({
    stage1ClaimAudit: 23,
    stage2SourceVerification: 22,
    stage3VerdictAccuracy: 25,
    stage4JustificationQuality: 22,
  });

  const totalSimScore = Object.values(simScores).reduce((acc, v) => acc + v, 0);

  return (
    <div className="animate-page-enter overflow-x-hidden space-y-10 sm:space-y-14 pb-20">
      {/* HERO SECTION */}
      <section className="relative pt-8 sm:pt-16 pb-4 sm:pb-6 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 -top-10 mx-auto h-72 w-full max-w-3xl bg-gradient-to-r from-blue-600/15 via-emerald-500/10 to-blue-600/15 blur-3xl -z-10"
        />

        <div className="inline-flex items-center justify-center bg-blue-950/40 border border-blue-500/30 rounded-full px-3.5 sm:px-4 py-1.5 mb-6 sm:mb-8 shadow-[0_0_20px_rgba(37,99,235,0.15)] max-w-full">
          <span className="text-[11px] sm:text-sm font-semibold text-[#60a5fa] tracking-wide">
            ✨ Inisiatif Asta Cita Nusantara Poin 4: Penguatan SDM, Sains &amp; Teknologi
          </span>
        </div>

        <h1 className="text-center font-extrabold text-2xl sm:text-4xl lg:text-5xl leading-tight tracking-tight max-w-4xl mx-auto">
          <span className="block text-white">Jangan hanya bertanya kepada AI.</span>
          <span className="block mt-1.5 bg-gradient-to-r from-[#3b82f6] to-[#10b981] bg-clip-text text-transparent">
            Uji kebenarannya secara ilmiah.
          </span>
        </h1>

        <p className="mt-4 sm:mt-6 text-center text-[#94a3b8] text-sm sm:text-base lg:text-lg leading-relaxed max-w-2xl mx-auto font-editorial">
          Kefasihan AI seringkali menutupi halusinasi dan referensi fiktif. Ubah pendekatan Anda
          dari sekadar pengguna pasif (<em className="italic text-slate-300">knowing</em>) menjadi
          penguji aktif yang berbasis bukti (<em className="italic text-slate-300">doing</em>).
        </p>

        <div className="mt-7 sm:mt-9 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={() => onNavigate('tanya-ai')}
            className="w-full sm:w-auto inline-flex items-center justify-center bg-[#2563eb] hover:bg-[#3b82f6] text-white font-bold text-sm sm:text-base rounded-xl px-6 sm:px-7 py-3.5 transition-all duration-200 cursor-pointer"
          >
            Buka Tanya AI &amp; Lab Audit
          </button>
          <button
            type="button"
            onClick={() => onNavigate('challenge-lab')}
            className="w-full sm:w-auto inline-flex items-center justify-center bg-[#0f172a] hover:bg-[#1e293b] border border-slate-700 text-white font-bold text-sm sm:text-base rounded-xl px-6 sm:px-7 py-3.5 transition-all duration-200 cursor-pointer"
          >
            Buka Challenge &amp; Riwayat V-Score
          </button>
        </div>
      </section>

      {/* PANEL INTERAKTIF: SIKLUS PEMBELAJARAN VERIFICATION-FIRST */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-10">
        <div className="bg-[#0b1120] border border-[#1e293b] rounded-2xl p-5 sm:p-8 shadow-xl">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-6 border-b border-slate-800/80">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-1">
                Arsitektur Pedagogis Nasional
              </div>
              <h2 className="text-xl sm:text-3xl font-extrabold text-white">
                Siklus Pembelajaran Verification-First
              </h2>
              <p className="text-sm sm:text-base text-slate-400 mt-1 max-w-3xl">
                Mengintegrasikan tiga pilar utama (<strong className="text-white">LEARN</strong>,{' '}
                <strong className="text-amber-400">CHALLENGE</strong>, dan{' '}
                <strong className="text-emerald-400">VERIFY 4-Tahap</strong>) untuk membangun
                ketahanan epistemik generasi muda Indonesia.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <button
                type="button"
                onClick={() => onNavigate('tanya-ai')}
                className="w-full sm:w-auto justify-center px-4 py-2.5 rounded-xl bg-blue-950/60 hover:bg-blue-900/60 border border-blue-500/40 text-blue-300 text-xs font-bold transition-all duration-300 cursor-pointer inline-flex items-center"
              >
                1. Eksplorasi Tanya AI →
              </button>
              <button
                type="button"
                onClick={() => onNavigate('challenge-lab')}
                className="w-full sm:w-auto justify-center px-4 py-2.5 rounded-xl bg-amber-950/50 hover:bg-amber-900/50 border border-amber-500/40 text-amber-300 text-xs font-bold transition-all duration-300 cursor-pointer inline-flex items-center"
              >
                2. Coba Challenge Lab →
              </button>
            </div>
          </div>

          {/* 3 Macro Cycle Pillars: LEARN -> CHALLENGE -> VERIFY */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-6">
            <div
              onClick={() => onNavigate('tanya-ai')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onNavigate('tanya-ai')}
              className="group bg-[#0f172a] hover:bg-slate-900/90 border border-[#1e293b] hover:border-blue-500/60 rounded-xl p-5 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_0_25px_rgba(37,99,235,0.2)] cursor-pointer"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-extrabold tracking-widest uppercase px-2.5 py-1 rounded-md bg-blue-500/15 text-blue-400 border border-blue-500/30">
                  FASE 1 · LEARN
                </span>
                <Sparkles className="w-5 h-5 text-blue-400 group-hover:rotate-12 transition-transform" />
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-blue-300 transition-colors">
                Sintesis 6 Bukti &amp; Mode Jebakan
              </h3>
              <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                Menarik 5–6 referensi nyata melalui Serper.dev, menyintesis jawaban utuh dengan
                Gemini AI, serta menguji ketelitian lewat fitur Injeksi Halusinasi Terkontrol.
              </p>
            </div>

            <div
              onClick={() => onNavigate('challenge-lab')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onNavigate('challenge-lab')}
              className="group bg-[#0f172a] hover:bg-slate-900/90 border border-[#1e293b] hover:border-amber-500/60 rounded-xl p-5 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_0_25px_rgba(245,158,11,0.2)] cursor-pointer"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-extrabold tracking-widest uppercase px-2.5 py-1 rounded-md bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  FASE 2 · CHALLENGE
                </span>
                <Layers className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-amber-300 transition-colors">
                Simulasi Kasus &amp; Impor Token Soal
              </h3>
              <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                Berlatih mendeteksi jebakan AI, mengimpor Kode Token Soal Base64 dari Mentor lintas
                perangkat, dan melaporkan temuan halusinasi komunitas.
              </p>
            </div>

            <div
              onClick={() => onNavigate('uji-output')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onNavigate('uji-output')}
              className="group bg-[#0f172a] hover:bg-slate-900/90 border border-[#1e293b] hover:border-emerald-500/60 rounded-xl p-5 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_0_25px_rgba(16,185,129,0.2)] cursor-pointer"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-extrabold tracking-widest uppercase px-2.5 py-1 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  FASE 3 · VERIFY (SIDE-BY-SIDE)
                </span>
                <CheckCircle2 className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors">
                Meja Audit Mikro, Rewriter &amp; PDF A4
              </h3>
              <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                Membandingkan klaim vs bukti secara berdampingan, memberi vonis mikro per klaim,
                menyusun Paragraf Akademik Terkoreksi (APA 7th), dan mencetak Sertifikat PDF A4.
              </p>
            </div>
          </div>

          {/* 4 Tahap VERIFY Interactive Cards */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-300">
                4 Tahap Inti Rubrik V-Score (@ 25 Poin · Klik kartu untuk detail)
              </h3>
              <span className="text-xs text-slate-400">
                Tahap Aktif:{' '}
                <strong className="text-blue-400">{VERIFY_STAGES[selectedStageIndex].code}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {VERIFY_STAGES.map((stage, idx) => {
                const IconComponent = stage.icon;
                const isSelected = selectedStageIndex === idx;
                return (
                  <button
                    key={stage.code}
                    type="button"
                    onClick={() => setSelectedStageIndex(idx)}
                    className={`text-left rounded-xl p-5 border transition-all duration-300 ease-out hover:-translate-y-1 active:scale-95 cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-b from-blue-950/70 to-[#0f172a] border-blue-500 shadow-[0_0_25px_rgba(37,99,235,0.28)]'
                        : 'bg-[#0f172a] border-[#1e293b] hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-blue-400">
                        {stage.code}
                      </span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-emerald-400 tabular-nums">
                        Maks {stage.weight}
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className="p-2 rounded-lg bg-slate-800/90 text-blue-400">
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div className="font-bold text-white text-base leading-snug">
                        {stage.title}
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed mt-2">
                      {stage.description}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 bg-[#0f172a] border border-blue-500/30 rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                  Simulasi Praktik · {VERIFY_STAGES[selectedStageIndex].code} —{' '}
                  {VERIFY_STAGES[selectedStageIndex].subtitle}
                </div>
                <p className="text-sm text-slate-200 font-medium">
                  {VERIFY_STAGES[selectedStageIndex].example}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('uji-output')}
                className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2563eb] hover:bg-[#3b82f6] text-white text-xs font-bold transition-all duration-300 hover:-translate-y-0.5 active:scale-95 cursor-pointer"
              >
                Buka Meja Audit Side-by-Side
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* 7 TAKSONOMI DAMPAK NEGATIF / PATOLOGI AI */}
        <div className="bg-[#0b1120] border border-[#1e293b] rounded-2xl p-6 sm:p-8 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-800/80">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-1 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                Klasifikasi Kerentanan Epistemik LLM
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                7 Taksonomi Dampak Negatif &amp; Patologi Output AI
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Setiap unit klaim pada meja audit diklasifikasikan secara otomatis dan spesifik ke
                dalam 7 jenis patologi informasi berikut:
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-5">
            {AI_PATHOLOGY_TAXONOMY.map((item) => (
              <div
                key={item.id}
                className="bg-[#0f172a] border border-slate-800 hover:border-amber-500/40 rounded-xl p-4 flex flex-col justify-between transition-all"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] font-bold mb-1.5">
                    <span className="text-amber-400 uppercase tracking-wider">{item.code}</span>
                    <span
                      className={
                        item.defaultRisk === 'Tinggi' ? 'text-red-400' : 'text-amber-300'
                      }
                    >
                      Risiko {item.defaultRisk}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white leading-snug">{item.label}</h3>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RUBRIK TRANSPARAN 100 POIN (4 TAHAP @ 25 POIN) */}
        <div className="bg-[#0b1120] border border-[#1e293b] rounded-2xl p-6 sm:p-8 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-1">
                Rubrik Penilaian Anti-Cheat &amp; Anti-Gibberish
              </div>
              <h2 className="text-2xl font-extrabold text-white">
                Indikator V-Score 100 Poin (4 Komponen @ 25 Poin)
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                Geser simulator di bawah ini untuk melihat bagaimana ke-4 tahap audit menentukan
                perolehan V-Score akhir Anda secara transparan.
              </p>
            </div>
            <div className="bg-[#0f172a] border border-emerald-500/40 rounded-xl px-5 py-3 text-right shrink-0">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Simulasi Skor V-Score
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-[#10b981] tabular-nums">
                {totalSimScore} <span className="text-sm font-normal text-slate-400">/ 100</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            {VSCORE_RUBRIC_100.map((item) => {
              const currentVal = simScores[item.key] ?? item.weight;
              const pct = Math.round((currentVal / item.weight) * 100);
              return (
                <div
                  key={item.key}
                  className="bg-[#0f172a] border border-[#1e293b] hover:border-blue-500/40 rounded-xl p-4 flex flex-col justify-between transition-all duration-300 hover:-translate-y-0.5"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-extrabold text-blue-400 uppercase tracking-wider">
                        Maks {item.weight} Poin
                      </span>
                      <span className="text-xs font-bold text-emerald-400 tabular-nums">
                        {currentVal} / {item.weight}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white leading-snug">{item.label}</h3>
                    <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80">
                    <label
                      htmlFor={`slider-${item.key}`}
                      className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5"
                    >
                      <span>Simulasi Capaian</span>
                      <span className="font-bold text-slate-200 tabular-nums">{pct}%</span>
                    </label>
                    <input
                      id={`slider-${item.key}`}
                      type="range"
                      min={0}
                      max={item.weight}
                      value={currentVal}
                      onChange={(e) =>
                        setSimScores((prev) => ({
                          ...prev,
                          [item.key]: Number(e.target.value),
                        }))
                      }
                      className="w-full accent-blue-500 cursor-pointer"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* INFORMASI PUBLIK: INDIKATOR KETERCAPAIAN ASTA CITA POIN 4 (Dipindahkan ke Beranda sesuai Spesifikasi 8) */}
        <div className="bg-gradient-to-br from-[#0b1120] via-[#0f172a] to-amber-950/20 border border-amber-500/30 rounded-2xl p-6 sm:p-8 shadow-xl">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
            <div>
              <div className="text-xs font-extrabold uppercase tracking-widest text-amber-400 mb-1 flex items-center gap-1.5">
                <Award className="w-4 h-4" />
                Visi Nasional &amp; Dampak Kebijakan Publik
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                Indikator Ketercapaian Asta Cita Nusantara Poin 4
              </h2>
              <p className="text-sm text-slate-300 mt-1 max-w-3xl">
                Memperkuat pembangunan Sumber Daya Manusia (SDM), sains, teknologi, dan pendidikan
                melalui standarisasi literasi verifikasi AI di perguruan tinggi dan sekolah
                menengah.
              </p>
            </div>
            <div className="flex items-center gap-3 bg-[#020617]/80 border border-amber-500/30 rounded-xl px-4 py-3 shrink-0">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Indeks Ketahanan Epistemik
                </div>
                <div className="text-sm font-extrabold text-emerald-400">
                  +34% Ketajaman Evaluasi Bukti
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-6">
            {ASTA_CITA_PUBLIC_PILLARS.map((pillar) => (
              <div
                key={pillar.title}
                className="bg-[#0f172a]/90 border border-slate-800 rounded-xl p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-amber-400 mb-2">{pillar.metric}</div>
                  <h3 className="text-base font-extrabold text-white leading-snug">
                    {pillar.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-2.5 leading-relaxed">
                    {pillar.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-5 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-400">
              Bagian informasi publik Asta Cita Poin 4 ini terbuka bagi seluruh pengunjung, sementara
              pembuatan soal dan rekap nilai kelas dilindungi di dalam Portal Mentor.
            </p>
            <button
              type="button"
              onClick={onDownloadStandaloneHtml}
              className="text-xs font-bold text-blue-400 hover:text-blue-300 underline underline-offset-4 cursor-pointer transition-colors"
            >
              Unduh Kode Sumber Single-File HTML Lengkap (.html)
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
