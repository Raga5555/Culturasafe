/**
 * CulturaSafe - Tourism & Belongings-Safety Application
 * Interactive Leaflet Map with OpenStreetMap and OSRM Free Routing,
 * Live GPS Location Tracking, and Supabase Backend Integration
 */
import L from 'leaflet';
import { SupabaseService, DbItinerary, DbSavedDestination } from './supabase.ts';

// Type definitions
export interface Place {
  id: string;
  name: string;
  cat: string;
  emoji: string;
  desc: string;
  tags: string[];
  mins: number;
  order: number;
  coords: [number, number]; // [lat, lng]
  address: string | null;
  hours: string | null;
  image: string | null;
  selectable: boolean;
}

export interface DestinationItem {
  id: string;
  name: string;
  type: string;
  curated: boolean;
}

export interface TripState {
  date: string;
  start: string;
  end: string;
  interests: string[];
  places: string[];
}

export interface BleState {
  status: 'connected' | 'separated';
  signal: string;
  battery: number;
  last: {
    name: string;
    time: number;
    sample: boolean;
    coords: [number, number];
  } | null;
}

export interface AppState {
  onboarded: boolean;
  interests: string[];
  destination: string | null;
  view: string;
  editing: boolean;
  trip: TripState;
  plan: { ids: string[]; skipped: string[]; source: string } | null;
  saved: Array<{ id: number | string; destName: string; trip: TripState; plan: any }>;
  starredPlaces: string[];
  focus: string | null;
  ble: BleState;
}

/* ================= DATA ================= */
export const INTERESTS: [string, string, string][] = [
  ['heritage', 'History & Heritage', '🏛️'],
  ['temples', 'Temples & Spiritual Places', '🛕'],
  ['beaches', 'Beaches & Coastal Views', '🌊'],
  ['cafes', 'Cafés & Coffee Shops', '☕'],
  ['food', 'Local Food & Restaurants', '🍛'],
  ['architecture', 'Architecture', '🏰'],
  ['museums', 'Museums & Art', '🖼️'],
  ['nature', 'Nature & Parks', '🌳'],
  ['shopping', 'Shopping & Local Markets', '🛍️'],
  ['photo', 'Photography Spots', '📷'],
  ['culture', 'Culture & Local Experiences', '🎭'],
  ['relax', 'Relaxation & Scenic Walks', '🌅']
];

export const IN = Object.fromEntries(INTERESTS.map(i => [i[0], i]));

export const DESTS: DestinationItem[] = [
  { id: 'puducherry', name: 'Puducherry', type: 'City', curated: true },
  { id: 'goa', name: 'Goa', type: 'State', curated: false },
  { id: 'kerala', name: 'Kerala', type: 'State', curated: false },
  { id: 'jaipur', name: 'Jaipur', type: 'City', curated: false },
  { id: 'kochi', name: 'Kochi', type: 'City', curated: false },
  { id: 'chennai', name: 'Chennai', type: 'City', curated: false },
  { id: 'varanasi', name: 'Varanasi', type: 'City', curated: false },
  { id: 'coorg', name: 'Coorg', type: 'Region', curated: false },
  { id: 'ladakh', name: 'Ladakh', type: 'Region', curated: false }
];

/* Verified coordinates for the 10 curated Puducherry attractions */
export const PLACES: Place[] = [
  {
    id: 'ashram',
    name: 'Sri Aurobindo Ashram',
    cat: 'Spiritual',
    emoji: '🕊️',
    coords: [11.9365, 79.8344],
    desc: 'Spiritual community and meditation centre associated with Sri Aurobindo and the Mother.',
    tags: ['temples', 'culture', 'heritage'],
    mins: 40,
    order: 6,
    address: 'Rue de la Marine, White Town',
    hours: '08:00 - 18:00',
    image: null,
    selectable: true
  },
  {
    id: 'manakula',
    name: 'Sri Manakula Vinayagar Temple',
    cat: 'Temple',
    emoji: '🛕',
    coords: [11.9351, 79.8336],
    desc: 'Well-known Ganesha temple near the French Quarter with ancient golden spire.',
    tags: ['temples', 'heritage', 'culture'],
    mins: 30,
    order: 5,
    address: 'Manakula Vinayagar Koil St, White Town',
    hours: '06:00 - 12:30, 16:00 - 21:30',
    image: null,
    selectable: true
  },
  {
    id: 'museum',
    name: 'Puducherry Museum',
    cat: 'Museum',
    emoji: '🏺',
    coords: [11.9338, 79.8347],
    desc: 'Regional museum with Pallava sculpture, bronze artefacts, and French colonial-era collections.',
    tags: ['museums', 'heritage', 'culture'],
    mins: 60,
    order: 8,
    address: 'Saint Louis St, White Town',
    hours: '09:00 - 17:00 (Closed Mon)',
    image: null,
    selectable: true
  },
  {
    id: 'memorial',
    name: 'French War Memorial',
    cat: 'Monument',
    emoji: '🗿',
    coords: [11.9327, 79.8358],
    desc: 'Colonial-era war memorial dedicated to the soldiers of WWI close to the seafront.',
    tags: ['heritage', 'photo'],
    mins: 20,
    order: 2,
    address: 'Goubert Ave, White Town',
    hours: 'Open 24 hours',
    image: null,
    selectable: true
  },
  {
    id: 'basilica',
    name: 'Basilica of the Sacred Heart of Jesus',
    cat: 'Church',
    emoji: '⛪',
    coords: [11.9261, 79.8286],
    desc: 'Gothic-style Catholic church known for its rare stained glass windows depicting gospel events.',
    tags: ['architecture', 'heritage', 'temples'],
    mins: 30,
    order: 7,
    address: 'MG Road Area, South Blvd',
    hours: '06:00 - 18:30',
    image: null,
    selectable: true
  },
  {
    id: 'promenade',
    name: 'Promenade Beach',
    cat: 'Seafront',
    emoji: '🌊',
    coords: [11.9304, 79.8357],
    desc: 'Famous 1.5 km seaside boulevard along the Bay of Bengal with sea spray and evening sea breeze.',
    tags: ['beaches', 'relax', 'photo'],
    mins: 45,
    order: 1,
    address: 'Goubert Ave',
    hours: 'Open 24 hours (No vehicles 17:00-06:30)',
    image: null,
    selectable: true
  },
  {
    id: 'park',
    name: 'Bharati Park',
    cat: 'Park',
    emoji: '🌳',
    coords: [11.9329, 79.8339],
    desc: 'Green landscaped park in the town centre featuring the Aayi Mandapam Greco-Roman monument.',
    tags: ['nature', 'relax', 'photo'],
    mins: 30,
    order: 3,
    address: 'Rue Saint Gilles, White Town',
    hours: '06:30 - 20:30',
    image: null,
    selectable: true
  },
  {
    id: 'quarter',
    name: 'French Quarter / White Town',
    cat: 'Neighbourhood',
    emoji: '🏘️',
    coords: [11.9333, 79.8322],
    desc: 'Colonial-era streets lined with yellow mustard villas, leafy bougainvillea, boutiques and quaint cafés.',
    tags: ['architecture', 'heritage', 'culture', 'photo'],
    mins: 75,
    order: 4,
    address: 'White Town Heritage Precinct',
    hours: 'Best explored on foot morning/evening',
    image: null,
    selectable: true
  },
  {
    id: 'bharathidasan',
    name: 'Bharathidasan Museum',
    cat: 'Museum',
    emoji: '📖',
    coords: [11.9348, 79.8280],
    desc: 'Former residence and memorial museum dedicated to the prominent 20th-century Tamil poet Bharathidasan.',
    tags: ['museums', 'culture', 'heritage'],
    mins: 30,
    order: 9,
    address: '95, Perumal Koil St, Heritage Town',
    hours: '09:00 - 17:00 (Closed Mon)',
    image: null,
    selectable: true
  },
  {
    id: 'market',
    name: 'Goubert Market',
    cat: 'Market',
    emoji: '🛍️',
    coords: [11.9366, 79.8285],
    desc: 'Vibrant local bazaar bustling with fresh flowers, spices, tropical fruits and traditional street life.',
    tags: ['shopping', 'food', 'culture'],
    mins: 45,
    order: 10,
    address: 'Jawaharlal Nehru St, Heritage Town',
    hours: '06:00 - 21:00',
    image: null,
    selectable: true
  }
];

export const P = Object.fromEntries(PLACES.map(p => [p.id, p]));
export const TRAVEL = 10; // estimated minutes between stops

/* Known Starting Locations for route generation */
export interface StartLocation {
  id: string;
  name: string;
  coords: [number, number] | null;
}

export const START_LOCATIONS: Record<string, StartLocation> = {
  current: { id: 'current', name: '📍 My Current Location', coords: null },
  bus_stand: { id: 'bus_stand', name: 'Puducherry Bus Stand', coords: [11.9272, 79.8143] },
  railway: { id: 'railway', name: 'Puducherry Railway Station', coords: [11.9254, 79.8292] },
  airport: { id: 'airport', name: 'Puducherry Airport', coords: [11.9686, 79.8105] },
  promenade: { id: 'promenade', name: 'Promenade Beach', coords: [11.9304, 79.8357] },
  quarter: { id: 'quarter', name: 'White Town', coords: [11.9333, 79.8322] }
};

/* ================= STATE ================= */
const KEY = 'culturasafe-v3';
const iso = (d: number | Date) => {
  const x = new Date(d);
  return new Date(x.getTime() - x.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
};
const day = (n: number) => iso(Date.now() + n * 864e5);

const fresh = (): AppState => ({
  onboarded: true,
  interests: ['heritage', 'culture', 'beaches'],
  destination: 'puducherry',
  view: 'explore', // Per requirement: Explore page is active on startup
  editing: false,
  trip: {
    date: day(1),
    start: '09:00',
    end: '13:00',
    interests: ['heritage', 'culture', 'beaches'],
    places: ['ashram', 'manakula', 'promenade', 'quarter']
  },
  plan: null,
  saved: [],
  starredPlaces: [],
  focus: null,
  ble: {
    status: 'connected',
    signal: 'Strong',
    battery: 86,
    last: {
      name: 'Promenade Beach',
      time: Date.now() - 1000 * 60 * 18,
      sample: true,
      coords: [11.9304, 79.8357]
    }
  }
});

let S: AppState;
try {
  const stored = JSON.parse(localStorage.getItem(KEY) || '{}');
  S = { ...fresh(), ...stored };
  // Per requirement: Open the Explore page automatically on startup
  S.view = 'explore';
  if (!S.destination) S.destination = 'puducherry';
} catch (e) {
  S = fresh();
}

const save = () => {
  try {
    localStorage.setItem(KEY, JSON.stringify(S));
  } catch (e) {}
};

const $ = <T extends HTMLElement = HTMLElement>(s: string): T | null => document.querySelector(s);
const toMin = (t: string) => {
  const [a, b] = t.split(':').map(Number);
  return a * 60 + b;
};
const hm = (m: number) => {
  m = ((m % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60);
  return `${h % 12 || 12}:${String(m % 60).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
};
const dur = (m: number) => (m >= 60 ? `${Math.floor(m / 60)}h${m % 60 ? ' ' + (m % 60) + 'm' : ''}` : `${m} min`);
const fdate = (d: string) => new Date(d + 'T00:00').toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });

let toastTimeout: any;
export const toast = (m: string) => {
  const t = $('#toast');
  if (!t) return;
  t.textContent = m;
  t.classList.add('on');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => t.classList.remove('on'), 3000);
};

/* ================= SERVICES ================= */
export const BleService = {
  separate() {
    const cur = S.plan?.ids?.[0] || 'promenade';
    const place = P[cur] || P.promenade;
    S.ble = {
      ...S.ble,
      status: 'separated',
      signal: 'Lost',
      last: {
        name: place.name,
        time: Date.now(),
        sample: true,
        coords: place.coords
      }
    };
    save();
    render();
    MapIntegration.updateAlertMarker();
    toast('Backpack tag separated! Alert logged.');
  },
  reconnect() {
    S.ble = {
      ...S.ble,
      status: 'connected',
      signal: 'Strong'
    };
    save();
    render();
    MapIntegration.updateAlertMarker();
    toast('Tag reconnected');
  }
};

export const Itinerary = {
  score: (id: string) => (P[id]?.tags || []).filter(t => S.trip.interests.includes(t)).length,
  generate() {
    const avail = toMin(S.trip.end) - toMin(S.trip.start);
    let ids = S.trip.places.slice().sort((a, b) => (P[a]?.order || 0) - (P[b]?.order || 0));
    const skipped: string[] = [];
    const total = (l: string[]) => l.reduce((s, id, i) => s + (P[id]?.mins || 30) + (i ? TRAVEL : 0), 0);
    while (ids.length > 1 && total(ids) > avail) {
      let w = ids[ids.length - 1];
      for (let i = ids.length - 1; i >= 0; i--) {
        if (this.score(ids[i]) < this.score(w)) w = ids[i];
      }
      ids = ids.filter(x => x !== w);
      skipped.push(w);
    }
    return { ids, skipped, source: 'Personalized rules engine' };
  },
  slots() {
    let t = toMin(S.trip.start);
    return (S.plan?.ids || []).map(id => {
      const s = { id, at: t };
      t += (P[id]?.mins || 30) + TRAVEL;
      return s;
    });
  }
};

/* ================= FREE LEAFLET MAP & OSRM ROUTING INTEGRATION ================= */
function createCustomPin(emoji: string, bg: string = '#1F4D3A', isSpecial: boolean = false) {
  const LeafletLib = (window as any).L || L;
  return LeafletLib.divIcon({
    className: 'custom-map-icon-wrapper',
    html: `<div class="custom-map-pin ${isSpecial ? 'belonging-pin' : ''}" style="background:${bg};">
      <span>${emoji}</span>
    </div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20]
  });
}

function createUserGpsPin() {
  const LeafletLib = (window as any).L || L;
  return LeafletLib.divIcon({
    className: 'custom-map-icon-wrapper',
    html: `<div class="user-gps-marker">
      <div class="user-gps-dot"></div>
      <div class="user-gps-pulse"></div>
    </div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -14]
  });
}

// Distance helper (Haversine formula in meters)
function computeDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // radius of Earth in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/* ================= LIVE GPS LOCATION TRACKER ================= */
export const LiveTracking = {
  isTracking: false,
  followMe: false,
  saveToCloud: false,
  coords: null as [number, number] | null,
  accuracy: null as number | null,
  lastUpdated: null as number | null,
  watchId: null as number | null,
  marker: null as L.Marker | null,
  accuracyCircle: null as L.Circle | null,
  lastCloudSavedTime: 0,
  lastCloudSavedCoords: null as [number, number] | null,
  minCloudSaveIntervalMs: 15000, // Throttling: at most once every 15s
  minDistanceThresholdMeters: 25, // Or if moved > 25 meters

  init() {
    const chkFollow = $('#chkFollowMe') as HTMLInputElement | null;
    const chkCloud = $('#chkSaveLocationHistory') as HTMLInputElement | null;

    if (chkFollow) {
      chkFollow.checked = this.followMe;
      chkFollow.onchange = () => {
        this.followMe = chkFollow.checked;
        if (this.followMe && this.coords && MapIntegration.map) {
          MapIntegration.map.setView(this.coords, Math.max(MapIntegration.map.getZoom(), 15));
        }
      };
    }

    if (chkCloud) {
      chkCloud.checked = this.saveToCloud;
      chkCloud.onchange = () => {
        if (chkCloud.checked && !SupabaseService.getCurrentUser()) {
          toast('Please sign in first to save location history to cloud.');
          chkCloud.checked = false;
          this.saveToCloud = false;
          AuthModal.open();
          return;
        }
        this.saveToCloud = chkCloud.checked;
        toast(this.saveToCloud ? '✓ Cloud location history logging enabled' : 'Cloud location history disabled');
      };
    }

    const btnLoc = $('#btnMyCurrentLocation');
    if (btnLoc) {
      btnLoc.onclick = () => this.requestCurrentLocation(true);
    }

    const btnTrack = $('#btnToggleLiveTracking');
    if (btnTrack) {
      btnTrack.onclick = () => {
        if (this.isTracking) {
          this.stopLiveTracking();
        } else {
          this.startLiveTracking();
        }
      };
    }
  },

  /**
   * One-shot Current Location Request
   */
  requestCurrentLocation(centerMap: boolean = true) {
    if (!navigator.geolocation) {
      this.displayError('Geolocation is not supported by your browser.');
      return;
    }

    this.updateStatus('Locating device...');

    navigator.geolocation.getCurrentPosition(
      pos => {
        this.handleLocationUpdate(pos, centerMap);
        toast(`Location acquired (±${Math.round(pos.coords.accuracy)}m)`);
      },
      err => {
        this.handleLocationError(err);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  },

  /**
   * Continuous Location Tracking via watchPosition
   */
  startLiveTracking() {
    if (!navigator.geolocation) {
      this.displayError('Geolocation is not supported by your browser.');
      return;
    }

    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }

    this.isTracking = true;
    this.updateTrackingButton();
    this.updateStatus('Acquiring live satellite fix...');

    this.watchId = navigator.geolocation.watchPosition(
      pos => {
        this.handleLocationUpdate(pos, this.followMe);
      },
      err => {
        this.handleLocationError(err);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 3000
      }
    );

    toast('Live tracking active. Browser updates position while active.');
  },

  stopLiveTracking() {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    this.isTracking = false;
    this.updateTrackingButton();
    this.updateStatus('Tracking stopped');
    toast('Live tracking stopped');
  },

  handleLocationUpdate(pos: GeolocationPosition, shouldCenter: boolean) {
    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;
    const acc = pos.coords.accuracy;
    this.coords = [lat, lng];
    this.accuracy = acc;
    this.lastUpdated = Date.now();

    const LeafletLib = (window as any).L || L;

    if (MapIntegration.map) {
      // 1. User Location Marker
      if (!this.marker) {
        this.marker = LeafletLib.marker([lat, lng], {
          icon: createUserGpsPin(),
          zIndexOffset: 1200
        }).addTo(MapIntegration.map);
      } else {
        this.marker.setLatLng([lat, lng]);
      }

      const popupHtml = `
        <div style="font-family:Figtree,sans-serif;padding:2px;">
          <b style="color:#1B72E8;">📍 My Current Location</b>
          <div style="font-size:12px;color:#6B6F66;margin-top:2px;">
            Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}<br>
            Accuracy: ±${Math.round(acc)} meters
          </div>
        </div>
      `;
      this.marker?.bindPopup(popupHtml);

      // 2. Accuracy circle
      if (acc && acc < 2500) {
        if (!this.accuracyCircle) {
          this.accuracyCircle = LeafletLib.circle([lat, lng], {
            radius: acc,
            color: '#1B72E8',
            weight: 1.5,
            fillColor: '#1B72E8',
            fillOpacity: 0.12
          }).addTo(MapIntegration.map);
        } else {
          this.accuracyCircle.setLatLng([lat, lng]);
          this.accuracyCircle.setRadius(acc);
        }
      } else if (this.accuracyCircle) {
        MapIntegration.map.removeLayer(this.accuracyCircle);
        this.accuracyCircle = null;
      }

      // Center if explicitly requested or if followMe is enabled
      if (shouldCenter) {
        MapIntegration.map.setView([lat, lng], Math.max(MapIntegration.map.getZoom(), 15));
      }
    }

    this.renderTelemetry();

    // Throttled Supabase location persistence (if opted in)
    if (this.saveToCloud && SupabaseService.getCurrentUser()) {
      const now = Date.now();
      const timeSinceLast = now - this.lastCloudSavedTime;
      let shouldSave = timeSinceLast >= this.minCloudSaveIntervalMs;

      if (!shouldSave && this.lastCloudSavedCoords) {
        const dist = computeDistanceMeters(
          this.lastCloudSavedCoords[0],
          this.lastCloudSavedCoords[1],
          lat,
          lng
        );
        if (dist >= this.minDistanceThresholdMeters) {
          shouldSave = true;
        }
      }

      if (shouldSave) {
        this.lastCloudSavedTime = now;
        this.lastCloudSavedCoords = [lat, lng];
        SupabaseService.saveLocationPoint(lat, lng, acc).catch(err => {
          console.warn('Cloud location persist warning:', err);
        });
      }
    }
  },

  handleLocationError(err: GeolocationPositionError) {
    let msg = 'Could not obtain GPS position.';
    if (err.code === err.PERMISSION_DENIED) {
      msg = 'Location permission was denied. Please allow location in your browser address bar.';
    } else if (err.code === err.POSITION_UNAVAILABLE) {
      msg = 'Location position unavailable. Check device GPS settings.';
    } else if (err.code === err.TIMEOUT) {
      msg = 'Location request timed out. Retrying on next cycle...';
    }
    this.displayError(msg);
  },

  displayError(msg: string) {
    const badge = $('#gpsStatusBadge');
    if (badge) {
      badge.innerHTML = `<span style="width:8px;height:8px;border-radius:50%;background:#B93A32;display:inline-block;"></span> <span style="color:#B93A32;">GPS: Notice</span>`;
    }
    const coordsEl = $('#gpsCoordsText');
    if (coordsEl) {
      coordsEl.textContent = msg;
    }
    toast(msg);
  },

  updateStatus(status: string) {
    const badge = $('#gpsStatusBadge');
    if (!badge) return;
    const color = this.isTracking ? '#2F7D5B' : '#6B6F66';
    badge.innerHTML = `<span style="width:8px;height:8px;border-radius:50%;background:${color};display:inline-block;"></span> GPS: ${status}`;
  },

  renderTelemetry() {
    const badge = $('#gpsStatusBadge');
    const coordsEl = $('#gpsCoordsText');
    const updatedEl = $('#gpsUpdatedText');

    if (badge) {
      const color = this.isTracking ? '#2F7D5B' : '#1B72E8';
      const label = this.isTracking ? 'Tracking Active' : 'Acquired';
      badge.innerHTML = `<span style="width:8px;height:8px;border-radius:50%;background:${color};display:inline-block;"></span> GPS: ${label}`;
    }

    if (coordsEl && this.coords) {
      const accStr = this.accuracy ? ` (±${Math.round(this.accuracy)}m)` : '';
      coordsEl.innerHTML = `<b>${this.coords[0].toFixed(5)}, ${this.coords[1].toFixed(5)}</b>${accStr}`;
    }

    if (updatedEl && this.lastUpdated) {
      const timeStr = new Date(this.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      updatedEl.textContent = `Updated: ${timeStr}`;
    }
  },

  updateTrackingButton() {
    const btn = $('#btnToggleLiveTracking');
    if (!btn) return;
    if (this.isTracking) {
      btn.textContent = '⏹ Stop Live Tracking';
      btn.classList.remove('alt');
      btn.classList.add('bad');
    } else {
      btn.textContent = '▶ Start Live Tracking';
      btn.classList.remove('bad');
      btn.classList.add('alt');
    }
  }
};

/* ================= MAP INTEGRATION ================= */
export const MapIntegration = {
  map: null as L.Map | null,
  markers: {} as Record<string, L.Marker>,
  routeLayer: null as L.GeoJSON | null,
  routeStartMarker: null as L.Marker | null,
  routeEndMarker: null as L.Marker | null,
  belongingMarker: null as L.Marker | null,
  initialized: false,

  mount(containerId: string = 'cultura-map') {
    if (this.initialized && this.map) {
      this.invalidateSize();
      return;
    }

    const container = document.getElementById(containerId);
    if (!container) return;

    const LeafletLib = (window as any).L || L;
    if (!LeafletLib || !LeafletLib.map) {
      container.innerHTML = `
        <div style="padding: 24px; text-align: center; color: var(--bad); background: var(--bads); border-radius: 14px;">
          <h3>Map Library Unavailable</h3>
          <p class="muted" style="margin: 8px 0;">Leaflet.js could not be loaded. Please verify your internet connection.</p>
          <button class="btn sm" onclick="window.location.reload()">Reload Application</button>
        </div>
      `;
      return;
    }

    try {
      // Puducherry center: Latitude 11.933, Longitude 79.830
      this.map = LeafletLib.map(containerId, {
        zoomControl: true,
        scrollWheelZoom: true
      }).setView([11.933, 79.830], 14);

      // OpenStreetMap Base Tile Layer
      const tileLayer = LeafletLib.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors'
      }).addTo(this.map);

      tileLayer.on('tileerror', () => {
        const statusEl = document.getElementById('mapStatusText');
        if (statusEl) {
          statusEl.innerHTML = '<span style="color:#8F2A24">⚠️ OpenStreetMap tile network slow. Retrying map tiles...</span>';
        }
      });

      // Handle map pan/drag: Pause "Follow Me" so user can freely explore without snapping back!
      this.map?.on('dragstart', () => {
        if (LiveTracking.followMe) {
          LiveTracking.followMe = false;
          const chk = $('#chkFollowMe') as HTMLInputElement | null;
          if (chk) chk.checked = false;
          toast('Follow Me paused while panning map');
        }
      });

      // Populate 10 tourist attraction markers
      this.addAttractionMarkers();

      // Check for belonging separation alert marker
      this.updateAlertMarker();

      this.initialized = true;

      // Invalidate size once DOM stabilizes
      setTimeout(() => this.invalidateSize(), 100);
      setTimeout(() => this.invalidateSize(), 400);

      // Populate toolbar destinations
      this.populateDestDropdown();
      this.bindToolbarEvents();
      LiveTracking.init();
    } catch (err: any) {
      console.error('Error initializing Leaflet map:', err);
      container.innerHTML = `
        <div style="padding: 24px; text-align: center; color: var(--bad);">
          <p>Failed to initialize map: ${err?.message || 'Unknown error'}</p>
        </div>
      `;
    }
  },

  addAttractionMarkers() {
    if (!this.map) return;
    const LeafletLib = (window as any).L || L;

    PLACES.forEach(place => {
      const isStarred = S.starredPlaces.includes(place.id);
      const marker = LeafletLib.marker(place.coords, {
        icon: createCustomPin(place.emoji, isStarred ? '#9A6A1C' : '#1F4D3A'),
        title: place.name
      });

      const popupHtml = `
        <div style="font-family: Figtree, system-ui, sans-serif; padding: 2px; min-width: 200px;">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; color: #1F4D3A; letter-spacing: 0.5px;">${place.cat}</div>
            <button onclick="window.culturaSafeToggleStar('${place.id}')" style="font-size:14px;cursor:pointer;" title="Bookmark place">${isStarred ? '⭐ Saved' : '☆ Save'}</button>
          </div>
          <h3 style="font-family: Fraunces, Georgia, serif; font-size: 16px; margin: 4px 0 6px; font-weight: 600; color: #25292B;">${place.emoji} ${place.name}</h3>
          <p style="font-size: 13px; color: #6B6F66; margin: 0 0 10px; line-height: 1.4;">${place.desc}</p>
          <div style="display:flex;gap:6px;flex-direction:column;">
            <button class="map-popup-btn" onclick="window.culturaSafeRouteTo('${place.id}')">Get Directions</button>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);
      marker.addTo(this.map!);
      this.markers[place.id] = marker;
    });
  },

  updateAlertMarker() {
    if (!this.map) return;
    const LeafletLib = (window as any).L || L;

    if (this.belongingMarker) {
      this.map.removeLayer(this.belongingMarker);
      this.belongingMarker = null;
    }

    if (S.ble.status === 'separated' && S.ble.last && this.map) {
      const coords = S.ble.last.coords || [11.9304, 79.8357];
      const marker = LeafletLib.marker(coords, {
        icon: createCustomPin('🎒', '#B93A32', true),
        zIndexOffset: 1000
      });

      const popupHtml = `
        <div style="font-family: Figtree, sans-serif; padding: 2px; min-width: 190px;">
          <div style="font-size: 11px; font-weight: 700; color: #B93A32; text-transform: uppercase;">⚠️ Belonging Separated</div>
          <h3 style="font-family: Fraunces, serif; font-size: 15px; margin: 4px 0; color: #8F2A24;">Backpack Tag</h3>
          <p style="font-size: 12px; color: #6B6F66; margin: 0 0 8px;">Last detected at <b>${S.ble.last.name}</b></p>
          <button class="map-popup-btn" style="background:#B93A32;" onclick="window.culturaSafeRouteTo('${P[S.ble.last.name]?.id || 'promenade'}')">Navigate to Tag</button>
        </div>
      `;
      marker.bindPopup(popupHtml);
      marker.addTo(this.map);
      this.belongingMarker = marker;
    }
  },

  populateDestDropdown() {
    const destSelect = document.getElementById('destSelect') as HTMLSelectElement | null;
    if (!destSelect) return;
    destSelect.innerHTML = PLACES.map(p => `<option value="${p.id}">${p.emoji} ${p.name} (${p.cat})</option>`).join('');
  },

  bindToolbarEvents() {
    const btnGetRoute = document.getElementById('btnGetRoute');
    const btnClearRoute = document.getElementById('btnClearRoute');
    const startSelect = document.getElementById('startSelect') as HTMLSelectElement | null;
    const destSelect = document.getElementById('destSelect') as HTMLSelectElement | null;

    if (btnGetRoute) {
      btnGetRoute.onclick = () => {
        const destId = destSelect?.value || 'ashram';
        this.requestDirections(destId);
      };
    }

    if (btnClearRoute) {
      btnClearRoute.onclick = () => {
        this.clearRoute();
      };
    }

    if (startSelect) {
      startSelect.onchange = () => {
        if (startSelect.value === 'current') {
          if (!LiveTracking.coords) {
            LiveTracking.requestCurrentLocation(false);
          }
        }
      };
    }
  },

  async requestDirections(destId: string) {
    const dest = P[destId];
    if (!dest) return;

    const startSelect = document.getElementById('startSelect') as HTMLSelectElement | null;
    const startKey = startSelect?.value || 'current';
    const statusEl = document.getElementById('routeStatus');

    let startCoords: [number, number] | null = null;
    let startLabel = 'Selected Start Point';

    if (startKey === 'current') {
      if (LiveTracking.coords) {
        startCoords = LiveTracking.coords;
        startLabel = 'My Current Location';
      } else {
        if (statusEl) {
          statusEl.innerHTML = `<div class="route-info-card"><span>Acquiring your GPS location for route start...</span></div>`;
        }
        navigator.geolocation.getCurrentPosition(
          pos => {
            LiveTracking.handleLocationUpdate(pos, false);
            this.executeRouting([pos.coords.latitude, pos.coords.longitude], 'My Current Location', dest.coords, dest.name);
          },
          err => {
            LiveTracking.handleLocationError(err);
            if (statusEl) {
              statusEl.innerHTML = `<div class="route-info-card error"><span>Could not retrieve current location. Please pick a known landmark from the list.</span></div>`;
            }
          },
          { enableHighAccuracy: true, timeout: 10000 }
        );
        return;
      }
    } else {
      const loc = START_LOCATIONS[startKey];
      if (loc && loc.coords) {
        startCoords = loc.coords;
        startLabel = loc.name;
      }
    }

    if (!startCoords) {
      if (statusEl) {
        statusEl.innerHTML = `<div class="route-info-card error"><span>Please choose a valid starting location.</span></div>`;
      }
      return;
    }

    this.executeRouting(startCoords, startLabel, dest.coords, dest.name);
  },

  async executeRouting(
    start: [number, number],
    startName: string,
    dest: [number, number],
    destName: string
  ) {
    const statusEl = document.getElementById('routeStatus');
    const clearBtn = document.getElementById('btnClearRoute');
    const LeafletLib = (window as any).L || L;

    if (statusEl) {
      statusEl.innerHTML = `<div class="route-info-card"><span>Calculating driving route between ${startName} and ${destName}...</span></div>`;
    }

    // Public OSRM Demo Routing Service: coordinates are in [lng, lat] order
    const url = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${dest[1]},${dest[0]}?overview=full&geometries=geojson`;

    try {
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Routing service returned response code ${res.status}`);
      }
      const data = await res.json();
      if (!data.routes || !data.routes.length) {
        throw new Error('No driving route could be found between these two locations.');
      }

      const route = data.routes[0];
      const distKm = (route.distance / 1000).toFixed(1);
      const durMin = Math.max(1, Math.round(route.duration / 60));

      // Clear previous route layers
      if (this.routeLayer && this.map) {
        this.map.removeLayer(this.routeLayer);
      }
      if (this.routeStartMarker && this.map) {
        this.map.removeLayer(this.routeStartMarker);
      }
      if (this.routeEndMarker && this.map) {
        this.map.removeLayer(this.routeEndMarker);
      }

      // Draw route on map
      this.routeLayer = LeafletLib.geoJSON(route.geometry, {
        style: {
          color: '#1F4D3A',
          weight: 5,
          opacity: 0.85,
          lineCap: 'round',
          lineJoin: 'round'
        }
      }).addTo(this.map!);

      // Markers for route start & destination
      this.routeStartMarker = LeafletLib.marker(start, {
        icon: createCustomPin('🟢', '#1D6B49')
      }).bindPopup(`<b>Start: ${startName}</b>`).addTo(this.map!);

      this.routeEndMarker = LeafletLib.marker(dest, {
        icon: createCustomPin('🎯', '#B93A32')
      }).bindPopup(`<b>Destination: ${destName}</b>`).addTo(this.map!);

      // Fit map viewport to encompass the route
      if (this.map && this.routeLayer) {
        this.map.fitBounds(this.routeLayer.getBounds(), { padding: [40, 40] });
      }

      // Update UI Status and Clear Route button
      if (statusEl) {
        statusEl.innerHTML = `
          <div class="route-info-card">
            <div>
              <strong>${startName} → ${destName}</strong>
              <div style="font-size:13px;color:#1F4D3A;margin-top:2px;">
                Distance: <b>${distKm} km</b> &nbsp;·&nbsp; Est. Duration: <b>~${durMin} min</b> &nbsp;·&nbsp; <span class="muted" style="font-size:11px;">OSRM free routing</span>
              </div>
            </div>
            <button class="btn sm alt" onclick="window.culturaSafeClearRoute()">Clear</button>
          </div>
        `;
      }

      if (clearBtn) clearBtn.style.display = 'inline-block';
      toast(`Route calculated: ${distKm} km (~${durMin} min)`);
    } catch (err: any) {
      console.warn('OSRM routing request failed:', err);
      if (statusEl) {
        statusEl.innerHTML = `
          <div class="route-info-card error">
            <div>
              <b>Routing Service Notice:</b> ${err?.message || 'Unable to compute route.'}
              <div style="font-size:12px;margin-top:4px;color:#7A4B48;">
                The public OSRM server may be temporarily busy. All map attractions and locations remain fully interactive.
              </div>
            </div>
            <button class="btn sm alt" onclick="window.culturaSafeClearRoute()">Dismiss</button>
          </div>
        `;
      }
    }
  },

  clearRoute() {
    if (this.routeLayer && this.map) {
      this.map.removeLayer(this.routeLayer);
      this.routeLayer = null;
    }
    if (this.routeStartMarker && this.map) {
      this.map.removeLayer(this.routeStartMarker);
      this.routeStartMarker = null;
    }
    if (this.routeEndMarker && this.map) {
      this.map.removeLayer(this.routeEndMarker);
      this.routeEndMarker = null;
    }

    const statusEl = document.getElementById('routeStatus');
    if (statusEl) statusEl.innerHTML = '';

    const clearBtn = document.getElementById('btnClearRoute');
    if (clearBtn) clearBtn.style.display = 'none';

    // Reset view
    if (this.map) {
      this.map.setView([11.933, 79.830], 14);
    }
  },

  focusPlace(id: string) {
    if (!this.map) return;

    if (id === 'belonging') {
      if (this.belongingMarker && S.ble.last?.coords) {
        this.map.setView(S.ble.last.coords, 16, { animate: true });
        this.belongingMarker.openPopup();
      }
      return;
    }

    const place = P[id];
    if (place && this.markers[id]) {
      this.map.setView(place.coords, 16, { animate: true });
      this.markers[id].openPopup();
      const destSelect = document.getElementById('destSelect') as HTMLSelectElement | null;
      if (destSelect) destSelect.value = id;
    }
  },

  invalidateSize() {
    if (!this.map) return;
    this.map.invalidateSize();
  },

  update(d: any) {
    if (!this.map) return;
    this.updateAlertMarker();
    if (d.focus) {
      this.focusPlace(d.focus);
    }
  }
};

// Global hooks for popup button clicks
(window as any).culturaSafeRouteTo = (destId: string) => {
  const destSelect = document.getElementById('destSelect') as HTMLSelectElement | null;
  if (destSelect) destSelect.value = destId;
  MapIntegration.requestDirections(destId);
};

(window as any).culturaSafeClearRoute = () => {
  MapIntegration.clearRoute();
};

(window as any).culturaSafeToggleStar = async (placeId: string) => {
  const place = P[placeId];
  if (!place) return;
  const exists = S.starredPlaces.includes(placeId);
  if (exists) {
    S.starredPlaces = S.starredPlaces.filter(id => id !== placeId);
    toast(`Removed ${place.name} from saved favourites`);
    if (SupabaseService.getCurrentUser()) {
      SupabaseService.removeSavedDestination(placeId);
    }
  } else {
    S.starredPlaces.push(placeId);
    toast(`⭐ Saved ${place.name} to favourites!`);
    if (SupabaseService.getCurrentUser()) {
      SupabaseService.saveDestination(placeId, place.name);
    }
  }
  save();
  render();
};

/* ================= MODALS & SUPABASE MANAGEMENT ================= */
export const AuthModal = {
  isSignUp: false,

  open(tab: 'account' | 'database' = 'account') {
    const modal = $('#authModal');
    if (!modal) return;
    modal.hidden = false;
    this.switchTab(tab);
    this.updateViews();
  },

  close() {
    const modal = $('#authModal');
    if (!modal) return;
    modal.hidden = true;
  },

  switchTab(tab: 'account' | 'database') {
    const tabAccount = $('#tabBtnAccount');
    const tabDb = $('#tabBtnDatabase');
    const contentAccount = $('#tabAccountContent');
    const contentDb = $('#tabDatabaseContent');

    if (tab === 'account') {
      tabAccount?.classList.add('active');
      tabDb?.classList.remove('active');
      if (contentAccount) contentAccount.style.display = 'block';
      if (contentDb) contentDb.style.display = 'none';
    } else {
      tabDb?.classList.add('active');
      tabAccount?.classList.remove('active');
      if (contentAccount) contentAccount.style.display = 'none';
      if (contentDb) contentDb.style.display = 'block';
      this.populateDbConfig();
    }
  },

  populateDbConfig() {
    const { url, key, isConfigured } = SupabaseService.getConfig();
    const urlInput = $('#sbUrlInput') as HTMLInputElement | null;
    const keyInput = $('#sbKeyInput') as HTMLInputElement | null;
    const notice = $('#supabaseStatusNotice');

    if (urlInput) urlInput.value = url;
    if (keyInput) keyInput.value = key;

    if (notice) {
      if (isConfigured) {
        notice.innerHTML = `
          <div class="row between">
            <div>
              <b style="color:var(--ok);">🟢 Supabase Connected</b>
              <div class="muted" style="font-size:12px;margin-top:2px;">PostgreSQL database & Auth ready</div>
            </div>
            <span class="chip ok">Active</span>
          </div>
        `;
      } else {
        notice.innerHTML = `
          <div class="row between">
            <div>
              <b style="color:var(--warn);">⚠️ Supabase Not Yet Configured</b>
              <div class="muted" style="font-size:12px;margin-top:2px;">Local browser storage is active as offline fallback. Enter your project URL & Anon Key below to enable cloud sync.</div>
            </div>
            <span class="chip warn">Local Fallback</span>
          </div>
        `;
      }
    }
  },

  updateViews() {
    const user = SupabaseService.getCurrentUser();
    const loggedOutView = $('#authLoggedOutView');
    const loggedInView = $('#authLoggedInView');
    const emailEl = $('#loggedInEmail');
    const userIdEl = $('#loggedInUserId');

    if (user) {
      if (loggedOutView) loggedOutView.style.display = 'none';
      if (loggedInView) loggedInView.style.display = 'block';
      if (emailEl) emailEl.textContent = user.email || 'Authenticated User';
      if (userIdEl) userIdEl.textContent = `UID: ${user.id}`;
    } else {
      if (loggedOutView) loggedOutView.style.display = 'block';
      if (loggedInView) loggedInView.style.display = 'none';
    }
  },

  init() {
    const btnOpen = $('#btnAuthOpen');
    const btnClose = $('#btnAuthClose');
    const modal = $('#authModal');

    if (btnOpen) btnOpen.onclick = () => this.open();
    if (btnClose) btnClose.onclick = () => this.close();

    if (modal) {
      modal.onclick = e => {
        if (e.target === modal) this.close();
      };
    }

    const tabAccount = $('#tabBtnAccount');
    const tabDb = $('#tabBtnDatabase');
    if (tabAccount) tabAccount.onclick = () => this.switchTab('account');
    if (tabDb) tabDb.onclick = () => this.switchTab('database');

    // Sign in vs sign up toggle
    const btnLoginMode = $('#authModeLoginBtn');
    const btnSignupMode = $('#authModeSignupBtn');
    const displayNameField = $('#authDisplayNameField');
    const submitBtn = $('#authSubmitBtn');

    if (btnLoginMode && btnSignupMode && submitBtn) {
      btnLoginMode.onclick = () => {
        this.isSignUp = false;
        btnLoginMode.classList.remove('alt');
        btnSignupMode.classList.add('alt');
        if (displayNameField) displayNameField.style.display = 'none';
        submitBtn.textContent = 'Sign In';
      };

      btnSignupMode.onclick = () => {
        this.isSignUp = true;
        btnSignupMode.classList.remove('alt');
        btnLoginMode.classList.add('alt');
        if (displayNameField) displayNameField.style.display = 'block';
        submitBtn.textContent = 'Create Account';
      };
    }

    // Auth Form Submit
    const authForm = $('#authForm') as HTMLFormElement | null;
    if (authForm) {
      authForm.onsubmit = async e => {
        e.preventDefault();
        const feedback = $('#authFeedback');
        if (feedback) feedback.style.display = 'none';

        const email = ($('#authEmailInput') as HTMLInputElement)?.value.trim();
        const password = ($('#authPasswordInput') as HTMLInputElement)?.value;
        const displayName = ($('#authDisplayNameInput') as HTMLInputElement)?.value.trim();

        if (!email || !password) return;

        if (submitBtn) {
          submitBtn.setAttribute('disabled', 'true');
          submitBtn.textContent = 'Processing...';
        }

        try {
          if (this.isSignUp) {
            await SupabaseService.signUp(email, password, displayName);
            toast('Account created! Signed in successfully.');
          } else {
            await SupabaseService.signIn(email, password);
            toast('Welcome back! Signed in.');
          }
          this.updateViews();
          await SyncService.pullFromCloud();
          render();
          this.close();
        } catch (err: any) {
          if (feedback) {
            feedback.textContent = err?.message || 'Authentication failed. Please verify credentials.';
            feedback.style.display = 'block';
          }
        } finally {
          if (submitBtn) {
            submitBtn.removeAttribute('disabled');
            submitBtn.textContent = this.isSignUp ? 'Create Account' : 'Sign In';
          }
        }
      };
    }

    // Sign out button
    const btnSignOut = $('#btnSignOut');
    if (btnSignOut) {
      btnSignOut.onclick = async () => {
        LiveTracking.stopLiveTracking();
        LiveTracking.saveToCloud = false;
        const chkCloud = $('#chkSaveLocationHistory') as HTMLInputElement | null;
        if (chkCloud) chkCloud.checked = false;

        await SupabaseService.signOut();
        toast('Signed out');
        this.updateViews();
        render();
        this.close();
      };
    }

    // Sync now button
    const btnSync = $('#btnSyncNow');
    if (btnSync) {
      btnSync.onclick = async () => {
        btnSync.textContent = 'Syncing...';
        await SyncService.pullFromCloud();
        btnSync.textContent = '🔄 Refresh Cloud Data';
        toast('Cloud data refreshed');
        render();
      };
    }

    // Supabase Config Form Submit
    const sbForm = $('#supabaseConfigForm') as HTMLFormElement | null;
    if (sbForm) {
      sbForm.onsubmit = e => {
        e.preventDefault();
        const url = ($('#sbUrlInput') as HTMLInputElement)?.value.trim();
        const key = ($('#sbKeyInput') as HTMLInputElement)?.value.trim();
        SupabaseService.setConfig(url, key);
        this.populateDbConfig();
        toast('Supabase configuration saved');
      };
    }

    // Test connection button
    const btnTest = $('#btnTestSbConnection');
    if (btnTest) {
      btnTest.onclick = async () => {
        btnTest.textContent = 'Testing...';
        const client = SupabaseService.getClient();
        if (!client) {
          toast('Configuration missing or invalid.');
          btnTest.textContent = 'Test Connection';
          return;
        }
        try {
          // Quick lightweight ping
          const { error } = await client.from('profiles').select('id').limit(1);
          if (error && error.code !== 'PGRST116') {
            console.warn('Test notice:', error);
          }
          toast('✓ Successfully connected to Supabase PostgreSQL!');
        } catch (e: any) {
          toast(`Connection notice: ${e?.message || 'Check project URL and key.'}`);
        } finally {
          btnTest.textContent = 'Test Connection';
        }
      };
    }
  }
};

/* ================= CLOUD SYNC SERVICE ================= */
export const SyncService = {
  async pullFromCloud() {
    const user = SupabaseService.getCurrentUser();
    if (!user) return;

    try {
      // 1. Fetch saved destinations
      const savedDests = await SupabaseService.getSavedDestinations();
      if (savedDests && savedDests.length) {
        const destIds = savedDests.map(d => d.destination_id);
        destIds.forEach(id => {
          if (!S.starredPlaces.includes(id)) {
            S.starredPlaces.push(id);
          }
        });
      }

      // 2. Fetch itineraries
      const cloudItins = await SupabaseService.getItineraries();
      if (cloudItins && cloudItins.length) {
        // Merge cloud itineraries into saved list
        cloudItins.forEach(ci => {
          const exists = S.saved.some(s => String(s.id) === String(ci.id));
          if (!exists) {
            S.saved.unshift({
              id: ci.id,
              destName: ci.destination,
              trip: {
                date: ci.travel_date,
                start: ci.start_time,
                end: ci.end_time,
                interests: ci.interests || [],
                places: ci.itinerary_data?.places || []
              },
              plan: ci.itinerary_data
            });
          }
        });
      }
      save();
    } catch (err) {
      console.warn('Sync error:', err);
    }
  }
};

/* ================= LOCATION HISTORY MODAL ================= */
export const HistoryModal = {
  open() {
    const modal = $('#historyModal');
    if (!modal) return;
    modal.hidden = false;
    this.loadHistory();
  },

  close() {
    const modal = $('#historyModal');
    if (!modal) return;
    modal.hidden = true;
  },

  async loadHistory() {
    const container = $('#historyListContainer');
    if (!container) return;

    if (!SupabaseService.getCurrentUser()) {
      container.innerHTML = `
        <div style="text-align:center;padding:24px;">
          <p class="muted">You must be signed in to store and view cloud location history.</p>
          <button class="btn sm" style="margin-top:8px;" onclick="window.culturaSafeOpenAuth()">Sign In to Account</button>
        </div>
      `;
      return;
    }

    container.innerHTML = `<p class="muted" style="text-align:center;padding:20px;">Fetching private location history...</p>`;

    try {
      const records = await SupabaseService.getLocationHistory(40);
      if (!records || !records.length) {
        container.innerHTML = `
          <div style="text-align:center;padding:24px;">
            <p class="muted">No location history points recorded yet.</p>
            <small class="muted">Check "Save history to cloud" and start live tracking to record points.</small>
          </div>
        `;
        return;
      }

      container.innerHTML = `
        <div style="display:flex;flex-direction:column;gap:8px;">
          ${records.map((r, i) => {
            const time = new Date(r.recorded_at).toLocaleString([], {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            });
            return `
              <div style="background:var(--card);border:1px solid var(--line);border-radius:8px;padding:8px 12px;display:flex;justify-content:space-between;align-items:center;font-size:13px;">
                <div>
                  <b>Point #${records.length - i}: ${r.latitude.toFixed(5)}, ${r.longitude.toFixed(5)}</b>
                  <div class="muted" style="font-size:11px;">Accuracy: ±${Math.round(r.accuracy_meters || 0)}m</div>
                </div>
                <span class="muted" style="font-size:12px;">${time}</span>
              </div>
            `;
          }).join('')}
        </div>
      `;
    } catch (err: any) {
      container.innerHTML = `<p class="err" style="padding:16px;">Error loading history: ${err?.message || 'Unknown error'}</p>`;
    }
  },

  init() {
    const btnOpen = $('#btnViewLocationHistory');
    const btnClose = $('#btnHistoryClose');
    const modal = $('#historyModal');

    if (btnOpen) btnOpen.onclick = () => this.open();
    if (btnClose) btnClose.onclick = () => this.close();

    if (modal) {
      modal.onclick = e => {
        if (e.target === modal) this.close();
      };
    }

    const btnClear = $('#btnClearHistoryBtn');
    if (btnClear) {
      btnClear.onclick = async () => {
        if (!confirm('Are you sure you want to delete all saved location history records?')) return;
        btnClear.setAttribute('disabled', 'true');
        btnClear.textContent = 'Deleting...';
        const ok = await SupabaseService.clearLocationHistory();
        btnClear.removeAttribute('disabled');
        btnClear.textContent = '🗑️ Delete All History';
        if (ok) {
          toast('Location history cleared from database.');
          this.loadHistory();
        } else {
          toast('Failed to clear location history.');
        }
      };
    }

    const btnRefresh = $('#btnRefreshHistoryBtn');
    if (btnRefresh) {
      btnRefresh.onclick = () => this.loadHistory();
    }
  }
};

/* ================= PRIVACY MODAL ================= */
export const PrivacyModal = {
  open() {
    const modal = $('#privacyModal');
    if (modal) modal.hidden = false;
  },
  close() {
    const modal = $('#privacyModal');
    if (modal) modal.hidden = true;
  },
  init() {
    const btnOpen = $('#btnPrivacyInfo');
    const btnClose = $('#btnPrivacyClose');
    const btnOk = $('#btnPrivacyOk');
    const modal = $('#privacyModal');

    if (btnOpen) btnOpen.onclick = () => this.open();
    if (btnClose) btnClose.onclick = () => this.close();
    if (btnOk) btnOk.onclick = () => this.close();

    if (modal) {
      modal.onclick = e => {
        if (e.target === modal) this.close();
      };
    }
  }
};

(window as any).culturaSafeOpenAuth = () => AuthModal.open();

/* ================= COMPONENTS ================= */
const IC = {
  home: '<path d="M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10"/>',
  explore: '<path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14"/>',
  itinerary: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  belongings: '<rect x="5" y="3" width="14" height="18" rx="4"/><path d="M12 7v3"/>',
  safety: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>'
};

const NAV = [
  ['home', 'Home'],
  ['explore', 'Explore'],
  ['itinerary', 'Itinerary'],
  ['belongings', 'Belongings'],
  ['safety', 'Safety']
];

const FLOW = ['destination', 'destpage', 'customize', 'interests', 'welcome'];
const sep = () => S.ble.status === 'separated';

function Nav() {
  const cur = FLOW.includes(S.view) ? 'home' : S.view;
  const dnav = $('#dnav');
  if (dnav) {
    dnav.innerHTML = NAV.map(([k, l]) => `<button data-go="${k}" ${cur === k ? 'aria-current="page"' : ''}>${l}</button>`).join('');
  }
  const bnav = $('#bnav');
  if (bnav) {
    bnav.innerHTML = NAV.map(
      ([k, l]) =>
        `<button data-go="${k}" ${cur === k ? 'aria-current="page"' : ''}><svg class="i" viewBox="0 0 24 24" aria-hidden="true">${IC[k as keyof typeof IC]}</svg>${l}${k === 'safety' ? '<i class="dot"></i>' : ''}</button>`
    ).join('');
  }
  const hide = !S.onboarded && ['welcome', 'interests'].includes(S.view);
  if (dnav) dnav.style.visibility = hide ? 'hidden' : '';
  if (bnav) bnav.style.display = hide ? 'none' : '';

  // Update header auth button indicator
  const user = SupabaseService.getCurrentUser();
  const authLabel = $('#authButtonLabel');
  const authDot = $('#authStatusDot');
  if (authLabel && authDot) {
    if (user) {
      authLabel.textContent = user.email ? user.email.split('@')[0] : 'Account';
      authDot.style.background = '#2F7D5B';
    } else {
      authLabel.textContent = 'Account';
      authDot.style.background = '#888';
    }
  }
}

const chips = (l: string[]) =>
  l.map(i => `<span class="chip">${IN[i]?.[2] || '✨'} ${IN[i]?.[1] || i}</span>`).join(' ') ||
  '<span class="muted">None selected</span>';

const dest = () => DESTS.find(d => d.id === S.destination);

function Welcome() {
  return `<div class="welcome view"><span class="logo">CulturaSafe</span><h1>Travel safely. Explore freely.</h1><p class="muted" style="font-size:16px">Discover places that match your interests. Build your own travel plan and explore with live GPS and belongings tracking.</p><div class="row"><button class="btn" data-act="start">Let's Plan My Journey</button><button class="link" data-act="skip">Skip personalization</button></div></div>`;
}

function Interests() {
  return `<div class="view" style="max-width:800px;margin:auto"><button class="link" data-act="${S.editing ? 'cancelEdit' : 'welcomeBack'}">← Back</button><h2 style="margin:10px 0 4px">What do you love exploring?</h2><p class="muted" style="margin-bottom:16px">Choose the experiences you enjoy. We'll use your preferences to personalize your trips.</p><div class="grid">${INTERESTS.map(([k, l, e]) => `<button class="opt" data-int="${k}" aria-pressed="${S.interests.includes(k)}"><span class="ic">${e}</span>${l}</button>`).join('')}</div><div class="row between" style="margin-top:18px"><span class="muted"><b>${S.interests.length}</b> of ${INTERESTS.length} selected</span><button class="btn" data-act="saveInterests" ${S.interests.length ? '' : 'disabled'}>${S.editing ? 'Save interests' : 'Continue'}</button></div></div>`;
}

function Home() {
  const d = dest();
  const planned = S.plan && S.plan.ids.length;
  const user = SupabaseService.getCurrentUser();
  const starred = S.starredPlaces.map(id => P[id]).filter(Boolean);

  return `<div class="view"><p class="muted">${user ? `Welcome back, ${user.email?.split('@')[0]}` : 'Welcome back'}</p><h2 style="margin-bottom:14px">Where to next?</h2>
  <div class="hero"><span class="chip" style="background:rgba(255,255,255,.18);color:#fff">${planned ? 'Current trip' : 'Destination'}</span><h1 style="margin:8px 0 4px">${d ? d.name : 'Puducherry'}</h1>
  <p class="muted" style="margin-bottom:16px">${planned ? `${fdate(S.trip.date)} · ${hm(toMin(S.trip.start))}–${hm(toMin(S.trip.end))} · ${S.plan?.ids.length} stops` : 'Heritage streets, spiritual landmarks, coastal views and local culture with live GPS & database sync.'}</p>
  <div class="row">${planned ? '<button class="btn" data-go="itinerary">Continue Trip</button><button class="btn alt" data-go="explore">Explore Map & GPS</button>' : `<button class="btn" data-go="${d ? 'customize' : 'destination'}">Plan My Trip</button><button class="btn alt" data-go="explore">Explore Map & GPS</button>`}<button class="btn alt" data-go="destination">Change destination</button></div></div>
  <div class="two"><div class="card"><div class="row between"><h3>Your interests</h3><button class="link" data-act="editInterests">Edit</button></div><div style="margin-top:10px">${chips(S.interests)}</div></div>
  <div class="card"><div class="row between"><h3>My belongings</h3><button class="link" data-go="belongings">Open</button></div><p style="margin-top:10px"><span class="chip ${sep() ? 'bad' : 'ok'}">${sep() ? '🔴 Backpack tag separated' : '🟢 Backpack tag connected'}</span></p></div></div>
  
  ${starred.length ? `
    <div class="card" style="margin-top:14px;">
      <div class="row between" style="margin-bottom:10px;">
        <h3>⭐ Saved Favourite Places (${starred.length})</h3>
        <button class="link" data-go="explore">View on Map</button>
      </div>
      <div class="grid">
        ${starred.map(p => `
          <div class="card" style="margin:0;padding:12px;display:flex;justify-content:space-between;align-items:center;">
            <div>
              <b>${p.emoji} ${p.name}</b>
              <div class="muted" style="font-size:12px;">${p.cat}</div>
            </div>
            <button class="btn sm alt" onclick="window.culturaSafeRouteTo('${p.id}')">Directions</button>
          </div>
        `).join('')}
      </div>
    </div>
  ` : ''}

  <div class="card" style="margin-top:14px"><h3 style="margin-bottom:10px">Saved trips</h3>${S.saved.length ? S.saved.map(t => `<div class="row between" style="padding:6px 0"><span>${t.destName} · ${fdate(t.trip.date)} · ${t.plan?.ids?.length || 0} stops</span><div class="row" style="gap:6px;"><button class="btn sm alt" data-open="${t.id}">Open</button><button class="btn sm bad" data-delsaved="${t.id}">Delete</button></div></div>`).join('') : '<p class="muted">No saved trips yet. Save one from the itinerary screen.</p>'}</div></div>`;
}

function Destination() {
  return `<div class="view" style="max-width:800px;margin:auto"><h2 style="margin-bottom:4px">Where would you like to explore?</h2><p class="muted" style="margin-bottom:14px">Puducherry is the curated destination with complete interactive map and attraction directions.</p>
  <input id="dq" type="search" placeholder="Search a city, state or region" aria-label="Search destinations" autocomplete="off"><div class="row" style="margin:12px 0" id="dtypes">${['All', 'City', 'State', 'Region'].map(t => `<button class="chip" data-type="${t}" style="${t === 'All' ? 'outline:2px solid var(--g2)' : ''}">${t}</button>`).join('')}</div><div id="dres"></div></div>`;
}

let dType = 'All';
function destResults() {
  const q = ($('#dq') as HTMLInputElement)?.value.trim().toLowerCase() || '';
  const l = DESTS.filter(d => (dType === 'All' || d.type === dType) && d.name.toLowerCase().includes(q));
  const dres = $('#dres');
  if (dres) {
    dres.innerHTML = `<div class="grid">${l.map(d => `<button class="opt" data-dest="${d.id}" style="display:block"><b>${d.name}</b><div class="muted">${d.type}${d.curated ? ' · Curated places & Map' : ' · Not curated yet'}</div></button>`).join('')}</div>${q && !l.length ? `<div class="card"><p>No match for “${($('#dq') as HTMLInputElement)?.value}”.</p><button class="btn sm" style="margin-top:8px" data-custom>Use “${($('#dq') as HTMLInputElement)?.value.trim()}” anyway</button></div>` : ''}`;
  }
}

function DestPage() {
  const d = dest();
  if (!d) return Destination();
  return `<div class="view" style="max-width:800px;margin:auto"><button class="link" data-go="destination">← Destinations</button>
  <div class="hero" style="margin-top:12px"><span class="chip" style="background:rgba(255,255,255,.18);color:#fff">${d.type}</span><h1 style="margin:8px 0">${d.name}</h1>
  ${d.curated ? `<p class="muted" style="margin-bottom:6px">Discover heritage streets, spiritual landmarks, coastal views and local culture.</p><p class="muted" style="margin-bottom:16px">${PLACES.length} curated places on interactive map.</p><div class="row"><button class="btn" data-go="customize">Plan My Trip</button><button class="btn alt" data-go="explore">View on Map</button></div>` : `<p class="muted" style="margin-bottom:16px">We don't have a verified place set for ${d.name} yet. In this prototype, planning and maps are available for Puducherry.</p><button class="btn" data-dest="puducherry">Plan Puducherry instead</button>`}</div></div>`;
}

function Customize() {
  const t = S.trip;
  const avail = toMin(t.end) - toMin(t.start);
  const bad = avail <= 0;
  return `<div class="view"><button class="link" data-go="destpage">← ${dest()?.name || 'Back'}</button><h2 style="margin:10px 0 14px">Customize Your Trip</h2>
  <div class="card"><h3 style="margin-bottom:10px">When would you like to explore?</h3><div class="form3">
  <label class="f">Date<input type="date" id="fDate" value="${t.date}" min="${day(0)}"></label><label class="f">Start<input type="time" id="fStart" value="${t.start}"></label><label class="f">End<input type="time" id="fEnd" value="${t.end}"></label></div>
  <div class="row" style="margin-top:10px"><button class="btn sm alt" data-date="0">Today</button><button class="btn sm alt" data-date="1">Tomorrow</button>${bad ? '<span class="err">End time must be after start time.</span>' : `<span class="muted">Available time: <b>${dur(avail)}</b></span>`}</div></div>
  <div class="card"><h3 style="margin-bottom:4px">Interests for this trip</h3><p class="muted" style="margin-bottom:10px">Changes here don't alter your saved profile.</p><div class="row">${INTERESTS.map(([k, l, e]) => `<button class="chip" data-tint="${k}" aria-pressed="${t.interests.includes(k)}" style="${t.interests.includes(k) ? 'background:var(--g);color:#fff' : ''}">${e} ${l}</button>`).join('')}</div></div>
  <div class="row between" style="margin:18px 0 10px"><h3>Which places would you like to visit?</h3><div class="row"><button class="btn sm alt" data-act="recommend">Select recommended</button><button class="btn sm alt" data-act="clearPlaces">Clear</button></div></div>
  <div class="grid">${PLACES.map(p => {
    const on = t.places.includes(p.id);
    const m = p.tags.filter(x => t.interests.includes(x));
    return `<button class="place" data-pick="${p.id}" aria-pressed="${on}"><div class="ph">${p.emoji}</div><b>${p.name}</b><span class="muted">${p.cat} · ~${dur(p.mins)}</span><span class="muted" style="margin:4px 0">${p.desc}</span>${m.length ? `<span class="chip" style="align-self:flex-start">Matches ${m.length}</span>` : ''}<span class="sel">${on ? '✓ Selected' : 'Select'}</span></button>`;
  }).join('')}</div>
  <div class="row between card" style="margin-top:16px"><span><b>${t.places.length}</b> selected · durations are estimates</span><button class="btn" data-act="create" ${bad || !t.places.length ? 'disabled' : ''}>Create My Itinerary</button></div></div>`;
}

function Itin() {
  if (!S.plan || !S.plan.ids.length) {
    return `<div class="view card"><h2>No itinerary yet</h2><p class="muted" style="margin:8px 0 14px">Pick a destination, time and places to build one.</p><div class="row"><button class="btn" data-go="${dest() ? 'customize' : 'destination'}">Plan My Trip</button><button class="btn alt" data-go="explore">Explore Map</button></div></div>`;
  }
  const sl = Itinerary.slots();
  const endAt = sl[sl.length - 1].at + (P[sl[sl.length - 1].id]?.mins || 30);
  const over = endAt > toMin(S.trip.end);
  return `<div class="view"><div class="row between"><div><h2>Your Personalized Itinerary</h2><p class="muted">${dest()?.name || 'Puducherry'} · ${fdate(S.trip.date)} · ${hm(toMin(S.trip.start))}–${hm(toMin(S.trip.end))}</p></div><span class="chip">Personalized to your interests</span></div>
  <p class="muted" style="margin:8px 0 14px">Generated by: ${S.plan.source}. Visit and travel times are estimates (${TRAVEL} min between stops).</p>
  ${over ? `<div class="strip">These stops run past your end time by about ${dur(endAt - toMin(S.trip.end))}. Remove a stop or edit the time.</div>` : ''}
  ${S.plan.skipped.length ? `<div class="card" style="background:var(--warns)">Not enough time for: <b>${S.plan.skipped.map(i => P[i]?.name).join(', ')}</b>. Lowest interest match was dropped first.</div>` : ''}
  <ol class="tl">${sl.map((s, i) => {
    const p = P[s.id];
    if (!p) return '';
    const m = p.tags.filter(x => S.trip.interests.includes(x)).map(x => IN[x]?.[1] || x);
    return `<li><div class="t">${hm(s.at)}</div><div class="st"><div class="row between"><h3>${p.name}</h3><span class="chip">${p.cat}</span></div><p class="muted" style="margin:4px 0">${p.desc}</p><p style="font-size:14px">${m.length ? 'Matches: ' + m.join(', ') : 'Chosen by you'} · ~${dur(p.mins)}</p>
  <div class="row" style="margin-top:10px"><button class="btn sm alt" data-view="${p.id}">View on map</button><button class="btn sm alt" data-mv="${i},-1" ${i ? '' : 'disabled'} aria-label="Move up">↑</button><button class="btn sm alt" data-mv="${i},1" ${i < sl.length - 1 ? '' : 'disabled'} aria-label="Move down">↓</button><button class="btn sm alt" data-rm="${p.id}">Remove</button></div></div></li>${i < sl.length - 1 ? `<div class="travel">~${TRAVEL} min travel (estimate)</div>` : ''}`;
  }).join('')}</ol>
  <div class="row"><button class="btn" data-act="regen">Regenerate Itinerary</button><button class="btn alt" data-go="customize">Edit Places</button><button class="btn alt" data-go="customize">Edit Time</button><button class="btn alt" data-act="saveTrip">Save Trip</button><button class="btn alt" data-go="explore">Explore Map & Route</button></div></div>`;
}

function AlertCard() {
  const b = S.ble;
  return `<div class="alert" role="alert"><h2>🔴 BELONGING SEPARATED</h2><p>Your backpack may have been left behind.</p><dl><dt>Last detected</dt><dd>${b.last ? b.last.name + (b.last.sample ? ' (sample location)' : '') : 'Location unavailable'}</dd><dt>Time</dt><dd>${b.last ? new Date(b.last.time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : 'Unavailable'}</dd><dt>Signal</dt><dd>${b.signal}</dd><dt>Next step</dt><dd>Head back to the last detected place and ask nearby staff.</dd></dl><div class="row"><button class="btn bad" data-act="viewLast">View Last Location on Map</button><button class="btn alt" data-act="reconnect">Mark as Reconnected</button></div></div>`;
}

function Belongings() {
  const b = S.ble;
  const ok = !sep();
  return `<div class="view" style="max-width:800px"><h2 style="margin-bottom:14px">My Belongings</h2>${ok ? '' : AlertCard()}
  <div class="card"><div class="row" style="gap:18px"><div class="ring">🎒</div><div><h3>Backpack Tag</h3><span class="chip ${ok ? 'ok' : 'bad'}" style="margin-top:6px">${ok ? '🟢 Connected' : '🔴 Separated'}</span></div></div>
  <div class="stats"><div class="stat"><small>Signal (simulated)</small><b>${b.signal}</b></div><div class="stat"><small>Battery (sample)</small><b>${b.battery}%</b></div><div class="stat"><small>Last detected</small><b>${ok ? 'Just now' : new Date(b.last?.time || Date.now()).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</b></div></div></div>
  <div class="row">${ok ? '<button class="btn bad" data-act="simulate">Simulate BLE Separation</button>' : '<button class="btn alt" data-act="reconnect">Mark as Reconnected</button>'}</div>
  <p class="muted" style="margin-top:12px">Prototype: this simulates tag status in the browser and connects with the map alert marker. Real separation alerts connect to hardware BLE beacons.</p></div>`;
}

function Safety() {
  return `<div class="view" style="max-width:800px"><h2 style="margin-bottom:14px">Safety</h2>${sep() ? AlertCard() : `<div class="card"><h3>Your belonging is connected.</h3><p class="muted" style="margin:6px 0 12px">🟢 Backpack Tag · Signal ${S.ble.signal} · Simulated status</p><button class="btn alt" data-go="belongings">Open belongings</button></div>`}</div>`;
}

/* ================= RENDER ================= */
const VIEWS: Record<string, () => string> = {
  welcome: Welcome,
  interests: Interests,
  home: Home,
  destination: Destination,
  destpage: DestPage,
  customize: Customize,
  itinerary: Itin,
  belongings: Belongings,
  safety: Safety
};

export function render() {
  document.body.classList.toggle('sep', sep());
  Nav();

  const ex = S.view === 'explore';
  const exploreEl = $('#explore');
  const rootEl = $('#root');
  const stripEl = $('#strip');
  const offChip = $('#offChip');

  if (exploreEl) exploreEl.hidden = !ex;
  if (rootEl) rootEl.hidden = ex;

  if (stripEl) {
    stripEl.innerHTML =
      sep() && S.onboarded && !['safety', 'belongings'].includes(S.view)
        ? `<div class="strip"><span>🔴 Backpack tag separated</span><button class="link" data-go="safety">Open Safety</button></div>`
        : '';
  }

  if (ex) {
    Explore();
  } else if (rootEl && VIEWS[S.view]) {
    rootEl.innerHTML = VIEWS[S.view]();
    if (S.view === 'destination') destResults();
  }

  if (offChip) offChip.hidden = navigator.onLine;
  window.scrollTo({ top: 0 });

  if (ex) {
    MapIntegration.invalidateSize();
  }
}

function Explore() {
  const sel = S.plan?.ids || S.trip.places;
  const b = sep() ? S.ble.last : null;

  const exHead = $('#exHead');
  if (exHead) {
    exHead.innerHTML = `
      <div class="row between" style="margin-bottom: 8px;">
        <div>
          <h2 style="margin-bottom: 4px;">Explore Puducherry</h2>
          <p class="muted">Interactive map with 10 verified tourist attractions, live GPS tracking, and driving directions.</p>
        </div>
        <div class="row" style="gap:6px;">
          <span class="chip ok">🗺️ Live OpenStreetMap</span>
          <span class="chip" style="background:#E2ECF8;color:#1B72E8;">📍 High-Accuracy GPS</span>
        </div>
      </div>
      ${
        b
          ? `<div class="alert" style="margin-bottom: 12px;"><b>🔴 Belonging Alert: ${b.name} (sample location)</b><p class="muted" style="margin:4px 0 8px;font-size:13px">Marker highlighted with 🎒 icon on the map below.</p><div class="row"><button class="btn sm bad" data-act="viewLast">Center on Tag</button><button class="btn sm alt" data-act="reconnect">Mark Reconnected</button></div></div>`
          : ''
      }
    `;
  }

  // Ensure map is mounted
  if (!MapIntegration.map) {
    MapIntegration.mount('cultura-map');
  }

  MapIntegration.update({
    destination: dest()?.name,
    places: sel.map(id => P[id]).filter(Boolean),
    itinerary: S.plan,
    focusPlace: S.focus && S.focus !== 'belonging' ? P[S.focus]?.name : null,
    focus: S.focus,
    belonging: b
  });

  const exList = $('#exList');
  if (exList) {
    exList.innerHTML = `
      <div class="row between" style="margin: 14px 0 10px;">
        <h3>Attractions in Puducherry</h3>
        <span class="muted" style="font-size:13px">${PLACES.length} destinations</span>
      </div>
      <div class="grid">
        ${PLACES.map(
          p => {
            const isStarred = S.starredPlaces.includes(p.id);
            return `
              <div class="place" style="position:relative;">
                <div class="row between" style="width:100%;margin-bottom:4px;">
                  <b>${p.emoji} ${p.name}</b>
                  <button onclick="window.culturaSafeToggleStar('${p.id}')" style="font-size:15px;cursor:pointer;padding:2px 6px;" title="${isStarred ? 'Remove from saved favourites' : 'Save to favourites'}">
                    ${isStarred ? '⭐' : '☆'}
                  </button>
                </div>
                <span class="chip" style="font-size:11px;padding:2px 8px;align-self:flex-start;margin-bottom:4px;">${p.cat}</span>
                <span class="muted" style="font-size:13px;line-height:1.4;">${p.desc}</span>
                <div class="row between" style="margin-top:auto;padding-top:10px;">
                  <span class="muted" style="font-size:12px;">~${dur(p.mins)}</span>
                  <div class="row" style="gap:6px;">
                    <button class="btn sm alt" data-view="${p.id}" style="padding:4px 8px;font-size:12px;">Map Pin</button>
                    <button class="btn sm" onclick="window.culturaSafeRouteTo('${p.id}')" style="padding:4px 8px;font-size:12px;">Directions</button>
                  </div>
                </div>
              </div>
            `;
          }
        ).join('')}
      </div>
    `;
  }
}

export const go = (v: string) => {
  S.view = v;
  if (v !== 'explore' && v !== 'belongings') S.focus = null;
  save();
  render();
};

/* ================= EVENTS ================= */
const A: Record<string, () => any> = {
  start() {
    S.view = 'interests';
  },
  skip() {
    S.onboarded = true;
    S.view = 'destination';
  },
  welcomeBack() {
    S.view = 'welcome';
  },
  saveInterests() {
    S.onboarded = true;
    S.trip.interests = [...S.interests];
    if (S.editing) {
      S.editing = false;
      S.view = 'home';
      toast('Interests saved');
    } else {
      S.view = 'explore';
    }
  },
  editInterests() {
    S.editing = true;
    S.view = 'interests';
  },
  cancelEdit() {
    S.editing = false;
    S.view = 'home';
  },
  recommend() {
    S.trip.places = PLACES.filter(p => p.tags.some(t => S.trip.interests.includes(t))).map(p => p.id);
  },
  clearPlaces() {
    S.trip.places = [];
  },
  create() {
    S.plan = Itinerary.generate();
    S.view = 'itinerary';
  },
  regen() {
    S.plan = Itinerary.generate();
    toast('Itinerary regenerated from your selections');
  },
  async saveTrip() {
    const newTrip = {
      id: Date.now(),
      destName: dest()?.name || 'Puducherry',
      trip: JSON.parse(JSON.stringify(S.trip)),
      plan: S.plan
    };
    S.saved = [newTrip, ...S.saved].slice(0, 10);
    save();

    // Persist to Supabase itineraries if authenticated
    if (SupabaseService.getCurrentUser()) {
      try {
        await SupabaseService.saveItinerary({
          destination: newTrip.destName,
          travel_date: newTrip.trip.date,
          start_time: newTrip.trip.start,
          end_time: newTrip.trip.end,
          interests: newTrip.trip.interests,
          itinerary_data: newTrip.plan
        });
        toast('Trip saved locally & synced to Supabase database!');
        return;
      } catch (e) {
        console.warn('Supabase save notice:', e);
      }
    }
    toast('Trip saved');
  },
  simulate() {
    BleService.separate();
    return 1;
  },
  reconnect() {
    BleService.reconnect();
    return 1;
  },
  viewLast() {
    S.focus = 'belonging';
    S.view = 'explore';
  }
};

document.addEventListener('click', async e => {
  const el = (e.target as HTMLElement).closest('button');
  if (!el) return;
  const d = el.dataset;
  let r;

  if (d.go) {
    S.view = d.go;
    if (d.go === 'explore') S.focus = sep() ? 'belonging' : null;
  } else if (d.act) {
    r = A[d.act] ? A[d.act]() : undefined;
    if (r) return;
  } else if (d.int) {
    const a = S.interests;
    const i = d.int;
    a.includes(i) ? a.splice(a.indexOf(i), 1) : a.push(i);
  } else if (d.dest) {
    S.destination = d.dest;
    S.view = 'destpage';
  } else if ('custom' in d) {
    const customVal = ($('#dq') as HTMLInputElement)?.value.trim() || 'Custom';
    DESTS.push({ id: 'x', name: customVal, type: 'Custom', curated: false });
    S.destination = 'x';
    S.view = 'destpage';
  } else if (d.type) {
    dType = d.type;
    document.querySelectorAll('[data-type]').forEach(b => {
      (b as HTMLElement).style.outline = b === el ? '2px solid var(--g2)' : '';
    });
    destResults();
    return;
  } else if (d.date !== undefined) {
    S.trip.date = day(+d.date);
  } else if (d.tint) {
    const a = S.trip.interests;
    a.includes(d.tint) ? a.splice(a.indexOf(d.tint), 1) : a.push(d.tint);
  } else if (d.pick) {
    const a = S.trip.places;
    a.includes(d.pick) ? a.splice(a.indexOf(d.pick), 1) : a.push(d.pick);
  } else if (d.view) {
    S.focus = d.view;
    S.view = 'explore';
  } else if (d.rm) {
    if (S.plan) S.plan.ids = S.plan.ids.filter(i => i !== d.rm);
    S.trip.places = S.trip.places.filter(i => i !== d.rm);
    if (S.plan && !S.plan.ids.length) S.plan = null;
  } else if (d.mv) {
    const [i, k] = d.mv.split(',').map(Number);
    if (S.plan) {
      const a = S.plan.ids;
      [a[i], a[i + k]] = [a[i + k], a[i]];
    }
  } else if (d.open) {
    const t = S.saved.find(x => String(x.id) === String(d.open));
    if (t) {
      S.trip = JSON.parse(JSON.stringify(t.trip));
      S.plan = t.plan;
      S.view = 'itinerary';
    }
  } else if (d.delsaved) {
    const idToDelete = String(d.delsaved);
    S.saved = S.saved.filter(x => String(x.id) !== idToDelete);
    if (SupabaseService.getCurrentUser()) {
      SupabaseService.deleteItinerary(idToDelete);
    }
    save();
    render();
    toast('Trip deleted');
    return;
  } else {
    return;
  }

  save();
  render();
});

document.addEventListener('input', e => {
  if ((e.target as HTMLElement).id === 'dq') destResults();
});

document.addEventListener('change', e => {
  const target = e.target as HTMLInputElement;
  const m = ({ fDate: 'date', fStart: 'start', fEnd: 'end' } as any)[target.id];
  if (m) {
    (S.trip as any)[m] = target.value || (S.trip as any)[m];
    save();
    const y = window.scrollY;
    render();
    window.scrollTo({ top: y });
  }
});

window.addEventListener('online', render);
window.addEventListener('offline', render);
window.addEventListener('resize', () => MapIntegration.invalidateSize());

// Initialize everything on DOM ready
function bootApp() {
  render();
  setTimeout(() => {
    MapIntegration.mount('cultura-map');
    AuthModal.init();
    HistoryModal.init();
    PrivacyModal.init();
    LiveTracking.init();
    SupabaseService.onAuth(user => {
      Nav();
      if (user) {
        SyncService.pullFromCloud();
      }
    });
  }, 60);
}

document.addEventListener('DOMContentLoaded', bootApp);
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  bootApp();
}
