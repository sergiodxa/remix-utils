import type { Cookie } from "@remix-run/server-runtime";
import cryptoJS from "crypto-js";

export type CSRFErrorCode =
  | "missing_token_in_cookie"
  | "invalid_token_in_cookie"
  | "tampered_token_in_cookie"
  | "missing_token_in_body"
  | "mismatched_token";

export class CSRFError extends Error {
  code: CSRFErrorCode;
  constructor(code: CSRFErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = "CSRFError";
  }
}

interface CSRFOptions {
  /**
   * The cookie object to use for serializing and parsing the CSRF token.
   */
  cookie: Cookie;
  /**
   * The name of the form data key to use for the CSRF token.
   */
  formDataKey?: string;
  /**
   * A secret to use for signing the CSRF token.
   */
  secret?: string;
}

export class CSRF {
  private cookie: Cookie;
  private formDataKey = "csrf";
  private secret?: string;

  constructor(options: CSRFOptions) {
    this.cookie = options.cookie;
    this.formDataKey = options.formDataKey ?? "csrf";
    this.secret = options.secret;
  }

  /**
   * Generates a random string in Base64URL to be used as an authenticity token
   * for CSRF protection.
   * @param bytes The number of bytes used to generate the token
   * @returns A random string in Base64URL
   */
  generate(bytes = 32) {
    let token = cryptoJS.lib.WordArray.random(bytes).toString(
      cryptoJS.enc.Base64url
    );
    if (!this.secret) return token;
    let signature = this.sign(token);
    return [token, signature].join(".");
  }

  /**
   * Generates a token and serialize it into the cookie.
   * @param bytes The number of bytes used to generate the token
   * @returns A tuple with the token and the string to send in Set-Cookie
   * @example
   * let [token, cookie] = await csrf.commitToken();
   * return json({ token }, {
   *   headers: { "set-cookie": cookie }
   * })
   */
  async commitToken(bytes = 32) {
    let token = this.generate(bytes);
    let cookie = await this.cookie.serialize(token);
    return [token, cookie] as const;
  }

  /**
   * Verify if a request and cookie has a valid CSRF token.
   * @example
   * export async function action({ request }: ActionArgs) {
   *   await csrf.validate(request);
   *   // the request is authenticated and you can do anything here
   * }
   * @example
   * export async function action({ request }: ActionArgs) {
   *   let formData = await request.formData()
   *   await csrf.validate(formData, request.headers);
   *   // the request is authenticated and you can do anything here
   * }
   * @example
   * export async function action({ request }: ActionArgs) {
   *   let formData = await parseMultipartFormData(request);
   *   await csrf.validate(formData, request.headers);
   *   // the request is authenticated and you can do anything here
   * }
   */
  validate(data: Request): Promise<void>;
  validate(data: FormData, headers: Headers): Promise<void>;
  async validate(data: FormData | Request, headers?: Headers): Promise<void> {
    if (data instanceof Request && data.bodyUsed) {
      throw new Error(
        "The body of the request was read before calling CSRF#verify. Ensure you clone it before reading it."
      );
    }

    let formData = await this.readBody(data);

    let cookie = await this.parseCookie(data, headers);

    // if the session doesn't have a csrf token, throw an error
    if (cookie === null) {
      throw new CSRFError(
        "missing_token_in_cookie",
        "Can't find CSRF token in cookie."
      );
    }

    if (typeof cookie !== "string") {
      throw new CSRFError(
        "invalid_token_in_cookie",
        "Invalid CSRF token in cookie."
      );
    }

    if (this.verifySignature(cookie) === false) {
      throw new CSRFError(
        "tampered_token_in_cookie",
        "Tampered CSRF token in cookie."
      );
    }

    // if the body doesn't have a csrf token, throw an error
    if (!formData.get(this.formDataKey)) {
      throw new CSRFError(
        "missing_token_in_body",
        "Can't find CSRF token in body."
      );
    }

    // if the body csrf token doesn't match the session csrf token, throw an
    // error
    if (formData.get(this.formDataKey) !== cookie) {
      throw new CSRFError(
        "mismatched_token",
        "Can't verify CSRF token authenticity."
      );
    }
  }

  private async readBody(data: FormData | Request) {
    if (data instanceof FormData) return data;
    return await data.clone().formData();
  }

  private parseCookie(data: FormData | Request, headers?: Headers) {
    if (data instanceof Request) headers = data.headers;
    if (!headers) return null;
    return this.cookie.parse(headers.get("cookie"));
  }

  private sign(token: string) {
    if (!this.secret) return token;
    return cryptoJS
      .HmacSHA256(token, this.secret)
      .toString(cryptoJS.enc.Base64url);
  }

  private verifySignature(token: string) {
    if (!this.secret) return true;
    let [value, signature] = token.split(".");
    let expectedSignature = this.sign(value);
    return signature === expectedSignature;
  }
}
