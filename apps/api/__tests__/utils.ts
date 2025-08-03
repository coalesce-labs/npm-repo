import { SELF, env } from "cloudflare:test";
import type { tokenTable } from "../src/db/schema";
import packagePublishPayload from "./mocks/package-publish-payload.json";
export const createToken = async (
	body: { name: string; scopes: Array<string> } = {
		name: crypto.randomUUID(),
		scopes: ["read", "write"]
	}
) => {
	const response = await SELF.fetch("http://localhost/-/npm/v1/tokens", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${env.ADMIN_TOKEN}`
		},
		body: JSON.stringify(body)
	});
	if (!response.ok) {
		throw new Error(`Failed to put token: ${response.statusText}`);
	}
	const responseBody = await response.json<typeof tokenTable.$inferSelect>();

	return responseBody;
};

export const publishMockPackage = async (body = packagePublishPayload) => {
	const { token } = await createToken({
		name: "test-token",
		scopes: ["write"]
	});

	const response = await SELF.fetch("http://localhost/mock", {
		method: "PUT",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${token}`
		},
		body: JSON.stringify(body)
	});

	if (!response.ok) {
		throw new Error(`Failed to publish package: ${response.statusText}`);
	}

	return response;
};
