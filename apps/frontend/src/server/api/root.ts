import { incidentRouter } from "@/server/api/routers/incident";
import { monitorRouter } from "@/server/api/routers/monitor";
import { notificationRouter } from "@/server/api/routers/notification";
import { postRouter } from "@/server/api/routers/post";
import { siteSettingsRouter } from "@/server/api/routers/site-settings";
import { statusPageRouter } from "@/server/api/routers/status-page";
import { userRouter } from "@/server/api/routers/user";
import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
	post: postRouter,
	user: userRouter,
	monitor: monitorRouter,
	incident: incidentRouter,
	statusPage: statusPageRouter,
	notification: notificationRouter,
	siteSettings: siteSettingsRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
