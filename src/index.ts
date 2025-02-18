import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const filePath = join(process.cwd(), './src/example.json');
const file = await readFile(filePath, 'utf-8');

console.log(JSON.parse(file));
