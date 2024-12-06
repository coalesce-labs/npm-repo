import { join } from "node:path";

import { defineWorkersConfig, readD1Migrations } from "@cloudflare/vitest-pool-workers/config";
export default defineWorkersConfig(async () => {
	const migrationsPath = join(__dirname, "migrations");
	const migrations = await readD1Migrations(migrationsPath);

	return {
		test: {
			setupFiles: ["./__tests__/setup.ts"],
			poolOptions: {
				workers: {
					singleWorker: true,
					wrangler: { configPath: "./wrangler.toml" },
					main: "./src/index.ts",
					miniflare: {
						bindings: {
							TEST_MIGRATIONS: migrations,
							MASTER_KEY: "test_master_key"
						}
					}
				}
			}
		}
	};
});
