import React from 'react';
import VehicleCard from './VehicleCard';

/**
 * VehicleList Component
 * Displays list of vehicles or empty/loading states
 */
const VehicleList = ({ vehicles, loading, error, fromCity, toCity }) => {
  // Loading state
  if (loading) {
    return (
      <div className="loading-container">
        <div>
          <div className="loading-spinner"></div>
          <div className="loading-text">Loading vehicles...</div>
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

  // Empty state - no vehicles found
  if (vehicles.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">🚗</div>
        <div className="empty-state-title">No Vehicles Available</div>
        <div className="empty-state-text">
          {fromCity && toCity 
            ? `No vehicles found for route ${fromCity} → ${toCity}`
            : 'Select a route to view available vehicles'
          }
        </div>
      </div>
    );
  }

  // Display vehicles
  return (
    <div className="vehicle-list">
      <h2 className="vehicle-list-title">
        Available Vehicles ({vehicles.length})
      </h2>
      <div className="vehicle-grid">
        {vehicles.map((vehicle) => (
          <VehicleCard key={vehicle.id} vehicle={vehicle} />
        ))}
      </div>
    </div>
  );
};

export default VehicleList;
