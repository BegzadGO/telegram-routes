import VehicleCard from './VehicleCard';

const VehicleList = ({ vehicles, loading, error, fromCity, toCity }) => {

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-card">
          <div className="loading-logo">📦</div>
          <div className="loading-subtitle">Juklenbekte...</div>
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
        <div className="error-title">Xato</div>
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="vehicle-list">
      {vehicles.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">🚚</div>
          <div className="empty-state-title">Xazirshe juk mashinlar joq</div>
          <div className="empty-state-text">
            {fromCity && toCity
              ? `${fromCity} → ${toCity} jonelisi boyınsha tabılmadı`
              : 'Hesh narsa tabılmadı'}
          </div>
        </div>
      )}

      {vehicles.length > 0 && (
        <>
          <h2 className="vehicle-list-title">
            Juk mashinlar ({vehicles.length})
          </h2>
          <div className="vehicle-grid">
            {vehicles.map(vehicle => (
              <VehicleCard key={vehicle.id} vehicle={vehicle} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default VehicleList;
