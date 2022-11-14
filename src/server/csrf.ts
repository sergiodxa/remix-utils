import { Session } from "@remix-run/server-runtime";
import { v4 as uuid } from "uuid";
import { unprocessableEntity } from "./responses";

/**
 * Create a random string in Base64 to be used as an authenticity token for
 * CSRF protection. You should run this on the `root.tsx` loader only.
 * @example
 * let token = createAuthenticityToken(session); // create and set in session
 * return json({ ...otherData, csrf: token }); // return the token in the data
 * @example
 * // create and set in session with the key `csrf-token`
 * let token = createAuthenticityToken(session, "csrfToken");
 * return json({ ...otherData, csrf: token }); // return the token in the data
 */
export function createAuthenticityToken(session: Session, sessionKey = "csrf"): string {
  let token = session.get(sessionKey);
  if (token) return token;
  token = uuid();
  session.set(sessionKey, token);
  return token;
}

/**
 * Verify if a request and session has a valid CSRF token.
 * @example
 * let action: ActionFunction = async ({ request }) => {
 *   let session = await getSession(request.headers.get("Cookie"));
 *   await verifyAuthenticityToken(request, session);
 *   // the request is authenticated and you can do anything here
 * }
 * @example
 * let action: ActionFunction = async ({ request }) => {
 *   let session = await getSession(request.headers.get("Cookie"));
 *   await verifyAuthenticityToken(request, session, "csrfToken");
 *   // the request is authenticated and you can do anything here
 * }
 * @example
 * let action: ActionFunction = async ({ request }) => {
 *   let session = await getSession(request.headers.get("Cookie"));
 *   let formData = await unstable_parseMultipartFormData(request, uploadHandler);
 *   await verifyAuthenticityToken(formData, session);
 *   // the request is authenticated and you can do anything here
 * }
 */
export async function verifyAuthenticityToken(
  data: Request | FormData,
  session: Session,
  sessionKey = "csrf"
) {
  if (data instanceof Request && data.bodyUsed) {
    throw new Error(
      "The body of the request was read before calling verifyAuthenticityToken. Ensure you clone it before reading it."
    );
  }
  // We clone the request to ensure we don't modify the original request.
  // This allow us to parse the body of the request and let the original request
  // still be used and parsed without errors.
  let formData =
    data instanceof FormData ? data : await data.clone().formData();

  // if the session doesn't have a csrf token, throw an error
  if (!session.has(sessionKey)) {
    throw unprocessableEntity({
      message: "Can't find CSRF token in session.",
    });
  }

  // if the body doesn't have a csrf token, throw an error
  if (!formData.get(sessionKey)) {
    throw unprocessableEntity({
      message: "Can't find CSRF token in body.",
    });
  }

  // if the body csrf token doesn't match the session csrf token, throw an
  // error
  if (formData.get(sessionKey) !== session.get(sessionKey)) {
    throw unprocessableEntity({
      message: "Can't verify CSRF token authenticity.",
    });
  }
}
