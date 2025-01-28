import { z } from "zod";

export const postToken = {
	json: z.object({
		name: z.string(),
		scopes: z
			.array(
				z.object({
					type: z.enum([
						"package:read",
						"package:write",
						"package:read+write",

						"user:read",
						"user:write",
						"user:read+write",

						"token:read",
						"token:write",
						"token:read+write"
					]),
					values: z.array(z.string())
				})
			)
			.min(1)
	})
};
