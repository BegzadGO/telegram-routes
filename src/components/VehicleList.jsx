import VehicleCard from './VehicleCard';

/**
 * VehicleList Component
 * Displays list of vehicles or empty/loading states
 */
const VehicleList = ({
  vehicles,
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
        <div className="loading-subtitle">Жукленбекте...</div>
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
      {vehicles.length === 0 && (
  <div className="empty-state">
    <div className="empty-state-icon">🚚</div>
    <div className="empty-state-title">Хазирше жук машинлар жоқ</div>
    <div className="empty-state-text">
      {fromCity && toCity 
        ? `${fromCity} → ${toCity} жөнелисы бойинша машин табылмады`
        : 'Жөнелисты таңлаң'
      }
    </div>
  </div>
)}
      
      {vehicles.length > 0 && (
  <>
    <h2 className="vehicle-list-title">
      Нокис қаласи ушин ({vehicles.length})
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
