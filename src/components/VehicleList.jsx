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
    <div className="loading-screen">
      <div className="loading-card">
        <div className="loading-logo">🚕</div>
        <div className="loading-subtitle">Juklenbekte...</div>
        <div className="loading-dots">
          <span></span><span></span><span></span>
        </div>
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
    <h3 className="route-places-title">
      📍 Gazeller bar
    </h3>

    {routePlaces.map(place => (
      <div key={place.id} className="route-place-card">
        {place.title && (
          <div className="route-place-title">
            📍 {place.title}
          </div>
        )}

        {place.note && (
          <div className="route-place-note">
            {place.note}
          </div>
        )}

        {place.address && (
          <div className="route-place-address">
            🏠 {place.address}
          </div>
        )}

        {place.lat && place.lng && (
          <a
            href={`https://maps.google.com/?q=${place.lat},${place.lng}`}
            target="_blank"
            rel="noreferrer"
            className="route-place-map-link"
          >
            📍 Kartada koriw →
          </a>
        )}
      </div>
    ))}
  </div>
)}
      {vehicles.length === 0 && (
  <div className="empty-state">
    <div className="empty-state-icon">🚗</div>
    <div className="empty-state-title">Xazirshe taksiler joq</div>
    <div className="empty-state-text">
      {fromCity && toCity 
        ? `No vehicles found for route ${fromCity} → ${toCity}`
        : 'Select a route to view available vehicles'
      }
    </div>
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
