import { appendUpdate } from '../src/update-writes.mjs';
import path from 'node:path';
import fs from 'node:fs';

async function prove() {
  const root = process.cwd();
  const updatesDir = path.join(root, 'docs/updates');
  
  console.log('--- MB-051 Proof Script ---');
  
  const testUpdate = {
    title: 'MB-051 Proof of Concept',
    summary: 'This update demonstrates the programmatic append capability implemented in MB-051.',
    bullets: [
      'Created src/update-writes.mjs with appendUpdate function.',
      'Wired POST /api/updates to dev-server.mjs.',
      'Verified file-based persistence in docs/updates.'
    ],
    updatesDir
  };

  try {
    const result = await appendUpdate(testUpdate);
    console.log('Result:', result);
    
    if (fs.existsSync(result.filePath)) {
      console.log('SUCCESS: Update file created at', result.filePath);
      const content = fs.readFileSync(result.filePath, 'utf8');
      console.log('--- Content ---');
      console.log(content);
      console.log('---------------');
    } else {
      console.error('FAILURE: Update file not found.');
      process.exit(1);
    }
  } catch (error) {
    console.error('ERROR:', error);
    process.exit(1);
  }
}

prove();
