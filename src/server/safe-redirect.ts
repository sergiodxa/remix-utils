/**
 * > [!NOTE]
 * > Install using `bunx shadcn@latest add @remix-utils/safe-redirect`.
 *
 * When performing a redirect, if the URL is user provided we can't trust it, if you do you're opening a vulnerability to phishing scam by allowing bad actors to redirect the user to malicious websites.
 *
 * ```
 * https://remix.utills/?redirectTo=https://malicious.app
 * ```
 *
 * To help you prevent this Remix Utils gives you a `safeRedirect` function which can be used to check if the URL is "safe".
 *
 * > [!NOTE]
 * > In this context, safe means the URL starts with `/` but not `//`, this means the URL is a pathname inside the same app and not an external link.
 *
 * ```ts
 * import { safeRedirect } from "remix-utils/safe-redirect";
 *
 * export async function loader({ request }: Route.LoaderArgs) {
 * 	let { searchParams } = new URL(request.url);
 * 	let redirectTo = searchParams.get("redirectTo");
 * 	return redirect(safeRedirect(redirectTo, "/home"));
 * }
 * ```
 *
 * The second argumento of `safeRedirect` is the default redirect which by when not configured is `/`, this lets you tell `safeRedirect` where to redirect the user if the value is not safe.
 *
 * @author [Sergio Xalambrí](https://sergiodxa.com)
 * @module Server/Safe Redirect
 */
const DEFAULT_REDIRECT = "/";

/**
 * This should be used any time the redirect path is user-provided
 * (Like the query string on our login/signup pages). This avoids
 * open-redirect vulnerabilities.
 * @param {string} to The redirect destination
 * @param {string} defaultRedirect The redirect to use if the to is unsafe.
 * @license MIT
 * @author https://github.com/jacob-ebey
 */
export function safeRedirect(
	to: FormDataEntryValue | string | null | undefined,
	defaultRedirect: string = DEFAULT_REDIRECT,
) {
	if (!to || typeof to !== "string") return defaultRedirect;

	let trimmedTo = to.trim();

	if (
		!trimmedTo.startsWith("/") ||
		trimmedTo.startsWith("//") ||
		trimmedTo.startsWith("/\\") ||
		trimmedTo.includes("..")
	) {
		return defaultRedirect;
	}

	return trimmedTo;
}
