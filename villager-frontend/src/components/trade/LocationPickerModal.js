import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import LocationPicker from './LocationPicker';
import './LocationPickerModal.css';

function LocationPickerModal({ open, value, onConfirm, onClose }) {
  const [draft, setDraft] = useState(value ?? {});

  useEffect(() => {
    if (open) {
      setDraft(value ?? {});
    }
  }, [open, value]);

  if (!open) return null;

  const canConfirm = draft?.latitude != null && draft?.longitude != null;

  const handlePanelClick = (e) => {
    e.stopPropagation();
  };

  return createPortal(
    <div
      className="location-picker-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="location-picker-modal-title"
      onClick={onClose}
    >
      <div className="location-picker-modal__backdrop" aria-hidden="true" />
      <div className="location-picker-modal__panel" onClick={handlePanelClick}>
        <h2 id="location-picker-modal-title" className="location-picker-modal__title">
          거래 장소 정하기
        </h2>
        <p className="location-picker-modal__desc">
          검색하거나 지도를 탭해서 위치를 정한 뒤 「이 위치로 정하기」를 눌러 주세요.
        </p>
        <LocationPicker
          key={open ? 'picker-open' : 'picker-closed'}
          value={draft}
          onChange={setDraft}
          showZoomControl
          mapClassName="location-picker__map--modal"
        />
        <div className="location-picker-modal__actions">
          <button
            type="button"
            className="location-picker-modal__btn"
            onClick={(e) => {
              e.stopPropagation();
              onClose?.();
            }}
          >
            취소
          </button>
          <button
            type="button"
            className="location-picker-modal__btn location-picker-modal__btn--primary"
            disabled={!canConfirm}
            onClick={(e) => {
              e.stopPropagation();
              onConfirm?.(draft);
            }}
          >
            이 위치로 정하기
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default LocationPickerModal;
