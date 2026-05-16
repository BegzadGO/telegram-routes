import { useState, useEffect } from 'react';

const formatPrice = (price) =>
  price ? `${price.toLocaleString('ru-RU')} сўм` : null;

const RouteSelector = ({ routes, onSearch }) => {
  const [fromCity, setFromCity] = useState('');
  const [toCity, setToCity]     = useState('');

  const fromCities = [...new Set(routes.map(r => r.from_city))].sort();
  const toCities   = fromCity
    ? [...new Set(routes.filter(r => r.from_city === fromCity).map(r => r.to_city))].sort()
    : [];

  const selectedRoute = fromCity && toCity
    ? routes.find(r => r.from_city === fromCity && r.to_city === toCity)
    : null;

  const price = selectedRoute?.price || 0;

  useEffect(() => { setToCity(''); }, [fromCity]);

  const handleSearch = () => {
    if (!fromCity || !toCity) return;
    onSearch(fromCity, toCity, price);
  };

  return (
    <div className="route-card">
      <h2 className="route-card-title">🚕 Жөнелисты таңлаң</h2>

      <div className="route-input">
        <label>Қаерден</label>
        <select value={fromCity} onChange={e => setFromCity(e.target.value)}>
          <option value="">Қаерден кетыуыңызды таңлаң</option>
          {fromCities.map(city => (
            <option key={city} value={city}>{city}</option>
          ))}
        </select>
      </div>

      <div className="route-arrow">↓</div>

      <div className="route-input">
        <label>Қаерге</label>
        <select
          value={toCity}
          onChange={e => setToCity(e.target.value)}
          disabled={!fromCity}
        >
          <option value="">Қаерге барыуыңызды таңлаң</option>
          {toCities.map(city => (
            <option key={city} value={city}>{city}</option>
          ))}
        </select>
      </div>

      {/* Баҳа — эки қала таңланғаннан кейин пайда болады */}
      {price > 0 && (
        <div className="route-price-badge">
          <span className="route-price-label">💰 1 жолаушы ушын</span>
          <span className="route-price-value">{formatPrice(price)}</span>
        </div>
      )}

      <button
        className="route-submit"
        onClick={handleSearch}
        disabled={!fromCity || !toCity}
      >
        🚕 Такси заказ беретуғын
      </button>
    </div>
  );
};

export default RouteSelector;
