import { createPortal } from 'react-dom';
import './AppointmentScheduleModal.css';

function AppointmentScheduleModal({ open, onClose, children }) {
  if (!open) return null;

  const handlePanelClick = (e) => {
    e.stopPropagation();
  };

  return createPortal(
    <div
      className="apt-schedule-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="apt-schedule-modal-title"
      onClick={onClose}
    >
      <div className="apt-schedule-modal__backdrop" aria-hidden="true" />
      <div className="apt-schedule-modal__panel" onClick={handlePanelClick}>
        <header className="apt-schedule-modal__header">
          <h2 id="apt-schedule-modal-title" className="apt-schedule-modal__title">
            약속 잡기
          </h2>
          <button
            type="button"
            className="apt-schedule-modal__close"
            onClick={(e) => {
              e.stopPropagation();
              onClose?.();
            }}
          >
            닫기
          </button>
        </header>
        <div className="apt-schedule-modal__body">{children}</div>
      </div>
    </div>,
    document.body,
  );
}

export default AppointmentScheduleModal;
