import type { Map as MapInstance } from 'maplibre-gl';

/** Real POIs come from the map tiles, never from invented offsets around a property. */
export const NEIGHBORHOOD_PLACES = [
  { id: 'mosque', ar: 'مسجد', en: 'Mosque', path: 'M5 21V11h14v10M3 21h18M8 11c0-3 4-6 4-6s4 3 4 6M12 5V2M10 21v-5h4v5' },
  { id: 'restaurant', ar: 'مطعم', en: 'Restaurant', path: 'M4 3v6c0 3 6 3 6 0V3M7 3v18M20 21V3c-5 3-5 10 0 10' },
  { id: 'school', ar: 'مدرسة', en: 'School', path: 'm2 9 10-5 10 5-10 5-10-5M6 11v6l6 3 6-3v-6M22 9v7' },
  { id: 'pharmacy', ar: 'صيدلية', en: 'Pharmacy', path: 'M9 3h6v6h6v6h-6v6H9v-6H3V9h6Z' },
  { id: 'park', ar: 'حديقة', en: 'Park', path: 'm12 3-7 9h4l-5 5h7v5h2v-5h7l-5-5h4Z' },
  { id: 'market', ar: 'متجر', en: 'Store', path: 'M4 10v11h16V10M3 10l2-7h14l2 7ZM9 21v-7h6v7' },
] as const;

export function ensureNeighborhoodPlaces(map: MapInstance, source: string, visible: boolean) {
  for (const place of NEIGHBORHOOD_PLACES) {
    const id = `neighborhood-${place.id}`;
    if (map.hasImage(id)) continue;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (!ctx) continue;
    ctx.fillStyle = '#102b46';
    ctx.strokeStyle = '#dcebf7';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(32, 32, 29, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.translate(14, 14);
    ctx.scale(1.5, 1.5);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.7;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke(new Path2D(place.path));
    map.addImage(id, ctx.getImageData(0, 0, 64, 64), { pixelRatio: 2 });
  }
  if (!map.getLayer('neighborhood-places')) {
    map.addLayer({
      id: 'neighborhood-places',
      type: 'symbol',
      source,
      'source-layer': 'poi',
      minzoom: 13,
      filter: ['any',
        ['in', ['get', 'subclass'], ['literal', ['mosque', 'muslim', 'restaurant', 'cafe', 'fast_food', 'school', 'kindergarten', 'pharmacy', 'park', 'garden', 'supermarket', 'convenience', 'marketplace']]],
        ['in', ['get', 'class'], ['literal', ['school', 'park', 'grocery']]],
      ],
      layout: {
        visibility: visible ? 'visible' : 'none',
        'icon-image': ['match', ['get', 'subclass'],
          ['mosque', 'muslim'], 'neighborhood-mosque',
          ['restaurant', 'cafe', 'fast_food'], 'neighborhood-restaurant',
          ['school', 'kindergarten'], 'neighborhood-school',
          'pharmacy', 'neighborhood-pharmacy',
          ['park', 'garden'], 'neighborhood-park',
          ['match', ['get', 'class'], 'school', 'neighborhood-school', 'park', 'neighborhood-park', 'neighborhood-market'],
        ],
        'icon-size': ['interpolate', ['linear'], ['zoom'], 13, .65, 17, 1],
        'icon-allow-overlap': false,
        'icon-padding': 8,
      },
    });
  } else {
    map.setLayoutProperty('neighborhood-places', 'visibility', visible ? 'visible' : 'none');
  }
}
