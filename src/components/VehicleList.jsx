import React from 'react';
import VehicleCard from './VehicleCard';

/**
 * VehicleList Component
 * Displays list of vehicles or empty/loading states
 */
const VehicleList = ({
  vehicles,
  routePlaces = [],
  loading,
  error,
  fromCity,
  toCity,
  onRefresh,
  favorites = [],
  onToggleFavorite,
}) => {
  // Loading state
  if (loading) {
    return (
      <div className="loading-container">
        <div>
          <div className="loading-spinner"></div>
          <div className="loading-text">Juklenbekte...</div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="error-container">
        <div className="error-title">Error Loading Vehicles</div>
        <div className="error-message">{error}</div>
      </div>
    );
  }

  // Display vehicles
  return (
    <div className="vehicle-list">
      {routePlaces.length > 0 && (
  <div className="route-places">
    <h3>📍 Информация по маршруту</h3>

    {routePlaces.map(place => (
      <div key={place.id} className="route-place-card">
        {place.title && <strong>{place.title}</strong>}
        {place.note && <p>{place.note}</p>}
        {place.address && <p>🏠 {place.address}</p>}

        {place.lat && place.lng && (
          <a
            href={`https://maps.google.com/?q=${place.lat},${place.lng}`}
            target="_blank"
            rel="noreferrer"
          >
            📍 Открыть на карте
          </a>
        )}
      </div>
    ))}
  </div>
)}
      {vehicles.length === 0 && (
  <div className="empty-state">
    <div className="empty-state-icon">🚗</div>
    <div className="empty-state-title">Xazirshe mashinlar joq</div>
    <div className="empty-state-text">
      {fromCity && toCity 
        ? `No vehicles found for route ${fromCity} → ${toCity}`
        : 'Select a route to view available vehicles'
      }
    </div>
  </div>
)}
      {onRefresh && (
  <div className="list-actions">
    <button className="refresh-button" onClick={onRefresh}>
      🔄 Обновить список
    </button>
  </div>
)}
      {vehicles.length > 0 && (
  <>
    <h2 className="vehicle-list-title">
      Taksistke qoñirow etiñ ({vehicles.length})
    </h2>
    <div className="vehicle-grid">
      {vehicles.map(vehicle => (
        <VehicleCard
          key={vehicle.id}
          vehicle={vehicle}
          isFavorite={favorites.some(f => f.id === vehicle.id)}
          onToggleFavorite={onToggleFavorite}
        />
      ))}
    </div>
  </>
)}
    </div>
  );
};

export default VehicleList;
