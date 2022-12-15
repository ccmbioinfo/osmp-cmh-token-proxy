# OSMP-CMH Token Proxy

A small proxy server for swapping authorization headers in OSMP requests to PhenoTips at CMH.

Currently, CMH uses a Microsoft Azure Application Proxy to gatekeep applications at CMH. OSMP requests need to include a bearer token in the Authorization header in order to access CMH applications.

However, PhenoTips also requires Basic credentials in the Authorization header for API requests, as well as a secret header. This proxy server checks for the secret header to see if it matches the credentials belonging to OSMP, and swaps the Authorization header if the secret header matches.

## Setup

- Make sure that you have `npm` and `node` installed on your machine.

- Copy `proxy/sample.env` to `proxy/.env` and fill out each variable as described below:

  - `NODE_ENV` : Leave as `production` by default. Set to `development` for debugging.
  - `LISTEN_HOST` : The IP address of the network interface you want to listen on.
  - `LISTEN_PORT` : The port that this proxy server will listen for requests on.
  - `TARGET_HOST` : The IP address to forward requests to. eg. `127.0.0.1`
  - `TARGET_PORT` : The port for the address to forward requests to.
  - `PT_AUTHORIZATION` : OSMP's base64-encoded Basic credentials for CMH PhenoTips.
  - `PT_SECRET` : Expected `X-Gene42-Secret` header value from OSMP.

- Build and start with `npm run start`.

## Questions / Considerations

- A request to PhenoTips is considered "from OSMP" if the `X-Gene42-Secret` header value matches the value provided to OSMP by the PhenoTips team.

- Every request to CMH's PhenoTips instance will have to pass through this proxy, so we want to minimize runtime as much as possible.

- **Q: Should we set a cookie for OSMP / non-OSMP requests?**

  - The only check is for whether the `X-Gene42-Secret` header exists, if the value matches what we expect, and if the `Authorization` header exists. Checking for cookies is effectively more instructions and thus a longer runtime.

- **Q: Should we validate the Bearer token provided for the Azure proxy?**
  - This would be an excellent way to validate OSMP requests, since we can validate the token with Azure's public key and check the client ID. However, this requires sending an HTTP request to Azure to get the public key, adding wait time. We know that only OSMP has the specific `X-Gene42-Secret` value, so checking this header is sufficient.
