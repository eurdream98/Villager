import { useState } from 'react';
import { uploadListingImages } from '../../lib/listingImages';
import { createGroupBuy, localDateTimeToIso } from '../../lib/groupBuyApi';
import './GroupBuy.css';

const EMPTY = {
  title: '',
  description: '',
  pricePerUnit: '',
  externalUrl: '',
  minCommitted: '5',
  maxCommitted: '',
  deadlineAt: '',
  pickupLocation: '',
  pickupStartAt: '',
  pickupEndAt: '',
  pickupNotes: '',
  neighborhood: '',
};

function defaultDeadline() {
  const d = new Date();
  d.setDate(d.getDate() + 3);
  d.setMinutes(0, 0, 0);
  return d.toISOString().slice(0, 16);
}

function defaultPickupStart() {
  const d = new Date();
  d.setDate(d.getDate() + 5);
  d.setHours(14, 0, 0, 0);
  return d.toISOString().slice(0, 16);
}

function defaultPickupEnd() {
  const d = new Date();
  d.setDate(d.getDate() + 5);
  d.setHours(16, 0, 0, 0);
  return d.toISOString().slice(0, 16);
}

function GroupBuyCreateScreen({ user, member, onBack, onCreated }) {
  const [form, setForm] = useState({
    ...EMPTY,
    deadlineAt: defaultDeadline(),
    pickupStartAt: defaultPickupStart(),
    pickupEndAt: defaultPickupEnd(),
    neighborhood: member?.neighborhood ?? '',
  });
  const [previews, setPreviews] = useState([]);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handlePhotos = (e) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const newPreviews = files.map((file) => ({
      id: `${file.name}-${file.lastModified}`,
      file,
      url: URL.createObjectURL(file),
    }));
    setPreviews((prev) => [...prev, ...newPreviews].slice(0, 10));
    e.target.value = '';
  };

  const removePhoto = (id) => {
    const removed = previews.find((p) => p.id === id);
    if (removed?.url) URL.revokeObjectURL(removed.url);
    setPreviews((prev) => prev.filter((p) => p.id !== id));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!form.title.trim()) {
      setError('제목을 입력해 주세요.');
      return;
    }
    if (!form.pricePerUnit || Number(form.pricePerUnit) <= 0) {
      setError('1인당 가격을 입력해 주세요.');
      return;
    }
    if (!form.minCommitted || Number(form.minCommitted) < 2) {
      setError('최소 확정 인원은 2명 이상이어야 합니다.');
      return;
    }
    if (!form.pickupLocation.trim()) {
      setError('픽업 장소를 입력해 주세요.');
      return;
    }
    if (previews.length === 0) {
      setError('상품 사진을 1장 이상 등록해 주세요.');
      return;
    }
    if (!user?.id) {
      setError('로그인 후 등록할 수 있습니다.');
      return;
    }

    setSubmitting(true);
    try {
      const imageUrls = await uploadListingImages(
        previews.map((p) => p.file),
        user.id,
      );
      const created = await createGroupBuy({
        title: form.title.trim(),
        description: form.description.trim(),
        pricePerUnit: Number(form.pricePerUnit),
        externalUrl: form.externalUrl.trim() || null,
        minCommitted: Number(form.minCommitted),
        maxCommitted: form.maxCommitted ? Number(form.maxCommitted) : null,
        deadlineAt: localDateTimeToIso(form.deadlineAt),
        pickupLocation: form.pickupLocation.trim(),
        pickupStartAt: localDateTimeToIso(form.pickupStartAt),
        pickupEndAt: localDateTimeToIso(form.pickupEndAt),
        pickupNotes: form.pickupNotes.trim(),
        neighborhood: form.neighborhood.trim() || null,
        imageUrls,
      });
      previews.forEach((p) => URL.revokeObjectURL(p.url));
      onCreated(created.id);
    } catch (err) {
      setError(err.message || '등록에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="group-buy-screen">
      <button type="button" className="group-buy-screen__back" onClick={onBack}>
        ← 목록
      </button>
      <h2 className="group-buy-detail__title">공동구매 열기</h2>
      <p className="group-buy-detail__desc">
        외부 쇼핑몰·오프라인 상품 링크와 사진을 등록하고, 이웃의 관심·확정 참여를 모집합니다.
      </p>

      {error && (
        <div className="group-buy-alert group-buy-alert--error" role="alert">
          {error}
        </div>
      )}

      <form className="group-buy-form" onSubmit={handleSubmit}>
        <div className="group-buy-field">
          <label htmlFor="gb-title">상품명</label>
          <input
            id="gb-title"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="예: 유기농 계란 30구"
          />
        </div>

        <div className="group-buy-field">
          <label htmlFor="gb-desc">설명</label>
          <textarea
            id="gb-desc"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="상품 설명, 구매처 정보 등"
          />
        </div>

        <div className="group-buy-field">
          <label htmlFor="gb-url">구매 링크 (선택)</label>
          <input
            id="gb-url"
            type="url"
            value={form.externalUrl}
            onChange={(e) => setForm((f) => ({ ...f, externalUrl: e.target.value }))}
            placeholder="https://..."
          />
        </div>

        <div className="group-buy-field">
          <label>상품 사진</label>
          <div className="group-buy-photos">
            {previews.map((p) => (
              <div key={p.id} className="group-buy-photo">
                <img src={p.url} alt="" />
                <button type="button" onClick={() => removePhoto(p.id)} aria-label="삭제">
                  ×
                </button>
              </div>
            ))}
          </div>
          <input type="file" accept="image/*" multiple onChange={handlePhotos} />
        </div>

        <div className="group-buy-field">
          <label htmlFor="gb-price">1인당 가격 (원)</label>
          <input
            id="gb-price"
            type="number"
            min="1"
            value={form.pricePerUnit}
            onChange={(e) => setForm((f) => ({ ...f, pricePerUnit: e.target.value }))}
          />
        </div>

        <div className="group-buy-field">
          <label htmlFor="gb-min">최소 확정 인원</label>
          <input
            id="gb-min"
            type="number"
            min="2"
            value={form.minCommitted}
            onChange={(e) => setForm((f) => ({ ...f, minCommitted: e.target.value }))}
          />
          <p className="group-buy-field__hint">확정 참여(결제 의사) 인원이 이 수에 도달하면 자동 성사됩니다.</p>
        </div>

        <div className="group-buy-field">
          <label htmlFor="gb-max">최대 확정 인원 (선택)</label>
          <input
            id="gb-max"
            type="number"
            min="2"
            value={form.maxCommitted}
            onChange={(e) => setForm((f) => ({ ...f, maxCommitted: e.target.value }))}
          />
        </div>

        <div className="group-buy-field">
          <label htmlFor="gb-deadline">모집 마감</label>
          <input
            id="gb-deadline"
            type="datetime-local"
            value={form.deadlineAt}
            onChange={(e) => setForm((f) => ({ ...f, deadlineAt: e.target.value }))}
          />
        </div>

        <div className="group-buy-panel">
          <p className="group-buy-panel__title">픽업 타임 (공통)</p>
          <p className="group-buy-panel__text">
            개별 약속 없이, 아래 시간대에 같은 장소로 오시면 됩니다. 등록자가 한 번에 배분합니다.
          </p>
        </div>

        <div className="group-buy-field">
          <label htmlFor="gb-pickup-loc">픽업 장소</label>
          <input
            id="gb-pickup-loc"
            value={form.pickupLocation}
            onChange={(e) => setForm((f) => ({ ...f, pickupLocation: e.target.value }))}
            placeholder="예: OO아파트 정문 벤치"
          />
        </div>

        <div className="group-buy-field">
          <label htmlFor="gb-pickup-start">픽업 시작</label>
          <input
            id="gb-pickup-start"
            type="datetime-local"
            value={form.pickupStartAt}
            onChange={(e) => setForm((f) => ({ ...f, pickupStartAt: e.target.value }))}
          />
        </div>

        <div className="group-buy-field">
          <label htmlFor="gb-pickup-end">픽업 종료</label>
          <input
            id="gb-pickup-end"
            type="datetime-local"
            value={form.pickupEndAt}
            onChange={(e) => setForm((f) => ({ ...f, pickupEndAt: e.target.value }))}
          />
          <p className="group-buy-field__hint">2~3시간 정도의 넓은 시간대를 권장합니다.</p>
        </div>

        <div className="group-buy-field">
          <label htmlFor="gb-pickup-notes">픽업 안내 (선택)</label>
          <textarea
            id="gb-pickup-notes"
            value={form.pickupNotes}
            onChange={(e) => setForm((f) => ({ ...f, pickupNotes: e.target.value }))}
            placeholder="예: 이름 말씀해 주시면 드립니다. 주차는 1시간 무료."
          />
        </div>

        <button type="submit" className="group-buy-btn group-buy-btn--primary" disabled={submitting}>
          {submitting ? '등록 중…' : '공동구매 등록'}
        </button>
      </form>
    </div>
  );
}

export default GroupBuyCreateScreen;
