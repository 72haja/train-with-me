import {
    convexAuthNextjsMiddleware,
    createRouteMatcher,
    nextjsMiddlewareRedirect,
} from "@convex-dev/auth/nextjs/server";

const isAuthPage = createRouteMatcher(["/auth(.*)"]);
const isPublicRoute = createRouteMatcher([
    "/auth(.*)",
    "/api/auth(.*)",
    "/api/stations(.*)",
    "/api/vvs(.*)",
]);

export default convexAuthNextjsMiddleware(async (request, { convexAuth }) => {
    const authenticated = await convexAuth.isAuthenticated();

    if (isAuthPage(request) && authenticated) {
        return nextjsMiddlewareRedirect(request, "/");
    }

    if (!isPublicRoute(request) && !authenticated) {
        return nextjsMiddlewareRedirect(request, "/auth/signin");
    }
});

export const config = {
    matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
