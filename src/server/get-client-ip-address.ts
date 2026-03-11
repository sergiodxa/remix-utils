/**
 * > [!NOTE]
 * > Install using `bunx shadcn@latest add @remix-utils/get-client-ip-address`.
 *
 * > [!NOTE]
 * > This depends on `is-ip`.
 *
 * This function receives a Request or Headers objects and will try to get the IP address of the client (the user) who originated the request.
 *
 * ```ts
 * import { getClientIPAddress } from "remix-utils/get-client-ip-address";
 *
 * export async function loader({ request }: Route.LoaderArgs) {
 * 	// using the request
 * 	let ipAddress = getClientIPAddress(request);
 * 	// or using the headers
 * 	let ipAddress = getClientIPAddress(request.headers);
 * }
 * ```
 *
 * If it can't find he IP address the return value will be `null`. Remember to check if it was able to find it before using it.
 *
 * The function uses the following list of headers, in order of preference:
 *
 * - X-Client-IP
 * - X-Forwarded-For
 * - HTTP-X-Forwarded-For
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
 * - oxygen-buyer-ip
 *
 * When a header is found that contains a valid IP address, it will return without checking the other headers.
 *
 * > [!WARNING]
 * > On local development the function is most likely to return `null`. This is because the browser doesn't send any of the above headers, if you want to simulate those headers you will need to either add it to the request Remix receives in your HTTP server or run a reverse proxy like NGINX that can add them for you.
 *
 * @author [Sergio Xalambrí](https://sergiodxa.com)
 * @module Server/Get Client IP Address
 */
import { isIP } from "is-ip";
import { getHeaders } from "./get-headers.js";

/**
 * This is the list of headers, in order of preference, that will be used to
 * determine the client's IP address.
 */
const headerNames = Object.freeze([
	"X-Azure-ClientIP" /** Azure Front Door */,
	"X-Client-IP",
	"X-Forwarded-For",
	"HTTP-X-Forwarded-For",
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
 * - HTTP-X-Forwarded-For
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
 * - oxygen-buyer-ip
 *
 * If the IP address is valid, it will be returned. Otherwise, null will be
 * returned.
 *
 * If the header values contains more than one IP address, the first valid one
 * will be returned.
 */
export function getClientIPAddress(headers: Headers): string | null;
export function getClientIPAddress(request: Request): string | null;
export function getClientIPAddress(requestOrHeaders: Request | Headers): string | null {
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
	}
	return null;
}
