#!/usr/bin/env node

/**
 * Script to generate a static HTML file with the photo and tags from Google Drive
 * Usage: npm run generate-static-html
 * Output: phototag-astronomia-16.html
 */

import GoogleDriveStorage from '../src/lib/googleDrive';
import * as fs from 'fs';
import * as path from 'path';

interface Tag {
  id: string;
  x: number;
  y: number;
  firstName: string;
  lastName: string;
  vinculo: string;
  yearIngreso: string;
}

function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

function getStarColor(vinculo: string): string {
  switch (vinculo) {
    case 'Docente':
      return '#3b82f6'; // blue-500
    case 'Estudiante':
      return '#eab308'; // yellow-500
    case 'Egresad@':
      return '#ef4444'; // red-500
    case 'Administración':
      return '#22c55e'; // green-500
    default:
      return '#facc15'; // yellow-400
  }
}

function generateHTML(tags: Tag[]): string {
  const sunsHTML = tags.map(tag => {
    const color = getStarColor(tag.vinculo);
    const name = `${tag.firstName} ${tag.lastName}`.trim();
    const vinculo = tag.vinculo || '';
    const yearIngreso = tag.yearIngreso || '';
    
    return `
      <div class="sun-container" style="position: absolute; left: ${tag.x}%; top: ${tag.y}%; transform: translate(-50%, -50%); z-index: 10;">
        <svg class="sun-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="cursor: pointer; filter: drop-shadow(0 1px 2px rgba(0,0,0,0.5));">
          <circle cx="12" cy="12" r="4" fill="${color}" stroke="black" stroke-width="1"/>
          <path d="M12 2v2M12 20v2M22 12h-2M4 12H2M19.07 4.93l-1.41 1.41M6.34 17.66l-1.41 1.41M19.07 19.07l-1.41-1.41M6.34 6.34l-1.41-1.41" stroke="black" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
        <div class="tooltip" style="position: absolute; top: calc(100% + 8px); left: 50%; transform: translateX(-50%); opacity: 0; visibility: hidden; pointer-events: none; transition: opacity 0.2s, visibility 0.2s; background: #111827; color: white; padding: 8px 12px; border-radius: 6px; white-space: nowrap; font-size: 14px; z-index: 1000; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">
          <div style="font-weight: 600; margin-bottom: 4px;">${escapeHtml(name)}</div>
          ${vinculo ? `<div style="font-size: 12px; color: #e5e7eb;">${escapeHtml(vinculo)}${yearIngreso ? ` (${escapeHtml(yearIngreso)})` : ''}</div>` : ''}
          <div class="tooltip-arrow" style="position: absolute; bottom: 100%; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-bottom: 6px solid #111827;"></div>
        </div>
      </div>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pregrado de Astronomía - UdeA 2025: ¡16 años cumplidos!</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
      background: #f9fafb;
      min-height: 100vh;
      padding: 20px;
    }
    
    .container {
      max-width: 1200px;
      width: 100%;
      margin: 0 auto;
      background: white;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    
    .header {
      background: white;
      color: #111827;
      padding: 30px;
      text-align: center;
      border-bottom: 1px solid #e5e7eb;
    }
    
    .header h1 {
      font-size: 2rem;
      margin-bottom: 10px;
      font-weight: 700;
    }
    
    .header p {
      font-size: 1.1rem;
      opacity: 0.95;
    }
    
    .image-container {
      position: relative;
      width: 100%;
      padding-top: 66.67%; /* 3:2 aspect ratio */
      background: #f3f4f6;
    }
    
    .image-container img {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: contain;
      display: block;
    }
    
    .suns-wrapper {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
    }
    
    .sun-container {
      pointer-events: auto;
      position: relative;
    }
    
    .sun-container:hover .tooltip {
      opacity: 1 !important;
      visibility: visible !important;
    }
    
    .sun-icon {
      transition: transform 0.2s;
      pointer-events: auto;
    }
    
    .sun-container:hover .sun-icon {
      transform: scale(1.1);
    }
    
    .tooltip {
      visibility: hidden;
    }
    
    .tooltip.show {
      opacity: 1 !important;
      visibility: visible !important;
    }
    
    .footer {
      background: #f9fafb;
      padding: 20px;
      text-align: center;
      color: #6b7280;
      font-size: 0.875rem;
      border-top: 1px solid #e5e7eb;
    }
    
    @media (max-width: 768px) {
      .header h1 {
        font-size: 1.5rem;
      }
      
      .header p {
        font-size: 1rem;
      }
      
      body {
        padding: 10px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Pregrado de Astronomía - UdeA (2025)</h1>
      <p>¡16 años cumplidos!</p>
    </div>
    
    <div class="image-container">
      <img src="./pregrado-astronomia-2025.jpg" alt="Foto del cumpleaños 16 del pregrado de astronomía 2025" />
      <div class="suns-wrapper">
        ${sunsHTML}
      </div>
    </div>
    
    <div class="footer">
      <p><i>Desarrollado por Jorge I. Zuluaga (Astronomía, UdeA) con la asistencia de Cursor (2025) v0.3.0</i></p>
      <p style="margin-top: 8px; font-size: 0.75rem;">Generado el ${new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
    </div>
  </div>
</body>
</html>`;
}

async function main() {
  try {
    console.log('Cargando etiquetas desde Google Drive...');
    const driveStorage = new GoogleDriveStorage();
    const tags = await driveStorage.loadTags();
    
    if (tags.length === 0) {
      console.warn('⚠️  No se encontraron etiquetas en Google Drive');
      console.log('Generando HTML vacío...');
    } else {
      console.log(`✓ Se encontraron ${tags.length} etiquetas`);
    }
    
    console.log('Generando HTML estático...');
    const html = generateHTML(tags);
    
    const outputPath = path.join(process.cwd(), 'phototag-astronomia-16.html');
    fs.writeFileSync(outputPath, html, 'utf8');
    
    // Copy the image file to the same directory as the HTML
    const imageSource = path.join(process.cwd(), 'public', 'pregrado-astronomia-2025.jpg');
    const imageDest = path.join(process.cwd(), 'pregrado-astronomia-2025.jpg');
    
    if (fs.existsSync(imageSource)) {
      fs.copyFileSync(imageSource, imageDest);
      console.log(`✓ Imagen copiada: ${imageDest}`);
    } else {
      console.warn(`⚠️  Imagen no encontrada en ${imageSource}`);
      console.warn(`   Asegúrate de copiar 'pregrado-astronomia-2025.jpg' al mismo directorio que el HTML`);
    }
    
    console.log(`✓ HTML generado exitosamente: ${outputPath}`);
    console.log(`\n📝 El archivo HTML está listo para compartir.`);
    console.log(`   Ábrelo en cualquier navegador para ver la foto con las etiquetas.\n`);
    
  } catch (error: any) {
    console.error('❌ Error:', error?.message || error);
    process.exit(1);
  }
}

main();

