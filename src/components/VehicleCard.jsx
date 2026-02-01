import React from 'react';

const VehicleCard = ({ vehicle }) => {
  const { vehicle_name, driver_name, driver_phone } = vehicle;

  return (
    <div className="vehicle-card">

      {/* Верхняя строка */}
      <div className="vehicle-card-top">
        <div className="vehicle-name">{vehicle_name}</div>
        <div className="driver-name">{driver_name}</div>
      </div>

      {/* Телефон по центру */}
      {driver_phone && (
  <button
    className="call-button"
    onClick={() => {
      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
      }

      window.Telegram.WebApp.openTelegramLink(
        `tel:${driver_phone}`
      );
    }}
  >
    📞 Позвонить
  </button>
)}

    </div>
  );
};

export default VehicleCard;
