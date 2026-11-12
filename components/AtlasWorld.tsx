"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

/**
 * Atmospheric studio environment for Citylit 3D dioramas.
 * Smooth, deep ambient vignette, soft ground contact shadow,
 * and gentle drifting ember sparks — no harsh wireframe grids.
 */

const skyVertex = `
  varying vec3 vDirection;
  void main() {
    vDirection = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const skyFragment = `
  uniform float uTime;
  uniform float uNight;
  varying vec3 vDirection;
  
  float hash(vec3 p) {
    p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3));
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }
  
  void main() {
    vec3 dir = normalize(vDirection);
    float horizon = smoothstep(-0.25, 0.75, dir.y);
    
    // Day palette: soft warm dawn/day atmosphere
    vec3 dayHorizon = vec3(0.88, 0.86, 0.83);
    vec3 dayZenith = vec3(0.58, 0.68, 0.82);
    vec3 daySky = mix(dayHorizon, dayZenith, horizon);
    
    // Night palette: deep studio indigo/slate with subtle warm horizon glow
    vec3 nightHorizon = vec3(0.08, 0.08, 0.12);
    vec3 nightZenith = vec3(0.035, 0.038, 0.058);
    vec3 nightSky = mix(nightHorizon, nightZenith, horizon);
    
    vec3 color = mix(daySky, nightSky, uNight);
    
    // Subtle star dust in night mode
    float starDensity = step(0.9982, hash(floor(dir * 280.0)));
    float starGlow = smoothstep(0.05, 0.85, dir.y) * uNight;
    color += vec3(0.85, 0.88, 0.98) * starDensity * starGlow * (0.6 + 0.4 * sin(uTime * 1.5 + dir.x * 14.0));
    
    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

const groundVertex = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const groundFragment = `
  uniform float uNight;
  varying vec2 vUv;
  void main() {
    vec2 center = vUv - 0.5;
    float dist = length(center) * 2.0;
    
    // Soft radial contact shadow directly beneath pedestal
    float shadowCore = smoothstep(0.85, 0.0, dist);
    float shadowAura = smoothstep(1.3, 0.2, dist) * 0.35;
    float shadow = max(shadowCore * 0.65, shadowAura);
    
    // Ground tone blends with sky
    vec3 dayGround = vec3(0.08, 0.08, 0.09);
    vec3 nightGround = vec3(0.0, 0.0, 0.0);
    vec3 groundColor = mix(dayGround, nightGround, uNight);
    
    float alpha = shadow * mix(0.48, 0.72, uNight);
    gl_FragColor = vec4(groundColor, alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

const sparkVertex = `
  uniform float uTime;
  attribute float aPhase;
  varying float vGlow;
  void main() {
    vec3 p = position;
    p.x += sin(uTime * 0.22 + aPhase * 6.283) * 0.15;
    p.y += sin(uTime * 0.38 + aPhase * 14.0) * 0.18;
    p.z += cos(uTime * 0.18 + aPhase * 6.283) * 0.15;
    vec4 viewPosition = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * viewPosition;
    gl_PointSize = clamp(3.2 * (4.0 / -viewPosition.z), 1.2, 5.0);
    vGlow = 0.4 + 0.6 * pow(sin(uTime * 1.2 + aPhase * 24.0) * 0.5 + 0.5, 2.0);
  }
`;

const sparkFragment = `
  uniform vec3 uAccent;
  uniform float uNight;
  varying float vGlow;
  void main() {
    float radius = length(gl_PointCoord - 0.5);
    if (radius > 0.5) discard;
    float core = exp(-radius * radius * 14.0);
    float alpha = core * vGlow * (0.35 + uNight * 0.35);
    vec3 tint = mix(uAccent, vec3(0.96, 0.92, 0.82), core * 0.4);
    gl_FragColor = vec4(tint, alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export default function AtlasWorld({
  night,
  accent = "#e4a95f",
  animate = true,
}: {
  night: boolean;
  accent?: string;
  animate?: boolean;
}) {
  const sky = useRef<THREE.ShaderMaterial>(null);
  const ground = useRef<THREE.ShaderMaterial>(null);
  const sparks = useRef<THREE.ShaderMaterial>(null);
  const time = useRef(0);
  const nightMix = useRef(night ? 1 : 0);
  const color = useMemo(() => new THREE.Color(accent), [accent]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uNight: { value: night ? 1 : 0 },
      uAccent: { value: new THREE.Color(accent) },
    }),
    [accent, night],
  );

  const particles = useMemo(() => {
    const count = 38;
    const positions = new Float32Array(count * 3);
    const phases = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const phase = (i * 0.61803398875) % 1;
      const angle = i * 2.3999632297;
      const radius = 1.6 + ((i * 11) % 25) / 10;
      positions.set([Math.cos(angle) * radius, 0.2 + phase * 2.2, Math.sin(angle) * radius], i * 3);
      phases[i] = phase;
    }
    return { positions, phases };
  }, []);

  useFrame((_, delta) => {
    if (animate) time.current += Math.min(delta, 0.05);
    nightMix.current = animate
      ? THREE.MathUtils.damp(nightMix.current, night ? 1 : 0, 3.2, delta)
      : night
        ? 1
        : 0;
    if (sky.current) {
      sky.current.uniforms.uTime.value = time.current;
      sky.current.uniforms.uNight.value = nightMix.current;
    }
    if (ground.current) {
      ground.current.uniforms.uNight.value = nightMix.current;
    }
    if (sparks.current) {
      sparks.current.uniforms.uTime.value = time.current;
      sparks.current.uniforms.uNight.value = nightMix.current;
      sparks.current.uniforms.uAccent.value.copy(color);
    }
  });

  return (
    <>
      {/* Cinematic studio sky dome */}
      <mesh renderOrder={-10} frustumCulled={false}>
        <sphereGeometry args={[70, 32, 20]} />
        <shaderMaterial
          ref={sky}
          vertexShader={skyVertex}
          fragmentShader={skyFragment}
          uniforms={uniforms}
          side={THREE.BackSide}
          depthWrite={false}
          depthTest={false}
        />
      </mesh>

      {/* Clean radial contact shadow under the pedestal */}
      <mesh position={[0, -0.44, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={-2}>
        <planeGeometry args={[10, 10]} />
        <shaderMaterial
          ref={ground}
          vertexShader={groundVertex}
          fragmentShader={groundFragment}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Subtle floating ambient dust / embers */}
      <points renderOrder={-1}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[particles.positions, 3]} />
          <bufferAttribute attach="attributes-aPhase" args={[particles.phases, 1]} />
        </bufferGeometry>
        <shaderMaterial
          ref={sparks}
          vertexShader={sparkVertex}
          fragmentShader={sparkFragment}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </>
  );
}
