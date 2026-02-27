import { useState } from 'react';

const DeliveryForm = ({ onSubmit, loading, submitError, onSuccessReset }) => {
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [truckType, setTruckType] = useState(''); // 'labo' | 'gazel'
  const [typeError, setTypeError] = useState('');
  const [success, setSuccess] = useState(false);

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/[^\d+\s\-()]/g, '');
    setPhone(value);
    setPhoneError('');
  };

  const handleTruckTypeSelect = (type) => {
    setTruckType(type);
    setTypeError('');
  };

  const handleSubmit = async () => {
    if (!truckType) {
      setTypeError('Juk mashinini tanlañ');
      return;
    }
    if (!phone.trim()) {
      setPhoneError('Telefon nomerini kiriting');
      return;
    }
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 9) {
      setPhoneError('Telefon nomeri kamida 9 raqamdan iborat bolishi kerak');
      return;
    }
    if (digits.length > 15) {
      setPhoneError('Telefon nomeri juda uzun');
      return;
    }

    const ok = await onSubmit({ phone: phone.trim(), truckType });
    if (ok) {
      setSuccess(true);
    }
  };

  const handleNewOrder = () => {
    setPhone('');
    setTruckType('');
    setPhoneError('');
    setTypeError('');
    setSuccess(false);
    if (onSuccessReset) onSuccessReset();
  };

  // ─── Экран успеха ─────────────────────────────────────────────
  if (success) {
    return (
      <div className="booking-card" style={{ margin: '16px' }}>
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <div className="success-icon">✅</div>
          <h2 className="booking-title">Ariza qabul qilindi!</h2>
          <p className="booking-subtitle">
            Siz benen <strong>5 minut ishinde</strong> baylanishamiz
          </p>
          <div className="success-details">
            <div className="success-detail-row">
              <span>📦 Tur:</span>
              <span>{truckType === 'labo' ? '🚐 Labo' : '🚚 Gazel'}</span>
            </div>
            <div className="success-detail-row">
              <span>📞 Telefon:</span>
              <span>{phone}</span>
            </div>
          </div>
          <button className="booking-submit" onClick={handleNewOrder}>
            🔄 Yangi ariza
          </button>
        </div>
      </div>
    );
  }

  // ─── Форма ────────────────────────────────────────────────────
  return (
    <div className="booking-card" style={{ margin: '16px' }}>
      <h2 className="booking-title">📦 Juk Jetkiziw</h2>
      <p className="booking-subtitle">
        Telefon nomeringizdi qaldiriñ, siz benen 5 minut ishinde baylanishamiz
      </p>

      {/* Тип машины */}
      <div className="booking-field">
        <label className="booking-label">Juk mashinini tanlañ</label>
        <div className="trip-type-selector">
          <button
            className={`trip-type-btn ${truckType === 'labo' ? 'trip-type-btn--active' : ''}`}
            onClick={() => handleTruckTypeSelect('labo')}
            disabled={loading}
            type="button"
          >
            🚐 Labo
          </button>
          <button
            className={`trip-type-btn ${truckType === 'gazel' ? 'trip-type-btn--active' : ''}`}
            onClick={() => handleTruckTypeSelect('gazel')}
            disabled={loading}
            type="button"
          >
            🚚 Gazel
          </button>
        </div>
        {typeError && <div className="booking-error">{typeError}</div>}
      </div>

      {/* Телефон */}
      <div className="booking-field">
        <label className="booking-label">Telefon nomeri</label>
        <input
          className={`booking-input ${phoneError ? 'booking-input--error' : ''}`}
          type="tel"
          placeholder="+998 90 123 45 67"
          value={phone}
          onChange={handlePhoneChange}
          disabled={loading}
        />
        {phoneError && <div className="booking-error">{phoneError}</div>}
      </div>

      {/* Ошибка отправки */}
      {submitError && (
        <div className="booking-error booking-error--submit">
          ⚠️ {submitError}
        </div>
      )}

      <button
        className="booking-submit"
        onClick={handleSubmit}
        disabled={loading || !phone.trim() || !truckType}
      >
        {loading ? (
          <span className="btn-loading">
            <span></span><span></span><span></span>
          </span>
        ) : '✅ Ariza jiberiw'}
      </button>
    </div>
  );
};

export default DeliveryForm;
