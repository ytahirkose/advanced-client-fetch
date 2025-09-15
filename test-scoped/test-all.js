const { createClient, retryPlugin, cachePlugin } = require("advanced-client-fetch/all");

console.log("Testing all package...");
try {
  const client = createClient();
  console.log("✅ All package loaded successfully!");
  console.log("Client methods:", Object.keys(client));
  console.log("Retry plugin:", typeof retryPlugin);
  console.log("Cache plugin:", typeof cachePlugin);
} catch (error) {
  console.error("❌ Error:", error.message);
  console.error("Stack:", error.stack);
}
