# OSMP-CMH Token Proxy

A small proxy server for swapping authorization headers in OSMP requests to PhenoTips at CMH.

Currently, CMH uses a Microsoft Azure Application Proxy to gatekeep applications at CMH. OSMP requests need to include a bearer token in the Authorization header in order to access CMH applications.

However, PhenoTips also requires Basic credentials in the Authorization header for API requests, as well as a secret header. This proxy server checks for the secret header to see if it matches the credentials belonging to OSMP, and swaps the Authorization header if the secret header matches.

## Setup

WIP

## Questions / Considerations

- A request to PhenoTips is considered "from OSMP" if the `X-Gene42-Secret` header value matches the value provided to OSMP by the PhenoTips team.

- Every request to CMH's PhenoTips instance will have to pass through this proxy, so we want to minimize runtime as much as possible.

- **Q: Should we set a cookie for OSMP / non-OSMP requests?**

  - The only check is for whether the `X-Gene42-Secret` header exists, if the value matches what we expect, and if the `Authorization` header exists. Checking for cookies is effectively more instructions and thus a longer runtime.

- **Q: Should we validate the Bearer token provided for the Azure proxy?**
  - This would be an excellent way to validate OSMP requests, since we can validate the token with Azure's public key and check the client ID. However, this requires sending an HTTP request to Azure to get the public key, adding wait time. We know that only OSMP has the specific `X-Gene42-Secret` value, so checking this header is sufficient.
