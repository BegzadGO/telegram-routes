import { useState } from 'react';

const BookingForm = ({ fromCity, toCity, onSubmit, onBack, loading }) => {
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/[^\d+\s\-()]/g, '');
    setPhone(value);
    setError('');
  };

  const handleSubmit = () => {
    if (!phone.trim()) {
      setError('Телефон рақамини киритинг');
      return;
    }
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 9) {
      setError('Телефон рақами камида 9 рақамдан иборат бўлиши керак');
      return;
    }
    if (digits.length > 13) {
      setError('Телефон рақами жуда узун');
      return;
    }
    onSubmit(phone.trim());
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
            disabled={loading}
          />
          {error && <div className="booking-error">{error}</div>}
        </div>

        <button
          className="booking-submit"
          onClick={handleSubmit}
          disabled={loading || !phone.trim()}
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
