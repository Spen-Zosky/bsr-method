import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/bin/bsr.ts',
    'src/mcp/server.ts',
  ],
  format: ['cjs'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  target: 'node18',
  shims: true,
  outExtension: () => ({ js: '.js' }),
});
