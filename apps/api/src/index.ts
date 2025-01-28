import { Hono } from "hono";
import { packageRouter } from "./routers/package";
import { tokenRouter } from "./routers/token";

const app = new Hono();

const routes = app.route("/", tokenRouter).route("/", packageRouter);

export type Routes = typeof routes;

export default app;
