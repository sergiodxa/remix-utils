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
export function AuthenticityTokenProvider({
	children,
	token,
}: AuthenticityTokenProviderProps) {
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
export function AuthenticityTokenInput({
	name = "csrf",
}: AuthenticityTokenInputProps) {
	let token = useAuthenticityToken();
	return <input type="hidden" value={token} name={name} />;
}
