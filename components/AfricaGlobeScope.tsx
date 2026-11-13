"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
import { ArrowLeft, GlobeHemisphereEast, MapPin, Mountains } from "@phosphor-icons/react";
import boundaries from "../public/data/provinces.json";
import { cities } from "../lib/data";
import { DIORAMAS } from "../lib/diorama/content";
import CartographicLoader from "./CartographicLoader";

const GLOBE_RADIUS = 2.15;

// Rough bounding boxes for stylized point-cloud continents (lon, lat)
// Only Africa is marked active; all other regions render subdued.
const CONTINENT_MASKS: Array<{
  name: string;
  active: boolean;
  boxes: Array<[number, number, number, number]>;
}> = [
  {
    name: "Africa",
    active: true,
    boxes: [
      [-17, 51, 14, 37], // North & West Africa bulge
      [-12, 43, -5, 14], // Central Africa
      [10, 41, -18, -5], // Southern-Central Africa
      [15, 33, -35, -18], // Southern Africa
      [43, 50, -25, -12], // Madagascar
    ],
  },
  {
    name: "Eurasia",
    active: false,
    boxes: [
      [-10, 40, 36, 68],
      [40, 140, 22, 70],
      [70, 105, 8, 25],
      [98, 128, -5, 22],
    ],
  },
  {
    name: "Americas",
    active: false,
    boxes: [
      [-160, -55, 45, 70],
      [-125, -75, 25, 48],
      [-105, -80, 10, 25],
      [-80, -35, -15, 12],
      [-74, -52, -52, -15],
    ],
  },
  {
    name: "Australia",
    active: false,
    boxes: [[113, 154, -39, -11]],
  },
];

function lonLatToVec3(lon: number, lat: number, radius: number): THREE.Vector3 {
  const phi = THREE.MathUtils.degToRad(90 - lat);
  const theta = THREE.MathUtils.degToRad(lon + 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  );
}

function pointInContinent(lon: number, lat: number): "active" | "inactive" | null {
  for (const continent of CONTINENT_MASKS) {
    for (const [minLon, maxLon, minLat, maxLat] of continent.boxes) {
      if (lon >= minLon && lon <= maxLon && lat >= minLat && lat <= maxLat) {
        return continent.active ? "active" : "inactive";
      }
    }
  }
  return null;
}

type ProvinceFeature = {
  code: string;
  name: string;
  rings: Array<Array<[number, number]>>;
  centroid: [number, number];
};

function parseProvinces(): ProvinceFeature[] {
  const features = (
    boundaries as {
      features: Array<{
        geometry: { type: string; coordinates: number[][][] | number[][][][] };
        properties: { shapeISO: string; shapeName: string };
      }>;
    }
  ).features;

  return features.map((f) => {
    const rawRings =
      f.geometry.type === "MultiPolygon"
        ? (f.geometry.coordinates as number[][][][]).map((poly) => poly[0])
        : [(f.geometry.coordinates as number[][][])[0]];

    const rings = rawRings.map((ring) =>
      ring
        .filter((_, idx) => idx % 3 === 0 || idx === ring.length - 1)
        .map(([lon, lat]) => [lon, lat] as [number, number]),
    );

    const pts = rings[0] ?? [];
    const avg = pts.reduce((acc, [lon, lat]) => [acc[0] + lon, acc[1] + lat], [0, 0]);
    const count = Math.max(1, pts.length);
    return {
      code: f.properties.shapeISO,
      name: f.properties.shapeName,
      rings,
      centroid: [avg[0] / count, avg[1] / count],
    };
  });
}

function FresnelGlobeShell({ reduced }: { reduced: boolean }) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uColor: { value: new THREE.Color("#22d3ee") },
          uInner: { value: new THREE.Color("#07182c") },
        },
        vertexShader: `
          varying vec3 vNormal;
          varying vec3 vViewDir;
          void main() {
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            vNormal = normalize(normalMatrix * normal);
            vViewDir = normalize(-mvPosition.xyz);
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          uniform vec3 uColor;
          uniform vec3 uInner;
          varying vec3 vNormal;
          varying vec3 vViewDir;
          void main() {
            float fresnel = pow(1.0 - max(dot(vNormal, vViewDir), 0.0), 2.8);
            vec3 col = mix(uInner, uColor, fresnel * 0.92);
            gl_FragColor = vec4(col, 0.88);
          }
        `,
        transparent: true,
      }),
    [],
  );

  const ringRef = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (!reduced && ringRef.current) {
      ringRef.current.rotation.z += delta * 0.08;
    }
  });

  return (
    <group>
      <mesh material={material}>
        <sphereGeometry args={[GLOBE_RADIUS, 48, 48]} />
      </mesh>
      {/* Subtle outer atmospheric halo */}
      <mesh>
        <sphereGeometry args={[GLOBE_RADIUS * 1.04, 48, 48]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.08} side={THREE.BackSide} />
      </mesh>
      {/* Orbital rings matching reference */}
      <mesh ref={ringRef} rotation={[Math.PI * 0.42, 0.18, 0]}>
        <ringGeometry args={[GLOBE_RADIUS * 1.18, GLOBE_RADIUS * 1.192, 96]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.34} side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation={[-Math.PI * 0.36, -0.22, 0.3]}>
        <ringGeometry args={[GLOBE_RADIUS * 1.25, GLOBE_RADIUS * 1.258, 96]} />
        <meshBasicMaterial color="#0ea5e9" transparent opacity={0.18} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function ContinentPointCloud() {
  const { activeGeo, inactiveGeo } = useMemo(() => {
    const activePositions: number[] = [];
    const inactivePositions: number[] = [];

    for (let lat = -60; lat <= 72; lat += 2.6) {
      const stepLon = Math.max(2.6, 2.6 / Math.max(0.25, Math.cos(THREE.MathUtils.degToRad(lat))));
      for (let lon = -180; lon < 180; lon += stepLon) {
        const status = pointInContinent(lon, lat);
        if (!status) continue;
        const p = lonLatToVec3(lon, lat, GLOBE_RADIUS * 1.007);
        if (status === "active") activePositions.push(p.x, p.y, p.z);
        else inactivePositions.push(p.x, p.y, p.z);
      }
    }

    const a = new THREE.BufferGeometry();
    a.setAttribute("position", new THREE.Float32BufferAttribute(activePositions, 3));
    const i = new THREE.BufferGeometry();
    i.setAttribute("position", new THREE.Float32BufferAttribute(inactivePositions, 3));
    return { activeGeo: a, inactiveGeo: i };
  }, []);

  return (
    <group>
      <points geometry={inactiveGeo}>
        <pointsMaterial color="#1d4d73" size={0.022} transparent opacity={0.38} sizeAttenuation />
      </points>
      <points geometry={activeGeo}>
        <pointsMaterial color="#38bdf8" size={0.032} transparent opacity={0.92} sizeAttenuation />
      </points>
    </group>
  );
}

function GlobeSouthAfricaLayer({
  provinces,
  hoveredCode,
  onHover,
  onSelectProvince,
}: {
  provinces: ProvinceFeature[];
  hoveredCode: string | null;
  onHover: (code: string | null) => void;
  onSelectProvince: (code: string) => void;
}) {
  const borderObjects = useMemo(() => {
    return provinces.map((province) => {
      const lines = province.rings.map((ring) => {
        const pts = ring.map(([lon, lat]) => lonLatToVec3(lon, lat, GLOBE_RADIUS * 1.018));
        return new THREE.BufferGeometry().setFromPoints(pts);
      });
      const pinPos = lonLatToVec3(province.centroid[0], province.centroid[1], GLOBE_RADIUS * 1.03);
      return { province, lines, pinPos };
    });
  }, [provinces]);

  return (
    <group>
      {borderObjects.map(({ province, lines, pinPos }) => {
        const isHovered = hoveredCode === province.code;
        return (
          <group key={province.code}>
            {lines.map((geom, idx) => (
              <lineLoop key={idx} geometry={geom}>
                <lineBasicMaterial
                  color={isHovered ? "#fef08a" : "#7dd3fc"}
                  transparent
                  opacity={isHovered ? 1 : 0.78}
                />
              </lineLoop>
            ))}
            <mesh
              position={pinPos}
              onPointerOver={(e) => {
                e.stopPropagation();
                onHover(province.code);
              }}
              onPointerOut={() => onHover(null)}
              onClick={(e) => {
                e.stopPropagation();
                onSelectProvince(province.code);
              }}
            >
              <sphereGeometry args={[isHovered ? 0.042 : 0.028, 12, 12]} />
              <meshBasicMaterial color={isHovered ? "#fbbf24" : "#38bdf8"} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function ProvinceExtrudedMap({
  provinces,
  selectedCode,
  onSelectProvince,
  onSelectCity,
  onSelectDiorama,
}: {
  provinces: ProvinceFeature[];
  selectedCode: string;
  onSelectProvince: (code: string) => void;
  onSelectCity: (citySlug: string) => void;
  onSelectDiorama: (sceneId: string) => void;
}) {
  const activeProvince = provinces.find((p) => p.code === selectedCode) ?? provinces[0];
  const center = activeProvince?.centroid ?? [24.6, -29.2];

  const provinceMeshes = useMemo(() => {
    return provinces.map((province) => {
      const isSelected = province.code === selectedCode;
      const shapes = province.rings
        .filter((ring) => ring.length >= 3)
        .map((ring) => {
          const shape = new THREE.Shape();
          ring.forEach(([lon, lat], idx) => {
            const x = (lon - center[0]) * 0.9;
            const y = (lat - center[1]) * 0.9;
            if (idx === 0) shape.moveTo(x, y);
            else shape.lineTo(x, y);
          });
          return shape;
        });

      const geometry = new THREE.ExtrudeGeometry(shapes, {
        depth: isSelected ? 0.36 : 0.14,
        bevelEnabled: true,
        bevelThickness: 0.025,
        bevelSize: 0.02,
        bevelSegments: 2,
      });
      geometry.rotateX(-Math.PI / 2);

      const borderGeos = province.rings.map((ring) => {
        const y = isSelected ? 0.39 : 0.17;
        const pts = ring.map(
          ([lon, lat]) => new THREE.Vector3((lon - center[0]) * 0.9, y, -(lat - center[1]) * 0.9),
        );
        return new THREE.BufferGeometry().setFromPoints(pts);
      });

      return { province, geometry, borderGeos, isSelected };
    });
  }, [provinces, selectedCode, center]);

  const provinceCities = useMemo(
    () => cities.filter((c) => c.provinceCode === selectedCode),
    [selectedCode],
  );

  const provinceDioramas = useMemo(() => {
    const names = new Set(provinceCities.map((c) => c.province.toLowerCase()));
    return DIORAMAS.filter((s) => names.has(s.province.toLowerCase()));
  }, [provinceCities]);

  return (
    <group>
      {provinceMeshes.map(({ province, geometry, borderGeos, isSelected }) => (
        <group key={province.code}>
          <mesh
            geometry={geometry}
            onClick={(e) => {
              e.stopPropagation();
              onSelectProvince(province.code);
            }}
          >
            <meshStandardMaterial
              color={isSelected ? "#0ea5e9" : "#0b2239"}
              emissive={isSelected ? "#0369a1" : "#04101f"}
              emissiveIntensity={isSelected ? 0.55 : 0.25}
              roughness={0.35}
              metalness={0.45}
            />
          </mesh>
          {borderGeos.map((bg, i) => (
            <lineLoop key={i} geometry={bg}>
              <lineBasicMaterial
                color={isSelected ? "#fde047" : "#38bdf8"}
                transparent
                opacity={isSelected ? 0.95 : 0.4}
              />
            </lineLoop>
          ))}
        </group>
      ))}

      {/* City pins inside the active province */}
      {provinceCities.map((city, idx) => {
        const angle = (idx / Math.max(1, provinceCities.length)) * Math.PI * 1.4 - 0.5;
        const x = Math.sin(angle) * 0.85;
        const z = Math.cos(angle) * 0.65;
        return (
          <group key={city.slug} position={[x, 0.48, z]}>
            <mesh onClick={() => onSelectCity(city.slug)}>
              <cylinderGeometry args={[0.04, 0.04, 0.26, 12]} />
              <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={0.6} />
            </mesh>
            <Html position={[0, 0.28, 0]} center distanceFactor={6}>
              <button
                type="button"
                className="globe-pin-btn"
                onClick={() => onSelectCity(city.slug)}
              >
                <MapPin size={12} weight="fill" />
                <span>{city.name}</span>
              </button>
            </Html>
          </group>
        );
      })}

      {/* Diorama pins if available for this province */}
      {provinceDioramas.slice(0, 2).map((scene, idx) => (
        <group key={scene.slug} position={[-0.75 + idx * 1.5, 0.48, -0.55]}>
          <Html center distanceFactor={6}>
            <button
              type="button"
              className="globe-pin-btn is-diorama"
              onClick={() => onSelectDiorama(scene.slug)}
            >
              <Mountains size={12} weight="fill" />
              <span>{scene.name}</span>
            </button>
          </Html>
        </group>
      ))}
    </group>
  );
}

function CameraRig({ mode }: { mode: "globe" | "province" }) {
  const { camera } = useThree();
  useEffect(() => {
    if (mode === "globe") {
      // Aim directly at Africa / South Africa
      const target = lonLatToVec3(22, -16, 5.2);
      camera.position.copy(target);
      camera.lookAt(0, 0, 0);
    } else {
      camera.position.set(0, 4.2, 4.4);
      camera.lookAt(0, 0, 0);
    }
  }, [mode, camera]);
  return null;
}

function FrameReadySignal({ onReady }: { onReady: () => void }) {
  const fired = useRef(false);
  useFrame(() => {
    if (!fired.current) {
      fired.current = true;
      onReady();
    }
  });
  return null;
}

export default function AfricaGlobeScope({
  initialProvince,
  onOpenCityLandmarks,
  onOpenDiorama,
}: {
  initialProvince?: string;
  onOpenCityLandmarks: (citySlug: string) => void;
  onOpenDiorama: (sceneId: string) => void;
}) {
  const provinces = useMemo(() => parseProvinces(), []);
  const [viewMode, setViewMode] = useState<"globe" | "province">(
    initialProvince ? "province" : "globe",
  );
  const [selectedCode, setSelectedCode] = useState<string>(initialProvince || "WC");
  const [hoveredCode, setHoveredCode] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  const activeProvince = provinces.find((p) => p.code === selectedCode) ?? provinces[0];
  const hoveredProvince = hoveredCode ? provinces.find((p) => p.code === hoveredCode) : null;

  return (
    <div className="globe-scope-wrap">
      {!ready ? (
        <CartographicLoader
          variant="globe"
          title={
            viewMode === "globe" ? "Africa & South Africa" : (activeProvince?.name ?? "Province")
          }
          subtitle="Only Africa active · 9 provinces"
          coordinates="22.9375° E · 30.5595° S"
        />
      ) : null}

      <div className="globe-hud-top">
        <div className="globe-hud-title">
          <GlobeHemisphereEast size={18} weight="regular" aria-hidden="true" />
          <div>
            <strong>
              {viewMode === "globe"
                ? "Africa · South Africa"
                : `${activeProvince?.name ?? ""} Province`}
            </strong>
            <span>
              {viewMode === "globe"
                ? hoveredProvince
                  ? `Select ${hoveredProvince.name} to drill down`
                  : "Only Africa active · Select any South African province"
                : "Select a city or landscape pin to inspect in 3D"}
            </span>
          </div>
        </div>

        {viewMode === "province" ? (
          <button type="button" className="globe-back-btn" onClick={() => setViewMode("globe")}>
            <ArrowLeft size={16} aria-hidden="true" />
            <span>Africa Globe</span>
          </button>
        ) : null}
      </div>

      <Canvas
        dpr={[1, 2]}
        camera={{ position: [1.8, -1.2, 4.7], fov: 42 }}
        className="globe-canvas"
      >
        <color attach="background" args={["#040b16"]} />
        <ambientLight intensity={0.65} />
        <directionalLight position={[6, 8, 5]} intensity={1.1} color="#bae6fd" />
        <pointLight position={[-4, -3, -4]} intensity={0.45} color="#38bdf8" />

        <CameraRig mode={viewMode} />
        <FrameReadySignal onReady={() => setReady(true)} />

        {viewMode === "globe" ? (
          <group>
            <FresnelGlobeShell reduced={reduced} />
            <ContinentPointCloud />
            <GlobeSouthAfricaLayer
              provinces={provinces}
              hoveredCode={hoveredCode}
              onHover={setHoveredCode}
              onSelectProvince={(code) => {
                setSelectedCode(code);
                setViewMode("province");
              }}
            />
          </group>
        ) : (
          <ProvinceExtrudedMap
            provinces={provinces}
            selectedCode={selectedCode}
            onSelectProvince={(code) => setSelectedCode(code)}
            onSelectCity={onOpenCityLandmarks}
            onSelectDiorama={onOpenDiorama}
          />
        )}

        <OrbitControls
          enablePan={false}
          minDistance={viewMode === "globe" ? 3.2 : 2.6}
          maxDistance={viewMode === "globe" ? 7.5 : 8.5}
          enableDamping
          dampingFactor={0.07}
        />
      </Canvas>

      {/* Bottom province quick-jump bar */}
      <div className="globe-province-strip" role="navigation" aria-label="South African provinces">
        {provinces.map((p) => {
          const active = viewMode === "province" && selectedCode === p.code;
          return (
            <button
              key={p.code}
              type="button"
              className={`globe-province-pill${active ? " is-active" : ""}`}
              onClick={() => {
                setSelectedCode(p.code);
                setViewMode("province");
              }}
            >
              {p.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
