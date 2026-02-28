import { useState, useEffect } from 'react';
import RouteSelector from './components/RouteSelector';
import VehicleList from './components/VehicleList';
import BookingForm from './components/BookingForm';
import SuccessScreen from './components/SuccessScreen';
import {
  fetchRoutes,
  fetchDeliveryVehicles,
  submitBooking,
} from './supabase';
import './styles.css';

const ROUTES_CACHE_KEY = 'routes_cache_v2';
const CACHE_TTL = 1000 * 60 * 60 * 12;

function App() {
  const [routes, setRoutes] = useState([]);
  const [deliveryVehicles, setDeliveryVehicles] = useState([]);
  const [deliveryLoading, setDeliveryLoading] = useState(false);
  const [deliveryError, setDeliveryError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedRoute, setSelectedRoute] = useState({ fromCity: '', toCity: '' });
  const [screen, setScreen] = useState('routes');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingPhone, setBookingPhone] = useState('');

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

  const loadDelivery = async () => {
    try {
      setDeliveryLoading(true); setDeliveryError(null);
      const cached = localStorage.getItem('delivery_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Date.now() - parsed.timestamp < CACHE_TTL) { setDeliveryVehicles(parsed.data); return; }
      }
      const data = await fetchDeliveryVehicles();
      setDeliveryVehicles(data);
      localStorage.setItem('delivery_cache', JSON.stringify({ timestamp: Date.now(), data }));
    } catch (e) { setDeliveryError(e.message || 'Delivery load error'); }
    finally { setDeliveryLoading(false); }
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
          <RouteSelector routes={routes} onSearch={(routeId, fromCity, toCity) => {
            setSelectedRoute({ fromCity, toCity });
            setScreen('booking');
          }} loading={false} />
        </>
      )}

      {screen === 'booking' && (
        <BookingForm
          fromCity={selectedRoute.fromCity} toCity={selectedRoute.toCity}
          onSubmit={handleSubmitBooking} onBack={() => setScreen('routes')} loading={bookingLoading}
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
          <VehicleList vehicles={deliveryVehicles} loading={deliveryLoading} error={deliveryError} fromCity="Jetkiziw" toCity="" />
        </>
      )}

      {screen !== 'booking' && screen !== 'success' && (
        <div className="bottom-nav">
          <button className={screen === 'routes' ? 'active' : ''} onClick={() => setScreen('routes')}>🧭 Jonelisler</button>
          <button className={screen === 'delivery' ? 'active' : ''} onClick={() => setScreen('delivery')}>📦 Juk mashinlari</button>
        </div>
      )}
    </div>
  );
}

export default App;
