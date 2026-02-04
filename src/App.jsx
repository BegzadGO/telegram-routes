import React, { useState, useEffect } from 'react';
import RouteSelector from './components/RouteSelector';
import VehicleList from './components/VehicleList';
import { fetchRoutes, fetchVehiclesByRoute, fetchRoutePlaces } from './supabase';
import './styles.css';

function App() {
  const [routes, setRoutes] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [routePlaces, setRoutePlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [vehiclesError, setVehiclesError] = useState(null);

  const [selectedRoute, setSelectedRoute] = useState({
    fromCity: '',
    toCity: ''
  });

  // 👉 НОВОЕ: текущий экран
  const [screen, setScreen] = useState('routes'); // routes | vehicles | favorites
  const [favorites, setFavorites] = useState(() => {
  return JSON.parse(localStorage.getItem('favorites') || '[]');
});

  const toggleFavorite = (vehicle) => {
  setFavorites(prev => {
    const exists = prev.find(v => v.id === vehicle.id);

    let updated;
    if (exists) {
      updated = prev.filter(v => v.id !== vehicle.id);
    } else {
      updated = [...prev, vehicle];
    }

    localStorage.setItem('favorites', JSON.stringify(updated));
    return updated;
  });
};
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

  const ROUTES_CACHE_KEY = 'routes_cache_v2';
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
    // 🔁 нормализуем маршруты: добавляем обратные
const normalizedRoutes = [];

data.forEach(route => {
  // прямой маршрут
  normalizedRoutes.push(route);

  // обратный маршрут
  if (route.from_city !== route.to_city) {
    normalizedRoutes.push({
      id: `${route.id}_reverse`,
      from_city: route.to_city,
      to_city: route.from_city,
      original_route_id: route.id,
      isReverse: true,
    });
  }
});

setRoutes(normalizedRoutes);

    // 3️⃣ Сохраняем в кеш
    localStorage.setItem(
      ROUTES_CACHE_KEY,
      JSON.stringify({
        timestamp: Date.now(),
        data: normalizedRoutes,
      })
    );
  } catch (err) {
    setError(err.message || 'Failed to load routes');
  } finally {
    setLoading(false);
  }
};

  const shuffleArray = (array) => {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};
 const reshuffleVehicles = () => {
  setVehicles(prev => shuffleArray(prev));
};
  
  // 👉 НОВОЕ ПОВЕДЕНИЕ
  const handleSearch = async (routeId, fromCity, toCity) => {
    try {
      setVehiclesLoading(true);
      setVehiclesError(null);
      setSelectedRoute({ fromCity, toCity });

      const data = await fetchVehiclesByRoute(routeId);
const shuffled = shuffleArray(data);
setVehicles(shuffled);

// 👉 ЗАГРУЖАЕМ СТОЯНКИ / ИНФОРМАЦИЮ
try {
  const places = await fetchRoutePlaces(routeId);
  setRoutePlaces(places || []);
} catch (placesErr) {
  console.error('Failed to load route places:', placesErr);
  setRoutePlaces([]);
}

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

  if (loading) {
  return (
    <div className="loading-screen">
      <div className="loading-card">
        <div className="loading-logo">
          🚕 Taksi <strong>95</strong>
        </div>
        <div className="loading-subtitle">
          Jonelister juklenbekte…
        </div>
        <div className="loading-dots">
          <span></span><span></span><span></span>
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
  routePlaces={routePlaces}
  loading={vehiclesLoading}
  error={vehiclesError}
  fromCity={selectedRoute.fromCity}
  toCity={selectedRoute.toCity}
  onRefresh={reshuffleVehicles}
  favorites={favorites}
  onToggleFavorite={toggleFavorite}
/>
        </>
      )}
      {screen === 'favorites' && (
  <>
    <header className="vehicles-header">
      <h1 className="app-title">Избранное</h1>
    </header>

    <VehicleList
      vehicles={favorites}
      loading={false}
      error={null}
      fromCity="Избранное"
      toCity=""
      onRefresh={null}
      favorites={favorites}
      onToggleFavorite={toggleFavorite}
    />
  </>
)}
      <div className="bottom-nav">
  <button
    className={screen === 'routes' ? 'active' : ''}
    onClick={() => setScreen('routes')}
  >
    🧭 Jonelisler
  </button>

  <button
    className={screen === 'favorites' ? 'active' : ''}
    onClick={() => setScreen('favorites')}
  >
    ❤️ Saqlangan
  </button>
</div>
    </div>
  );
}

export default App;
