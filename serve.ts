import { Application } from "oak";
import createRouter from "@/createRouter.ts";

const app = new Application();
const router = await createRouter();
app.use(router.routes());
app.use(router.allowedMethods());
await app.listen({ port: 8080 });
