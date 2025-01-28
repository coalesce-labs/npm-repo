import type { HonoRequest } from "hono";
import { HTTPException } from "hono/http-exception";

export const uint8ArrayFromBinaryString = (binaryString: string) => {
	const uint8Array = new Uint8Array(binaryString.length);

	for (let i = 0; i < binaryString.length; ++i) {
		uint8Array[i] = binaryString.charCodeAt(i);
	}

	return uint8Array;
};

export const ensureRequestParam = (request: HonoRequest, param: string) => {
	const paramValue = request.param(param);
	if (paramValue === undefined) {
		throw new HTTPException(400, { message: `Missing url parameter: ${param}` });
	}

	return paramValue;
};
