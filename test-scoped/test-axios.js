const { createAxiosAdapter } = require("advanced-client-fetch-axios-adapter");

console.log("Testing axios adapter...");
try {
  const adapter = createAxiosAdapter();
  console.log("✅ Axios adapter loaded successfully!");
  console.log("Available methods:", Object.keys(adapter));
} catch (error) {
  console.error("❌ Error:", error.message);
  console.error("Stack:", error.stack);
}
