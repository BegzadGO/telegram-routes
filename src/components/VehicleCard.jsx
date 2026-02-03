import React from 'react';

const VehicleCard = ({ vehicle, isFavorite, onToggleFavorite }) => {
  const { vehicle_name, driver_name, driver_phone } = vehicle;
  const formatDriverName = (name) => {
    if (!name) return '';
    const firstName = name.trim().split(' ')[0];
    return firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
  };

  return (
    <div className="vehicle-card">

      {/* Верхняя строка */}
      <div className="vehicle-card-top">
        <div className="vehicle-name">{vehicle_name}</div>
        <div className="driver-name">
  {formatDriverName(driver_name)}
</div>
      </div>

      {driver_phone && (
  <a
    href={`tel:${driver_phone}`}
    className="call-button"
    onClick={() => {
      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
      }
    }}
  >
    📞 Позвонить
  </a>
)}

    </div>
  );
};

export default VehicleCard;
