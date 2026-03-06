import { useState } from 'react';

const spotifyOptions = [
  {
    label: 'RapCaviar (Hip-Hop / Rap)',
    src: 'https://open.spotify.com/embed/playlist/37i9dQZF1DX0XUsuxWHRQd?utm_source=generator&theme=0',
  },
  {
    label: 'Most Necessary (Rap)',
    src: 'https://open.spotify.com/embed/playlist/37i9dQZF1DX2RxBh64BHjQ?utm_source=generator&theme=0',
  },
  {
    label: 'Old School Rap',
    src: 'https://open.spotify.com/embed/playlist/37i9dQZF1DWT5MrZnPU1zD?utm_source=generator&theme=0',
  },
];

export default function SpotifyFloatingWidget() {
  const [spotifyOpen, setSpotifyOpen] = useState(false);
  const [spotifyStarted, setSpotifyStarted] = useState(false);
  const [spotifySrc, setSpotifySrc] = useState(spotifyOptions[0].src);

  const toggleSpotify = () => {
    if (!spotifyStarted) {
      setSpotifyStarted(true);
      setSpotifyOpen(true);
      return;
    }
    setSpotifyOpen((prev) => !prev);
  };

  return (
    <div className="fixed bottom-4 right-4 z-[70] flex flex-col items-end gap-2">
      {spotifyStarted && (
        <div
          className={
            spotifyOpen
              ? 'w-[92vw] max-w-sm overflow-hidden rounded-2xl border border-white/15 bg-black/92 shadow-2xl backdrop-blur md:w-[340px]'
              : 'fixed -left-[9999px] top-0 h-px w-px overflow-hidden opacity-0'
          }
        >
          {spotifyOpen && (
            <>
              <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-white">Spotify Mood</p>
                <button
                  type="button"
                  onClick={() => setSpotifyOpen(false)}
                  className="rounded-md border border-white/20 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-200 hover:border-white/40"
                >
                  Cerrar
                </button>
              </div>

              <div className="border-b border-white/10 px-3 py-2">
                <label className="mb-1 block text-[10px] font-black uppercase tracking-[0.12em] text-zinc-400">Playlist</label>
                <select
                  value={spotifySrc}
                  onChange={(e) => setSpotifySrc(e.target.value)}
                  className="w-full rounded-md border border-white/20 bg-black/40 px-2 py-2 text-xs text-zinc-100 outline-none"
                >
                  {spotifyOptions.map((opt) => (
                    <option key={opt.src} value={opt.src} className="text-slate-900">
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          <iframe
            title="Spotify Rap Hip Hop"
            src={spotifySrc}
            width="100%"
            height="152"
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
          />
        </div>
      )}

        <button
          type="button"
        onClick={toggleSpotify}
          className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-black/90 text-[#1DB954] shadow-xl transition hover:scale-105"
          aria-label={spotifyOpen ? 'Cerrar Spotify' : 'Abrir Spotify'}
          title={spotifyOpen ? 'Cerrar Spotify' : 'Abrir Spotify'}
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current" aria-hidden="true">
          <path d="M12 1.75a10.25 10.25 0 1 0 10.25 10.25A10.26 10.26 0 0 0 12 1.75Zm4.67 14.77a.64.64 0 0 1-.88.21 9.56 9.56 0 0 0-8.36-.86.64.64 0 0 1-.42-1.2 10.84 10.84 0 0 1 9.46.98.64.64 0 0 1 .2.87Zm1.26-2.1a.8.8 0 0 1-1.1.26 11.96 11.96 0 0 0-10.6-1.02.8.8 0 1 1-.55-1.5 13.56 13.56 0 0 1 11.96 1.14.8.8 0 0 1 .3 1.1Zm.13-2.27a14.44 14.44 0 0 0-12.39-1.1.96.96 0 0 1-.62-1.82 16.37 16.37 0 0 1 14.06 1.24.96.96 0 0 1-1.05 1.68Z" />
        </svg>
      </button>
    </div>
  );
}
