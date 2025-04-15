import { Hono } from "hono";
import { showRoutes } from "hono/dev";
import v1 from "./api/v1";
import v2 from "./api/v2";

const app = new Hono<{ Bindings: Env }>().basePath("/api");
// .use("*", bearerAuth({ token: env.API_TOKEN }));

app.route("/", v1);
app.route("/", v2);

console.log(showRoutes(app));

export default app;
