import { describe, expect, test } from "bun:test";
import { getClientIPAddress } from "./get-client-ip-address";

const VALID_IP = "192.168.0.1";
const INVALID_IP = "abc.def.ghi.jkl";

const headerNames = [
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
];

describe(getClientIPAddress.name, () => {
	describe("Get the IP if it's valid", () => {
		test.each(headerNames)("%s", (headerName) => {
			let headers = new Headers();

			for (let header of headerNames) {
				if (headerName === "Forwarded") {
					headers.set(headerName, serializeForwardedHeader(VALID_IP));
				} else headers.set(header, INVALID_IP);
			}

			if (headerName === "Forwarded") {
				headers.set(headerName, serializeForwardedHeader(VALID_IP));
			} else headers.set(headerName, VALID_IP);

			expect(getClientIPAddress(headers)).toBe(VALID_IP);
		});

		describe("From the first valid matching header", () => {
			test.each(headerNames)("%s", (headerName) => {
				let headers = new Headers();

				for (let header of headerNames) {
					if (headerName === "Forwarded") {
						headers.set(headerName, serializeForwardedHeader(VALID_IP));
					} else headers.set(header, VALID_IP);
				}

				for (let header of headerNames.slice(
					0,
					headerNames.indexOf(headerName),
				)) {
					headers.delete(header);
				}
				expect(getClientIPAddress(headers)).toBe(VALID_IP);
			});
		});

		describe("When there are multiple values", () => {
			test.each(headerNames)("%s", (headerName) => {
				let headers = new Headers();
				if (headerName === "Forwarded") return;
				headers.append(headerName, VALID_IP);
				headers.append(headerName, "203.0.113.195");
				headers.append(headerName, "70.41.3.18");
				headers.append(headerName, "150.172.238.178");
				expect(getClientIPAddress(headers)).toBe(VALID_IP);
			});

			describe("Use first valid one", () => {
				test.each(headerNames)("%s", (headerName) => {
					let headers = new Headers();
					if (headerName === "Forwarded") return;
					headers.append(headerName, INVALID_IP);
					headers.append(headerName, VALID_IP);
					headers.append(headerName, "203.0.113.195");
					headers.append(headerName, "70.41.3.18");
					headers.append(headerName, "150.172.238.178");
					expect(getClientIPAddress(headers)).toBe(VALID_IP);
				});
			});
		});
	});

	describe("Get null if IP is invalid", () => {
		test.each(headerNames)("%s", (headerName) => {
			let headers = new Headers();

			if (headerName === "Forwarded") {
				headers.set(headerName, serializeForwardedHeader(INVALID_IP));
			} else headers.set(headerName, INVALID_IP);

			expect(getClientIPAddress(headers)).toBe(null);
		});
	});

	test("Get null if there's no header", () => {
		let headers = new Headers();
		expect(getClientIPAddress(headers)).toBe(null);
	});
});

function serializeForwardedHeader(ip: string): string {
	return `for=${ip};by=${ip};proto=http;host=${ip}`;
}
