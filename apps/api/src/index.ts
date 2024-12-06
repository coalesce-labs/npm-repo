import { Hono } from "hono";
import { packageRouter } from "./router/package";
import { tokenRouter } from "./router/token";

const app = new Hono();

const routes = app.route("/", tokenRouter).route("/", packageRouter);

export type Routes = typeof routes;

export default app;
