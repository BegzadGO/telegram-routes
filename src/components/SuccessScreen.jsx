const formatPrice = (price) =>
  price ? `${price.toLocaleString('ru-RU')} сўм` : null;

const SuccessScreen = ({ fromCity, toCity, price, phone, onBack }) => {
  const isDelivery = fromCity === toCity;

  return (
    <div className="success-screen">
      <div className="success-card">
        <div className="success-icon">✅</div>

        <h2 className="success-title">Заявка қабыл алынды!</h2>
        <p className="success-message">
          Сиз бенен <strong>5 минут ишинде</strong> байланисады
        </p>

        <div className="success-details">
          <div className="success-detail-row">
            <span>📍 Жөнелис:</span>
            <span>{isDelivery ? 'Жук жеткизиу' : `${fromCity} → ${toCity}`}</span>
          </div>
          {!isDelivery && price > 0 && (
            <div className="success-detail-row">
              <span>💰 Баҳа:</span>
              <span>{formatPrice(price)} / киши</span>
            </div>
          )}
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
