const SuccessScreen = ({ fromCity, toCity, phone, onBack }) => {
  return (
    <div className="success-screen">
      <div className="success-card">
        <div className="success-icon">✅</div>

        <h2 className="success-title">Заявка қабул қилинди!</h2>

        <p className="success-message">
          Сиз билан <strong>5 дақиқа ичида</strong> боғланишади
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
          🏠 Бош саҳифага
        </button>
      </div>
    </div>
  );
};

export default SuccessScreen;
