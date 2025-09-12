/**
 * > This depends on `react`, `@oslojs/crypto`, and `@oslojs/encoding`.
 *
 * The Honeypot middleware allows you to add a honeypot mechanism to your routes, providing a simple yet effective way to protect public forms from spam bots.
 *
 * To use the Honeypot middleware, first import and configure it:
 *
 * ```ts
 * import { createHoneypotMiddleware } from "remix-utils/middleware/honeypot";
 *
 * export const [honeypotMiddleware, getHoneypotInputProps] =
 *   createHoneypotMiddleware({
 *     // Randomize the honeypot field name
 *     randomizeNameFieldName: false,
 *     // Default honeypot field name
 *     nameFieldName: "name__confirm",
 *     // Optional timestamp field for validation
 *     validFromFieldName: "from__confirm",
 *     // Unique seed for encryption (recommended for extra security)
 *     encryptionSeed: undefined,
 *
 *     onSpam(error) {
 *       // Handle SpamError here and return a Response
 *       return new Response("Spam detected", { status: 400 });
 *     },
 *   });
 * ```
 *
 * Add the `honeypotMiddleware` to the `middleware` array in the route where you want to enable spam protection, use it in your `app/root.tsx` file to apply it globally:
 *
 * ```ts
 * import { honeypotMiddleware } from "~/middleware/honeypot";
 *
 * export const middleware: Route.MiddlewareFunction[] = [honeypotMiddleware];
 * ```
 *
 * Use the `getHoneypotInputProps` function in your root loader to retrieve the honeypot input properties:
 *
 * ```ts
 * import { getHoneypotInputProps } from "~/middleware/honeypot";
 *
 * export async function loader({ request }: Route.LoaderArgs) {
 *   let honeypotInputProps = await getHoneypotInputProps();
 *   return json({ honeypotInputProps });
 * }
 * ```
 *
 * Wrap your application in the `HoneypotProvider` component to make the honeypot input properties available throughout your app:
 *
 * ```tsx
 * import { HoneypotProvider } from "remix-utils/honeypot/react";
 *
 * export default function RootComponent() {
 *   return (
 *     <HoneypotProvider {...honeypotInputProps}>
 *       <Outlet />
 *     </HoneypotProvider>
 *   );
 * }
 * ```
 *
 * In any public form, include the `HoneypotInputs` component to add the honeypot fields:
 *
 * ```tsx
 * import { HoneypotInputs } from "remix-utils/honeypot/react";
 *
 * function PublicForm() {
 *   return (
 *     <Form method="post">
 *       <HoneypotInputs label="Please leave this field blank" />
 *       <input type="text" name="name" placeholder="Your Name" />
 *       <input type="email" name="email" placeholder="Your Email" />
 *       <button type="submit">Submit</button>
 *     </Form>
 *   );
 * }
 * ```
 *
 * For requests with a body (e.g., POST, PUT, DELETE) and a content type of `application/x-www-form-urlencoded` or `multipart/form-data`, the middleware validates the honeypot fields. If the request passes the honeypot check, it proceeds to the action handler. If the honeypot check fails, the `onSpam` handler is invoked, allowing you to handle spam requests appropriately.
 *
 * In your action handlers, you can process the form data as usual, without worrying about spam checks—they are already handled by the middleware:
 *
 * ```ts
 * export async function action({ request }: Route.ActionArgs) {
 *   // If this code runs, the honeypot check passed
 *   let formData = await request.formData();
 *   let name = formData.get("name");
 *   let email = formData.get("email");
 *   // Process the form data
 * }
 * ```
 *
 * The honeypot middleware is designed to be lightweight and effective against basic spam bots. For advanced spam protection, consider combining this with other techniques like CAPTCHA or rate limiting.
 * @author [Sergio Xalambrí](https://sergiodxa.com)
 * @module Middleware/Honeypot
 */
import type { MiddlewareFunction } from "react-router";
import type { HoneypotConfig, HoneypotInputProps } from "../honeypot.js";
import { Honeypot, SpamError } from "../honeypot.js";

export function createHoneypotMiddleware({
	onSpam,
	...options
}: createHoneypotMiddleware.Options = {}): createHoneypotMiddleware.ReturnType {
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

export namespace createHoneypotMiddleware {
	export interface Options extends HoneypotConfig {
		onSpam?(error: SpamError): Response;
	}

	export type ReturnType = [
		MiddlewareFunction<Response>,
		() => Promise<HoneypotInputProps>,
	];
}
