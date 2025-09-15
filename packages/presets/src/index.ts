/**
 * HyperHTTP Presets - Platform-specific client configurations
 */

// Edge preset
export {
  createEdgeClient,
  createEdgeClientWithRetry,
  createEdgeClientWithTimeout,
  createEdgeClientWithDedupe,
  createEdgeClientWithMetrics,
  createMinimalEdgeClient,
  createFullEdgeClient,
  createAPIGatewayClient,
  createCDNClient,
  createCloudflareWorkersClient,
  createVercelEdgeClient,
  createDenoDeployClient,
  createBunEdgeClient,
  edgeClient,
  type EdgePresetOptions,
} from './edge.js';

// Node preset
export {
  createNodeClient,
  createMinimalNodeClient,
  createFullNodeClient,
  createAPIServerClient,
  createDatabaseClient,
  createProductionNodeClient,
  createDevelopmentNodeClient,
  createTestNodeClient,
  createNodeClientWithFeatures,
  createMicroserviceNodeClient,
  createAPIGatewayNodeClient,
  nodeClient,
  type NodePresetOptions,
} from './node.js';

// Browser preset
export {
  createBrowserClient,
  createMinimalBrowserClient,
  createFullBrowserClient,
  createSPAClient,
  createPWAClient,
  createBrowserClientWithRetry,
  createBrowserClientWithTimeout,
  createBrowserClientWithDedupe,
  createBrowserClientWithMetrics,
  createDevelopmentBrowserClient,
  createProductionBrowserClient,
  createTestBrowserClient,
  createMobileBrowserClient,
  createDesktopBrowserClient,
  createWebWorkerClient,
  createServiceWorkerClient,
  browserClient,
  type BrowserPresetOptions,
} from './browser.js';

// Deno preset
export {
  createDenoClient,
  createMinimalDenoClient,
  createFullDenoClient,
  createDenoCLIClient,
  createDenoServerClient,
  denoClient,
  type DenoPresetOptions,
} from './deno.js';

// Bun preset
export {
  createBunClient,
  createMinimalBunClient,
  createFullBunClient,
  createBunCLIClient,
  createBunServerClient,
  bunClient,
  type BunPresetOptions,
} from './bun.js';


// Common functions (available in multiple presets)
export {
  createMicroserviceClient,
  createRealTimeClient,
  createStreamingClient,
  createWebSocketClient,
  createBatchClient,
  createServerlessClient,
} from './node.js';

// Re-export core types for convenience
export type { Client, ClientOptions, RequestOptions } from 'hyperhttp-core';
