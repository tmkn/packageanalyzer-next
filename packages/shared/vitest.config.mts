import { defineConfig, mergeConfig } from "vitest/config";
import viteConfig from "@tooling/vitest/vitest.config.mjs";

export default mergeConfig(viteConfig, defineConfig({}));
