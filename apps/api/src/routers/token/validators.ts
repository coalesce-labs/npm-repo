import { z } from "zod";

export const postToken = {
	json: z.object({
		name: z.string(),
		scopes: z
			.array(z.enum(["read", "write"]))
			.min(1)
			.describe("Array of scopes: 'read' for reading packages, 'write' for publishing packages")
	})
};
