const SuccessScreen = ({ fromCity, toCity, phone, onBack }) => {
  return (
    <div className="success-screen">
      <div className="success-card">
        <div className="success-icon">✅</div>

        <h2 className="success-title">Заявка қабул қилинды!</h2>

        <p className="success-message">
          Сиз бенен <strong>5 минут ишинде</strong> байланисамиз
        </p>

        <div className="success-details">
          <div className="success-detail-row">
            <span>📍 Маршрут:</span>
            <span>{fromCity} → {toCity}</span>
          </div>
          <div className="success-detail-row">
            <span>📞 Телефон:</span>
            <span>{phone}</span>
          </div>
        </div>

        <button className="success-back" onClick={onBack}>
          🏠 Артка
        </button>
      </div>
    </div>
  );
};

export default SuccessScreen;
