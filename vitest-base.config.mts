import { defineConfig } from 'vitest/config';

// The @projecthub bundles live in sibling repos with their own node_modules.
// When Vitest externalizes them, Node resolves their `@angular/core` import
// from the sibling copy, producing a second Angular runtime: injection context
// is registered by one copy while `input.required()` asserts against the other
// (NG0203). Inlining the bundles plus dedupe keeps a single copy of Angular
// and rxjs in the test graph.
export default defineConfig({
  resolve: {
    dedupe: [
      '@angular/core',
      '@angular/common',
      '@angular/compiler',
      '@angular/platform-browser',
      '@angular/router',
      '@angular/forms',
      'rxjs',
    ],
  },
  test: {
    server: {
      deps: {
        inline: ['@projecthub/ui', '@projecthub/shared'],
      },
    },
  },
});
