import { useState } from 'react';

const BookingForm = ({ fromCity, toCity, onSubmit, onBack, loading }) => {
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [tripType, setTripType] = useState(''); // 'passenger' | 'pochta'
  const [passengers, setPassengers] = useState(1);
  const [typeError, setTypeError] = useState('');

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/[^\d+\s\-()]/g, '');
    setPhone(value);
    setPhoneError('');
  };

  const handleTripTypeSelect = (type) => {
    setTripType(type);
    setTypeError('');
    if (type === 'pochta') setPassengers(1);
  };

  const handleSubmit = () => {
    // Проверяем тип поездки
    if (!tripType) {
      setTypeError('Йўловчи ёки Почтани танланг');
      return;
    }
    // Проверяем телефон
    if (!phone.trim()) {
      setPhoneError('Телефон рақамини киритинг');
      return;
    }
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 9) {
      setPhoneError('Телефон рақами камида 9 рақамдан иборат бўлиши керак');
      return;
    }
    if (digits.length > 13) {
      setPhoneError('Телефон рақами жуда узун');
      return;
    }
    onSubmit({
      phone: phone.trim(),
      tripType,
      passengers: tripType === 'passenger' ? passengers : null,
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !loading) handleSubmit();
  };

  return (
    <div className="booking-screen">
      <div className="booking-card">

        <div className="booking-route-label">
          📍 {fromCity} → {toCity}
        </div>

        <h2 className="booking-title">Заявка қалдирыу</h2>
        <p className="booking-subtitle">
          Телефон номериңизды қалдирың, биз сиз бенен 5 минут ишинде байланисамиз
        </p>

        {/* Выбор типа: Йўловчи или Почта */}
        <div className="booking-field">
          <label className="booking-label">Не везём?</label>
          <div className="trip-type-selector">
            <button
              className={`trip-type-btn ${tripType === 'passenger' ? 'trip-type-btn--active' : ''}`}
              onClick={() => handleTripTypeSelect('passenger')}
              disabled={loading}
              type="button"
            >
              🚕 Йўловчи
            </button>
            <button
              className={`trip-type-btn ${tripType === 'pochta' ? 'trip-type-btn--active' : ''}`}
              onClick={() => handleTripTypeSelect('pochta')}
              disabled={loading}
              type="button"
            >
              📦 Почта
            </button>
          </div>
          {typeError && <div className="booking-error">{typeError}</div>}
        </div>

        {/* Количество пассажиров — только если выбрано "Йўловчи" */}
        {tripType === 'passenger' && (
          <div className="booking-field">
            <label className="booking-label">Йўловчилар сони</label>
            <div className="passenger-selector">
              {[1, 2, 3, 4].map(n => (
                <button
                  key={n}
                  className={`passenger-btn ${passengers === n ? 'passenger-btn--active' : ''}`}
                  onClick={() => setPassengers(n)}
                  disabled={loading}
                  type="button"
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Телефон */}
        <div className="booking-field">
          <label className="booking-label">Телефон номери</label>
          <input
            className={`booking-input ${phoneError ? 'booking-input--error' : ''}`}
            type="tel"
            placeholder="+998 90 123 45 67"
            value={phone}
            onChange={handlePhoneChange}
            onKeyDown={handleKeyDown}
            autoFocus
            disabled={loading}
          />
          {phoneError && <div className="booking-error">{phoneError}</div>}
        </div>

        <button
          className="booking-submit"
          onClick={handleSubmit}
          disabled={loading || !phone.trim() || !tripType}
        >
          {loading ? (
            <span className="btn-loading">
              <span></span><span></span><span></span>
            </span>
          ) : (
            '✅ Заявка жиберыу'
          )}
        </button>

        <button className="booking-cancel" onClick={onBack} disabled={loading}>
          ← Артқа
        </button>

      </div>
    </div>
  );
};

export default BookingForm;
