import { useState, useEffect, useCallback } from 'react';
import Card from './components/Card';

/* =============================================
   Static Endpoint Metadata (dokumentasi API)
   ============================================= */
const ENDPOINTS = [
  {
    id: 'category', path: '/api/category',
    desc: 'Semua kategori anime lengkap dengan endpoint terkait.',
    params: '', timing: '< 1s', cache: '5 menit',
  },
  {
    id: 'list', path: '/api/list',
    desc: 'Video dari home, kategori, halaman, atau A-Z.',
    params: 'type=home&category=action&page=1&letter=a',
    timing: '< 2s', cache: '5 menit',
  },
  {
    id: 'search', path: '/api/search',
    desc: 'Cari video berdasarkan judul anime.',
    params: 'q=elf', timing: '< 2s', cache: '5 menit',
  },
  {
    id: 'detail', path: '/api/detail',
    desc: 'Detail video: judul, poster, deskripsi, iframe player.',
    params: 'url=https://nekopoi.care/...',
    timing: '< 2s', cache: '5 menit',
  },
  {
    id: 'stream', path: '/api/stream',
    desc: 'Direct m3u8 via headless browser. 15–30 detik.',
    params: 'url=https://nekopoi.care/...',
    timing: '15–30s ⚠️', cache: 'Tidak',
  },
  {
    id: 'genres', path: '/api/genres',
    desc: 'Semua genre: Action, Adventure, Comedy, Romance, dsb.',
    params: '', timing: '< 1s', cache: '5 menit',
  },
  {
    id: 'genre', path: '/api/genre',
    desc: 'Video berdasarkan genre spesifik.',
    params: 'url=https://nekopoi.care/genre/adventure/&page=1',
    timing: '< 2s', cache: '5 menit',
  },
  {
    id: 'episodes', path: '/api/episodes',
    desc: 'Semua episode dari halaman seri/batch.',
    params: 'url=https://nekopoi.care/episode/kokuhaku-sub/',
    timing: '< 2s', cache: '5 menit',
  },
  {
    id: 'random', path: '/api/random',
    desc: 'URL video anime acak.',
    params: '', timing: '< 2s', cache: 'Tidak',
  },
  {
    id: 'schedule', path: '/api/schedule',
    desc: 'Jadwal rilis anime dari Jepang.',
    params: '', timing: '< 2s', cache: '5 menit',
  },
];

const CODE_SNIPPETS = {
  curl: (base) => `curl "${base}/api/search?q=elf"`,
  js: (base) =>
    `const res = await fetch("${base}/api/search?q=elf");\nconst data = await res.json();\nconsole.log(data);`,
  python: (base) =>
    `import requests\nres = requests.get("${base}/api/search", params={"q":"elf"})\ndata = res.json()\nprint(data)`,
  go: (base) =>
    `resp, _ := http.Get("${base}/api/search?q=elf")\ndefer resp.Body.Close()\nvar data map[string]interface{}\njson.NewDecoder(resp.Body).Decode(&data)\nfmt.Println(data)`,
  php: (base) =>
    `$response = file_get_contents("${base}/api/search?q=elf");\n$data = json_decode($response, true);\nprint_r($data);`,
};

/* =============================================
   Helper: warnai JSON untuk explorer
   ============================================= */
function colorizeJSON(obj) {
  const json = JSON.stringify(obj, null, 2);
  return json.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    (match) => {
      if (/^"/.test(match)) {
        if (/:$/.test(match)) return `<span class="json-key">${match}</span>`;
        return `<span class="json-str">${match}</span>`;
      }
      if (/true|false/.test(match)) return `<span class="json-bool">${match}</span>`;
      if (/null/.test(match)) return `<span style="color:var(--muted2)">${match}</span>`;
      return `<span class="json-num">${match}</span>`;
    }
  );
}

/* =============================================
   Komponen Utama
   ============================================= */
export default function App() {
  const BASE = typeof window !== 'undefined' ? window.location.origin : '';

  // State: kategori (dari /api/category)
  const [categories, setCategories] = useState([]);

  // State: daftar anime (dari /api/list)
  const [animeList, setAnimeList] = useState([]);

  // State: loading
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingAnime, setLoadingAnime] = useState(true);

  // State: stats
  const [responseTime, setResponseTime] = useState(null);
  const [videoCount, setVideoCount] = useState(null);

  // State: endpoint explorer
  const [explorerValue, setExplorerValue] = useState('');
  const [explorerResult, setExplorerResult] = useState('');
  const [explorerLoading, setExplorerLoading] = useState(false);

  // State: code tabs
  const [activeTab, setActiveTab] = useState('curl');
  const [copiedTab, setCopiedTab] = useState(null);

  // State: expanded endpoint card
  const [expandedEp, setExpandedEp] = useState(null);

  // State: try-it response per endpoint
  const [tryItResults, setTryItResults] = useState({});

  /* =============================================
     Fetch: Kategori (sidebar)
     ============================================= */
  const fetchCategories = useCallback(async () => {
    setLoadingCategories(true);
    try {
      const res = await fetch(`${BASE}/api/category`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setCategories(data.data);
      }
    } catch (err) {
      console.error('Gagal fetch kategori:', err);
    } finally {
      setLoadingCategories(false);
    }
  }, [BASE]);

  /* =============================================
     Fetch: Anime list & Stats
     ============================================= */
  const fetchAnimeList = useCallback(async () => {
    setLoadingAnime(true);
    const t0 = Date.now();
    try {
      const res = await fetch(`${BASE}/api/list?category=action`);
      const ms = Date.now() - t0;
      const data = await res.json();
      setResponseTime(ms);
      if (data.success && Array.isArray(data.data)) {
        setAnimeList(data.data);
        setVideoCount(data.meta?.count || data.data.length);
      }
    } catch (err) {
      console.error('Gagal fetch anime list:', err);
      setResponseTime(null);
      setVideoCount(null);
    } finally {
      setLoadingAnime(false);
    }
  }, [BASE]);

  useEffect(() => {
    fetchCategories();
    fetchAnimeList();
  }, [fetchCategories, fetchAnimeList]);

  /* =============================================
     Fade-in on scroll (Intersection Observer)
     ============================================= */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('visible');
        });
      },
      { threshold: 0.08 }
    );
    document.querySelectorAll('.fade-in').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [categories, animeList]); // re-observe setelah data berubah

  /* =============================================
     Handler: Explorer
     ============================================= */
  const handleExplorerChange = async (e) => {
    const val = e.target.value;
    setExplorerValue(val);
    if (!val) {
      setExplorerResult('<span style="color:var(--muted)">← Pilih endpoint untuk melihat response</span>');
      return;
    }
    const { path, params } = JSON.parse(val);
    let url = BASE + path;
    if (params && params !== '(tidak ada)') url += '?' + params;

    setExplorerLoading(true);
    try {
      const res = await fetch(url);
      const data = await res.json();
      setExplorerResult(colorizeJSON(data));
    } catch (err) {
      setExplorerResult(`<span style="color:var(--red)">Error: ${err.message}</span>`);
    } finally {
      setExplorerLoading(false);
    }
  };

  /* =============================================
     Handler: Try It (dalam kartu endpoint)
     ============================================= */
  const handleTryIt = async (ep, e) => {
    e.stopPropagation();
    const params = ep.params && ep.params !== '(tidak ada)' ? ep.params : '';
    const url = BASE + ep.path + (params ? '?' + params : '');

    setTryItResults((prev) => ({ ...prev, [ep.id]: { loading: true } }));
    try {
      const res = await fetch(url);
      const data = await res.json();
      setTryItResults((prev) => ({
        ...prev,
        [ep.id]: { loading: false, data: JSON.stringify(data, null, 2), ok: res.ok },
      }));
    } catch (err) {
      setTryItResults((prev) => ({
        ...prev,
        [ep.id]: { loading: false, data: 'Error: ' + err.message, ok: false },
      }));
    }
  };

  /* =============================================
     Handler: Copy code snippet
     ============================================= */
  const handleCopy = async (lang) => {
    const snippet = CODE_SNIPPETS[lang](BASE);
    try {
      await navigator.clipboard.writeText(snippet);
      setCopiedTab(lang);
      setTimeout(() => setCopiedTab(null), 1500);
    } catch {
      // fallback
      const ta = document.createElement('textarea');
      ta.value = snippet;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopiedTab(lang);
      setTimeout(() => setCopiedTab(null), 1500);
    }
  };

  /* =============================================
     Render
     ============================================= */
  return (
    <>
      {/* ========== NAVBAR ========== */}
      <nav className="sticky top-0 z-[100] flex items-center justify-between px-8 py-4 glass border-b border-[var(--border)]">
        <div className="flex items-center gap-2 font-[var(--heading)] font-bold text-lg tracking-tight">
          🐱 7u7 <span className="text-[var(--accent2)]">Neko</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-[var(--green)] shadow-[0_0_12px_var(--green)] animate-status" />
          <span className="font-[var(--mono)] text-xs bg-[rgba(124,58,237,0.08)] border border-[rgba(124,58,237,0.25)] text-[var(--accent2)] px-3 py-1.5 rounded-md backdrop-blur">
            {BASE}
          </span>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-8">
        {/* ========== HERO ========== */}
        <section className="flex flex-col items-center text-center py-24 gap-6">
          <div className="inline-flex items-center gap-2 font-[var(--mono)] text-xs bg-[rgba(34,197,94,0.06)] border border-[rgba(34,197,94,0.25)] text-[var(--green)] px-4 py-1.5 rounded-full animate-badge">
            ✦ v1.0 — Production Ready
          </div>
          <h1 className="font-[var(--heading)] text-[clamp(2.8rem,8vw,5.5rem)] font-extrabold leading-[1.05] tracking-[-0.03em] max-w-[900px] text-gradient drop-shadow-[0_0_30px_rgba(124,58,237,0.25)]">
            7u7 Anime Streaming API
          </h1>
          <p className="text-lg text-[var(--muted)] max-w-[650px] font-light leading-relaxed">
            Unofficial REST API untuk streaming anime. Akses data video, genre, episode, hingga direct
            stream m3u8 — tanpa API key, tanpa rate limit, selalu online.
          </p>
          <div className="flex gap-4 flex-wrap justify-center mt-2">
            <a href="#endpoints" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold bg-[var(--accent)] text-white neon-glow transition-all hover:bg-[#6d28d9] hover:-translate-y-0.5 no-underline">
              📡 Jelajahi Endpoint
            </a>
            <a href="#explorer" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold border border-[var(--border2)] text-[var(--text)] bg-transparent transition-all hover:bg-[rgba(124,58,237,0.08)] hover:border-[var(--accent)] hover:text-[var(--accent2)] no-underline">
              🔍 Live Explorer
            </a>
          </div>
        </section>

        {/* ========== STATS ========== */}
        <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-4 pb-16 fade-in" id="statsBar">
          <div className="glass rounded-xl p-6 text-center glass-hover relative overflow-hidden">
            <div className="font-[var(--heading)] text-4xl font-extrabold text-[var(--accent2)]">10</div>
            <div className="text-sm text-[var(--muted)] mt-2">Endpoints</div>
          </div>
          <div className="glass rounded-xl p-6 text-center glass-hover relative overflow-hidden">
            <div className={`font-[var(--heading)] text-4xl font-extrabold text-[var(--accent2)] ${loadingAnime ? 'animate-shimmer' : ''}`}>
              {loadingAnime ? '...' : responseTime !== null ? `${responseTime}ms` : '—'}
            </div>
            <div className="text-sm text-[var(--muted)] mt-2">Response Time</div>
          </div>
          <div className="glass rounded-xl p-6 text-center glass-hover relative overflow-hidden">
            <div className={`font-[var(--heading)] text-4xl font-extrabold text-[var(--accent2)] ${loadingAnime ? 'animate-shimmer' : ''}`}>
              {loadingAnime ? '...' : videoCount !== null ? videoCount : '—'}
            </div>
            <div className="text-sm text-[var(--muted)] mt-2">Video Tersedia</div>
          </div>
          <div className="glass rounded-xl p-6 text-center glass-hover relative overflow-hidden">
            <div className="font-[var(--heading)] text-4xl font-extrabold text-[var(--accent2)]">∞</div>
            <div className="text-sm text-[var(--muted)] mt-2">Rate Limit</div>
          </div>
        </div>

        {/* ========== ENDPOINTS ========== */}
        <section className="pb-20 fade-in" id="endpoints">
          <div className="font-[var(--mono)] text-xs font-bold uppercase tracking-[0.15em] text-[var(--accent2)] mb-2 flex items-center gap-2">
            01 · Endpoints <span className="flex-1 h-px bg-gradient-to-r from-[var(--border2)] to-transparent" />
          </div>
          <h2 className="font-[var(--heading)] text-4xl font-bold mb-2 tracking-[-0.02em]">API Reference</h2>
          <p className="text-[var(--muted)] mb-10 font-light text-lg">
            Sepuluh endpoint RESTful dengan response JSON. Klik kartu untuk melihat detail dan mencoba langsung.
          </p>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(360px,1fr))] gap-4">
            {ENDPOINTS.map((ep) => {
              const tr = tryItResults[ep.id];
              return (
                <div
                  key={ep.id}
                  className={`glass rounded-xl p-6 cursor-pointer transition-all duration-[0.35s] relative overflow-hidden ${
                    expandedEp === ep.id
                      ? '!bg-[var(--surface2)] !border-[var(--accent)] shadow-[0_18px_40px_rgba(124,58,237,0.15)]'
                      : 'glass-hover'
                  }`}
                  onClick={() => setExpandedEp(expandedEp === ep.id ? null : ep.id)}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="font-[var(--mono)] text-xs font-bold text-[var(--green)] bg-[rgba(34,197,94,0.08)] px-2 py-0.5 rounded uppercase tracking-wider flex-shrink-0">
                      GET
                    </span>
                    <span className="font-[var(--mono)] text-sm text-[var(--accent2)] font-medium">{ep.path}</span>
                  </div>
                  <p className="text-sm text-[var(--muted)] mb-3 leading-relaxed">{ep.desc}</p>
                  <div className="flex gap-4 text-xs text-[var(--muted2)] font-[var(--mono)]">
                    <span>⏱ {ep.timing}</span>
                    <span>📦 {ep.cache}</span>
                  </div>

                  {/* Expand */}
                  {expandedEp === ep.id && (
                    <div className="mt-4 pt-4 border-t border-[var(--border)] animate-fade-slide">
                      <div className="mb-3">
                        <div className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-1">
                          Parameter
                        </div>
                        <input
                          className="w-full bg-[rgba(0,0,0,0.3)] border border-[var(--border2)] rounded-md text-[var(--accent2)] font-[var(--mono)] text-xs p-2.5 outline-none focus:border-[var(--accent)]"
                          value={ep.params || '(tidak ada)'}
                          readOnly
                        />
                      </div>
                      <div className="bg-[rgba(0,0,0,0.35)] border border-[var(--border)] rounded-lg font-[var(--mono)] text-xs leading-relaxed text-[#94a3b8] max-h-[200px] overflow-y-auto relative">
                        <div className="flex justify-between items-center px-3 py-2 bg-[rgba(124,58,237,0.04)] border-b border-[var(--border)]">
                          <span className="text-[0.62rem] font-semibold text-[var(--muted2)] uppercase tracking-wider">
                            Response JSON
                          </span>
                          <button
                            className="text-xs px-2 py-1 bg-[var(--accent)] text-white rounded cursor-pointer font-[var(--mono)] transition-all hover:bg-[#6d28d9] disabled:bg-[var(--muted2)] disabled:cursor-not-allowed"
                            disabled={tr?.loading}
                            onClick={(e) => handleTryIt(ep, e)}
                          >
                            {tr?.loading ? '...' : 'Try It'}
                          </button>
                        </div>
                        <pre className="p-3 whitespace-pre-wrap m-0" style={{ color: tr?.ok === false ? 'var(--red)' : tr?.ok ? '#86efac' : '#94a3b8' }}>
                          {tr?.data || ep.resp || 'Klik "Try It" untuk melihat response.'}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ========== ANIME SHOWCASE (Card.jsx) ========== */}
        <section className="pb-20 fade-in" id="anime-showcase">
          <div className="font-[var(--mono)] text-xs font-bold uppercase tracking-[0.15em] text-[var(--accent2)] mb-2 flex items-center gap-2">
            02 · Anime Showcase <span className="flex-1 h-px bg-gradient-to-r from-[var(--border2)] to-transparent" />
          </div>
          <h2 className="font-[var(--heading)] text-4xl font-bold mb-2 tracking-[-0.02em]">Video Terbaru</h2>
          <p className="text-[var(--muted)] mb-10 font-light text-lg">
            Data diambil langsung dari <code className="font-[var(--mono)] text-[var(--accent2)] bg-[rgba(124,58,237,0.08)] px-1.5 py-0.5 rounded">/api/list</code>.
          </p>

          {loadingAnime ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-5">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="glass rounded-xl overflow-hidden">
                  <div className="skeleton h-48 w-full" />
                  <div className="p-4 space-y-3">
                    <div className="skeleton h-5 w-3/4" />
                    <div className="skeleton h-4 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : animeList.length > 0 ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-5">
              {animeList.map((item, i) => (
                <Card
                  key={item.url || i}
                  title={item.title}
                  image={item.poster || item.image}
                  url={item.url}
                />
              ))}
            </div>
          ) : (
            <div className="glass rounded-xl p-12 text-center text-[var(--muted)]">
              <span className="text-4xl mb-4 block">📭</span>
              <p>Tidak ada video tersedia saat ini.</p>
              <p className="text-sm mt-2">Coba refresh atau periksa koneksi ke API.</p>
            </div>
          )}
        </section>

        {/* ========== INTERACTIVE EXPLORER ========== */}
        <section className="pb-20 fade-in" id="explorer">
          <div className="font-[var(--mono)] text-xs font-bold uppercase tracking-[0.15em] text-[var(--accent2)] mb-2 flex items-center gap-2">
            03 · Interactive Explorer <span className="flex-1 h-px bg-gradient-to-r from-[var(--border2)] to-transparent" />
          </div>
          <h2 className="font-[var(--heading)] text-4xl font-bold mb-2 tracking-[-0.02em]">Coba Langsung</h2>
          <p className="text-[var(--muted)] mb-10 font-light text-lg">
            Pilih endpoint, lihat response JSON real-time dari server.
          </p>
          <div className="glass rounded-2xl p-8">
            <div className="font-[var(--heading)] text-xl font-bold mb-5 flex items-center gap-2">
              ⚡ Live Request
            </div>
            <div className="grid grid-cols-[200px_1fr] gap-4 items-start max-md:grid-cols-1">
              <select
                className="bg-[rgba(0,0,0,0.3)] border border-[var(--border2)] rounded-lg text-[var(--text)] font-[var(--mono)] text-sm p-3 outline-none cursor-pointer focus:border-[var(--accent)]"
                value={explorerValue}
                onChange={handleExplorerChange}
              >
                <option value="">-- Pilih endpoint --</option>
                {ENDPOINTS.map((ep) => (
                  <option key={ep.id} value={JSON.stringify({ path: ep.path, params: ep.params })}>
                    GET {ep.path}
                  </option>
                ))}
              </select>
              <div className="bg-[rgba(0,0,0,0.35)] border border-[var(--border)] rounded-lg font-[var(--mono)] text-xs leading-relaxed text-[#94a3b8] max-h-[320px] overflow-y-auto p-4 whitespace-pre-wrap relative">
                {explorerLoading && (
                  <div className="absolute inset-0 bg-[rgba(4,4,10,0.6)] flex items-center justify-center rounded-lg z-10">
                    <div className="w-6 h-6 border-2 border-[var(--border2)] border-t-[var(--accent)] rounded-full animate-spin" />
                  </div>
                )}
                <div dangerouslySetInnerHTML={{ __html: explorerResult || '<span style="color:var(--muted)">← Pilih endpoint untuk melihat response</span>' }} />
              </div>
            </div>
          </div>
        </section>

        {/* ========== CODE EXAMPLES ========== */}
        <section className="pb-20 fade-in">
          <div className="font-[var(--mono)] text-xs font-bold uppercase tracking-[0.15em] text-[var(--accent2)] mb-2 flex items-center gap-2">
            04 · Code Examples <span className="flex-1 h-px bg-gradient-to-r from-[var(--border2)] to-transparent" />
          </div>
          <h2 className="font-[var(--heading)] text-4xl font-bold mb-2 tracking-[-0.02em]">Integrasi</h2>
          <p className="text-[var(--muted)] mb-10 font-light text-lg">
            Siap pakai dalam berbagai bahasa pemrograman.
          </p>
          <div className="flex gap-2 mb-5 flex-wrap">
            {['curl', 'js', 'python', 'go', 'php'].map((tab) => (
              <button
                key={tab}
                className={`px-4 py-2 rounded-md font-[var(--mono)] text-sm border transition-all cursor-pointer ${
                  activeTab === tab
                    ? 'bg-[var(--accent)] border-[var(--accent)] text-white'
                    : 'bg-transparent border-[var(--border2)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--text)]'
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {tab === 'js' ? 'JavaScript' : tab === 'python' ? 'Python' : tab === 'go' ? 'Go' : tab === 'php' ? 'PHP' : 'curl'}
              </button>
            ))}
          </div>
          <div className="bg-[rgba(0,0,0,0.45)] border border-[var(--border)] rounded-xl overflow-hidden">
            <div className="flex justify-between items-center px-5 py-3 bg-[rgba(124,58,237,0.04)] border-b border-[var(--border)]">
              <span className="font-[var(--heading)] text-xs font-semibold text-[var(--accent2)] uppercase tracking-[0.1em]">
                {activeTab === 'js' ? 'JavaScript' : activeTab === 'python' ? 'Python' : activeTab === 'go' ? 'Go' : activeTab === 'php' ? 'PHP' : 'curl'}
              </span>
              <button
                className="text-xs px-2.5 py-1 bg-[var(--accent)] text-white rounded cursor-pointer font-[var(--mono)] transition-all hover:bg-[#6d28d9]"
                onClick={() => handleCopy(activeTab)}
              >
                {copiedTab === activeTab ? '✓' : 'Copy'}
              </button>
            </div>
            <pre className="p-5 font-[var(--mono)] text-sm leading-relaxed text-[#94a3b8] overflow-x-auto whitespace-pre m-0">
              {CODE_SNIPPETS[activeTab](BASE)}
            </pre>
          </div>
        </section>

        {/* ========== FEATURES ========== */}
        <section className="pb-20 fade-in">
          <div className="font-[var(--mono)] text-xs font-bold uppercase tracking-[0.15em] text-[var(--accent2)] mb-2 flex items-center gap-2">
            05 · Keunggulan <span className="flex-1 h-px bg-gradient-to-r from-[var(--border2)] to-transparent" />
          </div>
          <h2 className="font-[var(--heading)] text-4xl font-bold mb-2 tracking-[-0.02em]">Fitur API</h2>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-4 mt-10">
            {[
              { icon: '⚡', title: 'Real-time Streaming', desc: 'Direct link m3u8 siap pakai untuk player video apa pun.' },
              { icon: '🔍', title: 'Pencarian Cepat', desc: 'Cari anime favorit berdasarkan judul, genre, atau jadwal rilis.' },
              { icon: '🔄', title: 'Tanpa Rate Limit', desc: 'Bebas akses kapan saja, tanpa batasan jumlah request.' },
              { icon: '📦', title: 'Response JSON Ringan', desc: 'Struktur data konsisten dan mudah diintegrasikan.' },
            ].map((feat, i) => (
              <div key={i} className="glass rounded-xl p-8 glass-hover">
                <span className="text-4xl mb-4 block">{feat.icon}</span>
                <h3 className="font-[var(--heading)] text-xl font-bold mb-2">{feat.title}</h3>
                <p className="text-sm text-[var(--muted)] leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ========== SIDEBAR: KATEGORI (ringan) ========== */}
        <section className="pb-20 fade-in">
          <div className="font-[var(--mono)] text-xs font-bold uppercase tracking-[0.15em] text-[var(--accent2)] mb-2 flex items-center gap-2">
            06 · Kategori <span className="flex-1 h-px bg-gradient-to-r from-[var(--border2)] to-transparent" />
          </div>
          <h2 className="font-[var(--heading)] text-4xl font-bold mb-2 tracking-[-0.02em]">Semua Kategori</h2>
          <p className="text-[var(--muted)] mb-10 font-light text-lg">
            Data dari <code className="font-[var(--mono)] text-[var(--accent2)] bg-[rgba(124,58,237,0.08)] px-1.5 py-0.5 rounded">/api/category</code>.
          </p>
          {loadingCategories ? (
            <div className="flex flex-wrap gap-3">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="skeleton h-10 w-28 rounded-full" />
              ))}
            </div>
          ) : categories.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {categories.map((cat) => (
                <span
                  key={cat.slug || cat.name}
                  className="glass px-4 py-2 rounded-full text-sm font-medium text-[var(--accent2)] cursor-pointer transition-all hover:bg-[rgba(124,58,237,0.15)] hover:border-[var(--accent)] hover:shadow-[0_0_16px_rgba(124,58,237,0.2)]"
                  title={cat.endpoint || ''}
                >
                  {cat.name}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-[var(--muted)] text-sm">Belum ada data kategori.</p>
          )}
        </section>
      </main>

      {/* ========== FOOTER ========== */}
      <footer className="border-t border-[var(--border)] py-10 text-center text-[var(--muted)] text-sm">
        <p>7u7 API · Dibuat dengan ❤️ untuk komunitas anime</p>
      </footer>
    </>
  );
}
