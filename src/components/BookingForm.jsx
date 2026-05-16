import { useState } from 'react';

const formatPrice = (price) =>
  price ? `${price.toLocaleString('ru-RU')} сўм` : null;

const BookingForm = ({ fromCity, toCity, price, onSubmit, onBack, loading, defaultType = 'taxi', disabled = false }) => {
  const [phone, setPhone]           = useState('');
  const [error, setError]           = useState('');
  const [bookingType, setBookingType] = useState(defaultType);
  const [passengers, setPassengers] = useState(1);

  const totalPrice = price && bookingType === 'taxi' ? price * passengers : 0;

  const handlePhoneChange = (e) => {
    setPhone(e.target.value.replace(/[^\d+\s\-()]/g, ''));
    setError('');
  };

  const handleSubmit = () => {
    if (disabled) return;
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length < 9) { setError('Телефон номерин дурыс киритиң'); return; }
    onSubmit(phone, bookingType, bookingType === 'taxi' ? passengers : null);
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter') handleSubmit(); };

  const subtitle = bookingType === 'taxi'
    ? <><strong>Районға Такси керекпе?</strong> Телефон номериңизды жазың, биз сиз бенен 5 минут ишинде байланисамыз</>
    : <><strong>Жук жибериу керекпе?</strong> Телефон номериңизды жазың, биз сиз бенен 5 минут ишинде байланисамыз</>;

  return (
    <div className="booking-screen">
      <div className="booking-card">

        <div className="booking-route-label">
          {fromCity === toCity ? '📦 Жук жеткизиу' : `📍 ${fromCity} → ${toCity}`}
        </div>

        <h2 className="booking-title">Заявка қалдырыу</h2>
        <p className="booking-subtitle">{subtitle}</p>

        <div className="booking-type-toggle">
          <button className={`type-btn ${bookingType === 'taxi'  ? 'active' : ''}`} onClick={() => setBookingType('taxi')}  type="button">🚕 Такси</button>
          <button className={`type-btn ${bookingType === 'cargo' ? 'active' : ''}`} onClick={() => setBookingType('cargo')} type="button">📦 Жук / Почта</button>
        </div>

        {bookingType === 'taxi' && (
          <div className="booking-field">
            <label className="booking-label">Жолаушылар саны</label>
            <div className="passengers-selector">
              <button className="passengers-btn" onClick={() => setPassengers(p => Math.max(1, p - 1))} type="button" disabled={passengers <= 1}>−</button>
              <span className="passengers-count">{passengers}</span>
              <button className="passengers-btn" onClick={() => setPassengers(p => Math.min(4, p + 1))} type="button" disabled={passengers >= 4}>+</button>
            </div>
          </div>
        )}

        {/* Баҳа блогы */}
        {totalPrice > 0 && (
          <div className="price-summary">
            <div className="price-row">
              <span>1 жолаушы</span>
              <span>{formatPrice(price)}</span>
            </div>
            {passengers > 1 && (
              <div className="price-row">
                <span>{passengers} жолаушы</span>
                <span>{formatPrice(price)} × {passengers}</span>
              </div>
            )}
            <div className="price-row price-total">
              <span>Жалпы баҳа</span>
              <span>{formatPrice(totalPrice)}</span>
            </div>
          </div>
        )}

        <div className="booking-field">
          <label className="booking-label">Телефон номери</label>
          <input
            className={`booking-input ${error ? 'booking-input--error' : ''}`}
            type="tel"
            placeholder="+998 90 123 45 67"
            value={phone}
            onChange={handlePhoneChange}
            onKeyDown={handleKeyDown}
            autoFocus
            disabled={disabled}
          />
          {error && <div className="booking-error">{error}</div>}
        </div>

        <button
          className="booking-submit"
          onClick={handleSubmit}
          disabled={loading || !phone || disabled}
        >
          {loading
            ? <span className="btn-loading"><span/><span/><span/></span>
            : '✅ Заявка жибериу'}
        </button>

        <button className="booking-cancel" onClick={onBack}>← Артқа</button>
      </div>
    </div>
  );
};

export default BookingForm;
