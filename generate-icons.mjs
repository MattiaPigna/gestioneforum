// Genera icone PNG per la PWA usando Canvas API (Node.js con canvas)
// Esegui: node generate-icons.mjs
import { createCanvas } from 'canvas';
import { writeFileSync, mkdirSync } from 'fs';

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

mkdirSync('./public/icons', { recursive: true });

for (const size of sizes) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Sfondo sfumato
  const grad = ctx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, '#3b82f6');
  grad.addColorStop(1, '#14b8a6');
  ctx.fillStyle = grad;

  // Bordi arrotondati
  const r = size * 0.22;
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(size - r, 0);
  ctx.quadraticCurveTo(size, 0, size, r);
  ctx.lineTo(size, size - r);
  ctx.quadraticCurveTo(size, size, size - r, size);
  ctx.lineTo(r, size);
  ctx.quadraticCurveTo(0, size, 0, size - r);
  ctx.lineTo(0, r);
  ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.closePath();
  ctx.fill();

  // Testo "FG"
  ctx.fillStyle = 'white';
  ctx.font = `bold ${size * 0.38}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('FG', size / 2, size / 2);

  writeFileSync(`./public/icons/icon-${size}.png`, canvas.toBuffer('image/png'));
  console.log(`✓ icon-${size}.png`);
}
console.log('Icone generate!');
