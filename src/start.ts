import { createCsrfMiddleware, createMiddleware, createStart } from "@tanstack/react-start";

const securityHeaders = createMiddleware().server(async ({ next }) => {
  const { setResponseHeader } = await import("@tanstack/react-start/server");
  setResponseHeader("X-Content-Type-Options", "nosniff");
  setResponseHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  setResponseHeader("X-Frame-Options", "SAMEORIGIN");
  setResponseHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  return next();
});

const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === "serverFn",
});

export const startInstance = createStart(() => ({
  requestMiddleware: [securityHeaders, csrfMiddleware],
}));
