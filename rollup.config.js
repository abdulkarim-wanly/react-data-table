import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(join(__dirname, 'package.json'), 'utf8'));

export default {
  input: ['src/index.ts', 'src/setup.ts'],
  output: [
    {
      dir: 'dist',
      entryFileNames: '[name].cjs.js',
      format: 'cjs',
      sourcemap: true,
      exports: 'named',
      chunkFileNames: 'chunks/[name]-[hash].cjs.js',
    },
    {
      dir: 'dist',
      entryFileNames: '[name].esm.js',
      format: 'esm',
      sourcemap: true,
      chunkFileNames: 'chunks/[name]-[hash].esm.js',
    },
  ],
  plugins: [
    peerDepsExternal(),
    resolve(),
    commonjs(),
    typescript({
      tsconfig: './tsconfig.json',
      sourceMap: true,
      declaration: true,
      declarationDir: 'dist/types',
    }),
  ],
  external: ['react', 'react-dom'],
};
