import React, { useState, useEffect } from 'react';

/**
 * RouteSelector Component
 * Allows users to select from and to cities, then search for vehicles
 */
const RouteSelector = ({ routes, onSearch, loading }) => {
  const [fromCity, setFromCity] = useState('');
  const [toCity, setToCity] = useState('');

  // Get unique city lists for dropdowns
  const fromCities = [...new Set(routes.map(r => r.from_city))].sort();
  const toCities = fromCity 
    ? [...new Set(routes.filter(r => r.from_city === fromCity).map(r => r.to_city))].sort()
    : [];

  // Reset toCity when fromCity changes
  useEffect(() => {
    setToCity('');
  }, [fromCity]);

  const handleSearch = () => {
  // 🛑 ЗАЩИТА ОТ ДАБЛ-КЛИКА
  if (loading) return;

  // 🛑 если маршрут не выбран
  if (!fromCity || !toCity) return;

  const route = routes.find(
    r => r.from_city === fromCity && r.to_city === toCity
  );

  if (route) {
    onSearch(route.id, fromCity, toCity);
  }
};

  // Check if search button should be enabled
  const canSearch = fromCity && toCity && !loading;

  return (
    <div className="route-selector">
      <h2 className="route-selector-title">Jonelisti tanlañ</h2>
      
      <div className="select-group">
        <label className="select-label" htmlFor="from-city">
          Qayerden
        </label>
        <select
          id="from-city"
          className="select-input"
          value={fromCity}
          onChange={(e) => setFromCity(e.target.value)}
          disabled={loading}
        >
          <option value="">Qayerden ketiwñizdi tanlañ</option>
          {fromCities.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
      </div>

      <div className="select-group">
        <label className="select-label" htmlFor="to-city">
          Qayerge
        </label>
        <select
          id="to-city"
          className="select-input"
          value={toCity}
          onChange={(e) => setToCity(e.target.value)}
          disabled={!fromCity || loading}
        >
          <option value="">Qayerge bariwñizdi tanlañ</option>
          {toCities.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
      </div>

      <button
        className="show-button"
        onClick={handleSearch}
        disabled={!canSearch}
      >
        {loading ? 'Juklenbekte...' : 'Korsetiw'}
      </button>
    </div>
  );
};

export default RouteSelector;
