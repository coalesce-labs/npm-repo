import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";

export const checkMasterKey = createMiddleware<AppEnv>(async (c, next) => {
	const requestMasterKey = c.req.header("x-master-key");

	if (!c.env.MASTER_KEY) {
		throw new HTTPException(401, { message: "Master key is not set, please set the MASTER_KEY environment variable" });
	}

	if (!requestMasterKey) {
		throw new HTTPException(401, { message: "Missing 'X-Master-Key' header" });
	}

	if (requestMasterKey !== c.env.MASTER_KEY) {
		throw new HTTPException(401, { message: "Invalid master key" });
	}

	await next();
});
