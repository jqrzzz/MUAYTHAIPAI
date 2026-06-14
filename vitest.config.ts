import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"

// Unit tests only — pure logic in lib/. No DOM, no Next runtime, no network.
// The "@/..." alias mirrors tsconfig's paths so lib modules resolve untouched.
export default defineConfig({
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
})
