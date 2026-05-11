import { useState, useEffect } from 'react';
import RouteSelector from './components/RouteSelector';
import VehicleList from './components/VehicleList';
import BookingForm from './components/BookingForm';
import SuccessScreen from './components/SuccessScreen';
import { fetchRoutes, fetchDeliveryVehicles, submitBooking } from './supabase';
import './styles.css';

const ROUTES_CACHE_KEY = 'routes_cache_v2';
const DELIVERY_CACHE_KEY = 'delivery_cache_v1';
const CACHE_TTL = 1000 * 60 * 60 * 12; // 12 саат

function App() {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [splash, setSplash] = useState(true);
  const [error, setError] = useState(null);

  const [deliveryVehicles, setDeliveryVehicles] = useState([]);
  const [deliveryLoading, setDeliveryLoading] = useState(false);
  const [deliveryError, setDeliveryError] = useState(null);

  const [selectedRoute, setSelectedRoute] = useState({ fromCity: '', toCity: '' });
  const [screen, setScreen] = useState('routes');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingPhone, setBookingPhone] = useState('');

  // Splash минимум 1.5 сек
  useEffect(() => {
    const timer = setTimeout(() => setSplash(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  // Telegram WebApp инициализация
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.expand();
      tg.enableClosingConfirmation();
      tg.setHeaderColor('secondary_bg_color');
      tg.ready();
    }
  }, []);

  // Маршрутларды жуклеу
  useEffect(() => { loadRoutes(); }, []);

  // Жук машиналарын тек delivery экранында жуклеу
  useEffect(() => {
    if (screen === 'delivery' && deliveryVehicles.length === 0) {
      loadDelivery();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen]);

  const loadRoutes = async () => {
    try {
      setLoading(true);
      setError(null);
      const cached = localStorage.getItem(ROUTES_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Date.now() - parsed.timestamp < CACHE_TTL) {
          setRoutes(parsed.data);
          return;
        }
      }
      const data = await fetchRoutes();
      // Тура ҳәм кери маршрутларды генерациялау
      const normalized = [];
      data.forEach(route => {
        normalized.push(route);
        if (route.from_city !== route.to_city) {
          normalized.push({
            id: `${route.id}_reverse`,
            from_city: route.to_city,
            to_city: route.from_city,
            original_route_id: route.id,
            isReverse: true,
          });
        }
      });
      setRoutes(normalized);
      localStorage.setItem(ROUTES_CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data: normalized }));
    } catch (err) {
      setError(err.message || 'Маршрутларды жуклеу мүмкин болмады');
    } finally {
      setLoading(false);
    }
  };

  const loadDelivery = async () => {
    try {
      setDeliveryLoading(true);
      setDeliveryError(null);
      const cached = localStorage.getItem(DELIVERY_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Date.now() - parsed.timestamp < CACHE_TTL) {
          setDeliveryVehicles(parsed.data);
          return;
        }
      }
      const data = await fetchDeliveryVehicles();
      setDeliveryVehicles(data);
      localStorage.setItem(DELIVERY_CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data }));
    } catch (e) {
      setDeliveryError(e.message || 'Жук машиналарын жуклеу мүмкин болмады');
    } finally {
      setDeliveryLoading(false);
    }
  };

  const handleRouteSelect = (fromCity, toCity) => {
    setSelectedRoute({ fromCity, toCity });
    setScreen('booking');
  };

  const handleSubmitBooking = async (phone, bookingType, passengers) => {
    setBookingLoading(true);
    try {
      const tg = window.Telegram?.WebApp;
      await submitBooking({
        phone,
        fromCity: selectedRoute.fromCity,
        toCity: selectedRoute.toCity,
        telegramUserId: tg?.initDataUnsafe?.user?.id || null,
        telegramUsername: tg?.initDataUnsafe?.user?.username || null,
        bookingType,
        passengers,
      });
      setBookingPhone(phone);
      setScreen('success');
      tg?.HapticFeedback?.notificationOccurred('success');
    } catch (err) {
      alert(err.message || 'Қате жүз берди. Қайтадан уринып көриң.');
      console.error(err);
    } finally {
      setBookingLoading(false);
    }
  };

  // Splash / Loading экраны
  if (loading || splash) {
    return (
      <div className="loading-screen">
        <div className="loading-card">
          <div className="loading-logo">🚕 Такси <strong>95</strong></div>
          <div className="loading-subtitle">Жөнелислер жукленбекте…</div>
          <div className="loading-dots"><span></span><span></span><span></span></div>
        </div>
      </div>
    );
  }

  // Қате экраны
  if (error) {
    return (
      <div className="app-container">
        <div className="error-container">
          <div className="error-title">Қате</div>
          <div className="error-message">{error}</div>
        </div>
        <button className="show-button" onClick={loadRoutes}>Қайтадан</button>
      </div>
    );
  }

  return (
    <div className="app-container">
      {screen === 'routes' && (
        <>
          <header className="route-header">
            <h1 className="brand-title">
              <span className="title-main">Такси <strong>95</strong></span>
              <span className="title-sub">Жөнелисты таңлаң</span>
            </h1>
          </header>
          <RouteSelector routes={routes} onSearch={handleRouteSelect} />
        </>
      )}

      {screen === 'booking' && (
        <BookingForm
          fromCity={selectedRoute.fromCity}
          toCity={selectedRoute.toCity}
          onSubmit={handleSubmitBooking}
          onBack={() => setScreen('routes')}
          loading={bookingLoading}
        />
      )}

      {screen === 'success' && (
        <SuccessScreen
          fromCity={selectedRoute.fromCity}
          toCity={selectedRoute.toCity}
          phone={bookingPhone}
          onBack={() => setScreen('routes')}
        />
      )}

      {screen === 'delivery' && (
        <>
          <header className="vehicles-header">
            <h1 className="app-title">Жук Машиналары</h1>
          </header>
          <VehicleList
            vehicles={deliveryVehicles}
            loading={deliveryLoading}
            error={deliveryError}
          />
        </>
      )}

      {screen !== 'booking' && screen !== 'success' && (
        <div className="bottom-nav">
          <button
            className={screen === 'routes' ? 'active' : ''}
            onClick={() => setScreen('routes')}
          >
            🧭 Жөнелислер
          </button>
          <button
            className={screen === 'delivery' ? 'active' : ''}
            onClick={() => setScreen('delivery')}
          >
            📦 Жук машиналары
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
