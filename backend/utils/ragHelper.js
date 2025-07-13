import fs from 'fs';
import path from 'path';

export function getContextFromDecade(decade) {
    const filePath = path.join(process.cwd(), 'data', `${decade}.json`);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    const stories = data.stories.slice(0,1).map(s => `Story: ${s.text}`).join('\n');
    const currency = data.currency.slice(0,1).map(c => `Currency: ${c.name}`).join('\n');
    const phrases = data.phrases.slice(0,1).map(p => `Popular phrase: ${p.phrase}`).join('\n');

    return `${stories}\n${currency}\n${phrases}`;
}
