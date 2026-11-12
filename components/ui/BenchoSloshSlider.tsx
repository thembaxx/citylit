"use client";

/**
 * Bencho Slosh Slider
 * Fluid range slider micro-interaction based on Bencho (bencho.dev) by Lorenzo Cabra.
 * Features:
 * - Fluid inertia slosh tilting based on drag velocity
 * - Magnetic notch detents with tactile feedback
 * - Web Audio soft clicks on notch crossing
 */

import { useRef, useState, useEffect } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  useVelocity,
  useSpring,
  useReducedMotion,
  animate,
  type PanInfo,
} from "motion/react";
import { benchoAudio } from "../../lib/bencho-audio";

interface SloshDetent {
  value: number;
  label: string;
}

interface BenchoSloshSliderProps {
  value: number;
  onChange: (val: number) => void;
  detents?: SloshDetent[];
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  unit?: string;
  className?: string;
}

export function BenchoSloshSlider({
  value,
  onChange,
  detents = [
    { value: 60, label: "1h" },
    { value: 120, label: "2h" },
    { value: 180, label: "3h" },
    { value: 360, label: "All day" },
  ],
  min = 60,
  max = 360,
  label = "Duration",
  unit = "min",
  className = "",
}: BenchoSloshSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [trackWidth, setTrackWidth] = useState(240);
  const thumbX = useMotionValue(0);
  const xVelocity = useVelocity(thumbX);
  const reduced = useReducedMotion();

  // Update track width
  useEffect(() => {
    const measure = () => {
      if (trackRef.current) {
        setTrackWidth(Math.max(120, trackRef.current.clientWidth - 36));
      }
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // Sync value to thumb position
  useEffect(() => {
    const fraction = (value - min) / (max - min);
    thumbX.set(fraction * trackWidth);
  }, [value, min, max, trackWidth, thumbX]);

  // Inertia slosh tilt: velocity creates an organic wave tilt
  const sloshTiltRaw = useTransform(xVelocity, [-1500, 0, 1500], [14, 0, -14]);
  const sloshTilt = useSpring(sloshTiltRaw, {
    stiffness: 300,
    damping: 18,
    mass: 0.6,
  });

  const progressPercent = useTransform(thumbX, [0, trackWidth], ["0%", "100%"]);

  const handleDrag = () => {
    const currentX = thumbX.get();
    const fraction = Math.max(0, Math.min(1, currentX / trackWidth));
    const rawVal = min + fraction * (max - min);

    // Find closest detent
    let closest = detents[0];
    let minDiff = Infinity;
    for (const d of detents) {
      const diff = Math.abs(d.value - rawVal);
      if (diff < minDiff) {
        minDiff = diff;
        closest = d;
      }
    }

    if (minDiff < (max - min) * 0.08 && closest.value !== value) {
      benchoAudio.playClick(620);
      onChange(closest.value);
    } else {
      onChange(Math.round(rawVal));
    }
  };

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info?: PanInfo) => {
    // Snap to nearest detent, taking release velocity into account
    const currentX = thumbX.get();
    const vx = info?.velocity?.x ?? xVelocity.get();
    const fraction = Math.max(0, Math.min(1, currentX / trackWidth));
    const rawVal = min + fraction * (max - min);

    // Bias toward flick direction when flung with velocity
    let targetVal = rawVal;
    if (Math.abs(vx) > 300) {
      const step = (max - min) * 0.12 * Math.sign(vx);
      targetVal = Math.max(min, Math.min(max, rawVal + step));
    }

    let closest = detents[0];
    let minDiff = Infinity;
    for (const d of detents) {
      const diff = Math.abs(d.value - targetVal);
      if (diff < minDiff) {
        minDiff = diff;
        closest = d;
      }
    }

    onChange(closest.value);
    const targetX = ((closest.value - min) / (max - min)) * trackWidth;
    if (reduced) {
      animate(thumbX, targetX, { duration: 0.1 });
    } else {
      animate(thumbX, targetX, {
        type: "spring",
        stiffness: 450,
        damping: 26,
        velocity: vx,
      });
    }
    benchoAudio.playClick(680);
  };

  return (
    <div className={`bencho-slosh-slider-root ${className}`}>
      <div className="bencho-slosh-header">
        <span className="bencho-slosh-label">{label}</span>
        <span className="bencho-slosh-value">
          {value} {unit}
        </span>
      </div>

      <div ref={trackRef} className="bencho-slosh-track">
        {/* Sloshing liquid fill */}
        <motion.div className="bencho-slosh-fill" style={{ width: progressPercent }} />

        {/* Detent tick marks */}
        <div className="bencho-slosh-detents" aria-hidden="true">
          {detents.map((d) => {
            const pct = ((d.value - min) / (max - min)) * 100;
            const isPassed = value >= d.value;

            return (
              <div
                key={d.value}
                className={`bencho-slosh-tick ${isPassed ? "is-passed" : ""}`}
                style={{ left: `${pct}%` }}
              >
                <span className="bencho-tick-mark" />
                <span className="bencho-tick-label">{d.label}</span>
              </div>
            );
          })}
        </div>

        {/* Draggable thumb with liquid tilt */}
        <motion.div
          className="bencho-slosh-thumb"
          drag="x"
          dragConstraints={{ left: 0, right: trackWidth }}
          dragElastic={0.18}
          dragMomentum={false}
          style={{
            x: thumbX,
            rotate: reduced ? 0 : sloshTilt,
            touchAction: "pan-y",
          }}
          onDrag={handleDrag}
          onDragEnd={handleDragEnd}
          whileTap={{ scale: 1.15 }}
          role="slider"
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          aria-label={label}
        >
          <div className="bencho-slosh-thumb-core" />
        </motion.div>
      </div>
    </div>
  );
}

export default BenchoSloshSlider;
