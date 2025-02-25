import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import data from 'data.json';

const Map = () => {
  const { lat, lon } = data.mapInfo;

  return (
    <MapContainer 
      center={[lat, lon]} 
      zoom={16} 
      style={{ width: '100%', height: '300px' }}
      scrollWheelZoom={false}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[lat, lon]}>
        <Popup>
          Hongkong Canteen
          <p><b>회장님 칠순잔치 장소</b></p>
        </Popup>
      </Marker>
    </MapContainer>
  );
};

export default Map;
