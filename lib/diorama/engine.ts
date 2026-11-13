import * as THREE from "three/webgpu";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { DIORAMA_BY_SLUG } from "./content";
import type {
  Atmosphere,
  DioramaEngine,
  DioramaEngineOptions,
  Quality,
  SceneBuild,
  SceneLoader,
  SceneModule,
} from "./types";
import type { DioramaSlug, TimeMode } from "./content";
import { createGroundShadow } from "./base";
import { createHotspotTexture } from "./textures";
import { mulberry32 } from "./utils";

const DEFAULT_QUALITY: Quality = {
  tier: "balanced",
  terrainSegments: 96,
  waterSegments: 64,
  treeCount: 1,
  detail: 0.8,
  shadows: true,
  dpr: 1.75,
};

const LOADERS: Record<DioramaSlug, SceneLoader> = {
  soweto: () => import("./scenes/soweto").then((module) => ({ build: module.buildSoweto })),
  drakensberg: () =>
    import("./scenes/drakensberg").then((module) => ({ build: module.buildDrakensberg })),
  pretoria: () => import("./scenes/pretoria").then((module) => ({ build: module.buildPretoria })),
  knysna: () => import("./scenes/knysna").then((module) => ({ build: module.buildKnysna })),
  "hole-in-the-wall": () =>
    import("./scenes/hole-in-the-wall").then((module) => ({ build: module.buildHoleInTheWall })),
  "sani-pass": () =>
    import("./scenes/sani-pass").then((module) => ({ build: module.buildSaniPass })),
  winelands: () =>
    import("./scenes/winelands").then((module) => ({ build: module.buildWinelands })),
  "cape-point": () =>
    import("./scenes/cape-point").then((module) => ({ build: module.buildCapePoint })),
  augrabies: () =>
    import("./scenes/augrabies").then((module) => ({ build: module.buildAugrabies })),
  boulders: () => import("./scenes/boulders").then((module) => ({ build: module.buildBoulders })),
  "robben-island": () =>
    import("./scenes/robben-island").then((module) => ({ build: module.buildRobbenIsland })),
  "kosi-bay": () => import("./scenes/kosi-bay").then((module) => ({ build: module.buildKosiBay })),
  addo: () => import("./scenes/addo").then((module) => ({ build: module.buildAddo })),
  "valley-of-desolation": () =>
    import("./scenes/valley-of-desolation").then((module) => ({
      build: module.buildValleyOfDesolation,
    })),
};

const SEEDS: Record<DioramaSlug, number> = {
  soweto: 17,
  drakensberg: 41,
  pretoria: 73,
  knysna: 91,
  "hole-in-the-wall": 127,
  "sani-pass": 149,
  winelands: 163,
  "cape-point": 181,
  augrabies: 199,
  boulders: 211,
  "robben-island": 233,
  "kosi-bay": 251,
  addo: 269,
  "valley-of-desolation": 287,
};

const ATMOSPHERES: Record<TimeMode, Atmosphere> = {
  day: { night: 0, golden: 0 },
  golden: { night: 0.04, golden: 1 },
  night: { night: 1, golden: 0 },
};

const DEFAULT_CAMERA = {
  position: [15.6, 13.6, 16.4] as [number, number, number],
  target: [0, 0.3, 0] as [number, number, number],
};

/**
 * Half extents of the projected diorama, including the strata base. The camera
 * distance is solved from these so the whole block always fits the stage.
 */
const FIT_HALF_WIDTH = 8.8;
const FIT_HALF_HEIGHT = 7.25;
const FIT_MARGIN = 1.16;

const DAY_SUN = new THREE.Color("#fff1d8");
const GOLDEN_SUN = new THREE.Color("#ffb36b");
const NIGHT_SUN = new THREE.Color("#8ea6d8");
const DAY_SKY = new THREE.Color("#fff6e6");
const NIGHT_SKY = new THREE.Color("#6d7fa8");
const DAY_GROUND = new THREE.Color("#5b5745");
const NIGHT_GROUND = new THREE.Color("#262a38");

type CameraTween = {
  elapsed: number;
  duration: number;
  fromPosition: THREE.Vector3;
  toPosition: THREE.Vector3;
  fromTarget: THREE.Vector3;
  toTarget: THREE.Vector3;
};

function disposeObject(object: THREE.Object3D) {
  object.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (mesh.isMesh) {
      mesh.geometry?.dispose();
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const material of materials) {
        if (!material) continue;
        const record = material as unknown as Record<string, unknown>;
        for (const key of ["map", "emissiveMap", "normalMap", "roughnessMap", "metalnessMap"]) {
          const texture = record[key];
          if (texture instanceof THREE.Texture) texture.dispose();
        }
        material.dispose();
      }
    }
  });
}

export function createDioramaEngine(options: DioramaEngineOptions): DioramaEngine {
  const { canvas, reducedMotion, onRenderer, onLandmarks, onSelect, onError } = options;
  const quality = options.quality ?? DEFAULT_QUALITY;
  const requestedBackend = options.backend ?? "auto";

  let renderer: THREE.WebGPURenderer | null = null;
  let scene: THREE.Scene | null = null;
  let camera: THREE.PerspectiveCamera | null = null;
  let controls: OrbitControls | null = null;
  let current: SceneBuild | null = null;
  let hotspotMaterial: THREE.MeshBasicMaterial | null = null;
  let hotspotGeometry: THREE.PlaneGeometry | null = null;
  let hotspots: THREE.Mesh[] = [];
  let baseSlabs: THREE.Mesh[] = [];
  let baseSlabY: number[] = [];
  let groundShadow: THREE.Mesh | null = null;
  let sun: THREE.DirectionalLight | null = null;
  let fill: THREE.DirectionalLight | null = null;
  let hemi: THREE.HemisphereLight | null = null;

  let initPromise: Promise<void> | null = null;
  let disposed = false;
  let loadToken = 0;
  let atmosphereMode: TimeMode = "day";
  const atmosphere: Atmosphere = { night: 0, golden: 0 };
  let explodedTarget = 0;
  let explode = 0;
  let autoRotate = false;
  let tween: CameraTween | null = null;
  let userMoved = false;

  const timer = new THREE.Timer();
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let pointerDown: { x: number; y: number } | null = null;

  function applyAtmosphere() {
    if (!sun || !fill || !hemi || !renderer) return;
    const golden = atmosphere.golden;
    const night = atmosphere.night;
    sun.color.copy(DAY_SUN).lerp(GOLDEN_SUN, golden).lerp(NIGHT_SUN, night);
    sun.intensity = 2.8 + golden * 0.25 - night * 2.15;
    sun.position.set(
      9 + golden * 4.5 - night * 15,
      15 - golden * 7.5 - night * 2,
      10 - golden * 1.5 + night * 1,
    );
    hemi.color.copy(DAY_SKY).lerp(NIGHT_SKY, night);
    hemi.groundColor.copy(DAY_GROUND).lerp(NIGHT_GROUND, night);
    hemi.intensity = 1.75 - night * 1.05;
    fill.intensity = 0.42 - night * 0.18 + golden * 0.08;
    renderer.toneMappingExposure = 1.05 - night * 0.12 + golden * 0.06;
  }

  function applyExplode() {
    if (!current) return;
    current.terrain.position.y = explode * 0.55;
    baseSlabs.forEach((slab, index) => {
      slab.position.y = baseSlabY[index] - index * 0.52 * explode;
    });
    for (const hotspot of hotspots) {
      const baseY = hotspot.userData.baseY as number;
      hotspot.position.y = baseY + explode * 0.55;
    }
    if (groundShadow) {
      (groundShadow.material as THREE.MeshBasicMaterial).opacity = 0.42 * (1 - explode * 0.35);
    }
  }

  function startTween(toPosition: THREE.Vector3, toTarget: THREE.Vector3, duration = 0.9) {
    if (!camera || !controls) return;
    if (reducedMotion || duration <= 0) {
      camera.position.copy(toPosition);
      controls.target.copy(toTarget);
      controls.update();
      tween = null;
      return;
    }
    tween = {
      elapsed: 0,
      duration,
      fromPosition: camera.position.clone(),
      toPosition,
      fromTarget: controls.target.clone(),
      toTarget,
    };
  }

  function focus(id: string) {
    if (!current || !camera || !controls) return;
    const landmark = current.landmarks.find((item) => item.id === id);
    if (!landmark) return;
    const target = new THREE.Vector3(...(landmark.focus ?? landmark.position));
    const direction = new THREE.Vector3().subVectors(camera.position, controls.target);
    if (direction.lengthSq() < 0.001) direction.set(1, 0.9, 1);
    direction.normalize();
    if (direction.y < 0.18) direction.y = 0.22;
    direction.normalize();
    const distance = landmark.distance ?? 8;
    const toPosition = target.clone().addScaledVector(direction, distance);
    startTween(toPosition, target, 0.95);
  }

  function cameraDestination(config: {
    position: [number, number, number];
    target: [number, number, number];
  }) {
    const target = new THREE.Vector3(...config.target);
    const offset = new THREE.Vector3(...config.position).sub(target);
    if (offset.lengthSq() < 0.001) offset.set(1, 0.85, 1);
    offset.normalize();
    const aspect = canvas.clientWidth / Math.max(1, canvas.clientHeight);
    const verticalHalf = THREE.MathUtils.degToRad((camera?.fov ?? 34) / 2);
    const horizontalHalf = Math.atan(Math.tan(verticalHalf) * aspect);
    const distance =
      Math.max(
        FIT_HALF_WIDTH / Math.tan(horizontalHalf),
        FIT_HALF_HEIGHT / Math.tan(verticalHalf),
      ) * FIT_MARGIN;
    return {
      position: target.clone().addScaledVector(offset, distance),
      target,
    };
  }

  function frameCamera(config: {
    position: [number, number, number];
    target: [number, number, number];
  }) {
    if (!camera || !controls) return;
    const destination = cameraDestination(config);
    camera.position.copy(destination.position);
    controls.target.copy(destination.target);
    controls.update();
  }

  function resetView() {
    if (!camera || !controls) return;
    const config = current?.camera ?? DEFAULT_CAMERA;
    const destination = cameraDestination(config);
    startTween(destination.position, destination.target, 0.85);
    userMoved = false;
  }

  function pickLandmark(clientX: number, clientY: number) {
    if (!camera || !scene || hotspots.length === 0) return null;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;
    pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(hotspots, false);
    if (!hits.length) return null;
    return hits[0].object.userData.landmarkId as string;
  }

  function onPointerDown(event: PointerEvent) {
    if (event.button !== 0) return;
    pointerDown = { x: event.clientX, y: event.clientY };
    canvas.style.cursor = "grabbing";
    tween = null;
  }

  function onPointerUp(event: PointerEvent) {
    const start = pointerDown;
    pointerDown = null;
    canvas.style.cursor = "grab";
    if (!start) return;
    if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > 7) return;
    const id = pickLandmark(event.clientX, event.clientY);
    if (id) {
      focus(id);
      onSelect?.(id);
    } else {
      onSelect?.(null);
    }
  }

  function onPointerMove(event: PointerEvent) {
    if (pointerDown) return;
    canvas.style.cursor = pickLandmark(event.clientX, event.clientY) ? "pointer" : "grab";
  }

  function onPointerLeave() {
    if (!pointerDown) canvas.style.cursor = "grab";
  }

  function resize() {
    if (!renderer || !camera) return;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    if (!userMoved && current) frameCamera(current.camera ?? DEFAULT_CAMERA);
  }

  function renderLoop() {
    if (!renderer || !scene || !camera || !controls) return;
    timer.update();
    const dt = Math.min(0.05, timer.getDelta());
    const time = timer.getElapsed();

    const target = ATMOSPHERES[atmosphereMode];
    if (reducedMotion) {
      atmosphere.night = target.night;
      atmosphere.golden = target.golden;
    } else {
      const k = 1 - Math.exp(-dt * 2.4);
      atmosphere.night += (target.night - atmosphere.night) * k;
      atmosphere.golden += (target.golden - atmosphere.golden) * k;
    }
    applyAtmosphere();

    explode = reducedMotion
      ? explodedTarget
      : explode + (explodedTarget - explode) * (1 - Math.exp(-dt * 3.2));
    applyExplode();

    if (tween) {
      tween.elapsed += dt;
      const progress = Math.min(1, tween.elapsed / tween.duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      camera.position.lerpVectors(tween.fromPosition, tween.toPosition, eased);
      controls.target.lerpVectors(tween.fromTarget, tween.toTarget, eased);
      if (progress >= 1) tween = null;
    }

    controls.update();

    const animationTime = reducedMotion ? time * 0.14 : time;
    current?.tick(animationTime, dt, atmosphere);

    for (let index = 0; index < hotspots.length; index++) {
      const hotspot = hotspots[index];
      hotspot.quaternion.copy(camera.quaternion);
      const pulse = 1 + Math.sin(time * 1.8 + index * 1.7) * (reducedMotion ? 0.02 : 0.07);
      hotspot.scale.setScalar(pulse);
    }

    renderer.render(scene, camera);
  }

  async function init() {
    if (initPromise) return initPromise;
    initPromise = (async () => {
      try {
        const gpu = new THREE.WebGPURenderer({
          canvas,
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
          forceWebGL: requestedBackend === "webgl",
        });
        await gpu.init();
        if (disposed) {
          gpu.dispose();
          return;
        }
        renderer = gpu;
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, quality.dpr));
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.05;
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        if (quality.shadows) {
          renderer.shadowMap.enabled = true;
          renderer.shadowMap.type = THREE.PCFShadowMap;
        }

        const backend = (renderer as unknown as { backend?: { isWebGPUBackend?: boolean } })
          .backend;
        onRenderer?.(backend?.isWebGPUBackend ? "WebGPU" : "WebGL 2");

        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(34, 1, 0.1, 200);
        camera.position.set(...DEFAULT_CAMERA.position);
        camera.lookAt(...DEFAULT_CAMERA.target);

        controls = new OrbitControls(camera, canvas);
        controls.target.set(...DEFAULT_CAMERA.target);
        controls.enableDamping = true;
        controls.dampingFactor = 0.075;
        controls.enablePan = false;
        controls.minDistance = 4.5;
        controls.maxDistance = 38;
        controls.minPolarAngle = 0.2;
        controls.maxPolarAngle = Math.PI * 0.485;
        controls.autoRotateSpeed = 0.55;
        controls.autoRotate = autoRotate;
        controls.addEventListener("start", () => {
          tween = null;
          userMoved = true;
        });
        controls.update();

        hemi = new THREE.HemisphereLight(DAY_SKY, DAY_GROUND, 1.75);
        scene.add(hemi);
        sun = new THREE.DirectionalLight(DAY_SUN, 2.8);
        sun.position.set(9, 15, 10);
        sun.castShadow = quality.shadows;
        if (quality.shadows) {
          sun.shadow.mapSize.set(
            quality.tier === "high" ? 2048 : 1024,
            quality.tier === "high" ? 2048 : 1024,
          );
          sun.shadow.camera.left = -13;
          sun.shadow.camera.right = 13;
          sun.shadow.camera.top = 13;
          sun.shadow.camera.bottom = -13;
          sun.shadow.camera.near = 1;
          sun.shadow.camera.far = 42;
          sun.shadow.bias = -0.0006;
          sun.shadow.normalBias = 0.025;
        }
        scene.add(sun);
        fill = new THREE.DirectionalLight(0xbcd7ff, 0.42);
        fill.position.set(-8, 7, -7);
        scene.add(fill);

        groundShadow = createGroundShadow(17, -2.62);
        (groundShadow.material as THREE.MeshBasicMaterial).opacity = 0.42;
        scene.add(groundShadow);

        hotspotGeometry = new THREE.PlaneGeometry(0.6, 0.6);
        hotspotMaterial = new THREE.MeshBasicMaterial({
          map: createHotspotTexture(),
          transparent: true,
          depthWrite: false,
          depthTest: false,
          toneMapped: false,
        });

        canvas.addEventListener("pointerdown", onPointerDown);
        canvas.addEventListener("pointerup", onPointerUp);
        canvas.addEventListener("pointermove", onPointerMove);
        canvas.addEventListener("pointerleave", onPointerLeave);
        canvas.style.cursor = "grab";
        canvas.style.touchAction = "none";

        const observer = new ResizeObserver(resize);
        observer.observe(canvas);
        window.addEventListener("resize", resize);
        resize();

        renderer.setAnimationLoop(renderLoop);

        (canvas as HTMLCanvasElement & { __dioramaObserver?: ResizeObserver }).__dioramaObserver =
          observer;
      } catch (error) {
        const message = error instanceof Error ? error.message : "The 3D renderer could not start.";
        onError?.(message);
        throw error;
      }
    })();
    return initPromise;
  }

  async function load(slug: DioramaSlug) {
    const token = ++loadToken;
    let loaded: SceneModule;
    try {
      loaded = await LOADERS[slug]();
    } catch (error) {
      onError?.(error instanceof Error ? error.message : "This diorama could not be loaded.");
      return;
    }
    if (disposed || token !== loadToken || !scene || !camera || !controls) return;

    if (current) {
      scene.remove(current.root);
      disposeObject(current.root);
      current = null;
    }
    for (const hotspot of hotspots) {
      scene.remove(hotspot);
    }
    hotspots = [];
    baseSlabs = [];
    baseSlabY = [];
    tween = null;
    explode = 0;
    explodedTarget = 0;

    const build = loaded.build({
      quality,
      reducedMotion,
      rng: mulberry32(SEEDS[slug]),
    });
    current = build;
    scene.add(build.root);
    build.root.updateMatrixWorld(true);

    const slabGroup =
      (build.base.children.find((child) => child.type === "Group") as THREE.Group | undefined) ??
      build.base;
    baseSlabs = slabGroup.children.filter(
      (child): child is THREE.Mesh => (child as THREE.Mesh).isMesh,
    );
    baseSlabY = baseSlabs.map((slab) => slab.position.y);

    if (hotspotGeometry && hotspotMaterial) {
      hotspotMaterial.color.set(DIORAMA_BY_SLUG[slug].accent);
      for (const landmark of build.landmarks) {
        const hotspot = new THREE.Mesh(hotspotGeometry, hotspotMaterial);
        hotspot.position.set(...landmark.position);
        hotspot.userData.landmarkId = landmark.id;
        hotspot.userData.baseY = landmark.position[1];
        hotspot.renderOrder = 30;
        scene.add(hotspot);
        hotspots.push(hotspot);
      }
    }

    const config = build.camera ?? DEFAULT_CAMERA;
    userMoved = false;
    frameCamera(config);
    onLandmarks?.(build.landmarks);
    onSelect?.(null);
  }

  function setAtmosphere(mode: TimeMode) {
    atmosphereMode = mode;
  }

  function setExploded(value: boolean) {
    explodedTarget = value ? 1 : 0;
  }

  function setAutoRotate(value: boolean) {
    autoRotate = value && !reducedMotion;
    if (controls) controls.autoRotate = autoRotate;
  }

  function dispose() {
    disposed = true;
    loadToken++;
    if (renderer) {
      renderer.setAnimationLoop(null);
    }
    const observer = (canvas as HTMLCanvasElement & { __dioramaObserver?: ResizeObserver })
      .__dioramaObserver;
    observer?.disconnect();
    window.removeEventListener("resize", resize);
    canvas.removeEventListener("pointerdown", onPointerDown);
    canvas.removeEventListener("pointerup", onPointerUp);
    canvas.removeEventListener("pointermove", onPointerMove);
    canvas.removeEventListener("pointerleave", onPointerLeave);
    if (scene) {
      for (const hotspot of hotspots) scene.remove(hotspot);
      if (current) {
        scene.remove(current.root);
        disposeObject(current.root);
      }
      if (groundShadow) {
        scene.remove(groundShadow);
        groundShadow.geometry.dispose();
        (groundShadow.material as THREE.MeshBasicMaterial).dispose();
        groundShadow = null;
      }
      if (sun) scene.remove(sun);
      if (fill) scene.remove(fill);
      if (hemi) scene.remove(hemi);
    }
    hotspots = [];
    current = null;
    hotspotGeometry?.dispose();
    hotspotMaterial?.dispose();
    controls?.dispose();
    renderer?.dispose();
    renderer = null;
    scene = null;
    camera = null;
    controls = null;
  }

  return {
    init,
    load,
    setAtmosphere,
    setExploded,
    setAutoRotate,
    focus,
    resetView,
    dispose,
  };
}
