import { useState } from 'react';

const BookingForm = ({ fromCity, toCity, onSubmit, onBack, loading }) => {
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [bookingType, setBookingType] = useState('taxi');
  const [passengers, setPassengers] = useState(1);

  const handlePhoneChange = (e) => {
    let value = e.target.value.replace(/[^\d+\s\-()]/g, '');
    setPhone(value);
    setError('');
  };

  const handleSubmit = () => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length < 9) {
      setError('Телефон номерини тўғри киритинг');
      return;
    }
    onSubmit(phone, bookingType, bookingType === 'taxi' ? passengers : null);
  };

  return (
    <div className="booking-screen">
      <div className="booking-card">
        <div className="booking-route-label">
          📍 {fromCity} → {toCity}
        </div>

        <h2 className="booking-title">Заявка қолдириш</h2>
        <p className="booking-subtitle">
          Телефон рақамингизни киритинг, биз сиз билан 5 дақиқа ичида боғланамиз
        </p>

        {/* Тип заявки */}
        <div className="booking-type-toggle">
          <button
            className={`type-btn ${bookingType === 'taxi' ? 'active' : ''}`}
            onClick={() => setBookingType('taxi')}
            type="button"
          >
            🚕 Taksi
          </button>
          <button
            className={`type-btn ${bookingType === 'cargo' ? 'active' : ''}`}
            onClick={() => setBookingType('cargo')}
            type="button"
          >
            📦 Pochta / Juk
          </button>
        </div>

        {/* Пассажиры — только для такси */}
        {bookingType === 'taxi' && (
          <div className="booking-field">
            <label className="booking-label">Yo'lovchilar soni</label>
            <div className="passengers-selector">
              <button
                className="passengers-btn"
                onClick={() => setPassengers(p => Math.max(1, p - 1))}
                type="button"
                disabled={passengers <= 1}
              >−</button>
              <span className="passengers-count">{passengers}</span>
              <button
                className="passengers-btn"
                onClick={() => setPassengers(p => Math.min(4, p + 1))}
                type="button"
                disabled={passengers >= 4}
              >+</button>
            </div>
          </div>
        )}

        {/* Телефон */}
        <div className="booking-field">
          <label className="booking-label">Телефон рақами</label>
          <input
            className={`booking-input ${error ? 'booking-input--error' : ''}`}
            type="tel"
            placeholder="+998 90 123 45 67"
            value={phone}
            onChange={handlePhoneChange}
            autoFocus
          />
          {error && <div className="booking-error">{error}</div>}
        </div>

        <button
          className="booking-submit"
          onClick={handleSubmit}
          disabled={loading || !phone}
        >
          {loading ? (
            <span className="btn-loading">
              <span></span><span></span><span></span>
            </span>
          ) : (
            '✅ Заявка юбориш'
          )}
        </button>

        <button className="booking-cancel" onClick={onBack}>
          ← Орқага
        </button>
      </div>
    </div>
  );
};

export default BookingForm;
