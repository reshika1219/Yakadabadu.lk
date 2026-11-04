import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { geocode, decodePolyline, COLOMBO } from '../utils/geo';

const pin = (status) =>
  L.divIcon({
    className: '',
    html: `<span class="map-pin map-pin--${status === 'assigned' ? 'assigned' : 'other'}"></span>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -12],
  });

// Re-centre the map whenever the set of points changes
const Fit = ({ points }) => {
  const map = useMap();
  useEffect(() => {
    if (points.length > 1) map.fitBounds(points, { padding: [40, 40], maxZoom: 15 });
    else if (points.length === 1) map.setView(points[0], 14);
  }, [map, points]);
  return null;
};

const MapComponent = ({ pickups = [], route, height = 420 }) => {
  const [located, setLocated] = useState([]); // [{ pickup, position }]
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLocated([]);
    setPending(pickups.length > 0);
    (async () => {
      for (const pickup of pickups) {
        const position = await geocode(pickup.address || '');
        if (cancelled) return;
        if (position) setLocated((prev) => [...prev, { pickup, position }]);
      }
      if (!cancelled) setPending(false);
    })();
    return () => { cancelled = true; };
    // pickups is a fresh array per render in some callers; key off the content instead
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickups.map((p) => `${p._id}:${p.address}`).join('|')]);

  const routeLine = useMemo(() => decodePolyline(route?.overview_polyline?.points), [route]);
  const points = useMemo(
    () => (routeLine.length ? routeLine : located.map((l) => l.position)),
    [routeLine, located]
  );
  const missing = pickups.length - located.length;

  return (
    <div className="map-wrap">
      <MapContainer center={COLOMBO} zoom={11} style={{ height, width: '100%' }} scrollWheelZoom={false}>
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {located.map(({ pickup, position }) => (
          <Marker key={pickup._id} position={position} icon={pin(pickup.status)}>
            <Popup>
              <strong className="text-capitalize">{pickup.pickupType || 'Pickup'}</strong>
              <br />
              {pickup.address}
              <br />
              <small>{new Date(pickup.scheduledTime).toLocaleString()}</small>
            </Popup>
          </Marker>
        ))}
        {routeLine.length > 0 && <Polyline positions={routeLine} pathOptions={{ color: '#0f2e1c', weight: 5 }} />}
        <Fit points={points} />
      </MapContainer>
      {(pending || missing > 0) && (
        <div className="map-note" role="status">
          {pending ? 'Locating addresses…' : `${missing} address${missing > 1 ? 'es' : ''} could not be placed on the map`}
        </div>
      )}
    </div>
  );
};

export default MapComponent;
