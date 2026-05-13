const SuccessScreen = ({ fromCity, toCity, phone, onBack }) => {
  return (
    <div className="success-screen">
      <div className="success-card">
        <div className="success-icon">✅</div>

        <h2 className="success-title">Заявка қабул қилинди!</h2>

        <p className="success-message">
          Сиз бенен <strong>5 минут ишинде</strong> байланисады
        </p>

        <div className="success-details">
          <div className="success-detail-row">
            <span>📍 Жөнелис:</span>
            <span>{fromCity === toCity ? 'Жук жеткизиу' : `${fromCity} → ${toCity}`}</span>
          </div>
          <div className="success-detail-row">
            <span>📞 Телефон:</span>
            <span>{phone}</span>
          </div>
        </div>

        <button className="success-back" onClick={onBack}>
          🏠 Артқа
        </button>
      </div>
    </div>
  );
};

export default SuccessScreen;
