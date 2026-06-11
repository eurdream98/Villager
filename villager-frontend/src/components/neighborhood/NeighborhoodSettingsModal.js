import { useState } from 'react';
import { createPortal } from 'react-dom';
import { reverseGeocode, searchLocations } from '../../lib/kakaoMap';
import { isNeighborhoodVerified } from '../../lib/neighborhoodApi';
import './Neighborhood.css';

async function resolveNeighborhoodFromLocation(item) {
  try {
    const geo = await reverseGeocode(item.latitude, item.longitude);
    return {
      name: geo.neighborhood || item.address,
      latitude: item.latitude,
      longitude: item.longitude,
    };
  } catch {
    return {
      name: item.address,
      latitude: item.latitude,
      longitude: item.longitude,
    };
  }
}

function NeighborhoodSettingsModal({
  open,
  neighborhoods,
  onClose,
  onRegister,
  onVerify,
}) {
  const [editingSlot, setEditingSlot] = useState(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  if (!open) return null;

  const handleSearch = async () => {
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
    } catch (err) {
      setError(err.message || '검색에 실패했습니다.');
    } finally {
      setSearching(false);
    }
  };

  const handleSelect = async (item) => {
    if (!editingSlot) return;
    setBusy(true);
    setError(null);
    try {
      const resolved = await resolveNeighborhoodFromLocation(item);
      await onRegister({ slot: editingSlot, ...resolved });
      setEditingSlot(null);
      setQuery('');
      setResults([]);
    } catch (err) {
      setError(err.message || '동네 변경에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  };

  const handleVerify = async (row) => {
    setBusy(true);
    setError(null);
    try {
      await onVerify(row.id);
    } catch (err) {
      setError(err.message || '동네 인증에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  };

  return createPortal(
    <div className="neighborhood-modal" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="neighborhood-modal__panel" onClick={(e) => e.stopPropagation()}>
        <h2 className="neighborhood-modal__title">동네 설정</h2>
        <p className="neighborhood-modal__desc">
          등록한 동네의 물건·글이 피드에 표시됩니다. 거래·글쓰기는 동네 인증 후 가능해요.
        </p>

        {[1, 2].map((slot) => {
          const row = neighborhoods.find((n) => n.slot === slot);
          const verified = row && isNeighborhoodVerified(row);
          return (
            <div key={slot} style={{ marginBottom: '1rem' }}>
              <p className="neighborhood-modal__slot-label">{slot}번 동네</p>
              {row ? (
                <div className="neighborhood-modal__selected">
                  <strong>{row.neighborhoodName}</strong>
                  {' · '}
                  {verified ? '인증 완료' : '미인증'}
                  <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                    {!verified && (
                      <button
                        type="button"
                        className="neighborhood-modal__search-btn"
                        onClick={() => handleVerify(row)}
                        disabled={busy}
                      >
                        인증하기
                      </button>
                    )}
                    <button
                      type="button"
                      className="neighborhood-modal__secondary"
                      style={{ padding: '0.4rem 0.6rem' }}
                      onClick={() => {
                        setEditingSlot(slot);
                        setQuery('');
                        setResults([]);
                      }}
                      disabled={busy}
                    >
                      변경
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className="neighborhood-modal__primary"
                  onClick={() => setEditingSlot(slot)}
                  disabled={busy}
                >
                  {slot}번 동네 등록
                </button>
              )}
            </div>
          );
        })}

        {editingSlot && (
          <>
            <p className="neighborhood-modal__slot-label">{editingSlot}번 동네 검색</p>
            <div className="neighborhood-modal__search-row">
              <input
                type="search"
                className="neighborhood-modal__input"
                placeholder="동네 이름 검색"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button
                type="button"
                className="neighborhood-modal__search-btn"
                onClick={handleSearch}
                disabled={searching}
              >
                검색
              </button>
            </div>
            {results.length > 0 && (
              <ul className="neighborhood-modal__results">
                {results.map((item) => (
                  <li key={`${item.latitude},${item.longitude}`}>
                    <button
                      type="button"
                      className="neighborhood-modal__result-item"
                      onClick={() => handleSelect(item)}
                      disabled={busy}
                    >
                      {item.address}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        {error && (
          <p className="neighborhood-modal__error" role="alert">
            {error}
          </p>
        )}

        <button type="button" className="neighborhood-modal__secondary" onClick={onClose}>
          닫기
        </button>
      </div>
    </div>,
    document.body,
  );
}

export default NeighborhoodSettingsModal;
