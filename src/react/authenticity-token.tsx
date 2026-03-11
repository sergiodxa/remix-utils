/**
 * > [!NOTE]
 * > Install using `bunx shadcn@latest add @remix-utils/csrf-server` and `bunx shadcn@latest add @remix-utils/csrf-react`.
 *
 * > [!NOTE]
 * > This depends on `react`, `@oslojs/crypto`, `@oslojs/encoding`, and React Router.
 *
 * The CSRF related functions let you implement CSRF protection on your application.
 *
 * This part of Remix Utils needs React and server-side code.
 *
 * First create a new CSRF instance.
 *
 * ```ts
 * // app/utils/csrf.server.ts
 * import { CSRF } from "remix-utils/csrf/server";
 * import { createCookie } from "react-router"; // or cloudflare/deno
 *
 * export const cookie = createCookie("csrf", {
 * 	path: "/",
 * 	httpOnly: true,
 * 	secure: process.env.NODE_ENV === "production",
 * 	sameSite: "lax",
 * 	secrets: ["s3cr3t"],
 * });
 *
 * export const csrf = new CSRF({
 * 	cookie,
 * 	// what key in FormData objects will be used for the token, defaults to `csrf`
 * 	formDataKey: "csrf",
 * 	// an optional secret used to sign the token, recommended for extra safety
 * 	secret: "s3cr3t",
 * });
 * ```
 *
 * Then you can use `csrf` to generate a new token.
 *
 * ```ts
 * import { csrf } from "~/utils/csrf.server";
 *
 * export async function loader({ request }: Route.LoaderArgs) {
 * 	let token = csrf.generate();
 * }
 * ```
 *
 * You can customize the token size by passing the byte size, the default one is 32 bytes which will give you a string with a length of 43 after encoding.
 *
 * ```ts
 * let token = csrf.generate(64); // customize token length
 * ```
 *
 * You will need to save this token in a cookie and also return it from the loader. For convenience, you can use the `CSRF#commitToken` helper.
 *
 * ```ts
 * import { csrf } from "~/utils/csrf.server";
 *
 * export async function loader({ request }: Route.LoaderArgs) {
 * 	let [token, cookieHeader] = await csrf.commitToken(request);
 * 	return json({ token }, { headers: { "set-cookie": cookieHeader } });
 * }
 * ```
 *
 * > [!NOTE]
 * > You could do this on any route, but I recommend you to do it on the `root` loader.
 *
 * Now that you returned the token and set it in a cookie, you can use the `AuthenticityTokenProvider` component to provide the token to your React components.
 *
 * ```tsx
 * import { AuthenticityTokenProvider } from "remix-utils/csrf/react";
 *
 * let { csrf } = useLoaderData<LoaderData>();
 * return (
 * 	<AuthenticityTokenProvider token={csrf}>
 * 		<Outlet />
 * 	</AuthenticityTokenProvider>
 * );
 * ```
 *
 * Render it in your `root` component and wrap the `Outlet` with it.
 *
 * When you create a form in some route, you can use the `AuthenticityTokenInput` component to add the authenticity token to the form.
 *
 * ```tsx
 * import { Form } from "react-router";
 * import { AuthenticityTokenInput } from "remix-utils/csrf/react";
 *
 * export default function Component() {
 * 	return (
 * 		<Form method="post">
 * 			<AuthenticityTokenInput />
 * 			<input type="text" name="something" />
 * 		</Form>
 * 	);
 * }
 * ```
 *
 * Note that the authenticity token is only really needed for a form that mutates the data somehow. If you have a search form making a GET request, you don't need to add the authenticity token there.
 *
 * This `AuthenticityTokenInput` will get the authenticity token from the `AuthenticityTokenProvider` component and add it to the form as the value of a hidden input with the name `csrf`. You can customize the field name using the `name` prop.
 *
 * ```tsx
 * <AuthenticityTokenInput name="customName" />
 * ```
 *
 * You should only customize the name if you also changed it on `createAuthenticityToken`.
 *
 * If you need to use `useFetcher` (or `useSubmit`) instead of `Form` you can also get the authenticity token with the `useAuthenticityToken` hook.
 *
 * ```tsx
 * import { useFetcher } from "react-router";
 * import { useAuthenticityToken } from "remix-utils/csrf/react";
 *
 * export function useMarkAsRead() {
 * 	let fetcher = useFetcher();
 * 	let csrf = useAuthenticityToken();
 * 	return function submit(data) {
 * 		fetcher.submit({ csrf, ...data }, { action: "/api/mark-as-read", method: "post" });
 * 	};
 * }
 * ```
 *
 * Finally, you need to validate the authenticity token in the action that received the request.
 *
 * ```ts
 * import { CSRFError } from "remix-utils/csrf/server";
 * import { redirectBack } from "remix-utils/redirect-back";
 * import { csrf } from "~/utils/csrf.server";
 *
 * export async function action({ request }: Route.ActionArgs) {
 * 	try {
 * 		await csrf.validate(request);
 * 	} catch (error) {
 * 		if (error instanceof CSRFError) {
 * 			// handle CSRF errors
 * 		}
 * 		// handle other possible errors
 * 	}
 *
 * 	// here you know the request is valid
 * 	return redirectBack(request, { fallback: "/fallback" });
 * }
 * ```
 *
 * If you need to parse the body as FormData yourself (e.g. to support file uploads) you can also call `CSRF#validate` with the FormData and Headers objects.
 *
 * ```ts
 * let formData = await parseMultiPartFormData(request);
 * try {
 * 	await csrf.validate(formData, request.headers);
 * } catch (error) {
 * 	// handle errors
 * }
 * ```
 *
 * > [!WARNING]
 * > If you call `CSRF#validate` with the request instance, but you already read its body, it will throw an error.
 *
 * In case the CSRF validation fails, it will throw a `CSRFError` which can be used to correctly identify it against other possible errors that may get thrown.
 *
 * The list of possible error messages are:
 *
 * - `missing_token_in_cookie`: The request is missing the CSRF token in the cookie.
 * - `invalid_token_in_cookie`: The CSRF token is not valid (is not a string).
 * - `tampered_token_in_cookie`: The CSRF token doesn't match the signature.
 * - `missing_token_in_body`: The request is missing the CSRF token in the body (FormData).
 * - `mismatched_token`: The CSRF token in the cookie and the body don't match.
 *
 * You can use `error.code` to check one of the error codes above, and `error.message` to get a human friendly description.
 *
 * > [!WARNING]
 * > Don't send those error messages to the end-user, they are meant to be used for debugging purposes only.
 *
 * @author [Sergio Xalambrí](https://sergiodxa.com)
 * @module Component/Authenticity Token
 */
import * as React from "react";

export interface AuthenticityTokenProviderProps {
	children: React.ReactNode;
	token: string;
}

export interface AuthenticityTokenInputProps {
	name?: string;
}

let context = React.createContext<string | null>(null);

/**
 * Save the Authenticity Token into context
 * @example
 * // Add `<AuthenticityTokenProvider>` wrapping your Outlet
 * let { csrf } = useLoaderData<typeof loader>();
 * return (
 *   <AuthenticityTokenProvider token={csrf}>
 *     <Outlet />
 *   </AuthenticityTokenProvider>
 * )
 */
export function AuthenticityTokenProvider({ children, token }: AuthenticityTokenProviderProps) {
	return <context.Provider value={token}>{children}</context.Provider>;
}

/**
 * Get the authenticity token, this should be used to send it in a submit.
 * @example
 * let token = useAuthenticityToken();
 * let submit = useSubmit();
 * function sendFormWithCode() {
 *   submit(
 *     { csrf: token, ...otherData },
 *     { action: "/action", method: "post" },
 *   );
 * }
 */
export function useAuthenticityToken() {
	let token = React.useContext(context);
	if (!token) throw new Error("Missing AuthenticityTokenProvider.");
	return token;
}

/**
 * Render a hidden input with the name csrf and the authenticity token as value.
 * @example
 * // Default usage
 * return (
 *   <Form action="/login" method="post">
 *     <AuthenticityTokenInput />
 *     <input name="email" type="email" />
 *     <input name="password" type="password" />
 *     <button type="submit">Login</button>
 *   </Form>
 * );
 * @example
 * // Customizing the name
 * <AuthenticityTokenInput name="authenticity_token" />
 */
export function AuthenticityTokenInput({ name = "csrf" }: AuthenticityTokenInputProps) {
	let token = useAuthenticityToken();
	return <input type="hidden" value={token} name={name} />;
}
