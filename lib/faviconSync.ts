import fs from 'fs';
import path from 'path';

/**
 * Checks if a custom favicon (fav.png) has been placed in public/logo/
 * and synchronizes it across public/favicon.ico, public/favicon.png, and app/icon.png
 * so that all browsers, devices, and direct favicon requests receive the custom icon.
 */
export function syncCustomFavicon(): boolean {
  try {
    const logoDir = path.join(process.cwd(), 'public', 'logo');
    const customFavPng = path.join(logoDir, 'fav.png');
    const customFavPNG = path.join(logoDir, 'fav.PNG');
    const customFavJpg = path.join(logoDir, 'fav.jpg');
    const customFavIco = path.join(logoDir, 'fav.ico');
    const customFavSvg = path.join(logoDir, 'fav.svg');

    let sourceFile: string | null = null;
    if (fs.existsSync(customFavPng)) sourceFile = customFavPng;
    else if (fs.existsSync(customFavPNG)) sourceFile = customFavPNG;
    else if (fs.existsSync(customFavJpg)) sourceFile = customFavJpg;
    else if (fs.existsSync(customFavIco)) sourceFile = customFavIco;
    else if (fs.existsSync(customFavSvg)) sourceFile = customFavSvg;

    if (sourceFile) {
      const sourceBuffer = fs.readFileSync(sourceFile);
      const targets = [
        path.join(process.cwd(), 'public', 'favicon.ico'),
        path.join(process.cwd(), 'public', 'favicon.png'),
        path.join(process.cwd(), 'public', 'fav.png'),
        path.join(process.cwd(), 'app', 'icon.png'),
      ];

      for (const target of targets) {
        let shouldWrite = true;
        if (fs.existsSync(target)) {
          try {
            const targetBuf = fs.readFileSync(target);
            if (targetBuf.equals(sourceBuffer)) {
              shouldWrite = false;
            }
          } catch {
            shouldWrite = true;
          }
        }
        if (shouldWrite) {
          try {
            const targetDir = path.dirname(target);
            if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
            fs.writeFileSync(target, sourceBuffer);
          } catch (e) {
            console.error(`Failed to write favicon to ${target}:`, e);
          }
        }
      }
      return true;
    }
  } catch (err) {
    console.error('Error syncing custom favicon:', err);
  }
  return false;
}
