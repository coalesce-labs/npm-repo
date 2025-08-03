import { SELF, env } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import { createToken } from "../utils";

import type { tokenTable } from "../../src/db/schema";

describe("token routes", () => {
	describe("POST /tokens", () => {
		it("should not create a token without being authenticated", async () => {
			const response = await SELF.fetch("http://localhost/-/npm/v1/tokens", {
				method: "POST",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify({
					name: "test-token",
					scopes: ["read", "write"]
				})
			});

			expect(response.status).toBe(403);
			expect(response.statusText).toBe("Forbidden");

			const responseBody = await response.text();
			expect(responseBody).toBe("Forbidden");
		});

		it("should not create a token with an invalid token", async () => {
			const response = await SELF.fetch("http://localhost/-/npm/v1/tokens", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: "Bearer invalid_token"
				},
				body: JSON.stringify({
					name: "test-token",
					scopes: ["read", "write"]
				})
			});

			expect(response.status).toBe(403);
			expect(response.statusText).toBe("Forbidden");

			const responseBody = await response.text();
			expect(responseBody).toBe("Forbidden");
		});

		it("should create a token with a token that has write scope", async () => {
			const { token } = await createToken({
				name: "test-token-creator",
				scopes: ["write"]
			});

			const response = await SELF.fetch("http://localhost/-/npm/v1/tokens", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`
				},
				body: JSON.stringify({
					name: "new-test-token",
					scopes: ["read"]
				})
			});

			expect(response.status).toBe(201);
		});

		it("should not create a token without providing at least one scope", async () => {
			const response = await SELF.fetch("http://localhost/-/npm/v1/tokens", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${env.ADMIN_TOKEN}`
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
					Authorization: `Bearer ${env.ADMIN_TOKEN}`
				},
				body: JSON.stringify({
					name: "test-token",
					scopes: ["invalid_scope"]
				})
			});

			expect(response.status).toBe(400);
			expect(response.statusText).toBe("Bad Request");
		});

		it("should create a token", async () => {
			const body = {
				name: "test-token",
				scopes: ["read", "write"]
			};

			const response = await SELF.fetch("http://localhost/-/npm/v1/tokens", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${env.ADMIN_TOKEN}`
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
		it("should not get tokens without been authenticated", async () => {
			const response = await SELF.fetch("http://localhost/-/npm/v1/tokens", {
				method: "GET"
			});

			expect(response.status).toBe(403);
			expect(response.statusText).toBe("Forbidden");

			const responseBody = await response.text();
			expect(responseBody).toBe("Forbidden");
		});

		it("should not get tokens with an invalid token", async () => {
			const response = await SELF.fetch("http://localhost/-/npm/v1/tokens", {
				method: "GET",
				headers: {
					Authorization: "Bearer invalid_token"
				}
			});

			expect(response.status).toBe(403);
			expect(response.statusText).toBe("Forbidden");

			const responseBody = await response.text();
			expect(responseBody).toBe("Forbidden");
		});

		it("should get tokens with a token that has read scope", async () => {
			const { token } = await createToken({
				name: "test-token-reader",
				scopes: ["read"]
			});

			const response = await SELF.fetch("http://localhost/-/npm/v1/tokens", {
				method: "GET",
				headers: {
					Authorization: `Bearer ${token}`
				}
			});

			expect(response.status).toBe(200);
		});

		it("should get tokens", async () => {
			const { token, name, scopes, createdAt, updatedAt } = await createToken();

			const response = await SELF.fetch("http://localhost/-/npm/v1/tokens", {
				method: "GET",
				headers: {
					Authorization: `Bearer ${env.ADMIN_TOKEN}`
				}
			});

			expect(response.status).toBe(200);

			const responseBody = await response.json<(typeof tokenTable.$inferSelect)[]>();
			expect(responseBody).to.be.an("array").to.have.length(2);

			const adminToken = responseBody.find((tokenDetails) => tokenDetails.token === env.ADMIN_TOKEN);
			expect(adminToken).to.be.an("object");
			expect(adminToken).to.have.property("token", env.ADMIN_TOKEN);
			expect(adminToken).to.have.property("name", "admin-token");
			expect(adminToken).to.have.property("scopes").to.be.deep.equal(["read", "write"]);

			const createdToken = responseBody.find((tokenDetails) => tokenDetails.token === token);
			expect(createdToken).to.be.an("object");
			expect(createdToken).to.have.property("token", token);
			expect(createdToken).to.have.property("name", name);
			expect(createdToken).to.have.property("scopes").to.be.deep.equal(scopes);
			expect(createdToken).to.have.property("createdAt", createdAt);
			expect(createdToken).to.have.property("updatedAt", updatedAt);
		});
	});

	describe("GET /tokens/:tokenId", () => {
		it("should not get a token without being authenticated", async () => {
			const response = await SELF.fetch("http://localhost/-/npm/v1/tokens/token/test-token", {
				method: "GET"
			});

			expect(response.status).toBe(403);
			expect(response.statusText).toBe("Forbidden");

			const responseBody = await response.text();
			expect(responseBody).toBe("Forbidden");
		});

		it("should not get a token with an invalid token", async () => {
			const response = await SELF.fetch("http://localhost/-/npm/v1/tokens/token/test-token", {
				method: "GET",
				headers: {
					Authorization: "Bearer invalid_token"
				}
			});

			expect(response.status).toBe(403);
			expect(response.statusText).toBe("Forbidden");

			const responseBody = await response.text();
			expect(responseBody).toBe("Forbidden");
		});

		it("should get a token with a token that has read scope", async () => {
			const { token } = await createToken({
				name: "test-token-reader",
				scopes: ["read"]
			});

			const response = await SELF.fetch(`http://localhost/-/npm/v1/tokens/token/${token}`, {
				method: "GET",
				headers: {
					Authorization: `Bearer ${token}`
				}
			});

			expect(response.status).toBe(200);
		});

		it("should get a token", async () => {
			const { token, name, scopes, createdAt, updatedAt } = await createToken();

			const response = await SELF.fetch(`http://localhost/-/npm/v1/tokens/token/${token}`, {
				method: "GET",
				headers: {
					Authorization: `Bearer ${env.ADMIN_TOKEN}`
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
		it("should not delete a token without being authenticated", async () => {
			const response = await SELF.fetch("http://localhost/-/npm/v1/tokens/token/test-token", {
				method: "DELETE"
			});

			expect(response.status).toBe(403);
			expect(response.statusText).toBe("Forbidden");

			const responseBody = await response.text();
			expect(responseBody).toBe("Forbidden");
		});

		it("should not delete a token with an invalid token", async () => {
			const response = await SELF.fetch("http://localhost/-/npm/v1/tokens/token/test-token", {
				method: "DELETE",
				headers: {
					Authorization: "Bearer invalid_token"
				}
			});

			expect(response.status).toBe(403);
			expect(response.statusText).toBe("Forbidden");

			const responseBody = await response.text();
			expect(responseBody).toBe("Forbidden");
		});

		it("should delete a token with a token that has write scope", async () => {
			const { token: tokenToDelete } = await createToken({
				name: "token-to-delete",
				scopes: ["read"]
			});

			const { token: deleterToken } = await createToken({
				name: "deleter-token",
				scopes: ["write"]
			});

			const response = await SELF.fetch(`http://localhost/-/npm/v1/tokens/token/${tokenToDelete}`, {
				method: "DELETE",
				headers: {
					Authorization: `Bearer ${deleterToken}`
				}
			});

			expect(response.status).toBe(200);
		});

		it("should delete a token", async () => {
			const { token } = await createToken();

			const response = await SELF.fetch(`http://localhost/-/npm/v1/tokens/token/${token}`, {
				method: "DELETE",
				headers: {
					Authorization: `Bearer ${env.ADMIN_TOKEN}`
				}
			});

			expect(response.status).toBe(200);

			const responseBody = await response.json();
			expect(responseBody).to.have.property("message").to.be.a("string").to.equal("ok");
		});
	});
});
