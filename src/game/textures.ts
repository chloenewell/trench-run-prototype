import * as THREE from 'three';

export function createGridTileTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#070b18';
  ctx.fillRect(0, 0, 512, 512);

  // Subtle metallic grid panels
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.22)';
  ctx.lineWidth = 3;
  ctx.strokeRect(8, 8, 496, 496);

  // Inner circuit traces
  ctx.strokeStyle = 'rgba(139, 92, 246, 0.28)';
  ctx.lineWidth = 2;
  for (let i = 64; i < 512; i += 64) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 512);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(512, i);
    ctx.stroke();
  }

  // Center directional chevron glow
  ctx.strokeStyle = 'rgba(34, 211, 238, 0.45)';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(190, 310);
  ctx.lineTo(256, 220);
  ctx.lineTo(322, 310);
  ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

export function createServerTowerTexture(maxAnisotropy: number, accentHex: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#060914';
  ctx.fillRect(0, 0, 256, 512);

  // Rack horizontal slots
  for (let y = 16; y < 496; y += 28) {
    ctx.fillStyle = '#0d152a';
    ctx.fillRect(18, y, 220, 18);

    // Data LED strips
    const count = 4;
    for (let i = 0; i < count; i++) {
      const lit = ((y + i * 17) % 5) !== 0;
      ctx.fillStyle = lit ? accentHex : '#1e293b';
      ctx.fillRect(28 + i * 50, y + 5, 32, 7);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createRadialGradient(64, 64, 4, 64, 64, 62);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.72)');
  grad.addColorStop(0.55, 'rgba(2, 6, 23, 0.36)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createPacketLabelTexture(
  orderNum: number,
  title: string,
  accentColor: string,
  maxAnisotropy: number
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Dark chamfered card background
  ctx.fillStyle = 'rgba(7, 11, 26, 0.94)';
  ctx.beginPath();
  ctx.moveTo(24, 8);
  ctx.lineTo(504, 8);
  ctx.lineTo(504, 224);
  ctx.lineTo(484, 248);
  ctx.lineTo(8, 248);
  ctx.lineTo(8, 28);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 8;
  ctx.stroke();

  // Order badge square
  ctx.fillStyle = accentColor;
  ctx.fillRect(26, 26, 76, 76);

  ctx.fillStyle = '#040711';
  ctx.font = 'bold 48px "Oxanium", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(orderNum), 64, 66);

  // Label text wrapped neatly
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 34px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  const cleanTitle = title.replace(/^\d+\.\s*/, '');
  const words = cleanTitle.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  for (const word of words) {
    const test = currentLine ? `${currentLine} ${word}` : word;
    if (ctx.measureText(test).width > 350 && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = test;
    }
  }
  if (currentLine) lines.push(currentLine);

  const startY = lines.length === 1 ? 84 : lines.length === 2 ? 62 : 42;
  lines.slice(0, 3).forEach((line, idx) => {
    ctx.fillText(line, 122, startY + idx * 44);
  });

  // Bottom bar indicator
  ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
  ctx.fillRect(26, 212, 456, 12);
  ctx.fillStyle = accentColor;
  ctx.fillRect(26, 212, 160, 12);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createHoloBoardTexture(
  heading: string,
  subline: string,
  steps: string[],
  maxAnisotropy: number
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#070b1e';
  ctx.fillRect(0, 0, 1024, 512);

  // Subtle scanlines
  ctx.fillStyle = 'rgba(34, 211, 238, 0.04)';
  for (let y = 0; y < 512; y += 8) {
    ctx.fillRect(0, y, 1024, 2);
  }

  ctx.strokeStyle = '#a855f7';
  ctx.lineWidth = 8;
  ctx.strokeRect(14, 14, 996, 484);

  ctx.fillStyle = '#22d3ee';
  ctx.font = 'bold 42px "Oxanium", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(heading, 512, 76);

  ctx.fillStyle = '#cbd5e1';
  ctx.font = '26px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText(subline, 512, 128);

  // Render chain boxes
  const boxW = Math.min(200, Math.floor(880 / Math.max(1, steps.length)) - 20);
  const gap = 22;
  const totalW = steps.length * boxW + (steps.length - 1) * gap;
  let startX = (1024 - totalW) / 2;

  steps.forEach((step, idx) => {
    ctx.fillStyle = idx === steps.length - 1 ? 'rgba(168, 85, 247, 0.24)' : 'rgba(14, 165, 233, 0.18)';
    ctx.fillRect(startX, 185, boxW, 210);
    ctx.strokeStyle = idx === steps.length - 1 ? '#c084fc' : '#38bdf8';
    ctx.lineWidth = 4;
    ctx.strokeRect(startX, 185, boxW, 210);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 22px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.textAlign = 'center';

    const words = step.split(' ');
    const lines: string[] = [];
    let cur = '';
    for (const w of words) {
      const t = cur ? `${cur} ${w}` : w;
      if (ctx.measureText(t).width > boxW - 24 && cur) {
        lines.push(cur);
        cur = w;
      } else {
        cur = t;
      }
    }
    if (cur) lines.push(cur);

    lines.slice(0, 4).forEach((ln, lIdx) => {
      ctx.fillText(ln, startX + boxW / 2, 245 + lIdx * 32);
    });

    if (idx < steps.length - 1) {
      ctx.fillStyle = '#22d3ee';
      ctx.font = 'bold 34px sans-serif';
      ctx.fillText('→', startX + boxW + gap / 2, 295);
    }

    startX += boxW + gap;
  });

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}
