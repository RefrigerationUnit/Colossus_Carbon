// js/ui/globe-canvas.js
export function initGlobe(container) {
  const globe = window.Globe()(container)
    .globeImageUrl('https://unpkg.com/three-globe/example/img/earth-night.jpg')
    .bumpImageUrl('https://unpkg.com/three-globe/example/img/earth-topology.png')
    .backgroundColor('#0b0f14')
    .showAtmosphere(true)
    .atmosphereColor('#4ad2c7')
    .atmosphereAltitude(0.18)
    .pointAltitude(0.02)
    .pointColor(() => '#5EF674')
    .pointLabel(d => d.label || 'Location')
    .pointsTransitionDuration(600);

  const controls = globe.controls();
  controls.enableZoom = true;
  controls.autoRotate = false;

  function resize() {
    globe.width(container.clientWidth);
    globe.height(container.clientHeight);
  }
  resize();
  window.addEventListener('resize', resize);

  return {
    setPoints(points) {
      globe.pointsData(points || []);
      if (points && points.length) {
        const last = points[points.length - 1];
        globe.pointOfView({ lat: last.lat, lng: last.lng, altitude: 2.6 }, 800);
      }
    }
  };
}
