import fs from 'fs';
import path from 'path';

export function getContextFrom1950() {
    const filePath = path.join(process.cwd(), 'data', '1950.json');
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    // combine a few fields for prompt
    const combined = [
        ...data.stories.slice(0, 1),
        ...data.currency.slice(0, 1),
        ...data.phrases.slice(0, 1)
    ].join('\n');

    return combined;
}
