import { randomBytes } from "crypto";
import { Session } from "remix";
import { bodyParser } from "./body-parser";
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
export function createAuthenticityToken(session: Session, sessionKey = "csrf") {
  let token = randomBytes(100).toString("base64");
  session.set(sessionKey, token);
  return token;
}

/**
 * Verify if a request and session has a valid CSRF token.
 * @example
 * let action: ActionFunction = async ({ request }) => {
 *   let session = await getSession(request.headers.get("Cookie");
 *   await verifyAuthenticityToken(request, session);
 *   // the request is authenticated and you can do anything here
 * }
 * @example
 * let action: ActionFunction = async ({ request }) => {
 *   let session = await getSession(request.headers.get("Cookie");
 *   await verifyAuthenticityToken(request, session, "csrfToken");
 *   // the request is authenticated and you can do anything here
 * }
 */
export async function verifyAuthenticityToken(
  request: Request,
  session: Session,
  sessionKey = "csrf"
) {
  // We clone the request to ensure we don't modify the original request.
  // This allow us to parse the body of the request and let the original request
  // still be used and parsed without errors.
  const params = await bodyParser.toSearchParams(request.clone());

  // if the session doesn't have a csrf token, throw an error
  if (!session.has(sessionKey)) {
    throw unprocessableEntity({
      message: "Can't verify CSRF token authenticity.",
    });
  }

  // if the body doesn't have a csrf token, throw an error
  if (!params.get(sessionKey)) {
    throw unprocessableEntity({
      message: "Can't verify CSRF token authenticity.",
    });
  }

  // if the body csrf token doesn't match the session csrf token, throw an
  // error
  if (params.get(sessionKey) !== session.get(sessionKey)) {
    throw unprocessableEntity({
      message: "Can't verify CSRF token authenticity.",
    });
  }
}
