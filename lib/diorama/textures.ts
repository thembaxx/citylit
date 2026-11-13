import * as THREE from "three/webgpu";

type Draw = (ctx: CanvasRenderingContext2D, size: number) => void;

export function canvasTexture(width: number, height: number, draw: Draw): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D is unavailable");
  draw(ctx, Math.max(width, height));
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function grain(ctx: CanvasRenderingContext2D, width: number, height: number, amount = 900) {
  for (let i = 0; i < amount; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const a = Math.random() * 0.06;
    ctx.fillStyle = `rgba(20, 18, 16, ${a})`;
    ctx.fillRect(x, y, 1 + Math.random() * 2, 1 + Math.random() * 2);
  }
}

/** A painted cooling-tower skin: concentric circles, a crane, chevrons and stars. */
export function createMuralTexture(seed = 7): THREE.CanvasTexture {
  const size = 1024;
  return canvasTexture(size, size, (ctx) => {
    const grad = ctx.createLinearGradient(0, 0, 0, size);
    grad.addColorStop(0, "#0c4b55");
    grad.addColorStop(0.5, "#13818a");
    grad.addColorStop(1, "#0e5d68");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    const cream = "#f1e2c2";
    const amber = "#e4a63c";
    const rust = "#c26834";
    const dark = "#17333a";
    const pale = "#a9dfe0";

    // Big sun / target on the lower left.
    ctx.fillStyle = cream;
    ctx.beginPath();
    ctx.arc(310, 650, 250, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = amber;
    ctx.beginPath();
    ctx.arc(310, 650, 178, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = dark;
    ctx.lineWidth = 18;
    ctx.beginPath();
    ctx.arc(310, 650, 250, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(310, 650, 92, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = dark;
    ctx.beginPath();
    ctx.arc(310, 650, 40, 0, Math.PI * 2);
    ctx.fill();

    // A tall crane / bird on the right.
    ctx.strokeStyle = dark;
    ctx.fillStyle = cream;
    ctx.lineWidth = 22;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(760, 770);
    ctx.bezierCurveTo(730, 560, 760, 380, 860, 260);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(850, 300);
    ctx.bezierCurveTo(930, 220, 1010, 250, 1010, 250);
    ctx.bezierCurveTo(950, 330, 890, 360, 850, 300);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(790, 500);
    ctx.bezierCurveTo(650, 470, 570, 380, 560, 330);
    ctx.bezierCurveTo(700, 350, 780, 410, 790, 500);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(820, 430);
    ctx.bezierCurveTo(900, 380, 970, 400, 1000, 430);
    ctx.stroke();

    // A fish and a spiral, low on the tower.
    ctx.fillStyle = amber;
    ctx.beginPath();
    ctx.ellipse(720, 880, 120, 55, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = dark;
    ctx.lineWidth = 12;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(840, 880);
    ctx.lineTo(930, 820);
    ctx.lineTo(920, 930);
    ctx.closePath();
    ctx.fillStyle = rust;
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = dark;
    ctx.beginPath();
    ctx.arc(660, 865, 12, 0, Math.PI * 2);
    ctx.fill();

    // Top band: triangles and zigzags.
    ctx.fillStyle = cream;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 120);
    for (let x = 0; x <= size; x += 128) {
      ctx.lineTo(x + 64, 40);
      ctx.lineTo(x + 128, 120);
    }
    ctx.lineTo(size, 0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = dark;
    ctx.lineWidth = 10;
    ctx.stroke();

    ctx.strokeStyle = amber;
    ctx.lineWidth = 26;
    ctx.beginPath();
    for (let x = 0; x <= size; x += 64) {
      ctx.lineTo(x, 170 + Math.sin((x / 64) * Math.PI) * 22);
    }
    ctx.stroke();

    // Stars and dots.
    ctx.fillStyle = pale;
    for (let i = 0; i < 26; i++) {
      const x = (i * 137 + seed * 31) % size;
      const y = 240 + ((i * 83) % 520);
      const r = 5 + (i % 4) * 3;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Bottom chevrons.
    ctx.strokeStyle = cream;
    ctx.lineWidth = 18;
    for (let y = 930; y < size + 40; y += 44) {
      ctx.beginPath();
      for (let x = -40; x <= size + 40; x += 80) {
        ctx.lineTo(x, y);
        ctx.lineTo(x + 40, y + 22);
        ctx.lineTo(x + 80, y);
      }
      ctx.stroke();
    }

    grain(ctx, size, size, 1400);
  });
}

/** Small township facade with a window and a door; the tint comes from instance colour. */
export function createHouseFacade() {
  const map = canvasTexture(256, 256, (ctx) => {
    ctx.fillStyle = "#f0e7d8";
    ctx.fillRect(0, 0, 256, 256);
    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, "rgba(255,255,255,0.22)");
    grad.addColorStop(1, "rgba(60,40,24,0.18)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);

    ctx.fillStyle = "#2d3c4a";
    ctx.fillRect(42, 62, 56, 54);
    ctx.fillRect(158, 62, 56, 54);
    ctx.strokeStyle = "#f6f0e5";
    ctx.lineWidth = 7;
    ctx.strokeRect(42, 62, 56, 54);
    ctx.strokeRect(158, 62, 56, 54);
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.fillRect(48, 68, 20, 42);

    ctx.fillStyle = "#5a3a27";
    ctx.fillRect(106, 160, 44, 82);
    ctx.strokeStyle = "#f6f0e5";
    ctx.lineWidth = 5;
    ctx.strokeRect(106, 160, 44, 82);
    ctx.fillStyle = "#e7c07c";
    ctx.beginPath();
    ctx.arc(141, 201, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(60,40,24,0.13)";
    ctx.fillRect(0, 238, 256, 18);
    grain(ctx, 256, 256, 160);
  });
  const emissive = canvasTexture(256, 256, (ctx) => {
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, 256, 256);
    ctx.fillStyle = "#ffcf83";
    ctx.fillRect(42, 62, 56, 54);
    ctx.fillRect(158, 62, 56, 54);
    ctx.fillStyle = "#ffb45c";
    ctx.fillRect(108, 162, 40, 78);
  });
  return { map, emissive };
}

/** Sandstone facade with arched windows for the Union Buildings wings. */
export function createUnionFacade() {
  const map = canvasTexture(512, 256, (ctx) => {
    ctx.fillStyle = "#c9a97a";
    ctx.fillRect(0, 0, 512, 256);
    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, "rgba(255,245,220,0.28)");
    grad.addColorStop(1, "rgba(80,50,25,0.18)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 256);

    ctx.strokeStyle = "rgba(90,62,36,0.35)";
    ctx.lineWidth = 3;
    for (let y = 20; y < 256; y += 32) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();
    }

    const window = (x: number, y: number, w: number, h: number) => {
      ctx.fillStyle = "#3c4d5a";
      ctx.beginPath();
      ctx.moveTo(x, y + h);
      ctx.lineTo(x, y + w / 2);
      ctx.arc(x + w / 2, y + w / 2, w / 2, Math.PI, 0);
      ctx.lineTo(x + w, y + h);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#efe0c2";
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.strokeStyle = "rgba(220,235,245,0.35)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + w / 2, y + 4);
      ctx.lineTo(x + w / 2, y + h);
      ctx.stroke();
    };

    for (let i = 0; i < 8; i++) {
      window(22 + i * 62, 74, 30, 58);
      window(22 + i * 62, 166, 30, 46);
    }

    ctx.fillStyle = "#b08d61";
    ctx.fillRect(0, 0, 512, 18);
    ctx.fillStyle = "#e3cda7";
    ctx.fillRect(0, 18, 512, 8);
    ctx.fillStyle = "rgba(70,45,25,0.25)";
    ctx.fillRect(0, 244, 512, 12);
    grain(ctx, 512, 256, 220);
  });
  const emissive = canvasTexture(512, 256, (ctx) => {
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, 512, 256);
    ctx.fillStyle = "#ffd08a";
    for (let i = 0; i < 8; i++) {
      ctx.fillRect(26 + i * 62, 80, 22, 48);
      ctx.fillRect(26 + i * 62, 170, 22, 38);
    }
  });
  return { map, emissive };
}

export function createSoccerTexture(): THREE.CanvasTexture {
  return canvasTexture(512, 320, (ctx) => {
    const stripe = 32;
    for (let x = 0; x < 512; x += stripe) {
      ctx.fillStyle = (x / stripe) % 2 === 0 ? "#4f8a4b" : "#5a9855";
      ctx.fillRect(x, 0, stripe, 320);
    }
    ctx.strokeStyle = "rgba(255,255,255,0.9)";
    ctx.lineWidth = 5;
    ctx.strokeRect(14, 14, 484, 292);
    ctx.beginPath();
    ctx.moveTo(256, 14);
    ctx.lineTo(256, 306);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(256, 160, 52, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeRect(14, 84, 62, 152);
    ctx.strokeRect(436, 84, 62, 152);
    ctx.strokeRect(14, 122, 24, 76);
    ctx.strokeRect(474, 122, 24, 76);
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.beginPath();
    ctx.arc(256, 160, 5, 0, Math.PI * 2);
    ctx.fill();
    grain(ctx, 512, 320, 260);
  });
}

export function createRoadTexture(): THREE.CanvasTexture {
  const texture = canvasTexture(128, 512, (ctx) => {
    ctx.fillStyle = "#4a4743";
    ctx.fillRect(0, 0, 128, 512);
    ctx.fillStyle = "rgba(255,255,255,0.04)";
    for (let i = 0; i < 220; i++) {
      ctx.fillRect(Math.random() * 128, Math.random() * 512, 2, 2);
    }
    ctx.fillStyle = "rgba(245,240,225,0.85)";
    for (let y = 0; y < 512; y += 74) {
      ctx.fillRect(61, y, 6, 38);
    }
    ctx.fillStyle = "rgba(245,240,225,0.55)";
    ctx.fillRect(5, 0, 3, 512);
    ctx.fillRect(120, 0, 3, 512);
  });
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

export function createRadialTexture(inner = "rgba(255,255,255,1)", outer = "rgba(255,255,255,0)") {
  return canvasTexture(128, 128, (ctx) => {
    const grad = ctx.createRadialGradient(64, 64, 4, 64, 64, 62);
    grad.addColorStop(0, inner);
    grad.addColorStop(0.55, "rgba(255,255,255,0.55)");
    grad.addColorStop(1, outer);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);
  });
}

export function createGroundShadowTexture(): THREE.CanvasTexture {
  return canvasTexture(512, 512, (ctx) => {
    const grad = ctx.createRadialGradient(256, 256, 40, 256, 256, 250);
    grad.addColorStop(0, "rgba(30,24,18,0.42)");
    grad.addColorStop(0.55, "rgba(30,24,18,0.2)");
    grad.addColorStop(1, "rgba(30,24,18,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);
  });
}

export function createHotspotTexture(): THREE.CanvasTexture {
  return canvasTexture(128, 128, (ctx) => {
    ctx.clearRect(0, 0, 128, 128);
    const glow = ctx.createRadialGradient(64, 64, 4, 64, 64, 60);
    glow.addColorStop(0, "rgba(255,226,164,0.95)");
    glow.addColorStop(0.35, "rgba(232,165,66,0.35)");
    glow.addColorStop(1, "rgba(232,165,66,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, 128, 128);
    ctx.strokeStyle = "rgba(255,248,230,0.95)";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(64, 64, 27, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "rgba(255,248,230,0.98)";
    ctx.beginPath();
    ctx.arc(64, 64, 8, 0, Math.PI * 2);
    ctx.fill();
  });
}
