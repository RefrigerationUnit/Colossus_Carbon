import { LAYERS } from '../layers/registry.js';

let _cache = null;
async function loadAll() {
  if (_cache) return _cache;
  const [car, flight, ship, sources] = await Promise.all([
    fetch('data/factors/car.json').then(r=>r.json()),
    fetch('data/factors/flight.json').then(r=>r.json()),
    fetch('data/factors/ship.json').then(r=>r.json()),
    fetch('data/sources.json').then(r=>r.json()),
  ]);
  _cache = { car, flight, ship, sources };
  return _cache;
}

/**
 * km: route distance in kilometers
 * active: { car:boolean, flight:boolean, ship:boolean }
 * returns { totals: {car|flight|ship: {enabled,label,value,sourceId}}, sources }
 */
export async function computeEmissions(km, active) {
  const { car, flight, ship, sources } = await loadAll();

  const totals = {};
  for (const layer of LAYERS) {
    const enabled = !!active[layer.id];
    let value = 0;
    if (enabled) {
      if (layer.id === 'car') {
        // Simple average factor
        const f = car.factors.average_g_per_km || 171; // fallback
        value = f * km;
      } else if (layer.id === 'flight') {
        // Distance banding (per passenger-km)
        const f = pickFlightFactor(flight.factors, km);
        value = f * km;
        // Optional: include non-CO2 RF multiplier (not applied by default here)
      } else if (layer.id === 'ship') {
        // Passenger-km proxy from dataset (coarse)
        const f = ship.factors.pax_g_per_km || 19;
        value = f * km;
      }
    }
    totals[layer.id] = {
      enabled,
      label: layer.label,
      value,
      sourceId: (layer.id === 'car' ? car.sourceId : layer.id === 'flight' ? flight.sourceId : ship.sourceId)
    };
  }

  return { totals, sources };
}

function pickFlightFactor(list, km) {
  // list: [{band,maxKm,gPerPkm}, ... last has maxKm=null]
  for (const row of list) {
    if (row.maxKm === null || km <= row.maxKm) return row.gPerPkm;
  }
  return list[list.length - 1].gPerPkm;
}
