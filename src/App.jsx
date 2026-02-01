import React, { useState, useEffect } from 'react';
import RouteSelector from './components/RouteSelector';
import VehicleList from './components/VehicleList';
import { fetchRoutes, fetchVehiclesByRoute } from './supabase';
import './styles.css';

function App() {
  const [routes, setRoutes] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vehiclesLoading, setVehiclesLoading] = useState(false);
  const [error, setError] = useState(null);
  const [vehiclesError, setVehiclesError] = useState(null);

  const [selectedRoute, setSelectedRoute] = useState({
    fromCity: '',
    toCity: ''
  });

  // 👉 НОВОЕ: текущий экран
  const [screen, setScreen] = useState('routes'); // routes | vehicles

  // Telegram init
  useEffect(() => {
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.expand();
      tg.enableClosingConfirmation();
      tg.setHeaderColor('secondary_bg_color');
      tg.ready();
    }
  }, []);

  // Load routes
  useEffect(() => {
    loadRoutes();
  }, []);

  const ROUTES_CACHE_KEY = 'routes_cache_v1';
const ROUTES_CACHE_TTL = 1000 * 60 * 60 * 6; // 6 часов

const loadRoutes = async () => {
  try {
    setLoading(true);
    setError(null);

    // 1️⃣ Проверяем кеш
    const cached = localStorage.getItem(ROUTES_CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);

      // если кеш ещё свежий
      if (Date.now() - parsed.timestamp < ROUTES_CACHE_TTL) {
        setRoutes(parsed.data);
        setLoading(false);
        return;
      }
    }

    // 2️⃣ Если кеша нет или он старый — идём в Supabase
    const data = await fetchRoutes();
    setRoutes(data);

    // 3️⃣ Сохраняем в кеш
    localStorage.setItem(
      ROUTES_CACHE_KEY,
      JSON.stringify({
        timestamp: Date.now(),
        data,
      })
    );
  } catch (err) {
    setError(err.message || 'Failed to load routes');
  } finally {
    setLoading(false);
  }
};

  // 👉 НОВОЕ ПОВЕДЕНИЕ
  const handleSearch = async (routeId, fromCity, toCity) => {
    try {
      setVehiclesLoading(true);
      setVehiclesError(null);
      setSelectedRoute({ fromCity, toCity });

      const data = await fetchVehiclesByRoute(routeId);
      setVehicles(data);

      // 👉 ПЕРЕХОД НА ВТОРОЙ ЭКРАН
      setScreen('vehicles');

      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
      }
    } catch (err) {
      setVehiclesError(err.message || 'Failed to load vehicles');
    } finally {
      setVehiclesLoading(false);
    }
  };

  // Загрузка маршрутов
  if (loading) {
    return (
      <div className="app-container">
        <div className="loading-container">
          <div>
            <div className="loading-spinner"></div>
            <div className="loading-text">Juklenbekte...</div>
          </div>
        </div>
      </div>
    );
  }

  // Ошибка загрузки маршрутов
  if (error) {
    return (
      <div className="app-container">
        <div className="error-container">
          <div className="error-title">Error</div>
          <div className="error-message">{error}</div>
        </div>
        <button className="show-button" onClick={loadRoutes}>
          Qaytadan
        </button>
      </div>
    );
  }

  return (
    <div className="app-container">

      {/* 🔹 ЭКРАН 1: ВЫБОР МАРШРУТА */}
      {screen === 'routes' && (
        <>
          <header className="route-header">
  <h1 className="brand-title">
  <span className="title-main">
    Taksi <strong>95</strong>
  </span>
  <span className="title-sub">Jonelisti tañlañ</span>
</h1>
</header>

          <RouteSelector
            routes={routes}
            onSearch={handleSearch}
            loading={vehiclesLoading}
          />
        </>
      )}

      {/* 🔹 ЭКРАН 2: СПИСОК ВОДИТЕЛЕЙ */}
      {screen === 'vehicles' && (
        <>
          <header className="vehicles-header">
  <button
    className="back-button"
    onClick={() => setScreen('routes')}
  >
    ←
  </button>

  <h1 className="app-title">
    {selectedRoute.fromCity} → {selectedRoute.toCity}
  </h1>
</header>

          <VehicleList
            vehicles={vehicles}
            loading={vehiclesLoading}
            error={vehiclesError}
            fromCity={selectedRoute.fromCity}
            toCity={selectedRoute.toCity}
          />
        </>
      )}
    </div>
  );
}

export default App;
