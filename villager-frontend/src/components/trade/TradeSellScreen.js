import { useState } from 'react';
import './Trade.css';

const EMPTY_FORM = {
  title: '',
  isFree: false,
  price: '',
  neighborhood: '',
  imageUrls: [],
};

function TradeSellScreen({ onClose, onSubmit }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [previews, setPreviews] = useState([]);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handlePhotos = (e) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    const newPreviews = files.map((file) => ({
      id: `${file.name}-${file.lastModified}`,
      url: URL.createObjectURL(file),
    }));

    setPreviews((prev) => [...prev, ...newPreviews].slice(0, 10));
    setForm((prev) => ({
      ...prev,
      imageUrls: [...prev.imageUrls, ...newPreviews.map((p) => p.url)].slice(0, 10),
    }));
    e.target.value = '';
  };

  const removePhoto = (id) => {
    const removed = previews.find((p) => p.id === id);
    if (removed?.url) URL.revokeObjectURL(removed.url);
    setPreviews((prev) => prev.filter((p) => p.id !== id));
    setForm((prev) => ({
      ...prev,
      imageUrls: prev.imageUrls.filter((url) => url !== removed?.url),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!form.title.trim()) {
      setError('제목을 입력해 주세요.');
      return;
    }
    if (form.imageUrls.length === 0) {
      setError('물건 사진을 1장 이상 등록해 주세요.');
      return;
    }
    if (!form.isFree && (!form.price || Number(form.price) <= 0)) {
      setError('가격을 입력하거나 무료 나눔을 선택해 주세요.');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        title: form.title,
        description: '',
        isFree: form.isFree,
        price: form.isFree ? 0 : form.price,
        neighborhood: form.neighborhood,
        imageUrls: form.imageUrls,
      });
      previews.forEach((p) => URL.revokeObjectURL(p.url));
      onClose();
    } catch (err) {
      setError(err.message || '등록에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="trade-sell" role="dialog" aria-labelledby="trade-sell-title">
      <header className="trade-sell__header">
        <button type="button" className="trade-sell__back" onClick={onClose}>
          ← 취소
        </button>
        <h2 id="trade-sell-title" className="trade-sell__title">
          물건 판매
        </h2>
      </header>

      <form className="trade-sell__form" onSubmit={handleSubmit}>
        <section className="trade-sell__section">
          <h3 className="trade-sell__label">사진</h3>
          <div className="trade-sell__photos">
            {previews.map((p) => (
              <div key={p.id} className="trade-sell__photo">
                <img src={p.url} alt="" />
                <button
                  type="button"
                  className="trade-sell__photo-remove"
                  onClick={() => removePhoto(p.id)}
                  aria-label="사진 삭제"
                >
                  ×
                </button>
              </div>
            ))}
            {previews.length < 10 && (
              <label className="trade-sell__photo-add">
                <span>+</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotos}
                  aria-label="사진 추가"
                />
              </label>
            )}
          </div>
          <p className="trade-sell__hint">최대 10장 · 거래 방법은 채팅에서 약속 잡기로 정합니다</p>
        </section>

        <section className="trade-sell__section">
          <label className="trade-sell__label" htmlFor="trade-title">
            제목
          </label>
          <input
            id="trade-title"
            className="trade-sell__input"
            type="text"
            placeholder="어떤 물건인가요?"
            maxLength={80}
            value={form.title}
            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
          />
        </section>

        <section className="trade-sell__section">
          <div className="trade-sell__row">
            <span className="trade-sell__label">무료 나눔</span>
            <label className="trade-sell__toggle">
              <input
                type="checkbox"
                checked={form.isFree}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    isFree: e.target.checked,
                    price: e.target.checked ? '' : prev.price,
                  }))
                }
              />
              <span className="trade-sell__toggle-ui" />
            </label>
          </div>
          {!form.isFree && (
            <>
              <label className="trade-sell__label" htmlFor="trade-price">
                가격 (원)
              </label>
              <input
                id="trade-price"
                className="trade-sell__input"
                type="number"
                min="0"
                step="100"
                placeholder="0"
                value={form.price}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, price: e.target.value }))
                }
              />
            </>
          )}
        </section>

        <section className="trade-sell__section">
          <label className="trade-sell__label" htmlFor="trade-neighborhood">
            동네 (선택)
          </label>
          <input
            id="trade-neighborhood"
            className="trade-sell__input"
            type="text"
            placeholder="예: 역삼동"
            value={form.neighborhood}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, neighborhood: e.target.value }))
            }
          />
        </section>

        {error && (
          <p className="trade-sell__error" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          className="trade-sell__submit"
          disabled={submitting}
        >
          {submitting ? '등록 중…' : '판매 글 올리기'}
        </button>
      </form>
    </div>
  );
}

export default TradeSellScreen;
