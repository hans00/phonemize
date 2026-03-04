import { copyFileSync, mkdirSync, existsSync, readdirSync, statSync } from 'fs';
import { resolve, dirname, relative } from 'path';
import cleanup from 'rollup-plugin-cleanup';
import typescript from '@rollup/plugin-typescript';
import json from '@rollup/plugin-json';
import Oxc from 'unplugin-oxc/rollup';
import pkg from './package.json' with { type: 'json' };

const DATA_DIR = resolve('data');

/**
 * Rollup plugin that keeps JSON files from data/ as separate files in dist/
 * instead of inlining them as JS object literals.
 *
 * Without this, @rollup/plugin-json converts large dictionaries (e.g. the
 * 2.8 MB English pronunciation dictionary) into JavaScript source code.
 * Hermes (React Native's JS engine) cannot compile such large files to
 * bytecode, crashing with "Error encoding bytecode".
 *
 * Keeping them as .json means bundlers like Metro load them natively
 * without bytecode compilation.
 */
function externalDataPlugin() {
  return {
    name: 'external-data',
    resolveId(source, importer) {
      if (!importer) return null;
      const resolved = resolve(dirname(importer), source);
      if (resolved.startsWith(DATA_DIR) && resolved.endsWith('.json')) {
        return { id: './' + relative(DATA_DIR, resolved), external: true };
      }
      return null;
    },
    writeBundle() {
      copyDirRecursive(DATA_DIR, resolve('dist'));
    },
  };
}

function copyDirRecursive(src, dest) {
  if (!existsSync(src)) return;
  for (const entry of readdirSync(src)) {
    const srcPath = resolve(src, entry);
    const destPath = resolve(dest, entry);
    if (statSync(srcPath).isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else if (entry.endsWith('.json')) {
      mkdirSync(dirname(destPath), { recursive: true });
      copyFileSync(srcPath, destPath);
    }
  }
}

export default {
  input: Object.keys(pkg.exports).map((name) => 'src/' + (name.replace(/^\.\/?/, '') || 'index') + '.ts'),
  output: [
    {
      dir: 'dist',
      entryFileNames: '[name].cjs',
      chunkFileNames: '[name]-[hash].cjs',
      format: 'cjs',
    },
    {
      dir: 'dist',
      entryFileNames: '[name].mjs',
      chunkFileNames: '[name]-[hash].mjs',
      format: 'es',
    },
  ],
  plugins: [
    externalDataPlugin(),
    cleanup({ extensions: ['cjs', 'mjs', 'd.ts'] }),
    typescript(),
    json({
      compact: true,
      preferConst: true,
    }),
    Oxc({
      minify: {
        sourceMap: false,
      }
    }),
  ],
};
