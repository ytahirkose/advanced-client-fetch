// All-in-one entry point for advanced-client-fetch
// Includes: core + plugins + presets (axios-adapter excluded)

// Core
export * from '../packages/core/src/index';

// Plugins
export * from '../packages/plugins/src/index';

// Presets
export * from '../packages/presets/src/index';

// Re-export main types
export type { Client, ClientOptions } from '../packages/core/src/types';
export type { Middleware, Context } from '../packages/core/src/types';
