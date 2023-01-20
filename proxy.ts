import { ClientRequest, createServer } from "http";
import { createProxyServer } from "http-proxy";
import dotenv from "dotenv";
import { hostname } from "os";

dotenv.config();

const LISTEN_HOST =
  process.env.LISTEN_HOST!.toLowerCase() === "hostname"
    ? hostname()
    : process.env.LISTEN_HOST!;
const LISTEN_PORT = parseInt(process.env.LISTEN_PORT!);
const TARGET_HOST = process.env.TARGET_HOST!;
const TARGET_PORT = parseInt(process.env.TARGET_PORT!);

const PT_AUTHORIZATION = process.env.PT_AUTHORIZATION;
const EXPECTED_GENE42_SECRET = process.env.PT_SECRET;

if (PT_AUTHORIZATION === undefined || PT_AUTHORIZATION === "")
  throw Error("PT_AUTHORIZATION not set in env!");

if (EXPECTED_GENE42_SECRET === undefined || EXPECTED_GENE42_SECRET === "")
  throw Error("PT_SECRET not set in env!");

var proxy = createProxyServer();

// Extract <token> from "Authorization: Bearer <token>" header
// Not currently used. May be used in the future.
function parseAuthorizationToken(header: string): string | null {
  const bearerTokenPattern = new RegExp("^ ?Bearer (?<token>[S]+)$");
  const tokenMatch = bearerTokenPattern.exec(header);
  if (
    tokenMatch === null ||
    tokenMatch.groups === undefined ||
    tokenMatch.groups.token === undefined
  )
    return null;

  return tokenMatch.groups.token;
}

function headerIsString(
  header: ReturnType<ClientRequest["getHeader"]>
): header is string {
  return typeof header === "string";
}

function isOSMPRequest(proxyReq: ClientRequest) {
  // Return whether this request is an authorized request from the OSMP server
  const authHeader = proxyReq.getHeader("Authorization");
  if (!headerIsString(authHeader)) return false;
  const gene42SecretHeader = proxyReq.getHeader("X-Gene42-Secret");
  if (!headerIsString(gene42SecretHeader)) return false;

  // Only OSMP has this secret
  if (gene42SecretHeader !== EXPECTED_GENE42_SECRET) return false;

  return true;
}

proxy.on("proxyReq", function (proxyReq, req, res, options) {
  if (isOSMPRequest(proxyReq)) {
    proxyReq.removeHeader("Authorization");
    proxyReq.setHeader("Authorization", `Basic ${PT_AUTHORIZATION}`);
  }
});

// Additional handlers for dev logging only
if (process.env.NODE_ENV === "development") {
  proxy.on("proxyReq", function (proxyReq, req, res, options) {
    console.log("##### proxyReq #####");
    console.log(proxyReq);
  });

  proxy.on("proxyRes", function (proxyRes, req, res) {
    console.log("##### proxyRes #####");
    console.log(proxyRes);
  });
}

var server = createServer(function (req, res) {
  proxy.web(req, res, {
    target: `http://${TARGET_HOST}:${TARGET_PORT}`,
  });
});

server.listen(LISTEN_PORT, LISTEN_HOST, undefined, () => {
  console.log(
    `OSMP-CMH Proxy listening to ${LISTEN_HOST} on port ${LISTEN_PORT}.`
  );
});
