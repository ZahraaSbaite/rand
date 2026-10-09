import "./netlifyEnv.js";
import serverless from "serverless-http";
import { connectLambda } from "@netlify/blobs";
import app from "./app.js";

// Netlify function entry point (re-exported by frontend/netlify/functions/api.mjs).

const handle = serverless(app, { binary: ["image/*"] });

export const handler = async (event, context) => {
  if (event.blobs) connectLambda(event);
  // serverless-http takes the client IP from here; Netlify sends it as a header.
  const ip = event.headers?.["x-nf-client-connection-ip"];
  if (ip) {
    event.requestContext = { ...event.requestContext, identity: { ...event.requestContext?.identity, sourceIp: ip } };
  }
  return handle(event, context);
};
