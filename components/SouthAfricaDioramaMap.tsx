"use client";

import { useRef, useState, useMemo } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { benchoAudio } from "../lib/bencho-audio";
import boundaries from "../public/data/provinces.json";

// Province color mapping matching Image 3 (low-poly clay diorama aesthetic)
const PROVINCE_THEMES: Record<
  string,
  { name: string; color: string; elevation: number; pinOffset: [number, number, number] }
> = {
  LP: {
    name: "LIMPOPO",
    color: "#7da85b", // Olive forest green
    elevation: 0.38,
    pinOffset: [2.0, 0.75, -2.6],
  },
  MP: {
    name: "MPUMALANGA",
    color: "#8d5838", // Chocolate limestone
    elevation: 0.36,
    pinOffset: [2.6, 0.72, -1.2],
  },
  GT: {
    name: "GAUTENG",
    color: "#dfb458", // Warm sand ochre
    elevation: 0.42,
    pinOffset: [1.5, 0.8, -1.0],
  },
  NW: {
    name: "NORTH WEST",
    color: "#8cb964", // Lime sage
    elevation: 0.35,
    pinOffset: [0.3, 0.68, -1.4],
  },
  FS: {
    name: "FREE STATE",
    color: "#e5aa42", // Warm golden amber
    elevation: 0.34,
    pinOffset: [0.8, 0.68, 0.1],
  },
  KZ: {
    name: "KWAZULU-NATAL",
    color: "#cca043", // Warm golden ochre
    elevation: 0.36,
    pinOffset: [2.8, 0.72, 0.4],
  },
  EC: {
    name: "EASTERN CAPE",
    color: "#78a867", // Sage moss green
    elevation: 0.35,
    pinOffset: [1.2, 0.68, 1.8],
  },
  WC: {
    name: "WESTERN CAPE",
    color: "#845b41", // Limestone brown
    elevation: 0.38,
    pinOffset: [-1.4, 0.74, 1.9],
  },
  NC: {
    name: "NORTHERN CAPE",
    color: "#6c9862", // Sage olive green
    elevation: 0.32,
    pinOffset: [-1.8, 0.65, 0.2],
  },
};

// Coordinate projection helper
function projectCoords(lon: number, lat: number): [number, number] {
  const x = (lon - 24.6) * 0.42;
  const z = -(lat + 29.2) * 0.42;
  return [x, z];
}

// Low-poly faceted mountain peak component
function LowPolyMountain({
  position,
  scale = 0.28,
}: {
  position: [number, number, number];
  scale?: number;
}) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.4, 0]} castShadow>
        <coneGeometry args={[0.5, 0.8, 5]} />
        <meshStandardMaterial color="#888985" roughness={0.92} flatShading />
      </mesh>
      <mesh position={[0, 0.65, 0]}>
        <coneGeometry args={[0.22, 0.32, 5]} />
        <meshStandardMaterial color="#e8eaed" roughness={0.85} flatShading />
      </mesh>
    </group>
  );
}

// Low-poly cute tree component
function LowPolyTree({
  position,
  scale = 0.22,
}: {
  position: [number, number, number];
  scale?: number;
}) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.04, 0.06, 0.4, 6]} />
        <meshStandardMaterial color="#533c2a" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.55, 0]} castShadow>
        <dodecahedronGeometry args={[0.26, 0]} />
        <meshStandardMaterial color="#477a3c" roughness={0.88} flatShading />
      </mesh>
    </group>
  );
}

// Create high-resolution Canvas2D texture for speech bubble signposts (100% offline, zero network requests, zero CSP issues)
function createSignTexture(text: string, isSelected: boolean) {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = 384;
  canvas.height = 96;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  // Background rounded capsule
  ctx.fillStyle = isSelected ? "#7c5cfc" : "#ffffff";
  ctx.beginPath();
  if (typeof ctx.roundRect === "function") {
    ctx.roundRect(4, 4, 376, 88, 28);
  } else {
    ctx.rect(4, 4, 376, 88);
  }
  ctx.fill();

  // Subtle border
  ctx.strokeStyle = isSelected ? "#9374ff" : "rgba(0, 0, 0, 0.14)";
  ctx.lineWidth = 4;
  ctx.stroke();

  // Crisp bold uppercase label
  ctx.fillStyle = isSelected ? "#ffffff" : "#1a1c22";
  ctx.font = "bold 32px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 192, 48);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  return texture;
}

// 3D speech bubble signpost pin matching Image 3
function ProvinceSignPin({
  label,
  position,
  isSelected,
  onClick,
}: {
  label: string;
  position: [number, number, number];
  isSelected: boolean;
  onClick: () => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const texture = useMemo(() => createSignTexture(label, isSelected), [label, isSelected]);

  useFrame((state) => {
    if (!groupRef.current) return;
    const time = state.clock.getElapsedTime();
    // Gentle floating bob
    groupRef.current.position.y = position[1] + Math.sin(time * 2.0 + position[0]) * 0.025;
  });

  const width = Math.max(1.15, label.length * 0.115);

  return (
    <group
      ref={groupRef}
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      {/* Signpost stem */}
      <mesh position={[0, -0.22, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 0.44, 8]} />
        <meshStandardMaterial color="#ffffff" roughness={0.4} />
      </mesh>

      {/* Pill with embedded crisp text texture */}
      {texture && (
        <mesh position={[0, 0.06, 0]}>
          <planeGeometry args={[width, 0.34]} />
          <meshBasicMaterial map={texture} transparent side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
}

// Individual extruded province piece
function ProvincePiece({
  iso,
  feature,
  isSelected,
  onSelect,
}: {
  iso: string;
  feature: (typeof boundaries.features)[0];
  isSelected: boolean;
  onSelect: () => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const theme = PROVINCE_THEMES[iso] || {
    name: feature.properties.shapeName.toUpperCase(),
    color: "#7da85b",
    elevation: 0.35,
    pinOffset: [0, 0.7, 0],
  };

  // Convert GeoJSON polygon to THREE.Shape
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    const geom = feature.geometry;
    let coords: number[][] = [];

    if (geom.type === "Polygon") {
      coords = (geom.coordinates as unknown as number[][][])[0] || [];
    } else if (geom.type === "MultiPolygon") {
      let maxLen = 0;
      for (const poly of geom.coordinates as unknown as number[][][][]) {
        const ring = poly[0];
        if (ring && ring.length > maxLen) {
          maxLen = ring.length;
          coords = ring;
        }
      }
    }

    if (!coords || coords.length === 0) return null;

    coords.forEach(([lon, lat], i) => {
      const [px, pz] = projectCoords(lon, lat);
      // In Three.js shape coords: X and Y (where Y corresponds to Z in 3D after rotation)
      if (i === 0) s.moveTo(px, -pz);
      else s.lineTo(px, -pz);
    });
    s.closePath();
    return s;
  }, [feature]);

  // Extrude configuration for puzzle block thickness
  const extrudeSettings = useMemo(
    () => ({
      depth: theme.elevation,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.025,
      bevelThickness: 0.025,
    }),
    [theme.elevation],
  );

  // Smooth hover/select lift animation
  useFrame(() => {
    if (!groupRef.current) return;
    const targetY = isSelected ? 0.22 : hovered ? 0.09 : 0;
    groupRef.current.position.y += (targetY - groupRef.current.position.y) * 0.18;
  });

  if (!shape) return null;

  return (
    <group
      ref={groupRef}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
      onClick={(e) => {
        e.stopPropagation();
        benchoAudio.playTap(900);
        onSelect();
      }}
    >
      {/* Extruded 3D Province Block */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} castShadow receiveShadow>
        <extrudeGeometry args={[shape, extrudeSettings]} />
        <meshStandardMaterial
          color={hovered ? "#ffdf78" : theme.color}
          roughness={0.88}
          metalness={0.02}
        />
      </mesh>

      {/* Decorative Low-poly Mountains & Trees on province surface */}
      <LowPolyMountain
        position={[theme.pinOffset[0] - 0.45, theme.elevation + 0.05, theme.pinOffset[2] - 0.35]}
      />
      <LowPolyTree
        position={[theme.pinOffset[0] + 0.38, theme.elevation + 0.02, theme.pinOffset[2] - 0.25]}
      />
      <LowPolyTree
        position={[theme.pinOffset[0] - 0.32, theme.elevation + 0.02, theme.pinOffset[2] + 0.32]}
      />

      {/* 3D Signpost Pin */}
      <ProvinceSignPin
        label={theme.name}
        position={[theme.pinOffset[0], theme.elevation + 0.45, theme.pinOffset[2]]}
        isSelected={isSelected}
        onClick={onSelect}
      />
    </group>
  );
}

export default function SouthAfricaDioramaMap({
  selectedProvince,
  onSelectProvince,
  className = "",
}: {
  selectedProvince?: string | null;
  onSelectProvince?: (name: string, iso: string) => void;
  className?: string;
}) {
  return (
    <div
      className={`citylit-diorama-map-wrapper ${className}`}
      role="region"
      aria-label="3D Low-Poly South Africa Provinces Map Puzzle"
    >
      <div className="citylit-diorama-map-canvas">
        <Canvas
          shadows
          camera={{ position: [0, 8.5, 7.8], fov: 42 }}
          gl={{ antialias: true, alpha: true }}
        >
          <ambientLight intensity={1.4} />
          <directionalLight
            position={[5, 12, 6]}
            intensity={2.2}
            castShadow
            shadow-mapSize={[1024, 1024]}
            shadow-bias={-0.0001}
          />
          <directionalLight position={[-6, 8, -4]} intensity={0.65} color="#e6f0ff" />

          {/* Tabletop Studio Surface */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
            <planeGeometry args={[26, 26]} />
            <meshStandardMaterial color="#1a1c22" roughness={0.96} />
          </mesh>

          {/* 9 Province Puzzle Pieces */}
          <group position={[0, 0, 0]}>
            {boundaries.features.map((feat) => {
              const iso = feat.properties.shapeISO;
              const name = feat.properties.shapeName;
              return (
                <ProvincePiece
                  key={iso}
                  iso={iso}
                  feature={feat}
                  isSelected={selectedProvince === name || selectedProvince === iso}
                  onSelect={() => onSelectProvince?.(name, iso)}
                />
              );
            })}
          </group>

          <OrbitControls
            enableZoom={true}
            minDistance={4.5}
            maxDistance={14}
            maxPolarAngle={Math.PI / 2.1}
            enablePan={false}
          />
        </Canvas>
      </div>

      {/* Floating Interactive Legend & Quick Reset */}
      <div className="citylit-diorama-map-controls">
        <span className="diorama-map-hint">
          {selectedProvince ? `Province: ${selectedProvince}` : "Tap any province piece to explore"}
        </span>
        {selectedProvince && (
          <button
            type="button"
            className="diorama-map-reset-btn"
            onClick={() => {
              benchoAudio.playTap(600);
              onSelectProvince?.("All provinces", "ALL");
            }}
          >
            Show all
          </button>
        )}
      </div>
    </div>
  );
}
