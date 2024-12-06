import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { createMiddleware } from "hono/factory";
import { tokenTable } from "../db/schema";

export const loadToken = createMiddleware<AppEnv>(async (c, next) => {
	const db = drizzle(c.env.DB);

	const authorizationHeader = c.req.header("Authorization");

	if (!authorizationHeader) {
		return await next();
	}

	const [, token] = authorizationHeader.split(" ");

	if (!token) {
		return await next();
	}

	const tokenQueryResult = await db.select().from(tokenTable).where(eq(tokenTable.token, token));

	const tokenDetails = tokenQueryResult.at(0);
	if (tokenDetails) {
		c.set("token", tokenDetails);
	}

	await next();
});
