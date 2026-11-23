import * as THREE from "three";

// Batched, on-demand neighborhood illustration shared by the Details surface.
export function createNeighborhoodScene(host, project, options){
  let playing=false;
  let reducedMotion=options.reducedMotion;
  const rawPlaces=options.places||[];

  // Physical road clearance: strictly prevent any building from intersecting vehicular road corridors
  // South Road corridor: z in [2.12, 3.48]
  // West Road corridor: x in [-4.18, -3.02]
  const places = rawPlaces.map(p => {
    let px = p.x, pz = p.z, py = p.y;
    if (p.id === 'pharmacy') {
      px = -5.2;
      pz = 1.15; // Setback onto northwest sidewalk plaza, completely clear of South road
      py = 1.0;
    } else if (p.id === 'restaurant') {
      px = 5.2;
      pz = 1.35; // Setback leaving a spacious outdoor cafe dining terrace before curb
      py = 1.0;
    } else if (p.id === 'market') {
      px = 1.0;
      pz = 4.2; // Southern sidewalk commercial arcade, clear of South road
      py = 1.0;
    } else {
      if (pz > 2.05 && pz < 3.55) {
        pz = pz >= 2.8 ? 4.15 : 1.25;
      }
      if (px > -4.20 && px < -3.00) {
        px = px >= -3.6 ? -2.6 : -4.8;
      }
    }
    return { ...p, x: px, z: pz, y: py };
  });

  const setPlaying=value=>{playing=value;options.onPlayingChange?.(value);if(value)schedule();};
  const vector=new THREE.Vector3();
  const markers=[...places.filter(p=>p.enabled),{id:'apartment',x:0,y:5.05,z:-.5}];
  const projectPins=(camera,width,height)=>{camera.updateMatrixWorld();project(markers.map(p=>{vector.set(p.x,p.y,p.z).project(camera);const x=(vector.x*.5+.5)*width,y=(-vector.y*.5+.5)*height;return {id:p.id,x,y,visible:vector.z>=-1&&vector.z<=1&&x>=22&&x<=width-22&&y>=35&&y<=height-10};}));};

  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});
  const getDpr=()=>{
    if(typeof window==='undefined')return 1;
    return Math.min(window.devicePixelRatio||1,2.5);
  };
  renderer.setPixelRatio(getDpr());
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate=true;
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.15;
  renderer.domElement.setAttribute('aria-hidden','true');
  host.append(renderer.domElement);

  const scene=new THREE.Scene();
  scene.fog=new THREE.FogExp2(options.dark?0x111928:0xe8e6e1,0.016);
  const camera=new THREE.PerspectiveCamera(34,1,.1,100);
  const target=new THREE.Vector3(0,1.15,0);
  const rest = { azimuth: .72, elevation: .58, distance: 22.5, target: new THREE.Vector3(0, 1.15, 0) };
  const approach = { azimuth: .85, elevation: .24, distance: 6 };
  let azimuth = rest.azimuth + (reducedMotion ? 0 : approach.azimuth);
  let elevation = rest.elevation + (reducedMotion ? 0 : approach.elevation);
  let distance = rest.distance + (reducedMotion ? 0 : approach.distance);
  let currentBank = 0;
  let velAzimuth = 0;
  let isPointerDown = false;
  let lastPointerX = 0;
  let lastPointerTime = 0;
  let frame=0,last=0,introStart=-10000,visible=false,disposed=false;
  let flight=null;
  const root=new THREE.Group();scene.add(root);

  // Sweep outward from the featured property along the neighborhood ground plane.
  const sweepGeometry = new THREE.RingGeometry(.96, 1, 96);
  const sweepMaterial = new THREE.MeshBasicMaterial({
    color: 0xf4c78a, transparent: true, depthWrite: false, toneMapped: false,
  });
  const sweep = new THREE.Mesh(sweepGeometry, sweepMaterial);
  sweep.rotation.x = -Math.PI / 2;
  sweep.position.set(0, .13, -.5);
  sweep.visible = false;
  root.add(sweep);

  function stopIntro() {
    introStart = -10000;
    sweep.visible = false;
  }

  // Drone target beacon ring placed on safe ground landing spot during flight with radar crosshairs
  const beaconGroup = new THREE.Group();
  const beaconRingGeo = new THREE.RingGeometry(0.38, 0.48, 48);
  const beaconInnerGeo = new THREE.RingGeometry(0.14, 0.18, 32);
  const beaconDotGeo = new THREE.CircleGeometry(0.06, 24);
  const beaconWaveGeo = new THREE.RingGeometry(0.52, 0.56, 48);
  const beaconMaterial = new THREE.MeshBasicMaterial({
    color: 0x38bdf8, transparent: true, opacity: 0, depthWrite: false, toneMapped: false, side: THREE.DoubleSide,
  });
  const beaconWaveMaterial = new THREE.MeshBasicMaterial({
    color: 0x38bdf8, transparent: true, opacity: 0, depthWrite: false, toneMapped: false, side: THREE.DoubleSide,
  });
  const beaconRing = new THREE.Mesh(beaconRingGeo, beaconMaterial);
  const beaconInner = new THREE.Mesh(beaconInnerGeo, beaconMaterial);
  const beaconDot = new THREE.Mesh(beaconDotGeo, beaconMaterial);
  const beaconWave = new THREE.Mesh(beaconWaveGeo, beaconWaveMaterial);
  beaconRing.rotation.x = -Math.PI / 2;
  beaconInner.rotation.x = -Math.PI / 2;
  beaconDot.rotation.x = -Math.PI / 2;
  beaconWave.rotation.x = -Math.PI / 2;
  beaconGroup.add(beaconRing, beaconInner, beaconDot, beaconWave);

  // 4 crosshair radar tick marks
  const tickGeo = new THREE.PlaneGeometry(0.024, 0.18);
  for (let a = 0; a < Math.PI * 2; a += Math.PI / 2) {
    const tick = new THREE.Mesh(tickGeo, beaconMaterial);
    tick.rotation.x = -Math.PI / 2;
    tick.position.set(Math.sin(a) * 0.52, 0, Math.cos(a) * 0.52);
    tick.rotation.z = a;
    beaconGroup.add(tick);
  }
  beaconGroup.position.set(0, 0.035, 0);
  beaconGroup.visible = false;
  root.add(beaconGroup);

  // Holographic 3D vertical altimeter laser beam connecting drone camera to ground target during flight
  const beamGeo = new THREE.CylinderGeometry(0.015, 0.045, 1, 16, 1, true);
  const beamMaterial = new THREE.MeshBasicMaterial({
    color: 0x38bdf8, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, toneMapped: false,
  });
  const altimeterBeam = new THREE.Mesh(beamGeo, beamMaterial);
  altimeterBeam.visible = false;
  root.add(altimeterBeam);

  // Obstacle collision boxes to guarantee drone target and camera never end up inside geometry
  const OBSTACLES = [
    { minX: -1.75, maxX: 3.85, minZ: -2.15, maxZ: 1.1, name: 'Main Complex' },
    { minX: -1.35, maxX: 1.35, minZ: 0.8, maxZ: 2.1, name: 'Entrance Stairs' },
    { minX: 3.65, maxX: 6.0, minZ: -3.85, maxZ: -1.95, name: 'School' },
    { minX: 4.1, maxX: 6.2, minZ: 0.5, maxZ: 2.1, name: 'Restaurant' },
    { minX: -2.85, maxX: -0.55, minZ: -4.75, maxZ: -2.85, name: 'Mosque' },
    { minX: -6.1, maxX: -4.3, minZ: 0.4, maxZ: 1.9, name: 'Pharmacy' },
    { minX: 0.1, maxX: 1.9, minZ: 3.4, maxZ: 4.9, name: 'Market' },
    { minX: -2.45, maxX: -1.15, minZ: -0.15, maxZ: 1.15, name: 'Plaza Fountain' },
    { minX: 0.1, maxX: 1.9, minZ: 3.3, maxZ: 4.1, name: 'Bus Shelter' },
    { minX: 5.5, maxX: 6.8, minZ: 1.8, maxZ: 3.8, name: 'East Tunnel' },
    { minX: -6.8, maxX: -5.5, minZ: 1.8, maxZ: 3.8, name: 'West Tunnel' },
    { minX: -4.6, maxX: -2.6, minZ: -5.0, maxZ: -3.8, name: 'North Tunnel' },
    { minX: -4.6, maxX: -2.6, minZ: 3.8, maxZ: 5.0, name: 'South Tunnel' },
    // Trees
    { minX: -2.45, maxX: -1.55, minZ: 1.35, maxZ: 2.25 },
    { minX: -2.45, maxX: -1.55, minZ: -2.95, maxZ: -2.05 },
    { minX: 3.45, maxX: 4.35, minZ: -2.85, maxZ: -1.95 },
    { minX: 3.45, maxX: 4.35, minZ: -0.05, maxZ: 0.85 },
    { minX: 2.35, maxX: 3.25, minZ: 1.35, maxZ: 2.25 },
    { minX: -5.25, maxX: -4.35, minZ: -2.45, maxZ: -1.55 },
    { minX: -5.25, maxX: -4.35, minZ: -0.35, maxZ: 0.55 },
  ];

  function isInsideObstacle(x, z, margin = 0.28) {
    for (const obs of OBSTACLES) {
      if (x >= obs.minX - margin && x <= obs.maxX + margin &&
          z >= obs.minZ - margin && z <= obs.maxZ + margin) {
        return obs;
      }
    }
    return null;
  }

  function findNearestSafeLocation(targetX, targetZ) {
    let x = THREE.MathUtils.clamp(targetX, -6.5, 6.5);
    let z = THREE.MathUtils.clamp(targetZ, -4.6, 4.6);
    const margin = 0.35;
    const obs = isInsideObstacle(x, z, margin);
    if (!obs) return { x, z };

    const distLeft = Math.abs(x - (obs.minX - margin));
    const distRight = Math.abs((obs.maxX + margin) - x);
    const distBack = Math.abs(z - (obs.minZ - margin));
    const distFront = Math.abs((obs.maxZ + margin) - z);
    const minDist = Math.min(distLeft, distRight, distBack, distFront);

    if (minDist === distFront) z = obs.maxZ + margin;
    else if (minDist === distLeft) x = obs.minX - margin;
    else if (minDist === distRight) x = obs.maxX + margin;
    else z = obs.minZ - margin;

    x = THREE.MathUtils.clamp(x, -6.5, 6.5);
    z = THREE.MathUtils.clamp(z, -4.6, 4.6);
    return { x, z };
  }

  function getClearAzimuth(targetPos, desiredAzimuth, elev, dist) {
    for (let offset = 0; offset <= Math.PI; offset += Math.PI / 6) {
      for (const sign of [1, -1]) {
        const testAz = desiredAzimuth + sign * offset;
        const testCamX = targetPos.x + Math.sin(testAz) * Math.cos(elev) * dist;
        const testCamZ = targetPos.z + Math.cos(testAz) * Math.cos(elev) * dist;
        if (!isInsideObstacle(testCamX, testCamZ, 0.2)) {
          return testAz;
        }
      }
    }
    return desiredAzimuth;
  }

  const ambient = new THREE.HemisphereLight(0xdbeafe, 0xe2d9cb, 2.8);
  scene.add(ambient);

  const sun = new THREE.DirectionalLight(0xfff8eb, 3.6);
  sun.position.set(8.5, 14, 6.5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -9.5, right: 9.5, top: 10.5, bottom: -9.5, near: 1, far: 42 });
  sun.shadow.normalBias = 0.025;
  sun.shadow.bias = -0.00015;
  sun.shadow.radius = 2.0;
  scene.add(sun);

  const fill = new THREE.DirectionalLight(0xa5c4e8, 1.6);
  fill.position.set(-8, 6, -4);
  scene.add(fill);

  const material = (color, opts = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.65, ...opts });

  // Vibrant, architectural palette with rich colors and living warmth
  const stone = material('#f5f2eb', { roughness: 0.65 }); // Travertine limestone
  const darkStone = material('#1e2430', { roughness: 0.7 }); // Anthracite slate
  const woodMat = material('#a2653e', { roughness: 0.72 }); // Warm cedar/teak wood
  const glass = material('#3b6a88', { metalness: 0.65, roughness: 0.12, emissive: '#ffd7a8', emissiveIntensity: 0.18 }); // Luminous azure glass with interior warmth
  const goldFrame = material('#d4af37', { metalness: 0.5, roughness: 0.35 }); // Champagne gold mullions
  const pavement = material('#ded9d0', { roughness: 0.8 }); // Warm plaza stone
  const road = material('#353942', { roughness: 0.85 }); // Rich dark asphalt
  const crosswalkMat = material('#f8fafc', { roughness: 0.4 }); // Bright white crosswalk stripes
  const leafSpring = material('#2e8540', { roughness: 0.75 }); // Spring green tree foliage
  const leafEmerald = material('#1b6a38', { roughness: 0.75 }); // Deep emerald tree foliage
  const leafGolden = material('#529938', { roughness: 0.75 }); // Sunlit golden tree foliage
  const flowerCoral = material('#e11d48'); // Coral red flowers
  const flowerPurple = material('#8b5cf6'); // Purple lavender flowers
  const flowerGold = material('#f59e0b'); // Marigold flowers
  const parkMat = material('#4d8b47', { roughness: 0.85 }); // Emerald park lawn
  const parasolYellow = material('#f59e0b', { roughness: 0.6 }); // Cafe parasol yellow
  const parasolBlue = material('#2563eb', { roughness: 0.6 }); // Cafe parasol blue
  const carWhite = material('#f8fafc', { metalness: 0.6, roughness: 0.25 }); // White pearl sedan
  const carBlue = material('#1d4ed8', { metalness: 0.65, roughness: 0.25 }); // Metallic blue coupe
  const carRed = material('#dc2626', { metalness: 0.6, roughness: 0.25 }); // Crimson red crossover
  const carDark = material('#27272a', { metalness: 0.5, roughness: 0.3 }); // Charcoal SUV
  const carLightMat = new THREE.MeshBasicMaterial({ color: 0xfffbeb }); // Glowing headlights
  const carTailNormal = new THREE.MeshBasicMaterial({ color: 0x7f1d1d }); // Cruising rear taillights
  const carBrakeMat = new THREE.MeshBasicMaterial({ color: 0xff2222 }); // Ruby glowing LED braking taillights
  const carYellow = material('#f59e0b', { metalness: 0.55, roughness: 0.25 }); // Commercial delivery van
  const carSilver = material('#cbd5e1', { metalness: 0.75, roughness: 0.20 }); // Silver compact metallic
  const wheelMat = material('#18181b', { roughness: 0.9 }); // Dark tire rubber
  const rimMat = material('#94a3b8', { metalness: 0.8, roughness: 0.25 }); // Alloy rims

  // Traffic light illuminated & dimmed states
  const trafficRedOn = new THREE.MeshBasicMaterial({ color: 0xff2222 });
  const trafficRedOff = new THREE.MeshBasicMaterial({ color: 0x3d0a0a });
  const trafficAmberOn = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
  const trafficAmberOff = new THREE.MeshBasicMaterial({ color: 0x3d2800 });
  const trafficGreenOn = new THREE.MeshBasicMaterial({ color: 0x22ff55 });
  const trafficGreenOff = new THREE.MeshBasicMaterial({ color: 0x0a3311 });

  // Plaza fountain & shimmering water
  const waterMat = material('#38bdf8', { roughness: 0.08, metalness: 0.8, transparent: true, opacity: 0.82 });
  const waterRippleMat = new THREE.MeshBasicMaterial({ color: 0xbae6fd, transparent: true, opacity: 0.45, depthWrite: false, side: THREE.DoubleSide });

  // Urban micro-detail materials
  const hydrantRed = material('#dc2626', { roughness: 0.4 });
  const binGreen = material('#15803d', { roughness: 0.5 });
  const signBlue = material('#1d4ed8', { roughness: 0.4 });
  const lampPostMat = material('#1e2430', { metalness: 0.7, roughness: 0.3 }); // Black street lamp posts
  const lampLightMat = new THREE.MeshBasicMaterial({ color: 0xfef08a }); // Warm glowing LED lamp heads
  const tunnelVoidMat = new THREE.MeshBasicMaterial({ color: 0x050508 }); // Deep shadow void inside tunnels
  const tunnelLightGreen = new THREE.MeshBasicMaterial({ color: 0x10b981 }); // Green portal LED lane indicator
  const groundMat = material('#dfddd6');

  // Batch repeated architectural pieces by material: one draw call per material.
  const boxes = new Map();
  function box(w, h, d, x, y, z, mat) {
    if (!boxes.has(mat)) boxes.set(mat, []);
    boxes.get(mat).push([w, h, d, x, y, z]);
  }

  // Ground plane & Roadways
  box(15, 0.22, 11, 0, -0.2, 0, groundMat);
  box(13.5, 0.015, 1.35, 0, -0.075, 2.8, road);
  box(1.15, 0.015, 10.0, -3.6, -0.075, 0, road);

  // Road markings: center stripes
  for (let i = -5; i < 6; i++) box(0.45, 0.018, 0.04, i, -0.06, 2.8, crosswalkMat);
  for (let i = -3; i < 4; i++) box(0.04, 0.018, 0.45, -3.6, -0.06, i, crosswalkMat);

  // Pedestrian Zebra Crosswalk across south road
  for (let i = -2; i <= 2; i++) box(0.22, 0.018, 0.95, -0.6 + i * 0.35, -0.06, 2.8, crosswalkMat);

  // Pedestrian Zebra Crosswalk across west road near intersection
  for (let i = -1; i <= 1; i++) box(0.75, 0.018, 0.18, -3.6, -0.06, 2.05 + i * 0.32, crosswalkMat);

  // Solid white stop lines before intersection (-3.6, 2.8)
  box(0.08, 0.018, 0.62, -4.25, -0.06, 3.12, crosswalkMat); // Eastbound stop line
  box(0.08, 0.018, 0.62, -2.95, -0.06, 2.48, crosswalkMat); // Westbound stop line
  box(0.52, 0.018, 0.08, -3.88, -0.06, 2.15, crosswalkMat); // Southbound stop line
  box(0.52, 0.018, 0.08, -3.32, -0.06, 3.45, crosswalkMat); // Northbound stop line

  // Directional lane navigation arrows on asphalt
  box(0.35, 0.018, 0.06, -5.2, -0.06, 3.12, crosswalkMat);
  box(0.10, 0.018, 0.14, -4.95, -0.06, 3.12, crosswalkMat);
  box(0.35, 0.018, 0.06, -2.0, -0.06, 2.48, crosswalkMat);
  box(0.10, 0.018, 0.14, -2.25, -0.06, 2.48, crosswalkMat);

  // ----------------------------------------------------
  // Architectural Road Tunnels & Underpasses at Perimeter Road Terminals
  // Vehicles drive through portals into deep shadow tunnel chambers and disappear smoothly
  // ----------------------------------------------------

  // 1. East Tunnel Portal (South Road, +X terminal, x = 6.05, z = 2.8)
  box(0.75, 0.62, 0.35, 6.05, 0.25, 2.8 - 0.88, darkStone);
  box(0.75, 0.62, 0.35, 6.05, 0.25, 2.8 + 0.88, darkStone);
  box(0.75, 0.16, 2.15, 6.05, 0.54, 2.8, darkStone);
  box(0.04, 0.04, 1.45, 5.67, 0.45, 2.8, flowerGold);
  box(0.06, 0.04, 0.06, 5.66, 0.54, 3.12, tunnelLightGreen);
  box(0.06, 0.04, 0.06, 5.66, 0.54, 2.48, tunnelLightGreen);
  box(0.95, 0.08, 2.15, 6.15, 0.64, 2.8, stone);
  box(0.95, 0.08, 0.12, 6.15, 0.72, 2.8 - 1.02, stone);
  box(0.95, 0.08, 0.12, 6.15, 0.72, 2.8 + 1.02, stone);
  box(0.85, 0.12, 1.85, 6.15, 0.74, 2.8, leafEmerald);
  box(0.05, 0.48, 1.45, 6.45, 0.24, 2.8, tunnelVoidMat);
  box(0.35, 0.22, 0.08, 5.5, 0.08, 2.8 - 0.76, stone);
  box(0.35, 0.22, 0.08, 5.5, 0.08, 2.8 + 0.76, stone);

  // 2. West Tunnel Portal (South Road, -X terminal, x = -6.05, z = 2.8)
  box(0.75, 0.62, 0.35, -6.05, 0.25, 2.8 - 0.88, darkStone);
  box(0.75, 0.62, 0.35, -6.05, 0.25, 2.8 + 0.88, darkStone);
  box(0.75, 0.16, 2.15, -6.05, 0.54, 2.8, darkStone);
  box(0.04, 0.04, 1.45, -5.67, 0.45, 2.8, flowerGold);
  box(0.06, 0.04, 0.06, -5.66, 0.54, 3.12, tunnelLightGreen);
  box(0.06, 0.04, 0.06, -5.66, 0.54, 2.48, tunnelLightGreen);
  box(0.95, 0.08, 2.15, -6.15, 0.64, 2.8, stone);
  box(0.95, 0.08, 0.12, -6.15, 0.72, 2.8 - 1.02, stone);
  box(0.95, 0.08, 0.12, -6.15, 0.72, 2.8 + 1.02, stone);
  box(0.85, 0.12, 1.85, -6.15, 0.74, 2.8, leafEmerald);
  box(0.05, 0.48, 1.45, -6.45, 0.24, 2.8, tunnelVoidMat);
  box(0.35, 0.22, 0.08, -5.5, 0.08, 2.8 - 0.76, stone);
  box(0.35, 0.22, 0.08, -5.5, 0.08, 2.8 + 0.76, stone);

  // 3. North Tunnel Portal (West Road, -Z terminal, x = -3.6, z = -4.35)
  box(0.35, 0.62, 0.75, -3.6 - 0.78, 0.25, -4.35, darkStone);
  box(0.35, 0.62, 0.75, -3.6 + 0.78, 0.25, -4.35, darkStone);
  box(1.95, 0.16, 0.75, -3.6, 0.54, -4.35, darkStone);
  box(1.25, 0.04, 0.04, -3.6, 0.45, -3.97, flowerGold);
  box(0.06, 0.04, 0.06, -3.88, 0.54, -3.96, tunnelLightGreen);
  box(0.06, 0.04, 0.06, -3.32, 0.54, -3.96, tunnelLightGreen);
  box(1.95, 0.08, 0.95, -3.6, 0.64, -4.45, stone);
  box(1.75, 0.12, 0.85, -3.6, 0.74, -4.45, leafEmerald);
  box(1.25, 0.48, 0.05, -3.6, 0.24, -4.75, tunnelVoidMat);
  box(0.08, 0.22, 0.35, -3.6 - 0.68, 0.08, -3.8, stone);
  box(0.08, 0.22, 0.35, -3.6 + 0.68, 0.08, -3.8, stone);

  // 4. South Tunnel Portal (West Road, +Z terminal, x = -3.6, z = +4.35)
  box(0.35, 0.62, 0.75, -3.6 - 0.78, 0.25, 4.35, darkStone);
  box(0.35, 0.62, 0.75, -3.6 + 0.78, 0.25, 4.35, darkStone);
  box(1.95, 0.16, 0.75, -3.6, 0.54, 4.35, darkStone);
  box(1.25, 0.04, 0.04, -3.6, 0.45, 3.97, flowerGold);
  box(0.06, 0.04, 0.06, -3.88, 0.54, 3.96, tunnelLightGreen);
  box(0.06, 0.04, 0.06, -3.32, 0.54, 3.96, tunnelLightGreen);
  box(1.95, 0.08, 0.95, -3.6, 0.64, 4.45, stone);
  box(1.75, 0.12, 0.85, -3.6, 0.74, 4.45, leafEmerald);
  box(1.25, 0.48, 0.05, -3.6, 0.24, 4.75, tunnelVoidMat);
  box(0.08, 0.22, 0.35, -3.6 - 0.68, 0.08, 3.8, stone);
  box(0.08, 0.22, 0.35, -3.6 + 0.68, 0.08, 3.8, stone);

  // Plaza paving
  box(5.8, 0.12, 5.2, 0, -0.04, -0.45, pavement);

  // Main tower: stepped limestone frame, warm wood louvers, recessed glass, rooftop terrace
  const tower = new THREE.Group();
  root.add(tower);
  box(2.8, 0.3, 2.5, 0, 0.16, -0.5, stone, tower);

  for (let floor = 0; floor < 7; floor++) {
    const y = 0.4 + floor * 0.52;
    box(2.25, 0.44, 1.95, 0, y + 0.2, -0.5, glass, tower);
    box(2.65, 0.08, 2.3, 0, y + 0.46, -0.5, stone, tower);

    // Gold vertical mullions
    for (const x of [-1.17, -0.58, 0, 0.58, 1.17]) {
      box(0.035, 0.46, 0.04, x, y + 0.2, 0.49, goldFrame, tower);
      box(0.035, 0.46, 0.04, x, y + 0.2, -1.49, goldFrame, tower);
    }
    for (const z of [-1.25, -0.75, -0.25, 0.25]) {
      box(0.04, 0.46, 0.035, 1.14, y + 0.2, z, goldFrame, tower);
      box(0.04, 0.46, 0.035, -1.14, y + 0.2, z, goldFrame, tower);
    }

    // Warm cedar wood balcony louvers on front south facade
    if (floor > 0) {
      box(0.52, 0.32, 0.025, -0.82, y + 0.22, 0.51, woodMat, tower);
      box(0.52, 0.32, 0.025, 0.82, y + 0.22, 0.51, woodMat, tower);
    }
  }

  for (const x of [-1.25, 1.25]) box(0.13, 3.95, 0.15, x, 2, -0.5, stone, tower);
  box(2.7, 0.12, 2.4, 0, 4.2, -0.5, stone, tower);
  box(1.2, 0.35, 1, 0, 4.42, -0.5, darkStone, tower);

  // Rooftop teak deck & wooden pergola with potted plants
  box(1.8, 0.03, 1.4, -0.2, 4.26, -0.4, woodMat, tower);
  for (let i = 0; i < 6; i++) box(0.08, 0.08, 2.1, -1.1 + i * 0.44, 4.62, -0.5, woodMat, tower);
  box(0.25, 0.32, 0.25, 0.8, 4.38, 0.45, darkStone, tower);
  box(0.22, 0.25, 0.22, 0.8, 4.58, 0.45, leafEmerald, tower);

  // Lower wing with warm cedar wood pergola
  box(2.2, 1.4, 2.4, 2.25, 0.72, -0.5, glass);
  box(2.5, 0.16, 2.7, 2.25, 1.5, -0.5, stone);
  for (let i = 0; i < 5; i++) box(0.08, 1.45, 0.08, 1.35 + i * 0.45, 0.72, 0.74, stone);
  for (let i = 0; i < 4; i++) box(1.8, 0.06, 0.06, 2.25, 1.62, -0.8 + i * 0.35, woodMat);

  // Shaded entrance canopy with warm cedar wood ceiling & gold columns
  box(1.7, 0.08, 1.1, 0, 0.58, 1.3, darkStone);
  box(1.55, 0.03, 0.95, 0, 0.535, 1.3, woodMat);
  for (const x of [-0.75, 0.75]) box(0.05, 0.55, 0.05, x, 0.27, 1.65, goldFrame);

  // Grand limestone entrance steps
  for (let i = 0; i < 3; i++) box(2.1, 0.045, 0.4, 0, 0.06 - i * 0.025, 1.4 + i * 0.25, stone);

  // Vibrant flower planter boxes flanking the entrance steps
  box(0.45, 0.22, 1.1, -1.25, 0.12, 1.65, darkStone);
  box(0.38, 0.12, 0.98, -1.25, 0.26, 1.65, flowerCoral);
  box(0.45, 0.22, 1.1, 1.25, 0.12, 1.65, darkStone);
  box(0.38, 0.12, 0.98, 1.25, 0.26, 1.65, flowerGold);

  // Multi-tone lush street trees & flowering trees
  const treeGeo = new THREE.IcosahedronGeometry(0.42, 1);
  const trunkGeo = new THREE.CylinderGeometry(0.035, 0.045, 0.55, 6);
  const treeConfigs = [
    { x: -2, z: 1.8, mat: leafSpring },
    { x: -2, z: -2.5, mat: leafEmerald },
    { x: 3.9, z: -2.4, mat: leafGolden },
    { x: 3.9, z: 0.4, mat: leafSpring },
    { x: 2.8, z: 1.8, mat: leafEmerald },
    { x: -4.8, z: -2, mat: flowerPurple }, // Blooming Jacaranda in park!
    { x: -4.8, z: 0.1, mat: leafSpring },
  ];
  for (const { x, z, mat } of treeConfigs) {
    box(0.65, 0.15, 0.65, x, 0.04, z, pavement);
    const trunk = new THREE.Mesh(trunkGeo, darkStone);
    trunk.position.set(x, 0.35, z);
    root.add(trunk);
    const crown = new THREE.Mesh(treeGeo, mat);
    crown.position.set(x, 0.85, z);
    crown.scale.set(0.85, 1.25, 0.85);
    crown.castShadow = true;
    root.add(crown);
  }

  // Modern street lampposts with glowing warm LED heads along sidewalks
  const lampGeo = new THREE.CylinderGeometry(0.022, 0.028, 1.15, 6);
  const lampHeadGeo = new THREE.BoxGeometry(0.08, 0.04, 0.12);
  const lampPositions = [
    [-1.2, 2.15],
    [1.6, 2.15],
    [-3.0, 0.5],
    [3.2, 0.8],
  ];
  for (const [lx, lz] of lampPositions) {
    const post = new THREE.Mesh(lampGeo, lampPostMat);
    post.position.set(lx, 0.58, lz);
    root.add(post);
    const head = new THREE.Mesh(lampHeadGeo, lampLightMat);
    head.position.set(lx, 1.16, lz);
    root.add(head);
  }

  // 1. Traffic Center & Signal Gantries at intersection (-3.6, 2.8)
  // NE Corner pole & cantilever arms over roadway
  box(0.07, 1.95, 0.07, -3.05, 0.96, 2.15, lampPostMat);
  box(0.05, 0.05, 0.85, -3.05, 1.88, 2.55, lampPostMat);
  box(0.75, 0.05, 0.05, -3.42, 1.88, 2.15, lampPostMat);
  // SW Corner pole & cantilever arms
  box(0.07, 1.95, 0.07, -4.15, 0.96, 3.45, lampPostMat);
  box(0.05, 0.05, 0.85, -4.15, 1.88, 3.02, lampPostMat);
  box(0.75, 0.05, 0.05, -3.78, 1.88, 3.45, lampPostMat);

  // Traffic control center cabinet on sidewalk corner
  box(0.38, 0.08, 0.32, -2.85, 0.04, 1.85, pavement);
  box(0.32, 0.58, 0.26, -2.85, 0.36, 1.85, darkStone);
  box(0.24, 0.08, 0.02, -2.85, 0.48, 1.99, goldFrame);
  box(0.035, 0.035, 0.02, -2.85, 0.58, 1.99, trafficGreenOn);

  // 2. Public Transit & Bus Stop Shelter (x = 0.9, z = 3.65)
  for (const px of [0.15, 1.65]) {
    for (const pz of [3.35, 3.95]) box(0.04, 0.92, 0.04, px, 0.45, pz, darkStone);
  }
  box(1.7, 0.04, 0.85, 0.9, 0.92, 3.65, darkStone);
  box(1.58, 0.02, 0.75, 0.9, 0.94, 3.65, glass);
  box(1.5, 0.75, 0.025, 0.9, 0.46, 3.96, glass);
  box(0.025, 0.75, 0.62, 0.15, 0.46, 3.65, glass);
  box(1.15, 0.04, 0.28, 0.9, 0.22, 3.82, woodMat);
  for (const bx of [0.45, 1.35]) box(0.04, 0.20, 0.24, bx, 0.10, 3.82, darkStone);
  box(0.18, 0.82, 0.08, 1.85, 0.40, 3.45, darkStone);
  box(0.14, 0.38, 0.02, 1.85, 0.54, 3.40, beaconMaterial);
  box(0.035, 1.15, 0.035, -0.05, 0.58, 3.35, darkStone);
  box(0.18, 0.18, 0.02, -0.05, 1.08, 3.35, parasolYellow);
  box(0.12, 0.12, 0.025, -0.05, 1.08, 3.35, parasolBlue);

  // 3. Central Plaza Water Fountain (x = -1.8, z = 0.5)
  box(1.5, 0.24, 1.5, -1.8, 0.10, 0.5, stone);
  box(1.7, 0.06, 1.7, -1.8, 0.24, 0.5, darkStone);
  box(1.36, 0.02, 1.36, -1.8, 0.22, 0.5, waterMat);
  box(0.35, 0.45, 0.35, -1.8, 0.40, 0.5, stone);
  box(0.65, 0.08, 0.65, -1.8, 0.62, 0.5, darkStone);
  box(0.55, 0.02, 0.55, -1.8, 0.66, 0.5, waterMat);

  // 4. Red Fire Hydrants
  box(0.08, 0.26, 0.08, -2.7, 0.12, 2.25, hydrantRed);
  box(0.12, 0.05, 0.12, -2.7, 0.23, 2.25, hydrantRed);
  box(0.14, 0.04, 0.04, -2.7, 0.15, 2.25, darkStone);
  box(0.08, 0.26, 0.08, 2.6, 0.12, 2.25, hydrantRed);
  box(0.12, 0.05, 0.12, 2.6, 0.23, 2.25, hydrantRed);
  box(0.14, 0.04, 0.04, 2.6, 0.15, 2.25, darkStone);

  // 5. Duo Recycling & Waste Stations
  box(0.14, 0.32, 0.14, -0.98, 0.15, 2.25, darkStone);
  box(0.14, 0.32, 0.14, -0.82, 0.15, 2.25, binGreen);
  box(0.14, 0.32, 0.14, 3.02, 0.15, 2.25, darkStone);
  box(0.14, 0.32, 0.14, 3.18, 0.15, 2.25, binGreen);

  // 6. Bicycle Rack & 2 Parked City Bicycles
  for (let i = 0; i < 3; i++) box(0.03, 0.35, 0.38, 3.1 + i * 0.22, 0.16, 0.5, goldFrame);
  box(0.025, 0.20, 0.55, 3.1, 0.18, 0.5, carBlue);
  box(0.03, 0.18, 0.03, 3.1, 0.14, 0.25, wheelMat);
  box(0.03, 0.18, 0.03, 3.1, 0.14, 0.75, wheelMat);
  box(0.18, 0.02, 0.02, 3.1, 0.32, 0.65, darkStone);
  box(0.025, 0.20, 0.55, 3.32, 0.18, 0.5, carRed);
  box(0.03, 0.18, 0.03, 3.32, 0.14, 0.25, wheelMat);
  box(0.03, 0.18, 0.03, 3.32, 0.14, 0.75, wheelMat);
  box(0.18, 0.02, 0.02, 3.32, 0.32, 0.65, darkStone);

  // 7. Modern Illuminated Pedestrian Bollards
  for (const bx of [-2.4, -1.6, -0.8, 0.8, 1.6, 2.4]) {
    box(0.05, 0.32, 0.05, bx, 0.15, 2.30, darkStone);
    box(0.055, 0.04, 0.055, bx, 0.32, 2.30, lampLightMat);
  }

  // 8. Directional Street Signpost
  box(0.035, 1.45, 0.035, -3.05, 0.72, 2.35, darkStone);
  box(0.35, 0.06, 0.015, -3.05, 1.35, 2.35, signBlue);
  box(0.015, 0.06, 0.35, -3.05, 1.42, 2.35, signBlue);

  // 9. Cafe Menu Easel & Coffee Cups
  box(0.18, 0.35, 0.025, 3.3, 0.16, 1.4, darkStone);
  box(0.22, 0.38, 0.02, 3.3, 0.16, 1.4, woodMat);
  box(0.05, 0.04, 0.05, 3.6, 0.22, 1.3, crosswalkMat);
  box(0.05, 0.04, 0.05, 4.2, 0.22, 1.9, crosswalkMat);

  // 10. Park Stepping Stones
  for (let i = 0; i < 5; i++) {
    box(0.28, 0.02, 0.28, -4.2 - i * 0.32, -0.02, -1.3 - i * 0.18, pavement);
  }

  // Park: emerald lawn with wooden benches and flower bushes
  box(2.8, 0.08, 2.8, -5.2, -0.04, -1.7, parkMat);
  box(0.65, 0.18, 0.2, -4.2, 0.08, -1.2, woodMat);
  box(0.65, 0.18, 0.2, -4.2, 0.08, -2.2, woodMat);
  box(0.45, 0.25, 0.45, -6.0, 0.10, -1.0, flowerCoral);
  box(0.45, 0.25, 0.45, -6.0, 0.10, -2.4, flowerPurple);

  // Restaurant outdoor cafe terrace with colorful parasols & tables
  box(2.2, 0.04, 1.8, 3.8, -0.03, 1.6, pavement);
  box(0.35, 0.22, 0.35, 3.6, 0.09, 1.3, woodMat);
  box(0.35, 0.22, 0.35, 4.2, 0.09, 1.9, woodMat);

  // Cafe parasol 1 (Yellow)
  box(0.04, 0.85, 0.04, 3.6, 0.42, 1.3, darkStone);
  box(0.75, 0.08, 0.75, 3.6, 0.84, 1.3, parasolYellow);

  // Cafe parasol 2 (Blue)
  box(0.04, 0.85, 0.04, 4.2, 0.42, 1.9, darkStone);
  box(0.75, 0.08, 0.75, 4.2, 0.84, 1.9, parasolBlue);

  // Neighborhood place landmarks with physical foundations and architectural facades
  for (const p of places.filter(p => p.id !== 'park')) {
    const height = p.id === 'school' ? 1.05 : p.id === 'mosque' ? 1.2 : 0.7;
    const placeWallMat = stone;
    // Physical stone foundation base & entrance sidewalk plaza
    box(1.85, 0.05, 1.55, p.x, -0.02, p.z, pavement);
    box(1.6, height, 1.25, p.x, height * 0.5, p.z, placeWallMat);
    box(1.75, 0.1, 1.4, p.x, height + 0.06, p.z, darkStone);
    box(1.15, 0.35, 0.035, p.x, height * 0.6, p.z + 0.64, glass);

    // Architectural character accents for each place
    if (p.id === 'mosque') {
      // Golden dome atop mosque
      box(0.65, 0.35, 0.65, p.x, height + 0.26, p.z, goldFrame);
      box(0.12, 0.22, 0.12, p.x, height + 0.52, p.z, goldFrame);
    } else if (p.id === 'school') {
      // Blue entry portal & wood accent band
      box(1.7, 0.06, 1.35, p.x, height * 0.45, p.z, woodMat);
      box(0.85, 0.08, 0.45, p.x, height * 0.72, p.z + 0.7, parasolBlue);
    } else if (p.id === 'pharmacy') {
      // Vibrant green cross emblem
      box(0.35, 0.12, 0.04, p.x, height * 0.75, p.z + 0.65, leafSpring);
      box(0.12, 0.35, 0.04, p.x, height * 0.75, p.z + 0.65, leafSpring);
      // Modern front entrance awning
      box(1.4, 0.05, 0.35, p.x, height * 0.62, p.z + 0.78, darkStone);
    } else if (p.id === 'market') {
      // Striped awnings
      box(1.4, 0.06, 0.45, p.x, height * 0.65, p.z + 0.72, parasolYellow);
    }
  }

  const boxGeometry = new THREE.BoxGeometry(1, 1, 1), instance = new THREE.Object3D();
  for (const [mat, parts] of boxes) {
    const mesh = new THREE.InstancedMesh(boxGeometry, mat, parts.length);
    parts.forEach(([w, h, d, x, y, z], i) => {
      instance.position.set(x, y, z);
      instance.scale.set(w, h, d);
      instance.updateMatrix();
      mesh.setMatrixAt(i, instance.matrix);
    });
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.computeBoundingSphere();
    root.add(mesh);
  }
  // Pre-allocated object pools for zero-allocation 60 FPS animation loop
  const _v1 = new THREE.Vector3();
  const _v2 = new THREE.Vector3();
  const _vCam = new THREE.Vector3();
  const _vLook = new THREE.Vector3();

  // Dynamic Traffic Light Signal Heads at intersection (-3.6, 2.8)
  const trafficSignalBoxGeo = new THREE.BoxGeometry(0.10, 0.28, 0.08);
  const trafficLensGeo = new THREE.SphereGeometry(0.026, 8, 8);
  const ewSignalHeads = [];
  const nsSignalHeads = [];

  function createSignalHead(x, y, z, rotY, isEW) {
    const headGroup = new THREE.Group();
    headGroup.position.set(x, y, z);
    headGroup.rotation.y = rotY;

    const casing = new THREE.Mesh(trafficSignalBoxGeo, darkStone);
    headGroup.add(casing);

    const red = new THREE.Mesh(trafficLensGeo, trafficRedOff);
    red.position.set(0, 0.085, 0.045);
    const amber = new THREE.Mesh(trafficLensGeo, trafficAmberOff);
    amber.position.set(0, 0, 0.045);
    const green = new THREE.Mesh(trafficLensGeo, trafficGreenOff);
    green.position.set(0, -0.085, 0.045);

    headGroup.add(red, amber, green);
    root.add(headGroup);

    const record = { group: headGroup, red, amber, green };
    if (isEW) ewSignalHeads.push(record);
    else nsSignalHeads.push(record);
    return record;
  }

  // 2 East-West Signal Heads:
  createSignalHead(-3.42, 1.72, 2.15, -Math.PI / 2, true); // Over Eastbound lane, facing West
  createSignalHead(-4.15, 1.40, 3.02, Math.PI / 2, true);  // Curbside Westbound, facing East

  // 2 North-South Signal Heads:
  createSignalHead(-4.15, 1.72, 3.02, 0, false);            // Over Northbound lane, facing South
  createSignalHead(-3.05, 1.40, 2.55, Math.PI, false);      // Curbside Southbound, facing North

  // Central Plaza Fountain animated water ripples & bubbling jet
  const rippleGeo = new THREE.RingGeometry(0.18, 0.24, 32);
  const fountainRipple1 = new THREE.Mesh(rippleGeo, waterRippleMat);
  fountainRipple1.rotation.x = -Math.PI / 2;
  fountainRipple1.position.set(-1.8, 0.235, 0.5);
  root.add(fountainRipple1);

  const fountainRipple2 = new THREE.Mesh(rippleGeo, waterRippleMat);
  fountainRipple2.rotation.x = -Math.PI / 2;
  fountainRipple2.position.set(-1.8, 0.235, 0.5);
  root.add(fountainRipple2);

  const fountainJetGeo = new THREE.ConeGeometry(0.045, 0.16, 8);
  const fountainJet = new THREE.Mesh(fountainJetGeo, waterRippleMat);
  fountainJet.position.set(-1.8, 0.74, 0.5);
  root.add(fountainJet);

  // 6 Dynamic Moving Vehicles with rotating wheels, glowing headlights, and taillights
  const vehicles = [];
  const carWheelGeoX = new THREE.CylinderGeometry(0.068, 0.068, 0.042, 16);
  carWheelGeoX.rotateX(Math.PI / 2); // Axis along Z for rolling along X
  const carWheelGeoZ = new THREE.CylinderGeometry(0.068, 0.068, 0.042, 16);
  carWheelGeoZ.rotateZ(Math.PI / 2); // Axis along X for rolling along Z
  const carLightGeo = new THREE.BoxGeometry(0.04, 0.035, 0.05);

  const vehicleDefs = [
    // 1. Pearl White luxury sedan (Eastbound, South road lane 1, z = 3.12, moving +X)
    {
      id: 'sedan-white',
      mat: carWhite,
      length: 0.86, width: 0.40, height: 0.20,
      cabinLen: 0.46, cabinH: 0.13, cabinW: 0.34,
      axis: 'x', dir: 1, laneZ: 3.12, laneY: 0.075,
      min: -6.45, max: 6.45,
      cruiseSpeed: 1.85,
      initPos: -4.5,
      stopPos: -4.25,
      trafficPhaseKey: 'ew',
    },
    // 2. Metallic Royal Blue sports coupe (Westbound, South road lane 2, z = 2.48, moving -X)
    {
      id: 'coupe-blue',
      mat: carBlue,
      length: 0.82, width: 0.38, height: 0.18,
      cabinLen: 0.42, cabinH: 0.12, cabinW: 0.32,
      axis: 'x', dir: -1, laneZ: 2.48, laneY: 0.075,
      min: -6.45, max: 6.45,
      cruiseSpeed: 2.10,
      initPos: 4.5,
      stopPos: -2.95,
      trafficPhaseKey: 'ew',
    },
    // 3. Crimson Red family SUV (Southbound, West road lane 1, x = -3.88, moving +Z)
    {
      id: 'suv-red',
      mat: carRed,
      length: 0.88, width: 0.44, height: 0.24,
      cabinLen: 0.54, cabinH: 0.17, cabinW: 0.38,
      axis: 'z', dir: 1, laneX: -3.88, laneY: 0.085,
      min: -4.75, max: 4.75,
      cruiseSpeed: 1.65,
      initPos: -2.8,
      stopPos: 2.15,
      trafficPhaseKey: 'ns',
    },
    // 4. Charcoal Metallic EV Crossover (Northbound, West road lane 2, x = -3.32, moving -Z)
    {
      id: 'ev-dark',
      mat: carDark,
      length: 0.86, width: 0.42, height: 0.22,
      cabinLen: 0.50, cabinH: 0.16, cabinW: 0.36,
      axis: 'z', dir: -1, laneX: -3.32, laneY: 0.085,
      min: -4.75, max: 4.75,
      cruiseSpeed: 1.75,
      initPos: 2.6,
      stopPos: 3.45,
      trafficPhaseKey: 'ns',
    },
    // 5. Commercial Yellow Delivery Van (Eastbound, trailing white sedan)
    {
      id: 'van-yellow',
      mat: carYellow,
      length: 0.94, width: 0.42, height: 0.28,
      cabinLen: 0.65, cabinH: 0.20, cabinW: 0.38,
      axis: 'x', dir: 1, laneZ: 3.12, laneY: 0.095,
      min: -6.45, max: 6.45,
      cruiseSpeed: 1.55,
      initPos: -1.2,
      stopPos: -4.25,
      trafficPhaseKey: 'ew',
      trailTargetId: 'sedan-white',
    },
    // 6. Silver Metallic Compact Hatchback (Westbound, trailing blue coupe)
    {
      id: 'hatch-silver',
      mat: carSilver,
      length: 0.78, width: 0.38, height: 0.19,
      cabinLen: 0.42, cabinH: 0.14, cabinW: 0.32,
      axis: 'x', dir: -1, laneZ: 2.48, laneY: 0.075,
      min: -6.45, max: 6.45,
      cruiseSpeed: 1.95,
      initPos: -0.2,
      stopPos: -2.95,
      trafficPhaseKey: 'ew',
      trailTargetId: 'coupe-blue',
    },
  ];

  vehicleDefs.forEach(def => {
    const vGroup = new THREE.Group();
    const isX = def.axis === 'x';
    const bodyL = isX ? def.length : def.width;
    const bodyW = isX ? def.width : def.length;
    const bodyH = def.height * 0.55;

    // Sculpted lower chassis
    const bodyGeo = new THREE.BoxGeometry(bodyL, bodyH, bodyW);
    const bodyMesh = new THREE.Mesh(bodyGeo, def.mat);
    bodyMesh.position.y = bodyH * 0.5;
    bodyMesh.castShadow = true;
    vGroup.add(bodyMesh);

    // Upper cabin with windows
    const cabL = isX ? def.cabinLen : def.cabinW;
    const cabW = isX ? def.cabinW : def.cabinLen;
    const cabinGeo = new THREE.BoxGeometry(cabL, def.cabinH, cabW);
    const cabinMesh = new THREE.Mesh(cabinGeo, glass);
    cabinMesh.position.y = bodyH + def.cabinH * 0.5;
    cabinMesh.castShadow = true;
    vGroup.add(cabinMesh);

    // 4 Wheels with tire rubber
    const wheels = [];
    const wheelGeo = isX ? carWheelGeoX : carWheelGeoZ;
    const halfL = (isX ? def.length : def.width) * 0.30;
    const halfW = (isX ? def.width : def.length) * 0.50;
    const wheelOffsets = isX
      ? [[-halfL, -halfW], [halfL, -halfW], [-halfL, halfW], [halfL, halfW]]
      : [[-halfW, -halfL], [halfW, -halfL], [-halfW, halfL], [halfW, halfL]];

    wheelOffsets.forEach(([ox, oz]) => {
      const wMesh = new THREE.Mesh(wheelGeo, wheelMat);
      wMesh.position.set(ox, 0.035, oz);
      wMesh.castShadow = true;
      vGroup.add(wMesh);
      wheels.push(wMesh);
    });

    // Dual front headlights & dual rear taillights
    const headlights = [];
    const taillights = [];
    const frontSign = def.dir;
    const rearSign = -def.dir;
    const frontL = (isX ? def.length : def.width) * 0.49 * frontSign;
    const rearL = (isX ? def.length : def.width) * 0.49 * rearSign;
    const sideW = (isX ? def.width : def.length) * 0.32;

    for (const s of [-sideW, sideW]) {
      const hl = new THREE.Mesh(carLightGeo, carLightMat);
      const tl = new THREE.Mesh(carLightGeo, carTailNormal);
      if (isX) {
        hl.position.set(frontL, bodyH * 0.55, s);
        tl.position.set(rearL, bodyH * 0.55, s);
      } else {
        hl.position.set(s, bodyH * 0.55, frontL);
        tl.position.set(s, bodyH * 0.55, rearL);
      }
      vGroup.add(hl, tl);
      headlights.push(hl);
      taillights.push(tl);
    }

    if (isX) {
      vGroup.position.set(def.initPos, def.laneY, def.laneZ);
    } else {
      vGroup.position.set(def.laneX, def.laneY, def.initPos);
    }

    root.add(vGroup);
    vehicles.push({
      ...def,
      group: vGroup,
      wheels,
      headlights,
      taillights,
      pos: def.initPos,
      currentSpeed: def.cruiseSpeed,
      trailTarget: null,
    });
  });

  // Link trailing vehicles to leading vehicles
  vehicles.forEach(v => {
    if (v.trailTargetId) {
      v.trailTarget = vehicles.find(o => o.id === v.trailTargetId) || null;
    }
  });

  // Expressive, living pedestrians with anatomically articulated limbs, shoes, smooth spline circuits, and biomechanical gait
  const walkers = [];
  const personTorsoGeo = new THREE.BoxGeometry(0.12, 0.17, 0.08);
  const personHeadGeo = new THREE.SphereGeometry(0.052, 10, 8);
  const personNeckGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.03, 6);
  const personThighGeo = new THREE.CapsuleGeometry(0.024, 0.085, 3, 6);
  const personCalfGeo = new THREE.CapsuleGeometry(0.020, 0.085, 3, 6);
  const personShoeGeo = new THREE.BoxGeometry(0.038, 0.024, 0.08);
  const personUpperArmGeo = new THREE.CapsuleGeometry(0.018, 0.075, 3, 6);
  const personForearmGeo = new THREE.CapsuleGeometry(0.016, 0.065, 3, 6);
  const personHandGeo = new THREE.SphereGeometry(0.018, 6, 6);
  const bagGeo = new THREE.BoxGeometry(0.07, 0.10, 0.045);
  const backpackGeo = new THREE.BoxGeometry(0.10, 0.13, 0.06);
  const capGeo = new THREE.CylinderGeometry(0.054, 0.058, 0.024, 8);
  const capBrimGeo = new THREE.BoxGeometry(0.06, 0.008, 0.04);
  const shoeMat = material('#18181b', { roughness: 0.9 });

  const walkerStyles = [
    { jacket: material('#1e293b'), pants: material('#475569'), skin: material('#cfa685'), hasBackpack: true },
    { jacket: material('#b87d46'), pants: material('#1e2430'), skin: material('#b08260'), hasCap: true },
    { jacket: material('#334155'), pants: material('#94a3b8'), skin: material('#dfba9b'), hasBag: true },
    { jacket: material('#dfdbd0'), pants: material('#334155'), skin: material('#cfa685') },
    { jacket: material('#991b1b'), pants: material('#1e293b'), skin: material('#b08260'), hasCap: true },
    { jacket: material('#0d9488'), pants: material('#334155'), skin: material('#dfba9b'), hasBag: true },
    { jacket: material('#1e3a8a'), pants: material('#d97706'), skin: material('#cfa685'), hasBackpack: true },
    { jacket: material('#15803d'), pants: material('#334155'), skin: material('#b08260'), hasCap: true },
    { jacket: material('#c2410c'), pants: material('#2563eb'), skin: material('#dfba9b'), hasBag: true },
    { jacket: material('#7e22ce'), pants: material('#f1f5f9'), skin: material('#cfa685') },
  ];

  // Natural closed sidewalk, plaza, and park circuits with rounded corners
  const circuitWaypointSets = [
    // 1. Promenade in front of main residential complex & entrance
    [[-2.8, 2.2], [0.0, 2.2], [2.6, 2.2], [2.6, 1.48], [0.0, 1.48], [-2.8, 1.48]],
    // 2. Boulevard sidewalk along southern thoroughfare
    [[-1.8, 3.55], [0.5, 3.55], [2.8, 3.55], [2.8, 3.9], [0.5, 3.9], [-1.8, 3.9]],
    // 3. West civic pathway connecting Mosque, trees, and courtyard
    [[-3.1, -3.2], [-3.1, -0.6], [-3.1, 1.8], [-2.75, 1.8], [-2.75, -0.6], [-2.75, -3.2]],
    // 4. Park garden walkway looping through greenery
    [[-4.2, -0.85], [-5.8, -1.05], [-6.0, -2.35], [-4.6, -2.45], [-4.0, -1.75]],
    // 5. Eastern dining & school plaza
    [[3.35, 0.15], [3.35, 2.1], [3.75, 2.1], [3.75, 0.15]],
    // 6. Courtyard garden loop near shaded entrance
    [[-0.8, 2.2], [0.0, 1.35], [1.7, 1.35], [1.7, 2.2], [0.5, 2.3]],
    // 7. Pedestrian Crosswalk Crossing (crosses zebra crosswalk to south sidewalk)
    [[-0.6, 2.2], [-0.6, 3.55], [-0.35, 3.55], [-0.35, 2.2]],
    // 8. Plaza Promenade to Water Fountain (circles around the fountain)
    [[-1.1, 0.5], [-1.8, 1.2], [-2.5, 0.5], [-1.8, -0.2]],
    // 9. Eastern sidewalk between School and Bus Shelter
    [[2.8, 1.4], [2.8, 3.55], [1.5, 3.55], [1.5, 2.2], [2.8, 2.2]],
    // 10. Park Jogger (exercising along the park circuit at swift pace)
    [[-3.9, -1.1], [-5.3, -1.1], [-6.1, -2.1], [-5.1, -2.5], [-3.9, -1.8]],
  ];

  const walkerSpeeds = [0.38, 0.44, 0.35, 0.37, 0.42, 0.36, 0.39, 0.34, 0.40, 0.66];
  const walkerPhases = [0.10, 0.55, 0.28, 0.72, 0.42, 0.85, 0.18, 0.63, 0.33, 0.90];

  circuitWaypointSets.forEach((wpList, index) => {
    const style = walkerStyles[index % walkerStyles.length];
    const group = new THREE.Group();

    // Pelvis root node for biomechanical vertical bounce, yaw, and list
    const pelvis = new THREE.Group();
    pelvis.position.y = 0.225;
    group.add(pelvis);

    // Torso with jacket/shirt
    const torsoGroup = new THREE.Group();
    const torso = new THREE.Mesh(personTorsoGeo, style.jacket);
    torso.position.y = 0.11;
    torso.castShadow = true;
    torsoGroup.add(torso);

    // Neck and Head
    const neck = new THREE.Mesh(personNeckGeo, style.skin);
    neck.position.y = 0.205;
    torsoGroup.add(neck);

    const head = new THREE.Mesh(personHeadGeo, style.skin);
    head.position.y = 0.26;
    head.castShadow = true;
    torsoGroup.add(head);

    if (style.hasCap) {
      const capGroup = new THREE.Group();
      const cap = new THREE.Mesh(capGeo, style.jacket);
      cap.position.y = 0.305;
      const brim = new THREE.Mesh(capBrimGeo, style.jacket);
      brim.position.set(0, 0.30, 0.038);
      capGroup.add(cap, brim);
      torsoGroup.add(capGroup);
    }

    if (style.hasBackpack) {
      const backpack = new THREE.Mesh(backpackGeo, darkStone);
      backpack.position.set(0, 0.11, -0.06);
      backpack.castShadow = true;
      torsoGroup.add(backpack);
    } else if (style.hasBag) {
      const bag = new THREE.Mesh(bagGeo, darkStone);
      bag.position.set(0.075, 0.08, 0.02);
      bag.castShadow = true;
      torsoGroup.add(bag);
    }

    pelvis.add(torsoGroup);

    // Articulated legs with hip, knee, calf, ankle, and shoes
    const legs = [];
    for (const side of [-1, 1]) {
      const hip = new THREE.Group();
      hip.position.set(side * 0.04, 0, 0);

      const thigh = new THREE.Mesh(personThighGeo, style.pants);
      thigh.position.y = -0.045;
      thigh.castShadow = true;
      hip.add(thigh);

      const knee = new THREE.Group();
      knee.position.y = -0.09;
      hip.add(knee);

      const calf = new THREE.Mesh(personCalfGeo, style.pants);
      calf.position.y = -0.045;
      calf.castShadow = true;
      knee.add(calf);

      const ankle = new THREE.Group();
      ankle.position.y = -0.09;
      knee.add(ankle);

      // Distinct shoe positioned so sole rests on ground level
      const shoe = new THREE.Mesh(personShoeGeo, shoeMat);
      shoe.position.set(0, 0.012, 0.015);
      shoe.castShadow = true;
      ankle.add(shoe);

      pelvis.add(hip);
      legs.push({ hip, knee, ankle, side });
    }

    // Articulated arms with shoulder, upper arm, elbow, forearm, and hand
    const arms = [];
    for (const side of [-1, 1]) {
      const shoulder = new THREE.Group();
      shoulder.position.set(side * 0.078, 0.18, 0);

      const upperArm = new THREE.Mesh(personUpperArmGeo, style.jacket);
      upperArm.position.y = -0.04;
      upperArm.castShadow = true;
      shoulder.add(upperArm);

      const elbow = new THREE.Group();
      elbow.position.y = -0.08;
      shoulder.add(elbow);

      const forearm = new THREE.Mesh(personForearmGeo, style.skin);
      forearm.position.y = -0.035;
      forearm.castShadow = true;
      elbow.add(forearm);

      const hand = new THREE.Mesh(personHandGeo, style.skin);
      hand.position.y = -0.075;
      hand.castShadow = true;
      elbow.add(hand);

      pelvis.add(shoulder);
      arms.push({ shoulder, elbow, side });
    }

    // Convert circuit waypoints into a closed Three.js Catmull-Rom spline curve for silky smooth turns
    const splinePoints = wpList.map(([x, z]) => new THREE.Vector3(x, 0, z));
    const spline = new THREE.CatmullRomCurve3(splinePoints, true, 'centripetal', 0.25);
    const totalLen = spline.getLength();

    root.add(group);
    walkers.push({
      group,
      pelvis,
      torso: torsoGroup,
      legs,
      arms,
      spline,
      totalLen,
      speed: walkerSpeeds[index % walkerSpeeds.length],
      phase: walkerPhases[index % walkerPhases.length],
      currentYaw: 0,
    });
  });

  function notifyDroneState() {
    if (!options.onDroneStateChange) return;
    const isOverhead = distance > 14 && elevation > 0.45;
    const state = flight ? 'flying' : (isOverhead ? 'overhead' : 'street');
    const altitude = Math.round(THREE.MathUtils.lerp(5, 38, THREE.MathUtils.clamp((distance - 4.8) / (22.5 - 4.8), 0, 1)));
    const heading = (Math.round((azimuth * 180 / Math.PI) % 360) + 360) % 360;
    const speed = flight ? Math.round(THREE.MathUtils.lerp(0, 42, Math.sin(Math.PI * Math.min(1, (performance.now() - flight.started) / flight.duration)))) : 0;
    options.onDroneStateChange({ state, altitude, heading, speed });
  }

  const resize=()=>{
    const width=host.clientWidth,height=host.clientHeight;
    if(!width||!height)return;
    renderer.setPixelRatio(getDpr());
    renderer.setSize(width,height,false);
    camera.aspect=width/height;
    camera.fov = Math.max(34, THREE.MathUtils.radToDeg(2 * Math.atan(.46 / camera.aspect)));
    camera.updateProjectionMatrix();
    draw();
  };

  function draw(){
    if(disposed||host.hidden||!visible||document.hidden)return;
    if (!flight) {
      camera.position.set(
        target.x+Math.sin(azimuth)*Math.cos(elevation)*distance,
        target.y+Math.sin(elevation)*distance,
        target.z+Math.cos(azimuth)*Math.cos(elevation)*distance
      );
      camera.lookAt(target);
      if (currentBank !== 0) {
        camera.rotateZ(currentBank);
      }
    }
    renderer.render(scene,camera);
    projectPins(camera,host.clientWidth,host.clientHeight);
  }

  function flyToCoordinates(rawX, rawZ) {
    const isApartmentFocus = (Math.hypot(rawX - 0, rawZ - (-0.5)) < 1.8) || (Math.abs(rawX) < 1.8 && rawZ >= -1.9 && rawZ <= 0.8);
    let safe;
    let destination;
    let targetAzimuth;

    if (isApartmentFocus) {
      destination = new THREE.Vector3(0, 1.15, -0.2);
      safe = { x: 0.0, z: 2.35 };
      targetAzimuth = 0.65; // Front-Right 3/4 architectural beauty angle (camera South-East, framing front entrance and south facade)
    } else {
      safe = findNearestSafeLocation(rawX, rawZ);
      destination = new THREE.Vector3(safe.x, 0.22, safe.z);

      const dx = destination.x - target.x, dz = destination.z - target.z;
      const dist = Math.hypot(dx, dz);
      targetAzimuth = azimuth;
      if (dist > 0.4) {
        // Enforce front/street approach: camera stays on south/street side of target
        const approachAngle = Math.atan2(dx, dz);
        targetAzimuth = approachAngle;
      }
      // Guarantee front-facing perspective:
      // For any building or place in the northern map half (z <= 2.0), camera must remain on south/street side
      if (destination.z <= 2.0 && Math.cos(targetAzimuth) < 0.2) {
        targetAzimuth = 0.65;
      }
      targetAzimuth = getClearAzimuth(destination, targetAzimuth, 0.22, 4.8);
    }

    setPlaying(false);
    stopIntro();

    beaconGroup.position.set(safe.x, 0.035, safe.z);
    beaconGroup.visible = true;
    beaconMaterial.opacity = 0.85;

    let diff = (targetAzimuth - azimuth) % (Math.PI * 2);
    if (diff > Math.PI) diff -= Math.PI * 2;
    if (diff < -Math.PI) diff += Math.PI * 2;
    targetAzimuth = azimuth + diff;

    const fromCam = camera.position.clone();
    const toCam = new THREE.Vector3(
      destination.x + Math.sin(targetAzimuth) * Math.cos(0.22) * 4.8,
      destination.y + Math.sin(0.22) * 4.8,
      destination.z + Math.cos(targetAzimuth) * Math.cos(0.22) * 4.8
    );

    // Dynamic 4-point Catmull-Rom drone flight spline with realistic climb and cruise altitude
    const isAtStreet = fromCam.y < 5.0;
    const cruiseAlt = isAtStreet ? Math.max(fromCam.y + 3.8, 8.5) : Math.max(fromCam.y, 8.2);
    const p1 = new THREE.Vector3(
      THREE.MathUtils.lerp(fromCam.x, toCam.x, 0.22),
      isAtStreet ? fromCam.y + 2.5 : cruiseAlt,
      THREE.MathUtils.lerp(fromCam.z, toCam.z, 0.22)
    );
    const p2 = new THREE.Vector3(
      THREE.MathUtils.lerp(fromCam.x, toCam.x, 0.65),
      cruiseAlt,
      THREE.MathUtils.lerp(fromCam.z, toCam.z, 0.65)
    );
    const p3 = new THREE.Vector3(
      THREE.MathUtils.lerp(fromCam.x, toCam.x, 0.88),
      toCam.y + 1.2,
      THREE.MathUtils.lerp(fromCam.z, toCam.z, 0.88)
    );
    const cameraSpline = new THREE.CatmullRomCurve3([fromCam, p1, p2, p3, toCam], false, 'centripetal');

    const fromLook = target.clone();
    const toLook = destination.clone();
    const midLook = new THREE.Vector3(
      THREE.MathUtils.lerp(fromLook.x, toLook.x, 0.5),
      Math.max(fromLook.y, toLook.y, 0.6),
      THREE.MathUtils.lerp(fromLook.z, toLook.z, 0.5)
    );
    const targetSpline = new THREE.CatmullRomCurve3([fromLook, midLook, toLook], false, 'centripetal');

    altimeterBeam.visible = true;

    flight = {
      started: performance.now(),
      duration: reducedMotion ? 0 : 2200,
      cameraSpline,
      targetSpline,
      fromAzimuth: azimuth,
      toAzimuth: targetAzimuth,
      toTarget: destination,
      toElevation: 0.22,
      toDistance: 4.8,
      isAscent: false,
    };

    if (!flight.duration) {
      target.copy(destination);
      azimuth = targetAzimuth;
      elevation = 0.22;
      distance = 4.8;
      currentBank = 0;
      beaconGroup.visible = false;
      altimeterBeam.visible = false;
      flight = null;
      notifyDroneState();
      draw();
      return;
    }
    notifyDroneState();
    schedule();
  }

  function flyToOverview() {
    setPlaying(false);
    stopIntro();
    beaconGroup.visible = false;
    altimeterBeam.visible = false;

    const destTarget = rest.target.clone();
    let diff = (rest.azimuth - azimuth) % (Math.PI * 2);
    if (diff > Math.PI) diff -= Math.PI * 2;
    if (diff < -Math.PI) diff += Math.PI * 2;
    const targetAz = azimuth + diff;

    const fromCam = camera.position.clone();
    const toCam = new THREE.Vector3(
      destTarget.x + Math.sin(targetAz) * Math.cos(rest.elevation) * rest.distance,
      destTarget.y + Math.sin(rest.elevation) * rest.distance,
      destTarget.z + Math.cos(targetAz) * Math.cos(rest.elevation) * rest.distance
    );

    // Catmull-Rom ascent spline with vertical climb flare
    const p1 = new THREE.Vector3(fromCam.x, Math.max(fromCam.y + 4.8, 10.5), fromCam.z);
    const p2 = new THREE.Vector3(
      THREE.MathUtils.lerp(fromCam.x, toCam.x, 0.45),
      Math.max(toCam.y, 15.0),
      THREE.MathUtils.lerp(fromCam.z, toCam.z, 0.45)
    );
    const cameraSpline = new THREE.CatmullRomCurve3([fromCam, p1, p2, toCam], false, 'centripetal');

    const fromLook = target.clone();
    const midLook = new THREE.Vector3(
      THREE.MathUtils.lerp(fromLook.x, destTarget.x, 0.5),
      Math.max(fromLook.y, destTarget.y, 0.8),
      THREE.MathUtils.lerp(fromLook.z, destTarget.z, 0.5)
    );
    const targetSpline = new THREE.CatmullRomCurve3([fromLook, midLook, destTarget], false, 'centripetal');

    flight = {
      started: performance.now(),
      duration: reducedMotion ? 0 : 2000,
      cameraSpline,
      targetSpline,
      fromAzimuth: azimuth,
      toAzimuth: targetAz,
      toTarget: destTarget,
      toElevation: rest.elevation,
      toDistance: rest.distance,
      isAscent: true,
    };

    if (!flight.duration) {
      target.copy(destTarget);
      azimuth = rest.azimuth;
      elevation = rest.elevation;
      distance = rest.distance;
      currentBank = 0;
      flight = null;
      notifyDroneState();
      draw();
      return;
    }
    notifyDroneState();
    schedule();
  }

  function flyToPointer(event){
    const rect=renderer.domElement.getBoundingClientRect();
    const ndc=new THREE.Vector2(((event.clientX-rect.left)/rect.width)*2-1,-((event.clientY-rect.top)/rect.height)*2+1);
    const raycaster=new THREE.Raycaster();
    raycaster.setFromCamera(ndc,camera);

    let clickedPoint = null;
    const intersects = raycaster.intersectObjects([root, tower], true);
    if (intersects.length > 0) {
      clickedPoint = intersects[0].point;
    } else {
      const ground=new THREE.Plane(new THREE.Vector3(0,1,0),0);
      const pointOnGround=new THREE.Vector3();
      if(raycaster.ray.intersectPlane(ground,pointOnGround)) {
        clickedPoint = pointOnGround;
      } else {
        clickedPoint = new THREE.Vector3(ndc.x*6.5, 0, -ndc.y*4.5);
      }
    }
    flyToCoordinates(clickedPoint.x, clickedPoint.z);
  }

  function animate(time) {
    if (disposed || !visible || host.hidden || document.hidden) { frame = 0; return; }
    const approaching = introStart >= 0 && !reducedMotion;
    if (time - last > 28) {
      if (approaching) {
        const elapsed = Math.max(0, time - introStart);
        const progress = Math.min(1, elapsed / 1900);
        const wave = Math.max(0, (elapsed - 350) / 1250);
        const phase = wave % 1;
        sweep.visible = wave > 0 && wave < 2;
        sweep.scale.setScalar(.8 + phase * 6);
        sweepMaterial.opacity = .95 * Math.sin(Math.PI * phase) ** .6;
        const remaining = (1 - progress) ** 3;
        azimuth = rest.azimuth + approach.azimuth * remaining;
        elevation = rest.elevation + approach.elevation * remaining;
        distance = rest.distance + approach.distance * remaining;
        currentBank = 0;
        if (wave >= 2) stopIntro();
      } else if (flight) {
        const rawProgress = Math.min(1, Math.max(0, (time - flight.started) / flight.duration));
        // Smooth quintic easeInOut for ultra-cinematic drone trajectory
        const ease = rawProgress < 0.5 ? 16 * Math.pow(rawProgress, 5) : 1 - Math.pow(-2 * rawProgress + 2, 5) / 2;

        flight.cameraSpline.getPointAt(ease, _vCam);
        flight.targetSpline.getPointAt(ease, _vLook);
        camera.position.copy(_vCam);
        camera.lookAt(_vLook);

        // Aerodynamic banking tilt into turns based on spline turn rate
        const turnRate = flight.toAzimuth - flight.fromAzimuth;
        const arc = Math.sin(Math.PI * ease);
        currentBank = THREE.MathUtils.clamp(turnRate * 0.16, -0.09, 0.09) * arc;
        if (currentBank !== 0) {
          camera.rotateZ(currentBank);
        }

        // Continuously update spherical coordinates for seamless handover on pointer grab
        target.copy(_vLook);
        _v1.subVectors(_vCam, _vLook);
        distance = _v1.length();
        elevation = Math.asin(THREE.MathUtils.clamp(_v1.y / distance, -1, 1));
        azimuth = Math.atan2(_v1.x, _v1.z);

        // Animate holographic altimeter laser and ground landing beacon
        if (beaconGroup.visible) {
          const pulse = (time * 0.008) % Math.PI;
          beaconRing.scale.setScalar(0.85 + Math.sin(pulse) * 0.25);
          beaconGroup.rotation.y = time * 0.0025;
          beaconMaterial.opacity = (1 - ease * 0.5) * 0.85;

          const wavePhase = (time * 0.0025) % 1;
          beaconWave.scale.setScalar(1 + wavePhase * 0.9);
          beaconWaveMaterial.opacity = (1 - wavePhase) * 0.55 * (1 - ease * 0.5);

          // Position altimeter laser beam directly under drone camera
          altimeterBeam.position.set(_vCam.x, _vCam.y * 0.5, _vCam.z);
          altimeterBeam.scale.set(1, Math.max(0.1, _vCam.y), 1);
          beamMaterial.opacity = (1 - ease * 0.3) * 0.42;
        }

        // Dynamic atmospheric depth fog density adapted to drone altitude
        scene.fog.density = THREE.MathUtils.lerp(0.010, 0.018, THREE.MathUtils.clamp((distance - 4.8) / 18, 0, 1));

        if (rawProgress >= 1) {
          target.copy(flight.toTarget);
          azimuth = flight.toAzimuth;
          elevation = flight.toElevation;
          distance = flight.toDistance;
          flight = null;
          currentBank = 0;
          beaconGroup.visible = false;
          altimeterBeam.visible = false;
        }
        notifyDroneState();
      } else if (playing) {
        azimuth += .0025;
        currentBank = 0;
        notifyDroneState();
      } else {
        currentBank = 0;

        // Inertial coasting after releasing pointer drag
        if (!isPointerDown && Math.abs(velAzimuth) > 0.00015) {
          azimuth += velAzimuth;
          velAzimuth *= 0.88; // smooth exponential decay
          notifyDroneState();
        }

        // Subtle organic drone hover micro-dynamics & wind turbulence when idle
        if (!reducedMotion && !isPointerDown) {
          const t = time * 0.001;
          const hoverY = Math.sin(t * 1.8) * 0.012 + Math.sin(t * 3.4) * 0.004;
          const hoverX = Math.cos(t * 1.1) * 0.005;
          const hoverZ = Math.sin(t * 0.9) * 0.005;
          const hoverRoll = Math.sin(t * 1.4) * 0.003;
          const hoverPitch = Math.cos(t * 1.2) * 0.002;
          camera.position.x += hoverX;
          camera.position.y += hoverY;
          camera.position.z += hoverZ;
          camera.rotateZ(hoverRoll);
          camera.rotateX(hoverPitch);
        }
      }

      // Biomechanically accurate bipedal pedestrian walking animation along smooth spline curves
      if (!reducedMotion) {
        for (const walker of walkers) {
          const { group, pelvis, torso, legs, arms, spline, totalLen, speed, phase } = walker;
          const dist = (time * 0.001 * speed + phase * totalLen) % totalLen;
          const u = dist / totalLen;

          // Continuous curve position and tangent vector
          spline.getPointAt(u, _v1);
          spline.getTangentAt(u, _v2);
          group.position.set(_v1.x, 0, _v1.z);

          // Smooth corner turning with continuous angular interpolation and inward body lean
          const targetYaw = Math.atan2(_v2.x, _v2.z);
          let dYaw = (targetYaw - walker.currentYaw) % (Math.PI * 2);
          if (dYaw > Math.PI) dYaw -= Math.PI * 2;
          if (dYaw < -Math.PI) dYaw += Math.PI * 2;
          walker.currentYaw += dYaw * 0.14;
          group.rotation.y = walker.currentYaw;
          group.rotation.z = -THREE.MathUtils.clamp(dYaw * 0.35, -0.06, 0.06);

          // Stride cadence and gait phase calculation
          const strideSpeed = speed * 3.4;
          const cycle = (time * 0.001 * strideSpeed * Math.PI * 2 + phase * 20) % (Math.PI * 2);

          for (let i = 0; i < 2; i++) {
            // Normalized gait phase p in [0, 1) for each leg
            let phi = (cycle + (i === 0 ? 0 : Math.PI)) % (Math.PI * 2);
            if (phi < 0) phi += Math.PI * 2;
            const p = phi / (Math.PI * 2);

            let hipPitch = 0;
            let kneeFlex = 0;
            let anklePitch = 0;

            if (p < 0.60) {
              // 1. Stance phase: foot on ground supporting weight, hip moving forward to backward
              const s = p / 0.60;
              hipPitch = Math.cos(s * Math.PI) * 0.36 + 0.04;
              // Knee has slight shock-absorption flex at foot-flat, stays mostly straight
              kneeFlex = 0.06 + Math.sin(s * Math.PI) * 0.12;
              // Ankle: heel strike (+), flat (0), toe push-off (-)
              anklePitch = (1 - s * 2) * 0.18;
            } else {
              // 2. Forward swing phase: hip swings forward, knee BENDS SHARPLY to lift foot cleanly over ground!
              const w = (p - 0.60) / 0.40;
              hipPitch = -Math.cos(w * Math.PI) * 0.36 + 0.04;
              // Knee flexes upward during mid-swing, then extends straight for heel strike
              kneeFlex = 0.10 + Math.sin(w * Math.PI) * 0.95;
              // Ankle flexes toes upward (dorsiflexion) to ensure toe clearance
              anklePitch = Math.sin(w * Math.PI) * 0.22;
            }

            legs[i].hip.rotation.x = hipPitch;
            legs[i].knee.rotation.x = kneeFlex;
            legs[i].ankle.rotation.x = anklePitch;

            // Contra-lateral arm swing with natural resting elbow bend
            const armPitch = -hipPitch * 0.82;
            arms[i].shoulder.rotation.x = armPitch;
            arms[i].shoulder.rotation.z = (i === 0 ? -1 : 1) * 0.06;
            // Elbow bends naturally more on forward arm swing
            arms[i].elbow.rotation.x = 0.22 + Math.max(0, -armPitch) * 0.45;
          }

          // Pelvis vertical bounce: 2 smooth pulses per full gait stride
          pelvis.position.y = 0.225 - Math.abs(Math.sin(cycle)) * 0.015;

          // Pelvic yaw rotation (hips swing forward with advancing leg)
          pelvis.rotation.y = Math.sin(cycle) * 0.07;

          // Pelvic roll list (weight shifts to stance side)
          pelvis.rotation.z = Math.sin(cycle) * 0.025;

          // Torso / shoulder counter-yaw rotation for balance
          torso.rotation.y = -Math.sin(cycle) * 0.08;
        }

        // Dynamic Traffic Signal Light System (14.0s cycle at intersection -3.6, 2.8)
        const cycleSec = (time * 0.001) % 14.0;
        const ewGreen = cycleSec < 6.0;
        const ewAmber = cycleSec >= 6.0 && cycleSec < 7.5;
        const ewRed = cycleSec >= 7.5;
        const nsGreen = cycleSec >= 7.5 && cycleSec < 12.5;
        const nsAmber = cycleSec >= 12.5;
        const nsRed = cycleSec < 7.5;

        for (let i = 0; i < ewSignalHeads.length; i++) {
          const h = ewSignalHeads[i];
          h.red.material = ewRed ? trafficRedOn : trafficRedOff;
          h.amber.material = ewAmber ? trafficAmberOn : trafficAmberOff;
          h.green.material = ewGreen ? trafficGreenOn : trafficGreenOff;
        }
        for (let i = 0; i < nsSignalHeads.length; i++) {
          const h = nsSignalHeads[i];
          h.red.material = nsRed ? trafficRedOn : trafficRedOff;
          h.amber.material = nsAmber ? trafficAmberOn : trafficAmberOff;
          h.green.material = nsGreen ? trafficGreenOn : trafficGreenOff;
        }

        // Central Plaza Fountain animated water ripples & bubbling water jet
        const fTime = time * 0.001;
        const rip1 = (fTime * 0.55) % 1;
        const rip2 = (fTime * 0.55 + 0.5) % 1;
        fountainRipple1.scale.setScalar(0.4 + rip1 * 1.5);
        fountainRipple2.scale.setScalar(0.4 + rip2 * 1.5);
        fountainJet.position.y = 0.74 + Math.sin(fTime * 7.0) * 0.025;
        fountainJet.scale.set(1 + Math.sin(fTime * 8) * 0.15, 1 + Math.cos(fTime * 6) * 0.2, 1 + Math.sin(fTime * 8) * 0.15);

        // Dynamic Moving Vehicles simulation with traffic lights, safe following distance, and rolling wheels
        const deltaSec = last > 0 ? Math.min(0.08, (time - last) * 0.001) : 0.033;
        for (let i = 0; i < vehicles.length; i++) {
          const v = vehicles[i];
          const isEW = v.trafficPhaseKey === 'ew';
          const lightRedOrAmber = isEW ? (ewRed || ewAmber) : (nsRed || nsAmber);

          let targetSpeed = v.cruiseSpeed;

          // 1. Decelerate at intersection stop line if signal is Red or Amber
          let distToStop = 0;
          if (v.dir === 1) {
            distToStop = v.stopPos - v.pos;
          } else {
            distToStop = v.pos - v.stopPos;
          }

          if (lightRedOrAmber && distToStop > 0 && distToStop < 2.5) {
            targetSpeed = Math.min(v.cruiseSpeed, Math.max(0, (distToStop - 0.28) * 1.6));
          }

          // 2. Safe following distance behind leading vehicle
          if (v.trailTarget) {
            const lead = v.trailTarget;
            let leadDist = 0;
            if (v.dir === 1) {
              leadDist = lead.pos >= v.pos ? (lead.pos - v.pos) : (v.max - v.pos + lead.pos - v.min);
            } else {
              leadDist = lead.pos <= v.pos ? (v.pos - lead.pos) : (v.pos - v.min + v.max - lead.pos);
            }

            if (leadDist > 0 && leadDist < 2.4) {
              const followCap = Math.max(0, Math.min(lead.currentSpeed, (leadDist - 1.35) * 1.8));
              targetSpeed = Math.min(targetSpeed, followCap);
            }
          }

          // Smooth acceleration and realistic deceleration rate
          const isBraking = targetSpeed < v.currentSpeed - 0.05;
          const accelRate = isBraking ? 4.8 : 2.4;
          v.currentSpeed += (targetSpeed - v.currentSpeed) * Math.min(1, deltaSec * accelRate);
          if (v.currentSpeed < 0.01 && targetSpeed === 0) v.currentSpeed = 0;

          // Ruby glowing taillights brighten when braking or stopped
          const activeTailMat = (isBraking || v.currentSpeed < 0.15) ? carBrakeMat : carTailNormal;
          for (let j = 0; j < v.taillights.length; j++) {
            v.taillights[j].material = activeTailMat;
          }

          // Advance vehicle position along lane axis
          v.pos += v.currentSpeed * v.dir * deltaSec;

          // Seamless boundary wrapping across edge of neighborhood
          if (v.dir === 1 && v.pos > v.max) {
            v.pos = v.min;
          } else if (v.dir === -1 && v.pos < v.min) {
            v.pos = v.max;
          }

          // Tunnel disappearance: vehicle enters deep shadow interior chamber and disappears
          if (v.axis === 'x') {
            v.group.visible = Math.abs(v.pos) < 6.1;
          } else {
            v.group.visible = Math.abs(v.pos) < 4.4;
          }

          // Synchronize Three.js transforms and physical wheel rotation
          if (v.axis === 'x') {
            v.group.position.x = v.pos;
            const rollDelta = -(v.currentSpeed * v.dir * deltaSec) / 0.068;
            for (let j = 0; j < v.wheels.length; j++) {
              v.wheels[j].rotation.z += rollDelta;
            }
          } else {
            v.group.position.z = v.pos;
            const rollDelta = (v.currentSpeed * v.dir * deltaSec) / 0.068;
            for (let j = 0; j < v.wheels.length; j++) {
              v.wheels[j].rotation.x += rollDelta;
            }
          }
        }
      }

      draw();
      last = time;
    }
    frame = (introStart >= 0 && !reducedMotion) || playing || flight || (!reducedMotion && (walkers.length > 0 || vehicles.length > 0)) || Math.abs(velAzimuth) > 0.00015 ? requestAnimationFrame(animate) : 0;
  }

  function schedule(){if(!frame&&!disposed)frame=requestAnimationFrame(animate);}
  const observer=new ResizeObserver(resize);observer.observe(host);

  let point=null,oldAngle=azimuth,pointerStart=null,pointerId=null;
  host.onpointerdown=e=>{
    if(e.target.closest('button'))return;
    isPointerDown = true;
    point=e.clientX;
    oldAngle=azimuth;
    pointerStart={x:e.clientX,y:e.clientY};
    pointerId=e.pointerId;
    velAzimuth = 0;
    lastPointerX = e.clientX;
    lastPointerTime = performance.now();
    host.setPointerCapture(e.pointerId);
  };

  let dragFrame = 0;
  host.onpointermove = event => {
    if (point === null) return;
    if(pointerStart && Math.hypot(event.clientX-pointerStart.x, event.clientY-pointerStart.y) > 7){
      pointerStart=null;
      flight=null;
      currentBank=0;
      beaconGroup.visible=false;
      setPlaying(false);
      stopIntro();
    }
    if(!pointerStart){
      const now = performance.now();
      const dt = Math.max(1, now - lastPointerTime);
      const dx = event.clientX - lastPointerX;
      velAzimuth = -(dx / dt) * 0.055;
      lastPointerX = event.clientX;
      lastPointerTime = now;

      azimuth = oldAngle - (event.clientX - point) * .008;
      notifyDroneState();
      if (!dragFrame) {
        dragFrame = requestAnimationFrame(() => {
          dragFrame = 0;
          draw();
        });
      }
    }
  };

  host.onpointerup = event => {
    isPointerDown = false;
    if(pointerStart && event.pointerId===pointerId) flyToPointer(event);
    point=null;
    pointerStart=null;
    pointerId=null;
    if (Math.abs(velAzimuth) > 0.0002) schedule();
  };
  host.onpointercancel = () => { isPointerDown=false;point=null;pointerStart=null;pointerId=null; };

  host.onkeydown=e=>{
    if(e.target.closest('button'))return;
    if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-','Home','Enter',' '].includes(e.key))return;
    e.preventDefault();
    setPlaying(false);
    flight=null;
    currentBank=0;
    stopIntro();
    if(e.key==='Home'){
      flyToOverview();
    } else if(['+','=','ArrowUp'].includes(e.key)){
      distance=Math.max(3.8,Math.min(29,distance - 1.2));
      notifyDroneState();
      draw();
    } else if(['-','ArrowDown'].includes(e.key)){
      distance=Math.max(3.8,Math.min(29,distance + 1.2));
      notifyDroneState();
      draw();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      azimuth += e.key==='ArrowLeft'?-.18:.18;
      notifyDroneState();
      draw();
    } else if (e.key === 'Enter' || e.key === ' ') {
      flyToCoordinates(0, 0);
    }
  };

  function updateVisibility(inView) {
    if (inView === visible) return;
    visible = inView;
    if (!visible || document.hidden) return;
    if (!reducedMotion) introStart = performance.now();
    draw();
    schedule();
  }

  const intersection = new IntersectionObserver(([entry]) => {
    updateVisibility(entry.isIntersecting && entry.intersectionRatio >= .2);
  }, { threshold: [0, .2] });
  intersection.observe(host);

  const onVisibility = () => {
    if (document.hidden) setPlaying(false);
    else if (visible) { draw(); schedule(); }
  };
  document.addEventListener('visibilitychange',onVisibility);

  const dispose=()=>{
    disposed=true;
    document.removeEventListener('visibilitychange',onVisibility);
    host.onpointerdown=host.onpointermove=host.onpointerup=host.onpointercancel=host.onkeydown=null;
    cancelAnimationFrame(frame);
    cancelAnimationFrame(dragFrame);
    observer.disconnect();
    intersection.disconnect();

    const geometries=new Set();
    scene.traverse(obj=>{if(obj.geometry)geometries.add(obj.geometry);});
    geometries.forEach(geometry=>geometry.dispose());

    const materials=[
      stone,darkStone,woodMat,glass,goldFrame,pavement,road,crosswalkMat,
      leafSpring,leafEmerald,leafGolden,flowerCoral,flowerPurple,flowerGold,
      parkMat,parasolYellow,parasolBlue,carWhite,carBlue,carRed,carDark,
      carLightMat,carTailNormal,carBrakeMat,carYellow,carSilver,wheelMat,rimMat,
      trafficRedOn,trafficRedOff,trafficAmberOn,trafficAmberOff,trafficGreenOn,trafficGreenOff,
      waterMat,waterRippleMat,hydrantRed,binGreen,signBlue,
      tunnelVoidMat,tunnelLightGreen,
      lampPostMat,lampLightMat,groundMat,
      sweepMaterial,beaconMaterial,beaconWaveMaterial,beamMaterial,shoeMat,
      ...walkerStyles.flatMap(s=>[s.jacket,s.pants,s.skin])
    ];
    materials.forEach(mat=>mat?.dispose());

    renderer.dispose();
    renderer.domElement.remove();
  };

  resize();
  schedule();
  if(options.dark){
    groundMat.color.set("#555865");
    ambient.intensity=1.8;
    sun.intensity=2.2;
    draw();
  }
  notifyDroneState();

  return {
    draw,
    dispose,
    setReducedMotion(value){
      reducedMotion=Boolean(value);
      if(value){
        if(introStart>=0){
          azimuth=rest.azimuth;elevation=rest.elevation;distance=rest.distance;target.set(0,1.15,0);
          stopIntro();
        }
        if(flight){
          target.copy(flight.toTarget);
          azimuth=flight.toAzimuth;
          elevation=flight.toElevation;
          distance=flight.toDistance;
          flight=null;
          currentBank=0;
        }
        beaconGroup.visible=false;
        altimeterBeam.visible=false;
        setPlaying(false);
      } else {
        schedule();
      }
      notifyDroneState();
      draw();
    },
    rotate(delta){
      stopIntro();flight=null;currentBank=0;azimuth+=delta;notifyDroneState();draw();
    },
    reset(){
      flyToOverview();
    },
    zoom(delta){
      stopIntro();distance=Math.max(3.8,Math.min(29,distance*(1+delta)));notifyDroneState();draw();
    },
    play(value){
      playing=value;if(value){stopIntro();schedule();}
    },
    theme(value){
      groundMat.color.set(value?'#555865':'#dfddd6');
      ambient.intensity=value?1.8:2.4;
      sun.intensity=value?2.2:3.4;
      draw();
    },
    flyToOverview,
    flyToCoordinates,
    flyToPlace(placeId){
      if (placeId === 'apartment') {
        flyToCoordinates(0, -0.5);
        return;
      }
      const marker = markers.find(m => m.id === placeId);
      if (marker) {
        flyToCoordinates(marker.x, marker.z);
      }
    },
    startPatrol(){
      const patrolPoints = [
        { x: 0, z: -0.5 },
        { x: -1.7, z: -3.8 },
        { x: -5.2, z: -1.7 },
        { x: 1.0, z: 4.1 },
        { x: 4.8, z: -2.9 },
      ];
      let pIdx = 0;
      function nextPoint() {
        if (disposed) return;
        if (pIdx >= patrolPoints.length) {
          flyToOverview();
          return;
        }
        const pt = patrolPoints[pIdx++];
        flyToCoordinates(pt.x, pt.z);
      }
      nextPoint();
    },
  };
}

