import type { tokenTable } from "../db/schema";

export const assertTokenAccess = (token: typeof tokenTable.$inferSelect) => {
	return (operation: "read" | "write", entity: "user" | "package" | "token", targetedPackage: string) => {
		const scopes = token?.scopes ?? [];

		// Check if token has the required operation scope
		if (!scopes.includes(operation)) {
			return false;
		}

		// For now, if the token has read or write scope, it can access all packages
		// Later this can be enhanced to support scoped access like "@org/*" or specific packages
		return true;
	};
};
