import { useEffect } from 'react';
import './Trade.css';

function TradeDetailImageViewer({ urls, index, title, onClose, onPrev, onNext }) {
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onPrev();
      if (e.key === 'ArrowRight') onNext();
    };
    window.addEventListener('keydown', onKey);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose, onPrev, onNext]);

  const url = urls[index];
  const hasMultiple = urls.length > 1;

  return (
    <div
      className="trade-detail-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={`${title} 사진 보기`}
    >
      <button
        type="button"
        className="trade-detail-lightbox__backdrop"
        onClick={onClose}
        aria-label="닫기"
      />

      <div className="trade-detail-lightbox__panel">
        <header className="trade-detail-lightbox__header">
          <span className="trade-detail-lightbox__counter">
            {index + 1} / {urls.length}
          </span>
          <button
            type="button"
            className="trade-detail-lightbox__close"
            onClick={onClose}
            aria-label="닫기"
          >
            ×
          </button>
        </header>

        <div className="trade-detail-lightbox__stage">
          {hasMultiple && (
            <button
              type="button"
              className="trade-detail-lightbox__nav trade-detail-lightbox__nav--prev"
              onClick={onPrev}
              aria-label="이전 사진"
            >
              ‹
            </button>
          )}

          <img
            src={url}
            alt={`${title} ${index + 1}`}
            className="trade-detail-lightbox__img"
          />

          {hasMultiple && (
            <button
              type="button"
              className="trade-detail-lightbox__nav trade-detail-lightbox__nav--next"
              onClick={onNext}
              aria-label="다음 사진"
            >
              ›
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default TradeDetailImageViewer;
