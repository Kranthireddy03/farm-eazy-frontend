import { useMemo, useState } from 'react';

const imagePattern = /\.(jpg|jpeg|png|gif|webp|avif|bmp|svg)(\?.*)?$/i;
const videoPattern = /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i;

function detectMediaType(url, videoUrlSet) {
  if (!url || typeof url !== 'string') return 'image';
  if (videoUrlSet && videoUrlSet.has(url.trim())) return 'video';
  if (videoPattern.test(url)) return 'video';
  if (imagePattern.test(url)) return 'image';
  return 'image';
}

function getVideoMimeType(url) {
  if (/\.webm(\?.*)?$/i.test(url || '')) return 'video/webm';
  if (/\.ogg(\?.*)?$/i.test(url || '')) return 'video/ogg';
  if (/\.mov(\?.*)?$/i.test(url || '')) return 'video/quicktime';
  if (/\.m4v(\?.*)?$/i.test(url || '')) return 'video/x-m4v';
  return 'video/mp4';
}

export default function ProductMediaCarousel({ mediaUrls, videoUrls }) {
  const videoUrlSet = useMemo(() => new Set((videoUrls || []).filter(Boolean).map((url) => url.trim())), [videoUrls]);
  const items = useMemo(
    () => (mediaUrls || []).filter((url) => typeof url === 'string' && url.trim()).map((url) => ({
      url: url.trim(),
      type: detectMediaType(url, videoUrlSet)
    })),
    [mediaUrls, videoUrlSet]
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const [dragStart, setDragStart] = useState(null);

  if (!items.length) {
    return <div className="flex items-center justify-center h-full text-6xl">📦</div>;
  }

  const handlePrev = () => setActiveIndex((prev) => (prev === 0 ? items.length - 1 : prev - 1));
  const handleNext = () => setActiveIndex((prev) => (prev === items.length - 1 ? 0 : prev + 1));

  const handleDragStart = (e) => {
    setDragStart(e.type === 'touchstart' ? e.touches[0].clientX : e.clientX);
  };

  const handleDragEnd = (e) => {
    if (dragStart === null) return;
    const endX = e.type === 'touchend' ? (e.changedTouches[0]?.clientX || 0) : e.clientX;
    if (endX - dragStart > 60) handlePrev();
    if (dragStart - endX > 60) handleNext();
    setDragStart(null);
  };

  const activeItem = items[activeIndex];

  return (
    <div className="h-full w-full grid grid-cols-1 md:grid-cols-[5.2rem_minmax(0,1fr)] gap-3 p-3">
      <div className="order-2 md:order-1 flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto md:max-h-[28rem] pr-1">
        {items.map((item, index) => (
          <button
            type="button"
            key={`${item.url}-${index}`}
            onClick={() => setActiveIndex(index)}
            className={`relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border transition-all ${
              index === activeIndex
                ? 'border-primary ring-2 ring-emerald-200 dark:ring-emerald-900/50'
                : 'border-border dark:border-border hover:border-primary'
            }`}
          >
            {item.type === 'video' ? (
              <div className="w-full h-full bg-card flex items-center justify-center text-white text-xs font-semibold">VIDEO</div>
            ) : (
              <img src={item.url} alt={`Media ${index + 1}`} className="w-full h-full object-cover" loading="lazy" />
            )}
          </button>
        ))}
      </div>

      <div
        className="order-1 md:order-2 relative h-96 md:h-[28rem] rounded-2xl overflow-hidden bg-muted dark:bg-muted"
        onMouseDown={handleDragStart}
        onMouseUp={handleDragEnd}
        onTouchStart={handleDragStart}
        onTouchEnd={handleDragEnd}
      >
        {activeItem.type === 'video' ? (
          <video
            key={activeItem.url}
            controls
            playsInline
            preload="metadata"
            className="w-full h-full object-contain bg-black"
          >
            <source src={activeItem.url} type={getVideoMimeType(activeItem.url)} />
            Your browser does not support this video format.
          </video>
        ) : (
          <img
            key={activeItem.url}
            src={activeItem.url}
            alt="Product media"
            className="w-full h-full object-contain"
            loading="eager"
          />
        )}

        {items.length > 1 && (
          <>
            <button
              type="button"
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 dark:bg-card/85 text-foreground dark:text-slate-100 rounded-full w-10 h-10 shadow-md"
              onClick={handlePrev}
              aria-label="Previous"
            >
              ‹
            </button>
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 dark:bg-card/85 text-foreground dark:text-slate-100 rounded-full w-10 h-10 shadow-md"
              onClick={handleNext}
              aria-label="Next"
            >
              ›
            </button>
          </>
        )}
      </div>
    </div>
  );
}
