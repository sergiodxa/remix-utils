import { createContext, ReactNode, useContext } from "react";

export interface AuthenticityTokenProviderProps {
  children: ReactNode;
  token: string;
}

export interface AuthenticityTokenInputProps {
  name?: string;
}

let context = createContext<string | null>(null);

/**
 * Save the Authenticity Token into context
 * Example: In the `root` add `<AuthenticityTokenProvider>`
 * ```tsx
 * let { csrf } = useLoaderData<{ csrf: string }>();
 * return (
 *   <AuthenticityTokenProvider token={csrf}>
 *     <Document>
 *       <Outlet />
 *     </Document>
 *   </AuthenticityTokenProvider>
 * )'
 * ```
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
  let token = useContext(context);
  if (!token) throw new Error("Missing AuthenticityTokenProvider.");
  return token;
}

/**
 * Render a hidden input with the name csrf and the authenticity token as value.
 * ```tsx
 * return (
 *   <Form action="/login" method="post">
 *     <AuthenticityTokenInput />
 *     <input name="email" type="email" />
 *     <input name="password" type="password" />
 *     <button type="submit">Login</button>
 *   </Form>
 * );
 * ```
 */
export function AuthenticityTokenInput({
  name = "csrf",
}: AuthenticityTokenInputProps) {
  let token = useAuthenticityToken();
  return <input type="hidden" value={token} name={name} />;
}
