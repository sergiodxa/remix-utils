import { expect } from "vitest";

import "@testing-library/jest-dom";

function validateIsResponse(response: Response) {
	if (response instanceof Response === false) {
		return {
			pass: false,
			message() {
				return "The value to assert must be an instance of Response.";
			},
		};
	}
	return;
}

function toHaveStatus(response: Response, status: number) {
	let isNotResponse = validateIsResponse(response);
	if (isNotResponse) return isNotResponse;

	let pass = response.status === status;

	return {
		pass,
		message() {
			if (pass) {
				return `The status code of the Response should not be ${status}.`;
			}
			return `The status code of the Response should be ${status}, it was ${response.status}.`;
		},
	};
}

function toRedirect(response: Response | string, path?: string) {
	if (typeof response === "string") {
		return {
			pass: response === path,
			message() {
				if (response === path) {
					return `The Response should not redirect to ${path}`;
				}
				return `The response should redirect to ${path}`;
			},
		};
	}

	let isNotResponse = validateIsResponse(response);
	if (isNotResponse) return isNotResponse;

	let header = response.headers.get("Location");
	let status = response.status;

	let pass = status === 302 && path ? header === path : Boolean(header);

	return {
		pass,
		message() {
			if (pass) {
				return `The Response should not redirect to ${path}`;
			}
			return `The response should redirect to ${path}`;
		},
	};
}

function toSetACookie(response: Response) {
	let isNotResponse = validateIsResponse(response);
	if (isNotResponse) return isNotResponse;

	let hasSetCookie = response.headers.has("Set-Cookie");

	return {
		pass: hasSetCookie,
		message() {
			if (hasSetCookie) return "Expected the response to not set a cookie.";
			return "Expected the response to set a cookie.";
		},
	};
}

function toBeOk(response: Response) {
	let isNotResponse = validateIsResponse(response);
	if (isNotResponse) return isNotResponse;

	let pass = response.ok;

	return {
		pass,
		message() {
			if (pass) return "It should not to be ok.";
			return "It should be ok.";
		},
	};
}

function toHaveHeader(response: Response, name: string, value?: string) {
	let isNotResponse = validateIsResponse(response);
	if (isNotResponse) return isNotResponse;

	let pass = response.headers.has(name);

	if (!value) {
		return {
			pass,
			message() {
				if (pass) return `It should not have the header ${name}`;
				return `It should have the header ${name}`;
			},
		};
	}

	if (value) {
		pass = response.headers.get(name) === value;
	}

	return {
		pass,
		message() {
			if (pass) {
				return `It should not have the header ${name} with value ${value}, it was ${response.headers.get(
					name,
				)}`;
			}
			return `It should have the header ${name} with value ${value}, it was ${response.headers.get(
				name,
			)}`;
		},
	};
}

expect.extend({
	toRedirect,
	toSetACookie,
	toHaveStatus,
	toBeOk,
	toHaveHeader,
});
