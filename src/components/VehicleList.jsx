import VehicleCard from './VehicleCard';

const VehicleList = ({ vehicles, loading, error, onBook }) => {
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-card">
          <div className="loading-logo">📦</div>
          <div className="loading-subtitle">Жукленбекте...</div>
          <div className="loading-dots">
            <span></span><span></span><span></span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-title">Жуклениу қатесі</div>
        <div className="error-message">{error}</div>
      </div>
    );
  }

  if (vehicles.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">🚚</div>
        <div className="empty-state-title">Хазирше жук машиналары жоқ</div>
        {onBook && (
          <button className="delivery-book-btn" onClick={onBook}>
            📦 Заявка қалдырыу
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="vehicle-list">
      <div className="vehicle-list-header">
        <h2 className="vehicle-list-title">Жук машиналары ({vehicles.length})</h2>
        {onBook && (
          <button className="delivery-book-btn" onClick={onBook}>
            📦 Заявка қалдырыу
          </button>
        )}
      </div>
      <div className="vehicle-grid">
        {vehicles.map(vehicle => (
          <VehicleCard key={vehicle.id} vehicle={vehicle} />
        ))}
      </div>
    </div>
  );
};

export default VehicleList;
