import { readFile, writeFile, mkdir, cp } from 'node:fs/promises';
import { resolve } from 'node:path';
import { render } from '../.ssr/entry-server.js';

const root = resolve(import.meta.dirname, '../..');
const output = resolve(root, 'frontend/dist');
const template = await readFile(resolve(output, 'index.html'), 'utf8');
if (!template.includes('<!--app-html-->')) throw new Error('Prerender placeholder is missing');
await writeFile(resolve(output, 'index.html'), template.replace('<!--app-html-->', () => render()));
await mkdir(resolve(output, 'assets'), { recursive: true });
await cp(resolve(root, 'public/assets/profile-photo.jpg'), resolve(output, 'assets/profile-photo.jpg'));
await cp(resolve(root, 'frontend/static/cv.html'), resolve(output, 'cv.html'));
await cp(resolve(root, 'frontend/static/cv.css'), resolve(output, 'cv.css'));
await cp(resolve(root, 'frontend/static/print-cv.js'), resolve(output, 'print-cv.js'));
await cp(resolve(root, 'frontend/static/favicon.svg'), resolve(output, 'favicon.svg'));
await cp(resolve(root, 'output/pdf/Muhammed-Fasil-PV-CV.pdf'), resolve(output, 'resume.pdf'));
await writeFile(resolve(output, 'robots.txt'), 'User-agent: *\nAllow: /\n');
console.log('Prerendered portfolio and copied only public CV assets.');
