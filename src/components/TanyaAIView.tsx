import React, { useState } from 'react';
import {
  SearchReference,
  VerdictType,
  analyzeReferenceCredibility,
  detectEpistemicStanceForTopic,
} from '../utils/verificationLogic';
import {
  performCleanLiveSearch,
  generateControlledHallucinationMode,
} from '../utils/liveSearchService';
import {
  Search,
  Sparkles,
  ExternalLink,
  ArrowRight,
  CheckCircle2,
  Filter,
  GraduationCap,
  ShieldAlert,
  FlaskConical,
} from 'lucide-react';

interface TanyaAIViewProps {
  onSendToAudit: (params: {
    claimText: string;
    references: SearchReference[];
    expectedVerdict?: VerdictType;
    scenarioTitle?: string;
    calibrationHint?: string;
  }) => void;
  onNotify: (title: string, message: string, type?: 'success' | 'info' | 'warning') => void;
}

const SAMPLE_QUERIES = [
  'Dampak konsumsi minuman berpemanis terhadap diabetes remaja di Indonesia',
  'Efektivitas kebijakan subsidi kendaraan listrik terhadap penurunan emisi karbon',
  'Kelayakan pembangkit listrik tenaga nuklir (PLTN) untuk transisi energi Indonesia',
];

export const TanyaAIView: React.FC<TanyaAIViewProps> = ({ onSendToAudit, onNotify }) => {
  const [query, setQuery] = useState<string>('');
  const [academicFilter, setAcademicFilter] = useState<boolean>(true);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [isInjectingTrap, setIsInjectingTrap] = useState<boolean>(false);
  const [trapTargetVerdict, setTrapTargetVerdict] = useState<'PARTIALLY SUPPORTED' | 'UNSUPPORTED'>(
    'PARTIALLY SUPPORTED'
  );
  const [result, setResult] = useState<{
    queryUsed: string;
    synthesizedAnswer: string;
    references: SearchReference[];
    usedFallback: boolean;
  } | null>(null);

  const handleRunSearch = async (customQuery?: string) => {
    const targetQuery = (customQuery ?? query).trim();
    if (!targetQuery) {
      onNotify(
        'Masukkan Topik Pertanyaan',
        'Silakan ketik topik ilmiah atau pilih salah satu pertanyaan contoh di bawah.',
        'warning'
      );
      return;
    }

    if (customQuery) {
      setQuery(customQuery);
    }

    setIsSearching(true);
    try {
      const res = await performCleanLiveSearch(targetQuery, academicFilter);
      setResult(res);
      onNotify(
        'Sintesis & Ekstraksi 6 Bukti Selesai',
        `Berhasil menyintesis jawaban akademik utuh sesuai topik "${targetQuery}" dari ${res.references.length} referensi relevan.`,
        'success'
      );
    } finally {
      setIsSearching(false);
    }
  };

  // Mode 1: Kirim Teks Normal (Deteksi otomatis apakah topik memuat Studi Kritis/Ad-Dakhil atau Konsensus Ilmiah)
  const handleSendNormalMode = () => {
    if (!result) return;
    const topicText = query.trim() || result.synthesizedAnswer;
    const stance = detectEpistemicStanceForTopic(topicText, result.references);
    const computedVerdict: VerdictType = stance.hasCriticalOrDebunkingStance
      ? stance.recommendedExpectedVerdict
      : 'VERIFIED';

    onSendToAudit({
      claimText: result.synthesizedAnswer,
      references: result.references,
      expectedVerdict: computedVerdict,
      scenarioTitle: `Tanya AI (Mode Normal): ${query.trim() || 'Sintesis Ilmiah'}`,
      calibrationHint: stance.hasCriticalOrDebunkingStance
        ? `Detektor Epistemik mendeteksi bahwa topik "${query.trim()}" memuat literatur pengkritisi (Studi Kritis / Ad-Dakhil / Isra'iliyat) atau sumber sekunder, sehingga klaim awal bersifat spekulatif/diperdebatkan (${computedVerdict}). Analisis kritis Anda yang konsisten akan memperoleh skor penuh 25/25.`
        : 'Teks ini dikirim melalui Mode Teks Normal (Akurat Sesuai Bukti): Seluruh paragraf sintesis disusun langsung dari ke-6 referensi primer yang relevan tanpa injeksi distorsi maupun sitasi fiktif.',
    });
  };

  // Mode 2: Kirim Mode Latihan Audit (Sisipkan Jebakan Distorsi/Halusinasi -> PARTIALLY SUPPORTED atau UNSUPPORTED)
  const handleSendTrapMode = async () => {
    if (!result) return;
    setIsInjectingTrap(true);
    try {
      const injected = await generateControlledHallucinationMode(
        result.synthesizedAnswer,
        query.trim() || 'kajian ilmiah',
        result.references,
        trapTargetVerdict
      );
      onSendToAudit({
        claimText: injected.manipulatedText,
        references: result.references,
        expectedVerdict: injected.expectedVerdict,
        scenarioTitle: `Latihan Audit (Injeksi Jebakan): ${query.trim() || 'Sintesis Ilmiah'}`,
        calibrationHint: injected.calibrationHint,
      });
    } finally {
      setIsInjectingTrap(false);
    }
  };

  return (
    <div className="animate-page-enter max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header Banner */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-blue-400">
          <Sparkles className="w-4 h-4" />
          Fase 1 · Clean Live Search, Sintesis Dinamis 6 Bukti &amp; Injeksi Halusinasi Terkontrol
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Tanya AI dengan 6 Bukti Mandiri Anti-Error
        </h1>
        <p className="text-slate-400 text-sm sm:text-base max-w-3xl">
          Mesin menarik 6 referensi nyata yang relevan dari Serper.dev, menyintesis jawaban akademik
          2 paragraf utuh lengkap dengan sitasi inline{' '}
          <code className="text-emerald-400 font-mono">[1]–[6]</code>, serta mengunci ke-6 bukti
          tersebut saat dikirim ke Meja Audit.
        </p>
      </div>

      {/* Search Control Box */}
      <div className="bg-[#0b1120] border border-[#1e293b] rounded-2xl p-6 sm:p-7 shadow-xl space-y-5">
        {/* Clean Scholar Filter Checkbox */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0f172a] border border-blue-500/30 rounded-xl p-4">
          <label
            htmlFor="clean-scholar-checkbox"
            className="flex items-start sm:items-center gap-3 cursor-pointer select-none"
          >
            <input
              id="clean-scholar-checkbox"
              type="checkbox"
              checked={academicFilter}
              onChange={(e) => setAcademicFilter(e.target.checked)}
              className="mt-0.5 sm:mt-0 w-4 h-4 rounded accent-blue-600 cursor-pointer"
            />
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <span>Fokus Pangkalan Data Akademik (Clean Scholar &amp; Jurnal Ilmiah)</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Menambahkan kata kunci alami{' '}
                <code className="text-blue-400 font-mono">jurnal penelitian ilmiah</code> agar hasil
                Serper.dev 100% relevan dengan topik yang Anda cari tanpa memblokir hasil valid.
              </p>
            </div>
          </label>
          <span className="shrink-0 inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-md bg-blue-500/15 text-blue-400 border border-blue-500/30">
            <Filter className="w-3.5 h-3.5" />
            {academicFilter ? 'Mode Akademik Aktif' : 'Mode Pencarian Umum'}
          </span>
        </div>

        {/* Input & Action Button */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleRunSearch();
          }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <div className="relative flex-1">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tanyakan klaim ilmiah, sejarah, statistik kebijakan, atau topik riset..."
              className="w-full bg-[#0f172a] border border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 rounded-xl px-4 py-3.5 text-sm sm:text-base text-white placeholder-slate-500 transition-all focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={isSearching}
            className="bg-[#2563eb] hover:bg-[#3b82f6] disabled:opacity-60 text-white font-bold text-sm sm:text-base rounded-xl px-6 py-3.5 transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <Search className="w-4 h-4" />
            {isSearching ? 'Menyintesis 6 Bukti...' : 'Cari & Sintesis'}
          </button>
        </form>

        {/* Quick Sample Prompts */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Contoh Pertanyaan Cepat (Klik untuk Menguji):
          </div>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_QUERIES.map((sample) => (
              <button
                key={sample}
                type="button"
                onClick={() => handleRunSearch(sample)}
                className="text-left text-xs bg-[#0f172a] hover:bg-slate-800 border border-slate-700/80 hover:border-blue-500/50 text-slate-300 hover:text-white px-3.5 py-2 rounded-lg transition-all duration-200 cursor-pointer"
              >
                {sample}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Loading Scan Animation */}
      {isSearching && (
        <div className="relative overflow-hidden bg-[#0b1120] border border-blue-500/40 rounded-2xl p-8 space-y-5">
          <div className="flex items-center gap-3 text-blue-400 font-bold text-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping" />
            Menarik 6 Referensi Serper.dev &amp; Menyusun Sintesis Akademik Utuh Sesuai Topik...
          </div>
          <div className="space-y-3 animate-pulse">
            <div className="h-4 bg-slate-800 rounded w-1/3" />
            <div className="h-3 bg-slate-800/90 rounded w-full" />
            <div className="h-3 bg-slate-800/90 rounded w-11/12" />
            <div className="h-3 bg-slate-800/90 rounded w-4/5" />
          </div>
        </div>
      )}

      {/* Search & Synthesis Results */}
      {result && !isSearching && (
        <div className="space-y-6 animate-page-enter">
          {/* AI Synthesized Answer Panel */}
          <div className="bg-[#0b1120] border border-[#1e293b] rounded-2xl p-6 sm:p-7 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="px-3 py-1 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-400 text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  AI Synthesized Answer (6 Sumber Primer)
                </span>
              </div>
              <span className="text-xs text-emerald-400 font-semibold">
                100% Sesuai Topik · Bebas Elipsis (&ldquo;...&rdquo;) · Sitasi Inline [1]–[6]
              </span>
            </div>

            <div className="space-y-4 text-slate-100 text-base sm:text-lg leading-relaxed font-editorial">
              {result.synthesizedAnswer.split('\n\n').map((para, idx) => (
                <p key={idx} className="leading-relaxed">
                  {para}
                </p>
              ))}
            </div>

            {/* DUA MODE PENGIRIMAN KE PIPELINE AUDIT (NORMAL VS INJEKSI HALUSINASI TERKONTROL) */}
            <div className="bg-[#0f172a] border border-blue-500/30 rounded-xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <FlaskConical className="w-4 h-4" />
                    Pilih Mode Pengiriman ke Meja Audit (Kunci 6 Bukti ke Kolom Kanan)
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Ke-6 referensi di bawah ini akan dikunci bersama teks pilihan Anda ke Meja Audit
                    Side-by-Side.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <label className="text-[11px] font-bold text-slate-400">Tingkat Jebakan:</label>
                  <select
                    value={trapTargetVerdict}
                    onChange={(e) =>
                      setTrapTargetVerdict(
                        e.target.value as 'PARTIALLY SUPPORTED' | 'UNSUPPORTED'
                      )
                    }
                    className="bg-[#020617] border border-amber-500/40 rounded-lg px-2.5 py-1.5 text-xs font-bold text-amber-300 focus:outline-none"
                  >
                    <option value="PARTIALLY SUPPORTED">
                      Distorsi Halus (Kunci: PARTIALLY SUPPORTED)
                    </option>
                    <option value="UNSUPPORTED">
                      Halusinasi &amp; Ghost Citation (Kunci: UNSUPPORTED)
                    </option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleSendNormalMode}
                  className="flex items-center justify-between gap-3 p-4 rounded-xl bg-emerald-950/30 hover:bg-emerald-900/40 border border-emerald-500/40 text-left transition-all cursor-pointer group"
                >
                  <div>
                    <div className="text-xs font-extrabold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      Mode 1 · Kirim Teks Normal (Akurat Sesuai Bukti)
                    </div>
                    <p className="text-xs text-slate-300 mt-1">
                      Mengirim paragraf sintesis beserta 6 bukti di bawah ke Meja Audit (Kunci
                      Jawaban: <strong className="text-emerald-300">VERIFIED</strong>).
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-emerald-400 shrink-0 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  type="button"
                  disabled={isInjectingTrap}
                  onClick={handleSendTrapMode}
                  className="flex items-center justify-between gap-3 p-4 rounded-xl bg-amber-950/35 hover:bg-amber-900/45 border border-amber-500/50 text-left transition-all cursor-pointer group disabled:opacity-60"
                >
                  <div>
                    <div className="text-xs font-extrabold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4" />
                      {isInjectingTrap
                        ? 'Menyisipkan Jebakan Halusinasi...'
                        : 'Mode 2 · Kirim Mode Latihan Audit (Sisipkan Jebakan Distorsi/Halusinasi)'}
                    </div>
                    <p className="text-xs text-slate-300 mt-1">
                      Memelintir sebagian statistik/kausalitas atau menyisipkan Ghost Citation
                      (Kunci Jawaban: <strong className="text-amber-300">{trapTargetVerdict}</strong>
                      ).
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-amber-400 shrink-0 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>

            <div className="text-xs text-slate-400 bg-[#020617]/70 border border-slate-800/80 rounded-lg px-3.5 py-2.5 font-mono">
              Kueri Live Search: <span className="text-blue-400">{result.queryUsed}</span>
            </div>
          </div>

          {/* 5-6 Verified References Cards */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-extrabold text-white tracking-wide uppercase">
                  Bukti Ekstraksi Mandiri (Clean Live Search — {result.references.length} Sumber)
                </h2>
                <p className="text-xs text-slate-400">
                  Dilengkapi 2 tombol aksi pada setiap kartu: Buka Web Asli dan jalur cadangan Cari
                  Judul di Google Scholar anti-404.
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-3 py-1 rounded-lg">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {result.references.length} Dokumen Primer Aktif
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {result.references.map((ref) => {
                const cred = analyzeReferenceCredibility(ref);
                return (
                  <div
                    key={ref.id}
                    className="bg-[#0b1120] hover:bg-[#0f172a] border border-[#1e293b] hover:border-blue-500/50 rounded-xl p-5 transition-all duration-200 space-y-3.5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <span className="shrink-0 w-7 h-7 rounded-lg bg-blue-600/20 border border-blue-500/40 text-blue-400 font-extrabold text-xs flex items-center justify-center font-mono tabular-nums">
                          [{ref.id}]
                        </span>
                        <div className="space-y-1.5">
                          <h3 className="text-base font-bold text-white leading-snug">
                            {ref.title}
                          </h3>
                          {/* SPESIFIKASI 3b: Badge Tingkat Kredibilitas & Peran Sumber */}
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span
                              className={`text-[11px] font-bold px-2.5 py-0.5 rounded border ${
                                cred.sourceTier === 'PRIMARY_ACADEMIC'
                                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                                  : 'bg-orange-950/60 text-orange-300 border-orange-500/40'
                              }`}
                            >
                              {cred.credibilityBadge}
                            </span>
                            {cred.isCriticalStance && cred.criticalStanceBadge && (
                              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-500/40">
                                {cred.criticalStanceBadge}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 font-mono break-all">{ref.url}</p>
                        </div>
                      </div>
                      <span className="shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        {ref.domain}
                      </span>
                    </div>

                    {/* Evidence Snippet Box */}
                    <div className="bg-[#020617]/80 border border-slate-800/90 rounded-lg p-3.5 text-sm sm:text-base text-slate-200 leading-relaxed font-editorial">
                      &ldquo;{ref.snippet}&rdquo;
                    </div>

                    {/* Dual Action Buttons */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <a
                          href={ref.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-xs font-bold text-blue-300 hover:text-white transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          🔗 Buka Web Asli
                        </a>

                        <a
                          href={ref.scholarUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-500/40 text-xs font-bold text-emerald-300 hover:text-white transition-colors"
                        >
                          <GraduationCap className="w-3.5 h-3.5" />
                          🎓 Cari Judul di Google Scholar
                        </a>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          onSendToAudit({
                            claimText: ref.snippet,
                            references: result.references,
                            expectedVerdict: 'VERIFIED',
                            scenarioTitle: `Audit Kutipan Bukti [${ref.id}]: ${ref.title}`,
                          })
                        }
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-400 hover:text-blue-300 cursor-pointer"
                      >
                        Uji Kutipan Ini di Meja Audit →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
