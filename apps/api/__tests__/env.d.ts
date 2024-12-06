declare module "cloudflare:test" {
	// Controls the type of `import("cloudflare:test").env`

	interface ProvidedEnv extends Env {
		TEST_MIGRATIONS: D1Migration[];
		FALLBACK_REGISTRY_ENDPOINT: string;
		MASTER_KEY: string;
	}
}
