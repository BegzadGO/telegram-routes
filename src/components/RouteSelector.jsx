import { useState, useEffect } from 'react';

const RouteSelector = ({ routes, onSearch }) => {
  const [fromCity, setFromCity] = useState('');
  const [toCity, setToCity] = useState('');

  const fromCities = [...new Set(routes.map(r => r.from_city))].sort();
  const toCities = fromCity
    ? [...new Set(routes.filter(r => r.from_city === fromCity).map(r => r.to_city))].sort()
    : [];

  useEffect(() => {
    setToCity('');
  }, [fromCity]);

  const handleSearch = () => {
    if (!fromCity || !toCity) return;
    onSearch(fromCity, toCity);
  };

  return (
    <div className="route-card">
      <h2 className="route-card-title">🚕 Жөнелисты таңлаң</h2>

      <div className="route-input">
        <label>Қаерден</label>
        <select value={fromCity} onChange={(e) => setFromCity(e.target.value)}>
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
          onChange={(e) => setToCity(e.target.value)}
          disabled={!fromCity}
        >
          <option value="">Қаерге барыуыңызды таңлаң</option>
          {toCities.map(city => (
            <option key={city} value={city}>{city}</option>
          ))}
        </select>
      </div>

      <button
        className="route-submit"
        onClick={handleSearch}
        disabled={!fromCity || !toCity}
      >
        🚕 Такси
      </button>
    </div>
  );
};

export default RouteSelector;
