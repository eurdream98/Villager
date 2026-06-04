import { useCallback, useState } from 'react';
import TradeDetailImageViewer from './TradeDetailImageViewer';
import './Trade.css';

function GalleryImage({ url, alt, className = '', onOpen }) {
  return (
    <button
      type="button"
      className={`trade-detail__gallery-cell trade-detail__gallery-cell--btn ${className}`.trim()}
      onClick={onOpen}
      aria-label="사진 크게 보기"
    >
      <img src={url} alt={alt} className="trade-detail__image" draggable={false} />
    </button>
  );
}

/** 5번째 사진: 오른쪽 영역을 세로 50:50 — 위·아래 반쪽 각각 표시 */
function GalleryImageSplitVertical({ url, alt, onOpen }) {
  return (
    <button
      type="button"
      className="trade-detail__gallery-side trade-detail__gallery-cell--btn"
      onClick={onOpen}
      aria-label="사진 크게 보기"
    >
      <span
        className="trade-detail__gallery-side-half trade-detail__gallery-side-half--top"
        style={{ backgroundImage: `url(${JSON.stringify(url)})` }}
        aria-hidden
      />
      <span
        className="trade-detail__gallery-side-half trade-detail__gallery-side-half--bottom"
        style={{ backgroundImage: `url(${JSON.stringify(url)})` }}
        aria-hidden
      />
      <span className="visually-hidden">{alt}</span>
    </button>
  );
}

/**
 * @param {string[]} imageUrls
 * @param {string} title
 */
function TradeDetailGallery({ imageUrls, title }) {
  const allUrls = imageUrls;
  const displayUrls = allUrls.slice(0, 10);
  const count = Math.min(displayUrls.length, 5);
  const [viewerIndex, setViewerIndex] = useState(null);

  const closeViewer = useCallback(() => setViewerIndex(null), []);
  const goPrev = useCallback(() => {
    setViewerIndex((i) =>
      i === null ? null : (i - 1 + allUrls.length) % allUrls.length,
    );
  }, [allUrls.length]);
  const goNext = useCallback(() => {
    setViewerIndex((i) =>
      i === null ? null : (i + 1) % allUrls.length,
    );
  }, [allUrls.length]);

  if (displayUrls.length === 0) {
    return (
      <div className="trade-detail__gallery trade-detail__gallery--mosaic trade-detail__gallery--count-0">
        <div className="trade-detail__gallery-cell trade-detail__gallery-cell--empty">
          <span className="trade-detail__image--empty">사진 없음</span>
        </div>
      </div>
    );
  }

  const mosaicClass = `trade-detail__gallery trade-detail__gallery--mosaic trade-detail__gallery--count-${count}`;

  const viewer =
    viewerIndex !== null ? (
      <TradeDetailImageViewer
        urls={allUrls}
        index={viewerIndex}
        title={title}
        onClose={closeViewer}
        onPrev={goPrev}
        onNext={goNext}
      />
    ) : null;

  if (count === 5) {
    return (
      <>
        <div className={mosaicClass}>
          <div className="trade-detail__gallery-quad">
            {displayUrls.slice(0, 4).map((url, i) => (
              <GalleryImage
                key={`${url}-${i}`}
                url={url}
                alt={i === 0 ? title : ''}
                onOpen={() => setViewerIndex(i)}
              />
            ))}
          </div>
          <GalleryImageSplitVertical
            url={displayUrls[4]}
            alt={title}
            onOpen={() => setViewerIndex(4)}
          />
          {displayUrls.length > 5 && (
            <button
              type="button"
              className="trade-detail__gallery-more"
              onClick={() => setViewerIndex(5)}
              aria-label={`사진 ${displayUrls.length - 5}장 더 보기`}
            >
              +{displayUrls.length - 5}
            </button>
          )}
        </div>
        {viewer}
      </>
    );
  }

  return (
    <>
      <div className={mosaicClass}>
        {displayUrls.slice(0, 5).map((url, i) => (
          <GalleryImage
            key={`${url}-${i}`}
            url={url}
            alt={i === 0 ? title : ''}
            onOpen={() => setViewerIndex(i)}
          />
        ))}
        {displayUrls.length > 5 && (
          <button
            type="button"
            className="trade-detail__gallery-more"
            onClick={() => setViewerIndex(5)}
            aria-label={`사진 ${displayUrls.length - 5}장 더 보기`}
          >
            +{displayUrls.length - 5}
          </button>
        )}
      </div>
      {viewer}
    </>
  );
}

export default TradeDetailGallery;
