import isIP from "is-ip";
import { getHeaders } from "./get-headers";

/**
 * This is the list of headers, in order of preference, that will be used to
 * determine the client's IP address.
 */
const headerNames = Object.freeze([
  "X-Client-IP",
  "X-Forwarded-For",
  "Fly-Client-IP",
  "CF-Connecting-IP",
  "Fastly-Client-Ip",
  "True-Client-Ip",
  "X-Real-IP",
  "X-Cluster-Client-IP",
  "X-Forwarded",
  "Forwarded-For",
  "Forwarded",
  "DO-Connecting-IP" /** Digital ocean app platform */,
  "oxygen-buyer-ip" /** Shopify oxygen platform */,
] as const);

/**
 * Get the IP address of the client sending a request.
 *
 * It receives the Request object or the headers object and use it to get the
 * IP address from one of the following headers in order.
 *
 * - X-Client-IP
 * - X-Forwarded-For
 * - Fly-Client-IP
 * - CF-Connecting-IP
 * - Fastly-Client-Ip
 * - True-Client-Ip
 * - X-Real-IP
 * - X-Cluster-Client-IP
 * - X-Forwarded
 * - Forwarded-For
 * - Forwarded
 * - DO-Connecting-IP
 *
 * If the IP address is valid, it will be returned. Otherwise, null will be
 * returned.
 *
 * If the header values contains more than one IP address, the first valid one
 * will be returned.
 */
export function getClientIPAddress(headers: Headers): string | null;
export function getClientIPAddress(request: Request): string | null;
export function getClientIPAddress(
  requestOrHeaders: Request | Headers
): string | null {
  let headers = getHeaders(requestOrHeaders);

  let ipAddress = headerNames
    .flatMap((headerName) => {
      let value = headers.get(headerName);
      if (headerName === "Forwarded") {
        return parseForwardedHeader(value);
      }
      if (!value?.includes(",")) return value;
      return value.split(",").map((ip) => ip.trim());
    })
    .find((ip) => {
      if (ip === null) return false;
      return isIP(ip);
    });

  return ipAddress ?? null;
}

function parseForwardedHeader(value: string | null): string | null {
  if (!value) return null;
  for (let part of value.split(";")) {
    if (part.startsWith("for=")) return part.slice(4);
    continue;
  }
  return null;
}
