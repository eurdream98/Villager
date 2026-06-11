import { useEffect, useState } from 'react';
import {
  APPOINTMENT_STATUS,
  formatAppointmentSummary,
  getLocationPlaceholder,
  seedAppointmentLocationFromListing,
  validateAppointmentDraft,
} from '../../lib/appointment';
import { buildKakaoMapLink } from '../../lib/listingLocation';
import { TRADE_METHODS } from '../../lib/trade';
import { isSameUser } from '../../lib/userId';
import AppointmentScheduleModal from './AppointmentScheduleModal';
import LocationPicker from './LocationPicker';
import './Trade.css';

function AppointmentMapLink({ appointment }) {
  const summary = formatAppointmentSummary(appointment);
  const href = buildKakaoMapLink({
    label: summary.address || summary.location,
    latitude: summary.latitude,
    longitude: summary.longitude,
  });
  if (!href) return null;
  return (
    <>
      <br />
      <a
        className="trade-apt__map-link"
        href={href}
        target="_blank"
        rel="noopener noreferrer"
      >
        카카오맵에서 보기
      </a>
    </>
  );
}

function AppointmentLocationSummary({ appointment }) {
  const summary = formatAppointmentSummary(appointment);
  return (
    <div>
      <dt>거래 장소</dt>
      <dd>
        {summary.location}
        <AppointmentMapLink appointment={appointment} />
      </dd>
    </div>
  );
}

function TradeAppointmentPanel({
  appointment,
  order,
  currentUserId,
  sellerId,
  listingFree,
  listingLocation,
  sellerPayoutVerified,
  useFormModal = false,
  onOpenPayoutAccount,
  onPropose,
  onConfirm,
  onReset,
}) {
  const [expanded, setExpanded] = useState(false);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [tradeMethod, setTradeMethod] = useState('meet');
  const [scheduledAt, setScheduledAt] = useState('');
  const [locationMode, setLocationMode] = useState('map');
  const [locationText, setLocationText] = useState('');
  const [mapLocation, setMapLocation] = useState({
    latitude: null,
    longitude: null,
    address: '',
  });
  const [error, setError] = useState(null);

  const isSeller = currentUserId === sellerId;
  const roleLabel = isSeller ? '판매자' : '구매자';
  const isEscrowDraft =
    !listingFree && (tradeMethod === 'shipping' || tradeMethod === 'door');
  const isFormOpen = useFormModal ? formModalOpen : expanded;

  useEffect(() => {
    if (!isFormOpen) return;
    const seeded = seedAppointmentLocationFromListing(listingLocation);
    setLocationText(seeded.location);
    setMapLocation({
      latitude: seeded.latitude,
      longitude: seeded.longitude,
      address: seeded.address,
    });
  }, [isFormOpen, listingLocation]);

  useEffect(() => {
    if (!isFormOpen) return;
    setLocationMode(tradeMethod === 'meet' ? 'map' : 'text');
  }, [isFormOpen, tradeMethod]);

  const closeForm = () => {
    if (useFormModal) {
      setFormModalOpen(false);
    } else {
      setExpanded(false);
    }
  };

  const openForm = () => {
    if (useFormModal) {
      setFormModalOpen(true);
    } else {
      setExpanded(true);
    }
  };

  const handleTradeMethodChange = (methodId) => {
    setTradeMethod(methodId);
    if (methodId === 'meet') {
      setLocationMode('map');
    } else {
      setLocationMode('text');
    }
  };

  const handlePropose = (e) => {
    e.preventDefault();
    setError(null);

    const locationSummary =
      locationMode === 'map'
        ? (mapLocation.address || locationText).trim()
        : locationText.trim();

    const validationError = validateAppointmentDraft({
      tradeMethod,
      scheduledAt,
      location: locationSummary,
      locationMode,
      mapLocation,
    });
    if (validationError) {
      setError(validationError);
      return;
    }

    onPropose({
      tradeMethod,
      scheduledAt,
      location: locationSummary,
      latitude: locationMode === 'map' ? mapLocation.latitude : null,
      longitude: locationMode === 'map' ? mapLocation.longitude : null,
      address: locationMode === 'map' ? mapLocation.address || '' : '',
    });
    closeForm();
  };

  const handleConfirm = async () => {
    try {
      await onConfirm();
    } catch (err) {
      setError(err.message || '약속 수락에 실패했습니다.');
    }
  };

  const proposeForm = (
    <form className="trade-apt__form" onSubmit={handlePropose}>
      <fieldset className="trade-apt__fieldset">
        <legend className="trade-apt__legend">거래 방법</legend>
        <ul className="trade-apt__methods">
          {TRADE_METHODS.map((m) => (
            <li key={m.id}>
              <label className="trade-apt__method-label">
                <input
                  type="radio"
                  name="apt-method"
                  value={m.id}
                  checked={tradeMethod === m.id}
                  onChange={() => handleTradeMethodChange(m.id)}
                />
                <span>{m.label}</span>
                {m.id === 'meet' && (
                  <span className="trade-apt__method-note">현장 결제</span>
                )}
                {(m.id === 'shipping' || m.id === 'door') && (
                  <span className="trade-apt__method-note trade-apt__method-note--escrow">
                    에스크로
                  </span>
                )}
              </label>
            </li>
          ))}
        </ul>
      </fieldset>

      <label className="trade-apt__legend" htmlFor="apt-time">
        거래 시간
      </label>
      <input
        id="apt-time"
        className="trade-apt__input"
        type="datetime-local"
        value={scheduledAt}
        onChange={(e) => setScheduledAt(e.target.value)}
        required
      />

      <span className="trade-apt__legend">거래 장소</span>
      {listingLocation && (listingLocation.address || listingLocation.neighborhood) && (
        <p className="trade-apt__hint trade-apt__hint--listing-loc">
          판매자 희망 위치를 기본값으로 불러왔어요. 약속에 맞게 다시 정해 주세요.
        </p>
      )}

      <div className="trade-sell__location-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={locationMode === 'map'}
          className={`trade-sell__location-tab${locationMode === 'map' ? ' trade-sell__location-tab--active' : ''}`}
          onClick={() => setLocationMode('map')}
        >
          지도로 찍기
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={locationMode === 'text'}
          className={`trade-sell__location-tab${locationMode === 'text' ? ' trade-sell__location-tab--active' : ''}`}
          onClick={() => setLocationMode('text')}
        >
          직접 입력
        </button>
      </div>

      {locationMode === 'map' ? (
        <LocationPicker
          value={{
            latitude: mapLocation.latitude,
            longitude: mapLocation.longitude,
            address: mapLocation.address,
          }}
          onChange={(loc) => {
            setMapLocation({
              latitude: loc.latitude,
              longitude: loc.longitude,
              address: loc.address ?? '',
            });
            if (loc.address) {
              setLocationText(loc.address);
            }
          }}
        />
      ) : (
        <input
          id="apt-location"
          className="trade-apt__input"
          type="text"
          placeholder={getLocationPlaceholder(tradeMethod)}
          value={locationText}
          onChange={(e) => setLocationText(e.target.value)}
          maxLength={200}
          required
        />
      )}

      {isSeller && isEscrowDraft && sellerPayoutVerified === false && (
        <p className="trade-apt__hint trade-apt__hint--warn">
          택배·문고리 에스크로는 <strong>정산 계좌 인증</strong>이 필요합니다.
          {onOpenPayoutAccount ? (
            <>
              {' '}
              <button
                type="button"
                className="trade-apt__link"
                onClick={onOpenPayoutAccount}
              >
                정산 계좌 등록
              </button>
            </>
          ) : (
            ' 상단 메뉴 「정산 계좌」에서 등록해 주세요.'
          )}
        </p>
      )}

      {error && (
        <p className="trade-apt__error" role="alert">
          {error}
        </p>
      )}

      <button type="submit" className="trade-apt__btn trade-apt__btn--primary">
        약속 제안하기
      </button>
      <p className="trade-apt__hint">
        제안 후 상대방({isSeller ? '구매자' : '판매자'})이 확정하면 약속이 확정됩니다.
      </p>
    </form>
  );

  if (appointment?.status === APPOINTMENT_STATUS.CONFIRMED) {
    const summary = formatAppointmentSummary(appointment);
    const isMeet = appointment.tradeMethod === 'meet';
    const isEscrowMethod =
      !listingFree && (appointment.tradeMethod === 'shipping' || appointment.tradeMethod === 'door');
    const isBuyer = currentUserId !== sellerId;
    return (
      <div className="trade-apt trade-apt--confirmed">
        <p className="trade-apt__badge">✅ 약속 완료</p>
        <dl className="trade-apt__summary">
          <div>
            <dt>거래 방법</dt>
            <dd>{summary.methodLabel}</dd>
          </div>
          <div>
            <dt>거래 시간</dt>
            <dd>{summary.time}</dd>
          </div>
          <AppointmentLocationSummary appointment={appointment} />
        </dl>
        {isMeet && (
          <p className="trade-apt__hint trade-apt__hint--meet">
            만나서 거래는 현장에서 물건을 확인한 뒤 직접 결제해 주세요. 에스크로 결제는
            사용하지 않습니다.
          </p>
        )}
        {isEscrowMethod && isBuyer && order?.escrowStatus === 'pending_payment' && (
          <p className="trade-apt__hint trade-apt__hint--pay">
            <strong>{order.paymentDeadlineHours}시간 이내</strong> 아래 「결제하기」로
            {summary.methodLabel} 금액을 입금해 주세요.
          </p>
        )}
        {isEscrowMethod && !isBuyer && order?.escrowStatus === 'pending_payment' && (
          <p className="trade-apt__hint trade-apt__hint--pay">
            구매자가 {order.paymentDeadlineHours}시간 이내에 에스크로 결제를 완료해야
            거래가 진행됩니다.
          </p>
        )}
        <button type="button" className="trade-apt__link" onClick={onReset}>
          약속 다시 잡기
        </button>
      </div>
    );
  }

  if (appointment?.status === APPOINTMENT_STATUS.PENDING) {
    const summary = formatAppointmentSummary(appointment);
    const isProposer = isSameUser(appointment.proposedBy, currentUserId);
    const canConfirm = !isProposer;
    const peerRole = isSeller ? '구매자' : '판매자';

    return (
      <div className="trade-apt trade-apt--pending">
        <p className="trade-apt__badge">📅 약속 제안</p>
        <dl className="trade-apt__summary">
          <div>
            <dt>거래 방법</dt>
            <dd>{summary.methodLabel}</dd>
          </div>
          <div>
            <dt>거래 시간</dt>
            <dd>{summary.time}</dd>
          </div>
          <AppointmentLocationSummary appointment={appointment} />
        </dl>
        {isSeller
          && isProposer
          && !listingFree
          && (appointment.tradeMethod === 'shipping' || appointment.tradeMethod === 'door')
          && sellerPayoutVerified === false && (
          <p className="trade-apt__hint trade-apt__hint--warn">
            정산 계좌 인증이 완료되지 않으면 구매자가 약속을 수락할 수 없습니다.
            {onOpenPayoutAccount && (
              <>
                {' '}
                <button
                  type="button"
                  className="trade-apt__link"
                  onClick={onOpenPayoutAccount}
                >
                  정산 계좌 등록
                </button>
              </>
            )}
          </p>
        )}
        <p className="trade-apt__hint">
          {isProposer ? (
            <>
              내가 제안한 약속입니다. <strong>{peerRole}</strong>가 「약속 수락」을 누르면
              확정됩니다. (본인은 수락할 수 없습니다.)
            </>
          ) : (
            <>
              {appointment.proposedByName}님이 제안 · {roleLabel}님, 내용을 확인하고
              「약속 수락」을 눌러 주세요.
            </>
          )}
        </p>
        {error && (
          <p className="trade-apt__error" role="alert">
            {error}
          </p>
        )}
        <div className="trade-apt__actions">
          {canConfirm && (
            <button
              type="button"
              className="trade-apt__btn trade-apt__btn--primary"
              onClick={handleConfirm}
            >
              약속 수락
            </button>
          )}
          <button type="button" className="trade-apt__btn" onClick={onReset}>
            {isProposer ? '제안 취소하고 다시 잡기' : '거절하고 다시 제안'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="trade-apt">
      <button
        type="button"
        className="trade-apt__toggle"
        onClick={useFormModal ? openForm : () => setExpanded((v) => !v)}
        aria-expanded={useFormModal ? formModalOpen : expanded}
      >
        📅 약속 잡기 {useFormModal ? '' : expanded ? '▲' : '▼'}
      </button>

      {useFormModal ? (
        <AppointmentScheduleModal open={formModalOpen} onClose={closeForm}>
          {proposeForm}
        </AppointmentScheduleModal>
      ) : (
        expanded && proposeForm
      )}
    </div>
  );
}

export default TradeAppointmentPanel;
