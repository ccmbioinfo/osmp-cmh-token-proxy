import { ClientRequest, createServer } from "http";
import { createProxyServer } from "http-proxy";
// import { verify } from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const LISTEN_PORT = process.env.LISTEN_PORT;
const TARGET_ADDRESS = process.env.TARGET_ADDRESS;
const TARGET_PORT = process.env.TARGET_PORT;

const PT_AUTHORIZATION = process.env.PT_AUTHORIZATION;
const EXPECTED_GENE42_SECRET = process.env.PT_SECRET;

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

var server = createServer(function (req, res) {
  proxy.web(req, res, {
    target: `${TARGET_ADDRESS}:${TARGET_PORT}`,
  });
});

server.listen(LISTEN_PORT);
