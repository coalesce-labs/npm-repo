import { SELF, env } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import { createToken } from "../utils";

import type { tokenTable } from "../../src/db/schema";

describe("token routes", () => {
	describe("POST /tokens", () => {
		it("should not create a token without providing the master key", async () => {
			const response = await SELF.fetch("http://localhost/-/npm/v1/tokens", {
				method: "post"
			});

			expect(response.status).toBe(401);
			expect(response.statusText).toBe("Unauthorized");

			const responseBody = await response.text();
			expect(responseBody).toBe("Missing 'X-Master-Key' header");
		});

		it("should not create a token with an invalid master key", async () => {
			const response = await SELF.fetch("http://localhost/-/npm/v1/tokens", {
				method: "POST",
				headers: {
					"x-master-key": "invalid_master_key"
				}
			});

			expect(response.status).toBe(401);
			expect(response.statusText).toBe("Unauthorized");

			const responseBody = await response.text();
			expect(responseBody).toBe("Invalid master key");
		});

		it("should not create a token without providing at least one scope", async () => {
			const response = await SELF.fetch("http://localhost/-/npm/v1/tokens", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"x-master-key": env.MASTER_KEY
				},
				body: JSON.stringify({
					name: "test-token",
					scopes: []
				})
			});

			expect(response.status).toBe(400);
			expect(response.statusText).toBe("Bad Request");
		});

		it("should not create a token when providing an invalid scope", async () => {
			const response = await SELF.fetch("http://localhost/-/npm/v1/tokens", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"x-master-key": env.MASTER_KEY
				},
				body: JSON.stringify({
					name: "test-token",
					scopes: [
						{
							type: "invalid_scope",
							values: ["*"]
						}
					]
				})
			});

			expect(response.status).toBe(400);
			expect(response.statusText).toBe("Bad Request");
		});

		it("should create a token", async () => {
			const body = {
				name: "test-token",
				scopes: [
					{
						type: "package:read+write",
						values: ["*"]
					}
				]
			};

			const response = await SELF.fetch("http://localhost/-/npm/v1/tokens", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"x-master-key": env.MASTER_KEY
				},
				body: JSON.stringify(body)
			});

			expect(response.status).toBe(201);

			const responseBody = await response.json();

			expect(responseBody).to.have.property("name", body.name);
			expect(responseBody).to.have.property("token").to.be.a("string");
			expect(responseBody).to.have.property("scopes").to.be.an("array").to.deep.equal(body.scopes);
			expect(responseBody).to.have.property("createdAt").to.be.a("number");
			expect(responseBody).to.have.property("updatedAt").to.be.a("number");
		});
	});

	describe("GET /tokens", () => {
		it("should not get tokens without providing the master key", async () => {
			const response = await SELF.fetch("http://localhost/-/npm/v1/tokens", {
				method: "GET"
			});

			expect(response.status).toBe(401);
			expect(response.statusText).toBe("Unauthorized");

			const responseBody = await response.text();
			expect(responseBody).toBe("Missing 'X-Master-Key' header");
		});

		it("should not get tokens with an invalid master key", async () => {
			const response = await SELF.fetch("http://localhost/-/npm/v1/tokens", {
				method: "GET",
				headers: {
					"x-master-key": "invalid_master_key"
				}
			});

			expect(response.status).toBe(401);
			expect(response.statusText).toBe("Unauthorized");

			const responseBody = await response.text();
			expect(responseBody).toBe("Invalid master key");
		});

		it("should get tokens", async () => {
			const { token, name, scopes, createdAt, updatedAt } = await createToken();

			const response = await SELF.fetch("http://localhost/-/npm/v1/tokens", {
				method: "GET",
				headers: {
					"x-master-key": env.MASTER_KEY
				}
			});

			expect(response.status).toBe(200);

			const responseBody = await response.json<(typeof tokenTable.$inferSelect)[]>();
			expect(responseBody).to.be.an("array").to.have.length(1);
			expect(responseBody[0]).to.have.property("token", token);
			expect(responseBody[0]).to.have.property("name", name);
			expect(responseBody[0]).to.have.property("scopes").to.be.deep.equal(scopes);
			expect(responseBody[0]).to.have.property("createdAt", createdAt);
			expect(responseBody[0]).to.have.property("updatedAt", updatedAt);
		});
	});

	describe("GET /tokens/:tokenId", () => {
		it("should not get a token without providing the master key", async () => {
			const response = await SELF.fetch("http://localhost/-/npm/v1/tokens/token/test-token", {
				method: "GET"
			});

			expect(response.status).toBe(401);
			expect(response.statusText).toBe("Unauthorized");

			const responseBody = await response.text();
			expect(responseBody).toBe("Missing 'X-Master-Key' header");
		});

		it("should not get a token with an invalid master key", async () => {
			const response = await SELF.fetch("http://localhost/-/npm/v1/tokens/token/test-token", {
				method: "GET",
				headers: {
					"x-master-key": "invalid_master_key"
				}
			});

			expect(response.status).toBe(401);
			expect(response.statusText).toBe("Unauthorized");

			const responseBody = await response.text();
			expect(responseBody).toBe("Invalid master key");
		});

		it("should get a token", async () => {
			const { token, name, scopes, createdAt, updatedAt } = await createToken();

			const response = await SELF.fetch(`http://localhost/-/npm/v1/tokens/token/${token}`, {
				method: "GET",
				headers: {
					"x-master-key": env.MASTER_KEY
				}
			});

			expect(response.status).toBe(200);

			const responseBody = await response.json<typeof tokenTable.$inferSelect>();

			expect(responseBody).to.be.an("object");
			expect(responseBody).to.have.property("token", token);
			expect(responseBody).to.have.property("name", name);
			expect(responseBody).to.have.property("scopes").to.be.deep.equal(scopes);
			expect(responseBody).to.have.property("createdAt", createdAt);
			expect(responseBody).to.have.property("updatedAt", updatedAt);
		});
	});

	describe("DELETE /tokens/token/:tokenId", () => {
		it("should not delete a token without providing the master key", async () => {
			const response = await SELF.fetch("http://localhost/-/npm/v1/tokens/token/test-token", {
				method: "DELETE"
			});

			expect(response.status).toBe(401);
			expect(response.statusText).toBe("Unauthorized");

			const responseBody = await response.text();
			expect(responseBody).toBe("Missing 'X-Master-Key' header");
		});

		it("should not delete a token with an invalid master key", async () => {
			const response = await SELF.fetch("http://localhost/-/npm/v1/tokens/token/test-token", {
				method: "DELETE",
				headers: {
					"x-master-key": "invalid_master_key"
				}
			});

			expect(response.status).toBe(401);
			expect(response.statusText).toBe("Unauthorized");

			const responseBody = await response.text();
			expect(responseBody).toBe("Invalid master key");
		});

		it("should delete a token", async () => {
			const { token } = await createToken();

			const response = await SELF.fetch(`http://localhost/-/npm/v1/tokens/token/${token}`, {
				method: "DELETE",
				headers: {
					"x-master-key": env.MASTER_KEY
				}
			});

			expect(response.status).toBe(200);

			const responseBody = await response.json();
			expect(responseBody).to.have.property("message").to.be.a("string").to.equal("ok");
		});
	});
});
