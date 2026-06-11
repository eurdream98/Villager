import { useState } from 'react';
import { createPortal } from 'react-dom';
import { reverseGeocode, searchLocations } from '../../lib/kakaoMap';
import './Neighborhood.css';

async function resolveNeighborhoodFromLocation(item) {
  try {
    const geo = await reverseGeocode(item.latitude, item.longitude);
    return {
      name: geo.neighborhood || item.address?.split(' ').slice(-2, -1)[0] || item.address,
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

function NeighborhoodOnboardingModal({ open, onComplete, onRegister }) {
  const [step, setStep] = useState(1);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [slot1, setSlot1] = useState(null);
  const [slot2, setSlot2] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  if (!open) return null;

  const resetSearch = () => {
    setQuery('');
    setResults([]);
    setError(null);
  };

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
      if (items.length === 0) {
        setError('검색 결과가 없습니다. 동·읍·면 이름으로 검색해 보세요.');
      }
    } catch (err) {
      setResults([]);
      setError(err.message || '검색에 실패했습니다.');
    } finally {
      setSearching(false);
    }
  };

  const handleSelect = async (item) => {
    setBusy(true);
    setError(null);
    try {
      const resolved = await resolveNeighborhoodFromLocation(item);
      if (step === 1) {
        setSlot1(resolved);
        resetSearch();
        setStep(2);
      } else {
        setSlot2(resolved);
        resetSearch();
      }
    } catch (err) {
      setError(err.message || '동네를 확인하지 못했습니다.');
    } finally {
      setBusy(false);
    }
  };

  const handleFinish = async (includeSecond) => {
    if (!slot1) {
      setError('첫 번째 동네를 등록해 주세요.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onRegister({ slot: 1, ...slot1 });
      if (includeSecond && slot2) {
        await onRegister({ slot: 2, ...slot2 });
      }
      onComplete?.();
    } catch (err) {
      setError(err.message || '동네 등록에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  };

  const currentSlot = step === 1 ? slot1 : slot2;

  return createPortal(
    <div className="neighborhood-modal" role="dialog" aria-modal="true">
      <div className="neighborhood-modal__panel">
        <h2 className="neighborhood-modal__title">내 동네 설정</h2>
        <p className="neighborhood-modal__desc">
          관심 있는 동네를 최대 2곳까지 등록할 수 있어요.
          글을 보거나 올리려면 해당 동네 인증이 필요합니다.
        </p>

        {slot1 && (
          <p className="neighborhood-modal__selected">
            1번 동네: <strong>{slot1.name}</strong>
          </p>
        )}
        {slot2 && (
          <p className="neighborhood-modal__selected">
            2번 동네: <strong>{slot2.name}</strong>
          </p>
        )}

        {step <= 2 && !currentSlot && (
          <>
            <p className="neighborhood-modal__slot-label">
              {step === 1 ? '1번 동네' : '2번 동네 (선택)'}
            </p>
            <div className="neighborhood-modal__search-row">
              <input
                type="search"
                className="neighborhood-modal__input"
                placeholder="예: 역삼동, 망원동"
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
                {searching ? '…' : '검색'}
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

        <div className="neighborhood-modal__actions">
          {step === 1 && slot1 && (
            <button
              type="button"
              className="neighborhood-modal__primary"
              onClick={() => {
                resetSearch();
                setStep(2);
              }}
            >
              2번 동네도 등록하기
            </button>
          )}
          {slot1 && (
            <button
              type="button"
              className="neighborhood-modal__primary"
              onClick={() => handleFinish(step === 2 && !!slot2)}
              disabled={busy}
            >
              {busy ? '등록 중…' : step === 2 && slot2 ? '두 동네 모두 등록' : '1번 동네만 등록하고 시작'}
            </button>
          )}
          {step === 2 && !slot2 && slot1 && (
            <button
              type="button"
              className="neighborhood-modal__secondary"
              onClick={() => handleFinish(false)}
              disabled={busy}
            >
              2번은 건너뛰기
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default NeighborhoodOnboardingModal;
