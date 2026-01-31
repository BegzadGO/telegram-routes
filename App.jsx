import React, { useState, useEffect } from 'react';
import RouteSelector from './components/RouteSelector';
import VehicleList from './components/VehicleList';
import { fetchRoutes, fetchVehiclesByRoute } from './supabase';
import './styles.css';

/**
 * Main App Component
 * Manages state and coordinates between route selection and vehicle display
 */
function App() {
  // State management
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

  // Initialize Telegram WebApp
  useEffect(() => {
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      
      // Expand the app to full height
      tg.expand();
      
      // Enable closing confirmation
      tg.enableClosingConfirmation();
      
      // Set header color to match theme
      tg.setHeaderColor('secondary_bg_color');
      
      // Ready signal to Telegram
      tg.ready();

      console.log('Telegram WebApp initialized:', {
        version: tg.version,
        platform: tg.platform,
        colorScheme: tg.colorScheme
      });
    } else {
      console.warn('Telegram WebApp API not available. Running in browser mode.');
    }
  }, []);

  // Load routes on component mount
  useEffect(() => {
    loadRoutes();
  }, []);

  /**
   * Load all available routes from Supabase
   */
  const loadRoutes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchRoutes();
      setRoutes(data);
    } catch (err) {
      setError(err.message || 'Failed to load routes');
      console.error('Error loading routes:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle route search and load vehicles
   * @param {string} routeId - The selected route ID
   * @param {string} fromCity - Departure city
   * @param {string} toCity - Destination city
   */
  const handleSearch = async (routeId, fromCity, toCity) => {
    try {
      setVehiclesLoading(true);
      setVehiclesError(null);
      setSelectedRoute({ fromCity, toCity });
      
      const data = await fetchVehiclesByRoute(routeId);
      setVehicles(data);

      // Haptic feedback for Telegram
      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
      }
    } catch (err) {
      setVehiclesError(err.message || 'Failed to load vehicles');
      console.error('Error loading vehicles:', err);
    } finally {
      setVehiclesLoading(false);
    }
  };

  // Show loading state while routes are being fetched
  if (loading) {
    return (
      <div className="app-container">
        <div className="loading-container">
          <div>
            <div className="loading-spinner"></div>
            <div className="loading-text">Loading routes...</div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if routes failed to load
  if (error) {
    return (
      <div className="app-container">
        <div className="error-container">
          <div className="error-title">Error Loading Application</div>
          <div className="error-message">{error}</div>
        </div>
        <button className="show-button" onClick={loadRoutes}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">Route Finder</h1>
        <p className="app-subtitle">Find available vehicles for your journey</p>
      </header>

      <RouteSelector
        routes={routes}
        onSearch={handleSearch}
        loading={vehiclesLoading}
      />

      <VehicleList
        vehicles={vehicles}
        loading={vehiclesLoading}
        error={vehiclesError}
        fromCity={selectedRoute.fromCity}
        toCity={selectedRoute.toCity}
      />
    </div>
  );
}

export default App;
