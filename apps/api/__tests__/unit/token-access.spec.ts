import { describe, expect, it } from "vitest";
import type { tokenTable } from "../../src/db/schema";
import { assertTokenAccess } from "../../src/utils/access";

type Token = typeof tokenTable.$inferSelect;

describe("assertTokenAccess", () => {
	describe("Simple scope access control", () => {
		const readOnlyToken: Token = {
			name: "read-only-token",
			token: "test-token-1",
			createdAt: Date.now(),
			updatedAt: Date.now(),
			scopes: ["read"]
		};

		const writeOnlyToken: Token = {
			name: "write-only-token",
			token: "test-token-2",
			createdAt: Date.now(),
			updatedAt: Date.now(),
			scopes: ["write"]
		};

		const readWriteToken: Token = {
			name: "read-write-token",
			token: "test-token-3",
			createdAt: Date.now(),
			updatedAt: Date.now(),
			scopes: ["read", "write"]
		};

		const noScopesToken: Token = {
			name: "no-scopes-token",
			token: "test-token-4",
			createdAt: Date.now(),
			updatedAt: Date.now(),
			scopes: []
		};

		describe("Read access", () => {
			it("should allow read access with read-only token", () => {
				const access = assertTokenAccess(readOnlyToken);
				expect(access("read", "package", "@test/package")).toBe(true);
			});

			it("should not allow read access with write-only token", () => {
				const access = assertTokenAccess(writeOnlyToken);
				expect(access("read", "package", "@test/package")).toBe(false);
			});

			it("should allow read access with read-write token", () => {
				const access = assertTokenAccess(readWriteToken);
				expect(access("read", "package", "@test/package")).toBe(true);
			});

			it("should not allow read access with no scopes", () => {
				const access = assertTokenAccess(noScopesToken);
				expect(access("read", "package", "@test/package")).toBe(false);
			});
		});

		describe("Write access", () => {
			it("should not allow write access with read-only token", () => {
				const access = assertTokenAccess(readOnlyToken);
				expect(access("write", "package", "@test/package")).toBe(false);
			});

			it("should allow write access with write-only token", () => {
				const access = assertTokenAccess(writeOnlyToken);
				expect(access("write", "package", "@test/package")).toBe(true);
			});

			it("should allow write access with read-write token", () => {
				const access = assertTokenAccess(readWriteToken);
				expect(access("write", "package", "@test/package")).toBe(true);
			});

			it("should not allow write access with no scopes", () => {
				const access = assertTokenAccess(noScopesToken);
				expect(access("write", "package", "@test/package")).toBe(false);
			});
		});

		describe("Token and user access", () => {
			it("should allow token read access with read scope", () => {
				const access = assertTokenAccess(readOnlyToken);
				expect(access("read", "token", "*")).toBe(true);
			});

			it("should allow token write access with write scope", () => {
				const access = assertTokenAccess(writeOnlyToken);
				expect(access("write", "token", "*")).toBe(true);
			});

			it("should work with any entity type when scopes match", () => {
				const access = assertTokenAccess(readWriteToken);
				expect(access("read", "user", "test-user")).toBe(true);
				expect(access("write", "user", "test-user")).toBe(true);
				expect(access("read", "token", "some-token")).toBe(true);
				expect(access("write", "token", "some-token")).toBe(true);
			});
		});
	});
});
