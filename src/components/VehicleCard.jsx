const VehicleCard = ({ vehicle }) => {
  const { vehicle_name, driver_name } = vehicle;

  const formatDriverName = (name) => {
    if (!name) return '';
    const firstName = name.trim().split(' ')[0];
    return firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
  };

  return (
    <div className="vehicle-card">
      <div className="vehicle-card-top">
        <div className="vehicle-name">{vehicle_name}</div>
        <div className="driver-name">{formatDriverName(driver_name)}</div>
      </div>
    </div>
  );
};

export default VehicleCard;
