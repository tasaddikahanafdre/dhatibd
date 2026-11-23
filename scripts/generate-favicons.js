const sharp = require('sharp');
const fs = require('fs');

async function generateIcons() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
  <rect width="256" height="256" rx="56" fill="#000000"/>
  <path d="M68 56 H124 C163.765 56 196 88.235 196 128 C196 167.765 163.765 200 124 200 H68 Z M104 90 V166 H124 C144.987 166 162 148.987 162 128 C162 107.013 144.987 90 124 90 Z" fill="#FFFFFF"/>
</svg>`;

  const svgBuffer = Buffer.from(svg);

  const png32 = await sharp(svgBuffer).resize(32, 32).png().toBuffer();
  const png192 = await sharp(svgBuffer).resize(192, 192).png().toBuffer();
  const png512 = await sharp(svgBuffer).resize(512, 512).png().toBuffer();

  fs.writeFileSync('public/icon.png', png192);
  fs.writeFileSync('app/icon.png', png192);
  fs.writeFileSync('public/favicon.ico', png32);
  fs.writeFileSync('public/favicon.png', png32);
  fs.writeFileSync('public/icon.svg', svg);
  fs.writeFileSync('public/favicon.svg', svg);
  console.log('Successfully generated icon.png, app/icon.png, favicon.ico, and favicon.png with clean D lettermark!');
}

generateIcons().catch(console.error);
