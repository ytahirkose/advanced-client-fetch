import { createClient } from 'advanced-client-fetch';

console.log("Testing advanced-client-fetch...");
try {
  const client = createClient();
  console.log("✅ Core loaded successfully!");
  console.log("Available methods:", Object.keys(client));
} catch (error) {
  console.error("❌ Error:", error.message);
  console.error("Stack:", error.stack);
}