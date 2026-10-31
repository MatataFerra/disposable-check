import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts", "src/dns.ts"],
  format: "esm",
  platform: "neutral",
  dts: true,
});
