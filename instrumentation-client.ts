import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn:
    process.env.NEXT_PUBLIC_SENTRY_DSN ??
    "https://30f07f3eb7a31780a1616c0e415ca876@o4511669602418688.ingest.us.sentry.io/4511669614936064",

  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,

  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  enableLogs: true,

  integrations: [Sentry.replayIntegration()]
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
