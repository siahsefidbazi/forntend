import { registerHooks } from 'node:module';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../../', import.meta.url));
registerHooks({
  resolve(specifier, context, nextResolve) {
    let candidate;
    if (specifier.startsWith('@/')) candidate = path.join(root, 'src', specifier.slice(2));
    else if (specifier.startsWith('.') && context.parentURL?.startsWith('file:')) {
      candidate = fileURLToPath(new URL(specifier, context.parentURL));
    }
    if (candidate && !path.extname(candidate) && existsSync(`${candidate}.ts`)) {
      return nextResolve(pathToFileURL(`${candidate}.ts`).href, context);
    }
    return nextResolve(specifier, context);
  },
});
