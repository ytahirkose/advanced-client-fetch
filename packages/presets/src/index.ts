/**
 * Advanced Client Fetch Presets - Platform-specific client configurations
 */

// Node.js preset
export {
  createNodeClient,
  createMinimalNodeClient,
  createAPIServerClient,
  createDatabaseClient,
  createMicroserviceClient,
  createBatchClient,
  createRealTimeClient,
  createStreamingClient,
  createWebSocketClient,
  createServerlessClient,
  createFullNodeClient,
  createProductionNodeClient,
  createDevelopmentNodeClient,
  createTestNodeClient,
  createNodeClientWithFeatures,
  createMicroserviceNodeClient,
  createAPIGatewayNodeClient,
  nodeClient,
  type NodePresetOptions,
} from './node.js';

// Edge runtime preset
export {
  createEdgeClient,
  createEdgeClientWithRetry,
  createEdgeClientWithTimeout,
  createEdgeClientWithDedupe,
  createEdgeClientWithMetrics,
  createCloudflareWorkersClient,
  createVercelEdgeClient,
  createMinimalEdgeClient,
  createFullEdgeClient,
  createAPIGatewayClient,
  createCDNClient,
  createWebSocketClient as createEdgeWebSocketClient,
  createRealTimeClient as createEdgeRealTimeClient,
  createStreamingClient as createEdgeStreamingClient,
  createBatchClient as createEdgeBatchClient,
  createMicroserviceClient as createEdgeMicroserviceClient,
  createServerlessClient as createEdgeServerlessClient,
  edgeClient,
  type EdgePresetOptions,
} from './edge.js';

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
  createDenoDeployClient,
  createDenoCLIClient,
  createDenoFreshClient,
  createDenoOakClient,
  createDenoHonoClient,
  createDenoClientWithRetry,
  createDenoClientWithTimeout,
  createDenoClientWithDedupe,
  createDenoClientWithMetrics,
  createDevelopmentDenoClient,
  createProductionDenoClient,
  createTestDenoClient,
  createServerlessDenoClient,
  createMicroserviceDenoClient,
  createAPIGatewayDenoClient,
  createCDNDenoClient,
  createWebSocketDenoClient,
  createRealTimeDenoClient,
  createStreamingDenoClient,
  createBatchDenoClient,
  denoClient,
  type DenoPresetOptions,
} from './deno.js';

// Bun preset
export {
  createBunClient,
  createMinimalBunClient,
  createFullBunClient,
  createBunCLIClient,
  createBunFreshClient,
  createBunHonoClient,
  createBunElysiaClient,
  createBunClientWithRetry,
  createBunClientWithTimeout,
  createBunClientWithDedupe,
  createBunClientWithMetrics,
  createDevelopmentBunClient,
  createProductionBunClient,
  createTestBunClient,
  createServerlessBunClient,
  createMicroserviceBunClient,
  createAPIGatewayBunClient,
  createCDNBunClient,
  createWebSocketBunClient,
  createRealTimeBunClient,
  createStreamingBunClient,
  createBatchBunClient,
  bunClient,
  type BunPresetOptions,
} from './bun.js';

// Re-export core types for convenience
export type { Client, ClientOptions } from '@advanced-client-fetch/core';