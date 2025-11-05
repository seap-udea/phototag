#!/usr/bin/env node

/**
 * Script to reset local tags file with data from Google Drive
 * Usage: npm run reset-local-tags
 */

import GoogleDriveStorage from '../src/lib/googleDrive';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  try {
    console.log('Cargando etiquetas desde Google Drive...');
    const driveStorage = new GoogleDriveStorage();
    const tags = await driveStorage.loadTags();
    
    if (tags.length === 0) {
      console.warn('⚠️  No se encontraron etiquetas en Google Drive');
      console.log('El archivo local se actualizará con un array vacío.');
    } else {
      console.log(`✓ Se encontraron ${tags.length} etiquetas en Google Drive`);
    }
    
    // Prepare data in the same format as the local file
    const dataToSave = {
      tags,
      lastUpdated: new Date().toISOString(),
      version: 1
    };
    
    // Ensure data directory exists
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
      console.log('✓ Directorio data/ creado');
    }
    
    // Write to local file
    const tagsFile = path.join(dataDir, 'phototag-tags.json');
    fs.writeFileSync(tagsFile, JSON.stringify(dataToSave, null, 2), 'utf8');
    
    console.log(`✓ Archivo local actualizado: ${tagsFile}`);
    console.log(`  - Total de etiquetas: ${tags.length}`);
    console.log(`  - Última actualización: ${dataToSave.lastUpdated}`);
    
  } catch (error: any) {
    console.error('❌ Error:', error?.message || error);
    process.exit(1);
  }
}

main();

