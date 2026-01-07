'use client';

/**
 * Destination Map Component - Enhanced
 * ====================================
 * Interactive world map with beautiful custom markers
 */

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import L from 'leaflet';

// Dynamically import Leaflet components (client-side only)
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);

const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);

const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);

const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);

interface DestinationCoordinate {
  destination: string;
  latitude: number;
  longitude: number;
  visits: number;
}

interface DestinationMapProps {
  destinations: DestinationCoordinate[];
  label?: string; // Custom label for the count (e.g., "visits", "users")
  icon?: string; // Custom icon for the count
}

// Create custom marker icons based on visit count
const createCustomIcon = (visits: number, destination: string) => {
  // Determine color based on visit count
  let color = '#3b82f6'; // blue (default)
  let bgColor = '#dbeafe'; // light blue
  let borderColor = '#2563eb'; // darker blue
  
  if (visits >= 8) {
    color = '#dc2626'; // red for hot destinations
    bgColor = '#fee2e2';
    borderColor = '#b91c1c';
  } else if (visits >= 6) {
    color = '#f59e0b'; // orange for popular
    bgColor = '#fed7aa';
    borderColor = '#d97706';
  } else if (visits >= 4) {
    color = '#8b5cf6'; // purple for moderate
    bgColor = '#ede9fe';
    borderColor = '#7c3aed';
  }
  
  // Determine size based on visits
  const size = Math.min(40 + visits * 2, 70);
  
  return L.divIcon({
    html: `
      <div style="
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <!-- Pin shadow -->
        <div style="
          position: absolute;
          bottom: -3px;
          width: ${size * 0.6}px;
          height: ${size * 0.3}px;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 50%;
          filter: blur(4px);
        "></div>
        
        <!-- Pin body -->
        <div style="
          position: relative;
          width: ${size}px;
          height: ${size}px;
          background: ${bgColor};
          border: 3px solid ${borderColor};
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06);
          transition: all 0.3s ease;
          cursor: pointer;
        ">
          <!-- Inner circle with icon -->
          <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(45deg);
            width: ${size * 0.6}px;
            height: ${size * 0.6}px;
            background: ${color};
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: ${size * 0.3}px;
            box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
          ">
            ✈️
          </div>
        </div>
        
        <!-- Visit count badge -->
        <div style="
          position: absolute;
          top: -8px;
          right: -8px;
          background: ${color};
          color: white;
          border-radius: 12px;
          padding: 2px 6px;
          font-size: 10px;
          font-weight: bold;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          border: 2px solid white;
        ">
          ${visits}
        </div>
      </div>
    `,
    className: 'custom-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
};

export function DestinationMap({ destinations, label = 'visits', icon = '✈️' }: DestinationMapProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="w-full h-96 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
          <p className="text-gray-600 font-medium">Loading interactive map...</p>
        </div>
      </div>
    );
  }

  if (!destinations || destinations.length === 0) {
    return (
      <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">No destination data available</p>
      </div>
    );
  }

  // Default center (world view)
  const center: [number, number] = [20, 0];
  const zoom = 2;

  return (
    <div className="w-full h-96 rounded-lg overflow-hidden shadow-xl border-2 border-gray-200">
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
        zoomControl={true}
      >
        {/* Enhanced map tiles with better colors */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {destinations.map((dest, index) => {
          // Skip invalid coordinates
          if (!dest.latitude || !dest.longitude) return null;
          
          const customIcon = createCustomIcon(dest.visits, dest.destination);
          
          return (
            <Marker
              key={index}
              position={[dest.latitude, dest.longitude]}
              icon={customIcon}
            >
              <Popup className="custom-popup">
                <div className="p-3 min-w-[200px]">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-base text-gray-900 flex-1 pr-2">
                      {dest.destination}
                    </h3>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-full whitespace-nowrap">
                      #{index + 1}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center text-xs text-gray-600">
                      <span className="mr-1">📍</span>
                      <span>{dest.latitude.toFixed(4)}, {dest.longitude.toFixed(4)}</span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                      <span className="text-sm font-semibold text-gray-700">Total {label.charAt(0).toUpperCase() + label.slice(1)}:</span>
                      <span className="text-lg font-bold text-blue-600">
                        {icon} {dest.visits}
                      </span>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}

