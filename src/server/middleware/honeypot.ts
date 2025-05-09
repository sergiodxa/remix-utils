import type { unstable_MiddlewareFunction } from "react-router";
import type { HoneypotConfig, HoneypotInputProps } from "../honeypot.js";
import { Honeypot, SpamError } from "../honeypot.js";

export function unstable_createHoneypotMiddleware({
	onSpam,
	...options
}: unstable_createHoneypotMiddleware.Options = {}): unstable_createHoneypotMiddleware.ReturnType {
	let honeypot = new Honeypot(options);

	return [
		async function middleware({ request }, next) {
			// If there's no body, we can skip the honeypot check (e.g. GET requests)
			if (request.body === null) return await next();
			// If the request is not a form submission, we can skip the honeypot check
			// (e.g. JSON or other types of requests)
			if (!isFormData(request)) return await next();

			try {
				let formData = await request.clone().formData();
				await honeypot.check(formData);
			} catch (error) {
				// If the error is a SpamError, we can handle it here and return a
				// custom response if provided.
				// Otherwise, we throw the error to be handled by the next middleware
				// or the error boundary.
				// This allows us to customize the response for spam errors while still
				// allowing other errors to propagate normally.
				if (error instanceof SpamError && onSpam) return onSpam(error);
				throw error;
			}

			return await next();
		},

		function getInputProps() {
			return honeypot.getInputProps();
		},
	];

	// Check if the request is a form submission by checking the content-type
	// This is needed because the Honeypot class only accepts FormData and we want
	// to prevent unnecessarily parsing of the request body for other types of
	// requests.
	function isFormData(request: Request) {
		let contentType = request.headers.get("content-type") ?? "";
		if (contentType.includes("multipart/form-data")) return true;
		if (contentType.includes("application/x-www-form-urlencoded")) return true;
		return false;
	}
}

export namespace unstable_createHoneypotMiddleware {
	export interface Options extends HoneypotConfig {
		onSpam?(error: SpamError): Response;
	}

	export type ReturnType = [
		unstable_MiddlewareFunction<Response>,
		() => Promise<HoneypotInputProps>,
	];
}
