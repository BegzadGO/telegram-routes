import { useState, useEffect } from 'react';
import RouteSelector from './components/RouteSelector';
import VehicleList from './components/VehicleList';
import BookingForm from './components/BookingForm';
import SuccessScreen from './components/SuccessScreen';
import {
  fetchRoutes,
  fetchVehiclesByRoute,
  fetchDeliveryVehicles,
  submitBooking,
} from './supabase';
import './styles.css';

const ROUTES_CACHE_KEY = 'routes_cache_v2';
const CACHE_TTL = 1000 * 60 * 60 * 12; // 12 часов

function App() {
  const [routes, setRoutes] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [deliveryVehicles, setDeliveryVehicles] = useState([]);
  const [deliveryLoading, setDeliveryLoading] = useState(false);
  const [deliveryError, setDeliveryError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [vehiclesError, setVehiclesError] = useState(null);
  const [vehiclesLoading, setVehiclesLoading] = useState(false);

  const [selectedRoute, setSelectedRoute] = useState({ fromCity: '', toCity: '' });
  const [screen, setScreen] = useState('routes');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingPhone, setBookingPhone] = useState('');

  const [favorites, setFavorites] = useState(() => {
    return JSON.parse(localStorage.getItem('favorites') || '[]');
  });

  const toggleFavorite = (vehicle) => {
    setFavorites(prev => {
      const exists = prev.find(v => v.id === vehicle.id);
      let updated = exists ? prev.filter(v => v.id !== vehicle.id) : [...prev, vehicle];
      localStorage.setItem('favorites', JSON.stringify(updated));
      return updated;
    });
  };

  useEffect(() => {
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.expand();
      tg.enableClosingConfirmation();
      tg.setHeaderColor('secondary_bg_color');
      tg.ready();
    }
  }, []);

  useEffect(() => {
    if (screen === 'delivery' && deliveryVehicles.length === 0) loadDelivery();
  }, [screen]);

  useEffect(() => { loadRoutes(); }, []);

  const loadRoutes = async () => {
    try {
      setLoading(true); setError(null);
      const cached = localStorage.getItem(ROUTES_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Date.now() - parsed.timestamp < CACHE_TTL) {
          setRoutes(parsed.data); setLoading(false); return;
        }
      }
      const data = await fetchRoutes();
      const normalizedRoutes = [];
      data.forEach(route => {
        normalizedRoutes.push(route);
        if (route.from_city !== route.to_city) {
          normalizedRoutes.push({ id: `${route.id}_reverse`, from_city: route.to_city, to_city: route.from_city, original_route_id: route.id, isReverse: true });
        }
      });
      setRoutes(normalizedRoutes);
      localStorage.setItem(ROUTES_CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data: normalizedRoutes }));
    } catch (err) { setError(err.message || 'Failed to load routes'); }
    finally { setLoading(false); }
  };

  const shuffleArray = (array) => {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  };

  const reshuffleVehicles = () => setVehicles(prev => shuffleArray(prev));

  const loadDelivery = async () => {
    try {
      setDeliveryLoading(true); setDeliveryError(null);
      const cached = localStorage.getItem('delivery_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Date.now() - parsed.timestamp < 1000 * 60 * 60 * 12) { setDeliveryVehicles(parsed.data); return; }
      }
      const data = await fetchDeliveryVehicles();
      setDeliveryVehicles(data);
      localStorage.setItem('delivery_cache', JSON.stringify({ timestamp: Date.now(), data }));
    } catch (e) { setDeliveryError(e.message || 'Delivery load error'); }
    finally { setDeliveryLoading(false); }
  };

  const handleSearch = async (routeId, fromCity, toCity) => {
    const cached = localStorage.getItem(`vehicles_cache_${routeId}`);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Date.now() - parsed.timestamp < CACHE_TTL) {
        setSelectedRoute({ fromCity, toCity }); setVehicles(parsed.data); setScreen('vehicles'); return;
      }
    }
    try {
      setVehiclesLoading(true); setVehiclesError(null); setSelectedRoute({ fromCity, toCity });
      setRoutePlaces([]);
      const data = await fetchVehiclesByRoute(routeId);

      const shuffled = shuffleArray(data);
      setVehicles(shuffled);
      localStorage.setItem(`vehicles_cache_${routeId}`, JSON.stringify({ timestamp: Date.now(), data: shuffled }));

      setScreen('vehicles');
      if (window.Telegram?.WebApp?.HapticFeedback) window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
    } catch (err) { setVehiclesError(err.message || 'Failed to load vehicles'); }
    finally { setVehiclesLoading(false); }
  };

  const handleOpenBooking = () => {
    setScreen('booking');
    if (window.Telegram?.WebApp?.HapticFeedback) window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
  };

  const handleSubmitBooking = async (phone) => {
    setBookingLoading(true);
    try {
      const tg = window.Telegram?.WebApp;
      await submitBooking({
        phone,
        fromCity: selectedRoute.fromCity,
        toCity: selectedRoute.toCity,
        telegramUserId: tg?.initDataUnsafe?.user?.id || null,
        telegramUsername: tg?.initDataUnsafe?.user?.username || null,
      });
      setBookingPhone(phone);
      setScreen('success');
      if (window.Telegram?.WebApp?.HapticFeedback) window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
    } catch (err) {
      alert('Хато юз берди. Қайта уриниб кўринг.');
      console.error(err);
    } finally { setBookingLoading(false); }
  };

  if (loading) return (
    <div className="loading-screen">
      <div className="loading-card">
        <div className="loading-logo">🚕 Taksi <strong>95</strong></div>
        <div className="loading-subtitle">Jonelister juklenbekte…</div>
        <div className="loading-dots"><span></span><span></span><span></span></div>
      </div>
    </div>
  );

  if (error) return (
    <div className="app-container">
      <div className="error-container"><div className="error-title">Error</div><div className="error-message">{error}</div></div>
      <button className="show-button" onClick={loadRoutes}>Qaytadan</button>
    </div>
  );

  return (
    <div className="app-container">
      {screen === 'routes' && (
        <>
          <header className="route-header">
            <h1 className="brand-title">
              <span className="title-main">Taksi <strong>95</strong></span>
              <span className="title-sub">Jonelisti tañlañ</span>
            </h1>
          </header>
          <RouteSelector routes={routes} onSearch={handleSearch} loading={vehiclesLoading} />
        </>
      )}

      {screen === 'vehicles' && (
        <>
          <header className="vehicles-header">
            <button className="back-button" onClick={() => setScreen('routes')}>←</button>
            <h1 className="app-title">{selectedRoute.fromCity} → {selectedRoute.toCity}</h1>
          </header>
          <VehicleList
            vehicles={vehicles} loading={vehiclesLoading} error={vehiclesError}
            fromCity={selectedRoute.fromCity} toCity={selectedRoute.toCity} onRefresh={reshuffleVehicles}
            favorites={favorites} onToggleFavorite={toggleFavorite}
          />
          <div className="booking-banner">
            <p className="booking-banner-text">Қайси транспорт бўш? Биз сизга ёрдам берамиз!</p>
            <button className="booking-banner-btn" onClick={handleOpenBooking}>📋 Заявка қолдириш</button>
          </div>
        </>
      )}

      {screen === 'booking' && (
        <BookingForm
          fromCity={selectedRoute.fromCity} toCity={selectedRoute.toCity}
          onSubmit={handleSubmitBooking} onBack={() => setScreen('vehicles')} loading={bookingLoading}
        />
      )}

      {screen === 'success' && (
        <SuccessScreen
          fromCity={selectedRoute.fromCity} toCity={selectedRoute.toCity}
          phone={bookingPhone} onBack={() => setScreen('routes')}
        />
      )}

      {screen === 'delivery' && (
        <>
          <header className="vehicles-header"><h1 className="app-title">Juk Mashinlar</h1></header>
          <VehicleList vehicles={deliveryVehicles} loading={deliveryLoading} error={deliveryError} fromCity="Jetkiziw" toCity="" favorites={favorites} onToggleFavorite={toggleFavorite} />
        </>
      )}

      {screen === 'favorites' && (
        <>
          <header className="vehicles-header"><h1 className="app-title">Saqlanģanlar</h1></header>
          <VehicleList vehicles={favorites} loading={false} error={null} fromCity="Избранное" toCity="" onRefresh={null} favorites={favorites} onToggleFavorite={toggleFavorite} />
        </>
      )}

      {screen !== 'booking' && screen !== 'success' && (
        <div className="bottom-nav">
          <button className={screen === 'routes' ? 'active' : ''} onClick={() => setScreen('routes')}>🧭 Jonelisler</button>
          <button className={screen === 'delivery' ? 'active' : ''} onClick={() => setScreen('delivery')}>📦 Juk mashinlari</button>
          <button className={screen === 'favorites' ? 'active' : ''} onClick={() => setScreen('favorites')}>❤️ Saqlangan</button>
        </div>
      )}
    </div>
  );
}

export default App;
