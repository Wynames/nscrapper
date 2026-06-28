import { useState } from 'react';

/**
 * Card — Komponen reusable untuk menampilkan item anime/video.
 *
 * Props:
 * - title   (string)  Judul anime
 * - image   (string)  URL poster/gambar
 * - url     (string)  URL tujuan saat kartu diklik
 * - description (string, opsional)  Deskripsi singkat
 */
export default function Card({ title, image, url, description }) {
  const [imgError, setImgError] = useState(false);

  const handleClick = () => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div
      className="card-glass cursor-pointer group"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') handleClick();
      }}
      title={title}
    >
      {/* Poster */}
      <div className="relative w-full h-48 overflow-hidden bg-[rgba(0,0,0,0.4)]">
        {!imgError && image ? (
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl text-[var(--muted2)]">
            🎬
          </div>
        )}
        {/* Overlay neon saat hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-[rgba(124,58,237,0.2)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-[var(--heading)] text-base font-bold text-[var(--text)] truncate group-hover:text-[var(--accent2)] transition-colors">
          {title || 'Tanpa Judul'}
        </h3>
        {description && (
          <p className="text-sm text-[var(--muted)] mt-1.5 line-clamp-2 leading-relaxed">
            {description}
          </p>
        )}
        {url && (
          <div className="mt-3 flex items-center gap-1 text-xs text-[var(--accent2)] font-[var(--mono)] opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <span>🔗</span>
            <span className="truncate">{url}</span>
          </div>
        )}
      </div>
    </div>
  );
}
