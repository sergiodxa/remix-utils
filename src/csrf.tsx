import { randomBytes } from 'crypto';
import * as React from 'react';
import { Session } from 'remix';
import { parseBody, parseParams } from './parse-body';

/**
 * An error that is thrown when a CSRF token is missing or invalid.
 * @example
 * throw new InvalidAuthenticityToken("Can't verify CSRF token authenticity.");
 * @example
 * try { await verifyAuthenticityToken(request, session); }
 * catch (error) {
 *   if (error instanceof InvalidAuthenticityToken) // do something
 * }
 */
export class InvalidAuthenticityToken extends Error {}

/**
 * Create a random string in Base64 to be used as an authenticity token for
 * CSRF protection. You should run this on the `root.tsx` loader only.
 * @example
 * let token = createAuthenticityToken(session); // create and set in session
 * return json({ ...otherData, csrf: token }); // return the token in the data
 */
export function createAuthenticityToken(session: Session) {
  let token = randomBytes(100).toString('base64');
  session.set('csrf', token);
  return token;
}

/**
 * Verify if a request and session has a valid CSRF token.
 * @example
 * async function action({ request }: ActionArgs): Promise<ActionReturn> {
 *   let session = await getSession(request.headers.get("Cookie"):
 *   await verifyAuthenticityToken(request, session);
 *   // the request is authenticated and you can do anything here
 * }
 */
export function verifyAuthenticityToken(request: Request, session: Session) {
  function parse(params: URLSearchParams) {
    return parseParams<{ csrf?: string }>(params);
  }

  function verify(body: { csrf?: string }): string {
    // if the session doesn't have a csrf token, throw an error
    if (!session.has('csrf')) {
      throw new InvalidAuthenticityToken(
        "Can't verify CSRF token authenticity."
      );
    }

    // if the body doesn't have a csrf token, throw an error
    if (!body.csrf) {
      throw new InvalidAuthenticityToken(
        "Can't verify CSRF token authenticity."
      );
    }

    // if the body csrf token doesn't match the session csrf token, throw an
    // error
    if (body.csrf !== session.get('csrf')) {
      throw new InvalidAuthenticityToken(
        "Can't verify CSRF token authenticity."
      );
    }

    return body.csrf;
  }

  // We clone the request to ensure we don't modify the original request.
  // This allow us to parse the body of the request and let the original request
  // still be used and parsed without errors.
  return parseBody(request.clone())
    .then(parse)
    .then(verify);
}

export type AuthenticityTokenProviderProps = {
  children: React.ReactNode;
  token: string;
};

let context = React.createContext<string | null>(null);

/**
 * Save the Authenticity Token into context
 * Example: In the `root` add `<AuthenticityTokenProvider>`
 * ```tsx
 * let { csrf } = useRouteData<{ csrf: string }>();
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
 *     { csrf: token, ..otherData },
 *     { action: "/action", method: "post" },
 *   );
 * }
 */
export function useAuthenticityToken() {
  let token = React.useContext(context);
  if (!token) throw new Error('Missing AuthenticityTokenProvider.');
  return token;
}

/**
 * Render a hidden input with the name csrf and the authenticity token as value.
 * ```tsx
 * return (
 *   <Form action="/login" method="post">
 *     <AuthenticityToken />
 *     <input name="email" type="email" />
 *     <input name="password" type="password" />
 *     <button type="submit">Login</button>
 *   </Form>
 * );
 * ```
 */
export function AuthenticityToken() {
  let token = useAuthenticityToken();
  return <input type="hidden" value={token} name="csrf" />;
}
