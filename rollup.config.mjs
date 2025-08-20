import cleanup from 'rollup-plugin-cleanup';
import typescript from '@rollup/plugin-typescript';
import json from '@rollup/plugin-json';
import Oxc from 'unplugin-oxc/rollup';
import pkg from './package.json' with { type: 'json' };

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
