import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import { createFactory } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { tokenTable } from "../../db/schema";
import { loadToken } from "../../middlewares/loadToken";
import { assertTokenAccess } from "../../utils/access";
import { postToken } from "./validators";

const tokenRouterFactory = createFactory<AppEnv>();

const postTokenHandler = tokenRouterFactory.createHandlers(loadToken, zValidator("json", postToken.json), async (c) => {
	const db = drizzle(c.env.DB);
	const can = assertTokenAccess(c.get("token"));

	if (!can("write", "token", "*")) {
		throw new HTTPException(403, { message: "Forbidden" });
	}

	const body = c.req.valid("json");
	const now = Date.now();

	const tokenQueryResult = await db
		.insert(tokenTable)
		.values({
			name: body.name,
			token: crypto.randomUUID(),
			scopes: body.scopes,
			createdAt: now,
			updatedAt: now
		})
		.returning();

	const [token] = tokenQueryResult;

	return c.json(token, 201);
});

const deleteTokenHandler = tokenRouterFactory.createHandlers(loadToken, async (c) => {
	const db = drizzle(c.env.DB);
	const can = assertTokenAccess(c.get("token"));

	if (!can("write", "token", "*")) {
		// special case for token
		throw new HTTPException(403, { message: "Forbidden" });
	}

	await db.delete(tokenTable).where(eq(tokenTable.token, c.req.param("token")));

	return c.json({ message: "ok" }, 200);
});

const getTokenHandler = tokenRouterFactory.createHandlers(loadToken, async (c) => {
	const db = drizzle(c.env.DB);
	const can = assertTokenAccess(c.get("token"));

	if (!can("read", "token", c.req.param("token"))) {
		throw new HTTPException(403, { message: "Forbidden" });
	}

	const tokenQueryResult = await db
		.select()
		.from(tokenTable)
		.where(eq(tokenTable.token, c.req.param("token")));

	if (tokenQueryResult.length === 0) {
		throw new HTTPException(404, { message: "Not found" });
	}

	const [token] = tokenQueryResult;

	return c.json(token);
});

const getTokensHandler = tokenRouterFactory.createHandlers(loadToken, async (c) => {
	const db = drizzle(c.env.DB);
	const can = assertTokenAccess(c.get("token"));

	if (!can("read", "token", "*")) {
		throw new HTTPException(403, { message: "Forbidden" });
	}

	const tokenQueryResult = await db.select().from(tokenTable);

	return c.json(tokenQueryResult);
});

export const tokenRouter = new Hono<AppEnv>()
	.post("/-/npm/v1/tokens", ...postTokenHandler)
	.get("/-/npm/v1/tokens", ...getTokensHandler)
	.get("/-/npm/v1/tokens/token/:token", ...getTokenHandler)
	.delete("/-/npm/v1/tokens/token/:token", ...deleteTokenHandler);
