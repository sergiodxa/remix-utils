import type {
  Session,
  SessionStorage,
  CookieOptions,
} from "@remix-run/server-runtime";
import { createSession } from "@remix-run/server-runtime";
import { EncryptJWT, jwtDecrypt, jwtVerify, SignJWT, UnsecuredJWT } from "jose";
import { parse, serialize } from "cookie";

interface JWTSessionStorageOptions {
  cookie: CookieOptions & { name: string };
  encrypt?: boolean;
  sign?: boolean;
}

interface JWTSessionStorage extends SessionStorage {
  getJWT(
    cookieHeader?: string | null,
    options?: CookieOptions
  ): Promise<string | null>;
}

export function createJWTSessionStorage({
  cookie,
  encrypt,
  sign,
}: JWTSessionStorageOptions): JWTSessionStorage {
  const secret = cookie.secrets?.[0];
  const encodeJWT = async (data: unknown, expires?: Date) => {
    let encoded;

    if (encrypt && secret) {
      encoded = new EncryptJWT({ data })
        .setProtectedHeader({ alg: "PBES2-HS512+A256KW", enc: "A256GCM" })
        .setIssuedAt();

      if (expires) {
        encoded.setExpirationTime(expires.getTime());
      }

      encoded = encoded.encrypt(new TextEncoder().encode(secret));
    } else if (sign && secret) {
      encoded = new SignJWT({ data })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt();

      if (expires) {
        encoded.setExpirationTime(expires.getTime());
      }

      encoded = encoded.sign(new TextEncoder().encode(secret));
    } else {
      encoded = new UnsecuredJWT({ data }).setIssuedAt().encode();
    }

    return encoded as string;
  };

  const decodeJWT = async (jwt: string) => {
    if (encrypt && secret) {
      try {
        let { payload: unsignedValue } = await jwtDecrypt(
          jwt,
          new TextEncoder().encode(secret)
        );
        return unsignedValue.data;
      } catch {}

      return null;
    } else if (sign && secret) {
      try {
        let { payload: unsignedValue } = await jwtVerify(
          jwt,
          new TextEncoder().encode(secret)
        );

        return unsignedValue.data;
      } catch {}

      return null;
    }

    return UnsecuredJWT.decode(jwt).payload.data as unknown;
  };

  return {
    async getSession(
      cookieHeader?: string | null,
      options?: CookieOptions
    ): Promise<Session> {
      let cookies =
        cookieHeader && (await parse(cookieHeader, { ...options, ...cookie }));
      let jwt = cookies && cookies[cookie.name] ? cookies[cookie.name] : "";
      let data: unknown = {};
      let id = "";

      try {
        data = await decodeJWT(jwt);
        id = jwt.split(".").slice(-1)[0] + "";
      } catch {
        data = {};
        id = "";
      }

      return createSession(data || {}, id);
    },

    async getJWT(
      cookieHeader?: string | null,
      options?: CookieOptions
    ): Promise<string | null> {
      let cookies =
        cookieHeader && (await parse(cookieHeader, { ...options, ...cookie }));
      let jwt = cookies && cookies[cookie.name] ? cookies[cookie.name] : "";

      try {
        await decodeJWT(jwt);

        return jwt;
      } catch {
        return null;
      }
    },

    async commitSession(
      session: Session,
      options?: CookieOptions
    ): Promise<string> {
      const jwt = await encodeJWT(
        session.data,
        options?.expires || new Date(Date.now() + (cookie.maxAge || 0) * 1000)
      );

      const serializedCookie = serialize(cookie.name, jwt, {
        ...options,
        ...cookie,
      });

      if (serializedCookie.length > 4096) {
        throw new Error(
          "Cookie length will exceed browser maximum. Length: " +
            serializedCookie.length
        );
      }

      return serializedCookie;
    },

    destroySession(_: Session, options?: CookieOptions): Promise<string> {
      return Promise.resolve(
        serialize(cookie.name, "", {
          ...(options || cookie),
          expires: new Date(0),
        })
      );
    },
  };
}
