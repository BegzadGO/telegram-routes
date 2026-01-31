import React from 'react';

/**
 * VehicleCard Component
 * Displays individual vehicle information with driver details
 */
const VehicleCard = ({ vehicle }) => {
  const { vehicle_name, driver_name, driver_phone, type, price } = vehicle;

  return (
    <div className="vehicle-card">
      <div className="vehicle-card-header">
        <div>
          <div className="vehicle-name">{vehicle_name}</div>
          <span className="vehicle-type">{type}</span>
        </div>
        {price && <div className="vehicle-price">${price}</div>}
      </div>

      <div className="vehicle-card-body">
        <div className="driver-info">
          <div className="driver-row">
            <span className="driver-label">Driver:</span>
            <span className="driver-value">{driver_name}</span>
          </div>
          
          {driver_phone && (
            <div className="driver-row">
              <span className="driver-label">Phone:</span>
              <a 
                href={`tel:${driver_phone}`} 
                className="driver-phone-link"
              >
                {driver_phone}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VehicleCard;
