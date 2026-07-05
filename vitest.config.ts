import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // Mirror the tsconfig "@/*" → "./*" path alias so tests can import modules the same
  // way app code does (e.g. lib/sdk/client.ts imports "@/lib/mesh").
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts"],
  },
});
