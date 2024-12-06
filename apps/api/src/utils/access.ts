import type { tokenTable } from "../db/schema";

export const assertTokenAccess = (token: typeof tokenTable.$inferSelect) => {
	return (operation: "read" | "write", targetedPackage: string) => {
		const targetedScopesValue = (token?.scopes ?? [])
			.filter(({ type }) => type.includes(operation))
			.flatMap(({ values }) => values);

		return targetedScopesValue.some((value) => value === "*" || value === targetedPackage);
	};
};
