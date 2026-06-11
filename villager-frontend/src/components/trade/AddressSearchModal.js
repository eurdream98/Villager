import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { searchLocations } from '../../lib/kakaoMap';
import './AddressSearchModal.css';

function AddressSearchModal({ open, onClose, onSelect }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setResults([]);
    setError(null);
    setSearching(false);
  }, [open]);

  const runSearch = async () => {
    const keyword = query.trim();
    if (keyword.length < 2) {
      setError('검색어를 2글자 이상 입력해 주세요.');
      return;
    }

    setSearching(true);
    setError(null);
    try {
      const items = await searchLocations(keyword);
      setResults(items);
      if (items.length === 0) {
        setError('검색 결과가 없습니다. 도로명·상호명·역 이름으로 다시 검색해 보세요.');
      }
    } catch (err) {
      setResults([]);
      setError(err.message || '검색에 실패했습니다.');
    } finally {
      setSearching(false);
    }
  };

  const handleSelect = (item) => {
    onSelect?.(item);
    onClose?.();
  };

  const handlePanelClick = (e) => {
    e.stopPropagation();
  };

  if (!open) return null;

  return createPortal(
    <div
      className="address-search-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="address-search-modal-title"
      onClick={onClose}
    >
      <div className="address-search-modal__backdrop" aria-hidden="true" />
      <div className="address-search-modal__panel" onClick={handlePanelClick}>
        <h2 id="address-search-modal-title" className="address-search-modal__title">
          주소·장소 검색
        </h2>
        <p className="address-search-modal__desc">
          도로명 주소, 상호명, 역·건물 이름으로 검색할 수 있어요.
        </p>
        <div className="address-search-modal__form">
          <input
            type="search"
            className="address-search-modal__input"
            placeholder="예: 스타벅스 강남역, 테헤란로 152"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                runSearch();
              }
            }}
            maxLength={100}
            autoFocus
          />
          <button
            type="button"
            className="address-search-modal__btn address-search-modal__btn--primary"
            disabled={searching}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              runSearch();
            }}
          >
            {searching ? '검색 중…' : '검색'}
          </button>
        </div>

        {error && (
          <p className="address-search-modal__error" role="alert">
            {error}
          </p>
        )}

        {results.length > 0 && (
          <ul className="address-search-modal__results">
            {results.map((item, i) => (
              <li key={`${item.address}-${item.latitude}-${i}`}>
                <button
                  type="button"
                  className="address-search-modal__result"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelect(item);
                  }}
                >
                  {item.kind === 'place' && (
                    <span className="address-search-modal__badge">장소</span>
                  )}
                  {item.address}
                </button>
              </li>
            ))}
          </ul>
        )}

        <button
          type="button"
          className="address-search-modal__cancel"
          onClick={(e) => {
            e.stopPropagation();
            onClose?.();
          }}
        >
          취소
        </button>
      </div>
    </div>,
    document.body,
  );
}

export default AddressSearchModal;
