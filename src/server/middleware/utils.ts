/**
 * > [!NOTE]
 * > This depends on `react-router`, and specifically v7.9.0 or later.
 *
 * Since React Router v7.9.0 you can use middleware to run code before and after the routes loaders and actions. In Remix Utils some middleware are provided to help you with common tasks.
 *
 *
 * > [!NOTE]
 * > Install using `bunx shadcn@latest add @remix-utils/middleware-session`.
 *
 * The session middleware let's you save a session object in the Router context so you can access it in any loader and ensure you're always working with the same Session instance.
 *
 * ```ts
 * import { createSessionMiddleware } from "remix-utils/middleware/session";
 * ```
 *
 * To use it, you need to create a session storage object and pass it to the middleware.
 *
 * ```ts
 * import { createCookieSessionStorage } from "react-router";
 *
 * let sessionStorage = createCookieSessionStorage({
 * 	cookie: createCookie("session", { path: "/", sameSite: "lax" }),
 * });
 *
 * let [sessionMiddleware, getSession] = createSessionMiddleware(sessionStorage);
 * ```
 *
 * Then you can use the `sessionMiddleware` in your `app/root.tsx` function.
 *
 * ```ts
 * import { sessionMiddleware } from "~/middleware/session.server";
 *
 * export const middleware: Route.MiddlewareFunction[] = [sessionMiddleware];
 * ```
 *
 * And you can use the `getSession` function in your loaders to get the session object.
 *
 * ```ts
 * import { getSession } from "~/middleware/session.server";
 *
 * export async function loader({ context }: Route.LoaderArgs) {
 * 	let session = await getSession(context);
 * 	let user = await getUser();
 * 	session.set("user", user);
 * 	return json({ user });
 * }
 * ```
 *
 * By default the middleware will automaticaly commit the session at the end of the request, but you can customize this behavior by passing a second argument to the `createSessionMiddleware` function.
 *
 * ```ts
 * let [sessionMiddleware, getSession] = createSessionMiddleware(sessionStorage, shouldCommit);
 * ```
 *
 * The `shouldCommit` function will be called at the end of the request with the previous session data and the session data before the request, if it returns `true` the session will be committed, if it returns `false` the session will be discarded.
 *
 * If you want to commit the session only if the session data changed you can use a library like `dequal` to compare the session data.
 *
 * ```ts
 * import { dequal } from "dequal";
 *
 * let [sessionMiddleware, getSession] = createSessionMiddleware(
 * 	sessionStorage,
 * 	(previous, next) => !dequal(previous, next), // Only commit if session changed
 * );
 * ```
 *
 * Or you can use a custom function to compare the session data, maybe only if some specific fields changed.
 *
 * ```ts
 * let [sessionMiddleware, getSession] = createSessionMiddleware(sessionStorage, (previous, next) => {
 * 	return current.user.id !== previous.user.id;
 * });
 * ```
 *
 *
 * > [!NOTE]
 * > Install using `bunx shadcn@latest add @remix-utils/middleware-logger`.
 *
 * The logger middleware let's you log the request and response information to the console, this can be useful to debug issues with the request and response.
 *
 * ```ts
 * import { createLoggerMiddleware } from "remix-utils/middleware/logger";
 *
 * export const [loggerMiddleware] = createLoggerMiddleware();
 * ```
 *
 * To use it, you need to add it to the `middleware` array in your `app/root.tsx` file.
 *
 * ```ts
 * import { loggerMiddleware } from "~/middleware/logger.server";
 * export const middleware: Route.MiddlewareFunction[] = [loggerMiddleware];
 * ```
 *
 * Now, every request and response will be logged to the console.
 *
 * The logger middleware can be customized by passing an options object to the `createLoggerMiddleware` function.
 *
 * ```ts
 * let [loggerMiddleware] = createLoggerMiddleware({
 * 	logger: console,
 * 	precision: 2,
 * 	formatMessage(request, response, time) {
 * 		return `${request.method} ${request.url} - ${response.status} - ${time}ms`;
 * 	},
 * });
 * ```
 *
 * The `logger` option let's you pass a custom logger, the `precision` option let's you set the number of decimal places to use in the response time, and the `formatMessage` option let's you customize the message that will be logged.
 *
 *
 * > [!NOTE]
 * > Install using `bunx shadcn@latest add @remix-utils/middleware-server-timing`.
 *
 * > [!NOTE]
 * > This depends on `@edgefirst-dev/server-timing`.
 *
 * The server timing middleware let's you add a `Server-Timing` header to the response with the time it took to run the loaders and actions.
 *
 * ```ts
 * import { createServerTimingMiddleware } from "remix-utils/middleware/server-timing";
 *
 * export const [serverTimingMiddleware, getTimingCollector] = createServerTimingMiddleware();
 * ```
 *
 * To use it, you need to add it to the `middleware` array in your `app/root.tsx` file.
 *
 * ```ts
 * import { serverTimingMiddleware } from "~/middleware/server-timing.server";
 *
 * export const middleware: Route.MiddlewareFunction[] = [serverTimingMiddleware];
 * ```
 *
 * And you can use the `getTimingCollector` function in your loaders and actions to add timings to the response.
 *
 * ```ts
 * import { getTimingCollector } from "~/middleware/server-timing.server";
 *
 * export async function loader({ request }: Route.LoaderArgs) {
 * 	let collector = getTimingCollector();
 * 	return await collector.measure("name", "optional description", async () => {
 * 		return await getData();
 * 	});
 * }
 * ```
 *
 * The `measure` function will measure the time it took to run the function passed as the last argument and add it to the `Server-Timing` header.
 *
 *
 * > [!NOTE]
 * > Install using `bunx shadcn@latest add @remix-utils/middleware-singleton`.
 *
 * The singleton middleware let's you create a singleton object that will be shared between loaders of a single requests.
 *
 * This is specially useful to share objects that needs to be created only once per request, like a cache, but not shared between requests.
 *
 * ```ts
 * import { createSingletonMiddleware } from "remix-utils/middleware/singleton";
 *
 * export const [singletonMiddleware, getSingleton] = createSingletonMiddleware({
 * 	instantiator: () => new MySingletonClass(),
 * });
 * ```
 *
 * To use it, you need to add it to the `middleware` array in the route where you want to use it.
 *
 * ```ts
 * import { singletonMiddleware } from "~/middleware/singleton.server";
 * export const middleware: Route.MiddlewareFunction[] = [singletonMiddleware];
 * ```
 *
 * And you can use the `getSingleton` function in your loaders to get the singleton object.
 *
 * ```ts
 * import { getSingleton } from "~/middleware/singleton.server";
 *
 * export async function loader({ context }: Route.LoaderArgs) {
 * 	let singleton = getSingleton(context);
 * 	let result = await singleton.method();
 * 	// ...
 * }
 * ```
 *
 * The singleton middleware can be created with different classes and arguments, so you can have multiple singletons in the same request.
 *
 * ```ts
 * import { createSingletonMiddleware } from "remix-utils/middleware/singleton";
 *
 * export const [singletonMiddleware, getSingleton] = createSingletonMiddleware({
 * 	instantiator: () => new MySingletonClass("arg1", "arg2"),
 * });
 *
 * export const [anotherSingletonMiddleware, getAnotherSingleton] = createSingletonMiddleware({
 * 	instantiator: () => new AnotherSingletonClass("arg1", "arg2"),
 * });
 * ```
 *
 * And use it in a route like this.
 *
 * ```ts
 * import { singletonMiddleware, anotherSingletonMiddleware } from "~/middleware/singleton.server";
 *
 * export const middleware: Route.MiddlewareFunction[] = [
 * 	singletonMiddleware,
 * 	anotherSingletonMiddleware,
 * ];
 * ```
 *
 * You can also access the `request` and `context` objects in the `instantiator` function, so you can create the singleton based on the request or context.
 *
 * ```ts
 * import { createSingletonMiddleware } from "remix-utils/middleware/singleton";
 * import { MySingletonClass } from "~/singleton";
 *
 * export const [singletonMiddleware, getSingleton] = createSingletonMiddleware({
 * 	instantiator: (request, context) => {
 * 		return new MySingletonClass(request, context);
 * 	},
 * });
 * ```
 *
 * This can allows you to create a class that depends on the request, maybe to read the URL or body, or depends on the context, maybe to read the session or some other data.
 *
 *
 * > [!NOTE]
 * > Install using `bunx shadcn@latest add @remix-utils/middleware-batcher`.
 *
 * > [!NOTE]
 * > This depends on `@edgefirst-dev/batcher`.
 *
 * The batcher middleware let's you get a per request instance of a batcher object that will dedupe and batch multiple calls to the same function.
 *
 * This is specially useful to avoid making multiple API calls to the same endpoint in a single request, or DB queries. The batcher will call the function only once and return the same result to all calls.
 *
 * ```ts
 * import { createBatcherMiddleware } from "remix-utils/middleware/batcher";
 *
 * export const [batcherMiddleware, getBatcher] = createBatcherMiddleware();
 * ```
 *
 * To use it, you need to add it to the `middleware` array in the route where you want to use it.
 *
 * ```ts
 * import { batcherMiddleware } from "~/middleware/batcher.server";
 * export const middleware: Route.MiddlewareFunction[] = [batcherMiddleware];
 * ```
 *
 * And you can use the `getBatcher` function in your loaders to get the batcher object.
 *
 * ```ts
 * import { getBatcher } from "~/middleware/batcher.server";
 *
 * export async function loader({ context }: Route.LoaderArgs) {
 * 	let batcher = getBatcher(context);
 * 	let result = await batcher.batch("key", async () => {
 * 		return await getData();
 * 	});
 * 	// ...
 * }
 * ```
 *
 * If you move your `batcher.batch` call to a separate function, you can use it in different route loaders and actions, and the batcher will still dedupe the calls.
 *
 * ```ts
 * import type { Batcher } from "remix-utils/middleware/batcher";
 * import { getData } from "~/data";
 *
 * export function getDataBatched(batcher: Batcher) {
 * 	return batcher.batch("key", async () => {
 * 		return await getData();
 * 	});
 * }
 * ```
 *
 * Then you can call it in any route loader who has access to the batcher.
 *
 * ```ts
 * import { getBatcher } from "~/middleware/batcher.server";
 * import { getDataBatched } from "~/data";
 *
 * export async function loader({ context }: Route.LoaderArgs) {
 * 	let batcher = getBatcher(context);
 * 	let result = await getDataBatched(batcher);
 * 	// ...
 * }
 * ```
 *
 *
 * > [!NOTE]
 * > Install using `bunx shadcn@latest add @remix-utils/middleware-context-storage`.
 *
 * The Context Storage middleware stores the Router context provider and request in AsyncLocalStorage and gives you functions to access it in your code.
 *
 * ```ts
 * import { createContextStorageMiddleware } from "remix-utils/middleware/context-storage";
 *
 * export const [contextStorageMiddleware, getContext, getRequest] = createContextStorageMiddleware();
 * ```
 *
 * To use it, you need to add it to the `middleware` array in your `app/root.tsx` file.
 *
 * ```ts
 * import { contextStorageMiddleware } from "~/middleware/context-storage.server";
 *
 * export const middleware: Route.MiddlewareFunction[] = [contextStorageMiddleware];
 * ```
 *
 * And you can use the `getContext` and `getRequest` functions in your function to get the context and request objects.
 *
 * ```ts
 * import { getContext, getRequest } from "~/middleware/context-storage.server";
 *
 * export async function doSomething() {
 * 	let context = getContext();
 * 	let request = getRequest();
 * 	// ...
 * }
 * ```
 *
 * Then call `doSomething` in any loader, action, or another middleware, and you will have access to the context and request objects without passing them around.
 *
 * You can pair this with any other middleware that uses the context to simplify using their returned getters.
 *
 * ```ts
 * import { createBatcherMiddleware } from "remix-utils/middleware/batcher";
 * import { getContext } from "~/middleware/context-storage.server";
 *
 * const [batcherMiddleware, getBatcherFromContext] = createBatcherMiddleware();
 *
 * export { bathcherMiddleware };
 *
 * export function getBatcher() {
 * 	let context = getContext();
 * 	return getBatcherFromContext(context);
 * }
 * ```
 *
 * Now instead of calling `getBatcher(context)` you can just call `getBatcher()` and it will return the batcher instance.
 *
 * ```ts
 * import { getBatcher } from "~/middleware/batcher.server";
 *
 * export async function loader(_: Route.LoaderArgs) {
 * 	let batcher = getBatcher();
 * 	let result = await batcher.batch("key", async () => {
 * 		return await getData();
 * 	});
 * 	// ...
 * }
 * ```
 *
 *
 * > [!NOTE]
 * > Install using `bunx shadcn@latest add @remix-utils/middleware-request-id`.
 *
 * The Request ID middleware generates a unique ID for each request and stores it in the Router context, this can be useful to log the request and response information and correlate them.
 *
 * ```ts
 * import { createRequestIDMiddleware } from "remix-utils/middleware/request-id";
 *
 * export const [requestIDMiddleware, getRequestID] = createRequestIDMiddleware();
 * ```
 *
 * To use it, you need to add it to the `middleware` array in your `app/root.tsx` file.
 *
 * ```ts
 * import { requestIDMiddleware } from "~/middleware/request-id.server";
 *
 * export const middleware: Route.MiddlewareFunction[] = [requestIDMiddleware];
 * ```
 *
 * And you can use the `getRequestID` function in your loaders, actions, and other middleware to get the request ID.
 *
 * ```ts
 * import { getRequestID } from "~/middleware/request-id.server";
 *
 * export async function loader({ request }: Route.LoaderArgs) {
 * 	let requestID = getRequestID();
 * 	// ...
 * }
 * ```
 *
 * By default the request ID is a UUID, but you can customize it by passing a function to the `createRequestIDMiddleware` function.
 *
 * ```ts
 * import { createRequestIDMiddleware } from "remix-utils/middleware/request-id";
 *
 * export const [requestIDMiddleware, getRequestID] = createRequestIDMiddleware({
 * 	generator() {
 * 		return Math.random().toString(36).slice(2);
 * 	},
 * });
 * ```
 *
 * The middleware also gets the request ID from the `X-Request-ID` header if it's present, this can be useful to correlate requests between services.
 *
 * If you want to use a different header you can pass the header name to the `createRequestIDMiddleware` function.
 *
 * ```ts
 * import { createRequestIDMiddleware } from "remix-utils/middleware/request-id";
 *
 * export const [requestIDMiddleware, getRequestID] = createRequestIDMiddleware({
 * 	header: "X-Correlation-ID",
 * });
 * ```
 *
 * You can disable this behaviour by passing `null` instead.
 *
 * ```ts
 * import { createRequestIDMiddleware } from "remix-utils/middleware/request-id";
 *
 * export const [requestIDMiddleware, getRequestID] = createRequestIDMiddleware({
 * 	header: null,
 * });
 * ```
 *
 *
 * > [!NOTE]
 * > Install using `bunx shadcn@latest add @remix-utils/middleware-basic-auth`.
 *
 * > [!NOTE]
 * > This depends on `@oslojs/crypto`, and `@oslojs/encoding`.
 *
 * The Basic Auth middleware let's you add a basic authentication to your routes, this can be useful to protect routes that need to be private.
 *
 * > [!WARNING]
 * > Basic Auth is not secure by itself, it should be used with HTTPS to ensure the username and password are encrypted. Do not use it to protect sensitive data, use a more secure method instead.
 *
 * ```ts
 * import { createBasicAuthMiddleware } from "remix-utils/middleware/basic-auth";
 *
 * export const [basicAuthMiddleware] = createBasicAuthMiddleware({
 * 	user: { username: "admin", password: "password" },
 * });
 * ```
 *
 * To use it, you need to add it to the `middleware` array in the route where you want to use it.
 *
 * ```ts
 * import { basicAuthMiddleware } from "~/middleware/basic-auth.server";
 * export const middleware: Route.MiddlewareFunction[] = [basicAuthMiddleware];
 * ```
 *
 * Now, when you access the route you will be prompted to enter the username and password.
 *
 * The `realm` option let's you set the realm for the authentication, this is the name of the protected area.
 *
 * ```ts
 * import { createBasicAuthMiddleware } from "remix-utils/middleware/basic-auth";
 *
 * export const [basicAuthMiddleware] = createBasicAuthMiddleware({
 * 	realm: "My Realm",
 * 	user: { username: "admin", password: "password" },
 * });
 * ```
 *
 * The `user` option let's you set the username and password to authenticate, you can also pass an array of users.
 *
 * ```ts
 * import { createBasicAuthMiddleware } from "remix-utils/middleware/basic-auth";
 *
 * export const [basicAuthMiddleware] = createBasicAuthMiddleware({
 * 	user: [
 * 		{ username: "admin", password: "password" },
 * 		{ username: "user", password: "password" },
 * 	],
 * });
 * ```
 *
 * The `verifyUser` option let's you pass a function to verify the user, this can be useful to check the user against a database.
 *
 * ```ts
 * import { createBasicAuthMiddleware } from "remix-utils/middleware/basic-auth";
 *
 * export const [basicAuthMiddleware] = createBasicAuthMiddleware({
 * 	verifyUser(username, password) {
 * 		let user = await getUser(username);
 * 		if (!user) return false;
 * 		return await verifyPassword(password, user.password);
 * 	},
 * });
 * ```
 *
 * The `verifyUser` function should return `true` if the user is authenticated, and `false` otherwise.
 *
 * In case of an invalid username or password the middleware will return a `401` status code with a `WWW-Authenticate` header.
 *
 * ```http
 * HTTP/1.1 401 Unauthorized
 * WWW-Authenticate: Basic realm="My Realm"
 *
 * Unauthorized
 * ```
 *
 * The `invalidUserMessage` option let's you customize the message sent when the user is invalid.
 *
 * ```ts
 * import { createBasicAuthMiddleware } from "remix-utils/middleware/basic-auth";
 *
 * export const [basicAuthMiddleware] = createBasicAuthMiddleware({
 * 	invalidUserMessage: "Invalid username or password",
 * 	user: { username: "admin", password: "password" },
 * });
 * ```
 *
 * And this will be the response when the user is invalid.
 *
 * ```http
 * HTTP/1.1 401 Unauthorized
 * WWW-Authenticate: Basic realm="My Realm"
 *
 * Invalid username or password
 * ```
 *
 * You can also customize the `invalidUserMessage` by passing a function which will receive the Request and context objects.
 *
 * ```ts
 * import { createBasicAuthMiddleware } from "remix-utils/middleware/basic-auth";
 *
 * export const [basicAuthMiddleware] = createBasicAuthMiddleware({
 * 	invalidUserMessage({ request, context }) {
 * 		// do something with request or context here
 * 		return { message: `Invalid username or password for ${username}` };
 * 	},
 * 	user: { username: "admin", password: "password" },
 * });
 * ```
 *
 * In both cases, with a hard-coded value or a function, the invalid message can be a string or an object, if it's an object it will be converted to JSON.
 *
 * ```http
 * HTTP/1.1 401 Unauthorized
 * WWW-Authenticate: Basic realm="My Realm"
 *
 * {"message":"Invalid username or password"}
 * ```
 *
 *
 * > [!NOTE]
 * > Install using `bunx shadcn@latest add @remix-utils/middleware-jwk-auth`.
 *
 * > [!NOTE]
 * > This depends on `@edgefirst-dev/jwt`.
 *
 * The JWK Auth middleware let's you add a JSON Web Key authentication to your routes, this can be useful to protect routes that need to be private and will be accessed by other services.
 *
 * > [!WARNING]
 * > JWK Auth is more secure than Basic Auth, but it should be used with HTTPS to ensure the token is encrypted.
 *
 * ```ts
 * import { createJWKAuthMiddleware } from "remix-utils/middleware/jwk-auth";
 *
 * export const [jwkAuthMiddleware, getJWTPayload] = createJWKAuthMiddleware({
 * 	jwksUri: "https://auth.example.com/.well-known/jwks.json",
 * });
 * ```
 *
 * The `jwksUri` option let's you set the URL to the JWKS endpoint, this is the URL where the public keys are stored.
 *
 * To use the middleware, you need to add it to the `middleware` array in the route where you want to use it.
 *
 * ```ts
 * import { jwkAuthMiddleware } from "~/middleware/jwk-auth";
 * export const middleware: Route.MiddlewareFunction[] = [jwkAuthMiddleware];
 * ```
 *
 * Now, when you access the route it will check the JWT token in the `Authorization` header.
 *
 * In case of an invalid token the middleware will return a `401` status code with a `WWW-Authenticate` header.
 *
 * ```http
 * HTTP/1.1 401 Unauthorized
 * WWW-Authenticate: Bearer realm="Secure Area"
 *
 * Unauthorized
 * ```
 *
 * The `realm` option let's you set the realm for the authentication, this is the name of the protected area.
 *
 * ```ts
 * import { createJWKAuthMiddleware } from "remix-utils/middleware/jwk-auth";
 *
 * export const [jwkAuthMiddleware] = createJWKAuthMiddleware({
 * 	realm: "My Realm",
 * 	jwksUri: "https://auth.example.com/.well-known/jwks.json",
 * });
 * ```
 *
 * If you want to customize the message sent when the token is invalid you can use the `invalidTokenMessage` option.
 *
 * ```ts
 * import { createJWKAuthMiddleware } from "remix-utils/middleware/jwk-auth";
 *
 * export const [jwkAuthMiddleware] = createJWKAuthMiddleware({
 * 	invalidTokenMessage: "Invalid token",
 * 	jwksUri: "https://auth.example.com/.well-known/jwks.json",
 * });
 * ```
 *
 * And this will be the response when the token is invalid.
 *
 * ```http
 * HTTP/1.1 401 Unauthorized
 * WWW-Authenticate: Bearer realm="Secure Area"
 *
 * Invalid token
 * ```
 *
 * You can also customize the `invalidTokenMessage` by passing a function which will receive the Request and context objects.
 *
 * ```ts
 * import { createJWKAuthMiddleware } from "remix-utils/middleware/jwk-auth";
 *
 * export const [jwkAuthMiddleware] = createJWKAuthMiddleware({
 * 	invalidTokenMessage({ request, context }) {
 * 		// do something with request or context here
 * 		return { message: `Invalid token` };
 * 	},
 * 	jwksUri: "https://auth.example.com/.well-known/jwks.json",
 * });
 * ```
 *
 * In both cases, with a hard-coded value or a function, the invalid message can be a string or an object, if it's an object it will be converted to JSON.
 *
 * ```http
 * HTTP/1.1 401 Unauthorized
 * WWW-Authenticate: Bearer realm="Secure Area"
 *
 * {"message":"Invalid token"}
 * ```
 *
 * If you want to get the JWT payload in your loaders, actions, or other middleware you can use the `getJWTPayload` function.
 *
 * ```ts
 * import { getJWTPayload } from "~/middleware/jwk-auth.server";
 *
 * export async function loader({ request }: Route.LoaderArgs) {
 * 	let payload = getJWTPayload();
 * 	// ...
 * }
 * ```
 *
 * And you can use the payload to get the subject, scope, issuer, audience, or any other information stored in the token.
 *
 * ##### With a Custom Header
 *
 * If your app receives the JWT in a custom header instead of the `Authorization` header you can tell the middleware to look for the token in that header.
 *
 * ```ts
 * import { createJWKAuthMiddleware } from "remix-utils/middleware/jwk-auth";
 *
 * export const [jwkAuthMiddleware, getJWTPayload] = createJWKAuthMiddleware({
 * 	header: "X-API-Key",
 * });
 * ```
 *
 * Now use the middleware as usual, but now instead of looking for the token in the `Authorization` header it will look for it in the `X-API-Key` header.
 *
 * ```ts
 * import { jwkAuthMiddleware } from "~/middleware/jwk-auth";
 *
 * export const middleware: Route.MiddlewareFunction[] = [jwkAuthMiddleware];
 * ```
 *
 * ##### With a Cookie
 *
 * If you save a JWT in a cookie using React Router's Cookie API, you can tell the middleware to look for the token in the cookie instead of the `Authorization` header.
 *
 * ```ts
 * import { createJWKAuthMiddleware } from "remix-utils/middleware/jwk-auth";
 * import { createCookie } from "react-router";
 *
 * export const cookie = createCookie("jwt", {
 * 	path: "/",
 * 	sameSite: "lax",
 * 	httpOnly: true,
 * 	secure: process.env.NODE_ENV === "true",
 * });
 *
 * export const [jwkAuthMiddleware, getJWTPayload] = createJWKAuthMiddleware({
 * 	cookie,
 * });
 * ```
 *
 * Then use the middleware as usual, but now instead of looking for the token in the `Authorization` header it will look for it in the cookie.
 *
 * ```ts
 * import { jwkAuthMiddleware } from "~/middleware/jwk-auth";
 *
 * export const middleware: Route.MiddlewareFunction[] = [jwkAuthMiddleware];
 * ```
 *
 *
 * > [!NOTE]
 * > Install using `bunx shadcn@latest add @remix-utils/middleware-honeypot`.
 *
 * > [!NOTE]
 * > This depends on `react`, `@oslojs/crypto`, and `@oslojs/encoding`.
 *
 * The Honeypot middleware allows you to add a honeypot mechanism to your routes, providing a simple yet effective way to protect public forms from spam bots.
 *
 * To use the Honeypot middleware, first import and configure it:
 *
 * ```ts
 * import { createHoneypotMiddleware } from "remix-utils/middleware/honeypot";
 *
 * export const [honeypotMiddleware, getHoneypotInputProps] = createHoneypotMiddleware({
 * 	randomizeNameFieldName: false, // Randomize the honeypot field name
 * 	nameFieldName: "name__confirm", // Default honeypot field name
 * 	validFromFieldName: "from__confirm", // Optional timestamp field for validation
 * 	encryptionSeed: undefined, // Unique seed for encryption (recommended for extra security)
 *
 * 	onSpam(error) {
 * 		// Handle SpamError here and return a Response
 * 		return new Response("Spam detected", { status: 400 });
 * 	},
 * });
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
 * 	let honeypotInputProps = await getHoneypotInputProps();
 * 	return json({ honeypotInputProps });
 * }
 * ```
 *
 * Wrap your application in the `HoneypotProvider` component to make the honeypot input properties available throughout your app:
 *
 * ```tsx
 * import { HoneypotProvider } from "remix-utils/honeypot/react";
 *
 * export default function RootComponent() {
 * 	return (
 * 		<HoneypotProvider {...honeypotInputProps}>
 * 			<Outlet />
 * 		</HoneypotProvider>
 * 	);
 * }
 * ```
 *
 * In any public form, include the `HoneypotInputs` component to add the honeypot fields:
 *
 * ```tsx
 * import { HoneypotInputs } from "remix-utils/honeypot/react";
 *
 * function PublicForm() {
 * 	return (
 * 		<Form method="post">
 * 			<HoneypotInputs label="Please leave this field blank" />
 * 			<input type="text" name="name" placeholder="Your Name" />
 * 			<input type="email" name="email" placeholder="Your Email" />
 * 			<button type="submit">Submit</button>
 * 		</Form>
 * 	);
 * }
 * ```
 *
 * For requests with a body (e.g., POST, PUT, DELETE) and a content type of `application/x-www-form-urlencoded` or `multipart/form-data`, the middleware validates the honeypot fields. If the request passes the honeypot check, it proceeds to the action handler. If the honeypot check fails, the `onSpam` handler is invoked, allowing you to handle spam requests appropriately.
 *
 * In your action handlers, you can process the form data as usual, without worrying about spam checks—they are already handled by the middleware:
 *
 * ```ts
 * export async function action({ request }: Route.ActionArgs) {
 * 	// If this code runs, the honeypot check passed
 * 	let formData = await request.formData();
 * 	let name = formData.get("name");
 * 	let email = formData.get("email");
 * 	// Process the form data
 * }
 * ```
 *
 * The honeypot middleware is designed to be lightweight and effective against basic spam bots. For advanced spam protection, consider combining this with other techniques like CAPTCHA or rate limiting.
 *
 *
 * > [!NOTE]
 * > Install using `bunx shadcn@latest add @remix-utils/middleware-secure-headers`.
 *
 * The secure headers middleware simplifies the setup of security headers. Inspired in part by the version from [Hono `secureHeaders` middleware](https://hono.dev/docs/middleware/builtin/secure-headers).
 *
 * ```ts
 * import { createSecureHeadersMiddleware } from "remix-utils/middleware/secure-headers";
 *
 * export const [secureHeadersMiddleware] = createSecureHeadersMiddleware();
 * ```
 *
 * To use it, you need to add it to the `middleware` array in your `app/root.tsx` file.
 *
 * ```ts
 * import { secureHeadersMiddleware } from "~/middleware/secure-headers.server";
 * export const middleware: Route.MiddlewareFunction[] = [secureHeadersMiddleware];
 * ```
 *
 * Now, every response will have the security header responses.
 *
 * The secure headers middleware middleware can be customized by passing an options object to the `createSecureHeadersMiddleware` function.
 *
 * The options let's you configure the headers key values. [More info here](https://hono.dev/docs/middleware/builtin/secure-headers#supported-options).
 *
 *
 * > [!NOTE]
 * > Install using `bunx shadcn@latest add @remix-utils/middleware-cors`.
 *
 * The CORS middleware simplifies the setup of CORS headers. Internally it uses the same [CORS](#cors) utils exported from `remix-utils/cors`.
 *
 * To use it, first create a CORS middleware instance:
 *
 * ```ts
 * import { createCorsMiddleware } from "remix-utils/middleware/cors";
 *
 * export const [corsMiddleware] = createCorsMiddleware();
 * ```
 *
 * Add the `corsMiddleware` to the `middleware` array in the route where you want to configure CORS, use it in your `app/root.tsx` file to apply it globally:
 *
 * ```ts
 * import { corsMiddleware } from "~/middleware/cors.server";
 *
 * export const middleware: Route.MiddlewareFunction[] = [corsMiddleware];
 * ```
 *
 * Now, every request will have the CORS headers set.
 *
 * You can customize the CORS middleware by passing an options object to the `createCorsMiddleware` function.
 *
 * The options lets you configure the CORS headers, e.g. `origin`, `methods`, `allowedHeaders`, etc.
 *
 * ```ts
 * import { createCorsMiddleware } from "remix-utils/middleware/cors";
 *
 * export const [corsMiddleware] = createCorsMiddleware({
 * 	origin: "https://example.com",
 * 	methods: ["GET", "POST"],
 * 	allowedHeaders: ["Content-Type", "Authorization"],
 * 	exposedHeaders: ["X-My-Custom-Header"],
 * 	maxAge: 3600,
 * 	credentials: true,
 * });
 * ```
 *
 * The [accepted `options`](#options) are the same as those accepted by the `cors` util.
 *
 *
 * > [!NOTE]
 * > Install using `bunx shadcn@latest add @remix-utils/middleware-csrf`.
 *
 * The CSRF middleware protects your application from Cross-Site Request Forgery attacks by validating that requests originate from trusted sources.
 *
 * ```ts
 * import { createCsrfMiddleware } from "remix-utils/middleware/csrf";
 *
 * export const csrfMiddleware = createCsrfMiddleware();
 * ```
 *
 * To use it, you need to add it to the `middleware` array in your `app/root.tsx` file.
 *
 * ```ts
 * import { csrfMiddleware } from "~/middleware/csrf.server";
 * export const middleware: Route.MiddlewareFunction[] = [csrfMiddleware];
 * ```
 *
 * Now, every non-safe request will be validated against CSRF attacks.
 *
 * > [!NOTE]
 * > If you add this middleware to the root route, it will apply to every route in your application. If your app has API routes that should accept cross-site requests (e.g., for webhooks or third-party integrations), you should move the CSRF middleware to a layout route that wraps only your UI routes, leaving API routes unprotected by CSRF validation.
 *
 * The middleware uses the `Sec-Fetch-Site` header to determine request origin. Requests from `same-origin` or `same-site` are automatically allowed. For `cross-site` requests, you can specify trusted origins to allow.
 *
 * The request origin is determined by checking (in order):
 *
 * 1. The `Origin` header
 * 2. The `Referer` header
 * 3. The `request.referrer` property
 *
 * ##### Allowing Cross-Site Requests
 *
 * You can allow cross-site requests from specific origins using a string:
 *
 * ```ts
 * let csrfMiddleware = createCsrfMiddleware({
 * 	origin: "https://trusted.com",
 * });
 * ```
 *
 * Or using a RegExp for pattern matching:
 *
 * ```ts
 * let csrfMiddleware = createCsrfMiddleware({
 * 	origin: /\.trusted\.com$/,
 * });
 * ```
 *
 * Or using an array of strings and RegExps:
 *
 * ```ts
 * let csrfMiddleware = createCsrfMiddleware({
 * 	origin: ["https://trusted1.com", "https://trusted2.com", /\.trusted\.com$/],
 * });
 * ```
 *
 * Or using a function for dynamic validation:
 *
 * ```ts
 * let csrfMiddleware = createCsrfMiddleware({
 * 	origin: (origin, request, context) => origin === "https://trusted.com",
 * });
 * ```
 *
 * The function can also be async:
 *
 * ```ts
 * let csrfMiddleware = createCsrfMiddleware({
 * 	origin: async (origin, request, context) => {
 * 		return await checkOriginInDatabase(origin);
 * 	},
 * });
 * ```
 *
 * ##### Customizing Safe Methods
 *
 * By default, the middleware skips CSRF validation for `GET`, `HEAD`, and `OPTIONS` requests. You can customize this:
 *
 * ```ts
 * let csrfMiddleware = createCsrfMiddleware({
 * 	safeMethods: ["GET", "HEAD", "OPTIONS", "POST"],
 * });
 * ```
 *
 * ##### Allowing Missing Origin
 *
 * You can allow requests with missing or invalid origin headers:
 *
 * ```ts
 * let csrfMiddleware = createCsrfMiddleware({
 * 	origin: "https://trusted.com",
 * 	allowMissingOrigin: true,
 * });
 * ```
 *
 * > [!WARNING]
 * > Enabling `allowMissingOrigin` is high risk. When enabled, requests without a parseable origin (missing `Origin`/`Referer` headers, `Sec-Fetch-Site` header, or `Origin: null`) will bypass origin validation entirely. This can allow attackers to perform cross-site requests in environments that don't send origin headers. Only use this option when you're certain that clients without origin headers are within your trusted boundary, or pair it with an additional CSRF token mechanism.
 *
 * ##### Custom Untrusted Request Handler
 *
 * You can provide a custom handler for requests that fail CSRF validation:
 *
 * ```ts
 * let csrfMiddleware = createCsrfMiddleware({
 * 	onUntrustedRequest(request, context) {
 * 		return new Response("Custom forbidden", { status: 418 });
 * 	},
 * });
 * ```
 *
 * By default, untrusted requests will receive a 403 Forbidden response.
 *
 *
 * > [!NOTE]
 * > Install using `bunx shadcn@latest add @remix-utils/middleware-csrf-token`.
 *
 * > [!NOTE]
 * > This depends on `@oslojs/crypto`, `@oslojs/encoding`, and React Router.
 *
 * The CSRF Token middleware protects your application from Cross-Site Request Forgery attacks using a token-based approach where a random token is stored in a cookie and must be included in form submissions.
 *
 * ```ts
 * import { createCsrfTokenMiddleware } from "remix-utils/middleware/csrf-token";
 * import { createCookie } from "react-router";
 *
 * let cookie = createCookie("csrf", {
 * 	path: "/",
 * 	httpOnly: true,
 * 	secure: process.env.NODE_ENV === "production",
 * 	sameSite: "lax",
 * });
 *
 * export const [csrfTokenMiddleware, getCsrfToken] = createCsrfTokenMiddleware({
 * 	cookie,
 * });
 * ```
 *
 * To use it, add it to the `middleware` array in your `app/root.tsx` file:
 *
 * ```ts
 * import { csrfTokenMiddleware } from "~/middleware/csrf-token.server";
 * export const middleware: Route.MiddlewareFunction[] = [csrfTokenMiddleware];
 * ```
 *
 * Use the `getCsrfToken` function in your root loader to retrieve the token:
 *
 * ```ts
 * import { getCsrfToken } from "~/middleware/csrf-token.server";
 *
 * export async function loader({ context }: Route.LoaderArgs) {
 * 	let csrfToken = getCsrfToken(context);
 * 	return { csrfToken };
 * }
 * ```
 *
 * You can use this with the `AuthenticityTokenProvider` and `AuthenticityTokenInput` components from `remix-utils/csrf/react`:
 *
 * ```tsx
 * import { AuthenticityTokenProvider } from "remix-utils/csrf/react";
 *
 * export default function Root() {
 * 	let { csrfToken } = useLoaderData<typeof loader>();
 * 	return (
 * 		<AuthenticityTokenProvider token={csrfToken}>
 * 			<Outlet />
 * 		</AuthenticityTokenProvider>
 * 	);
 * }
 * ```
 *
 * Then in your forms:
 *
 * ```tsx
 * import { AuthenticityTokenInput } from "remix-utils/csrf/react";
 *
 * function MyForm() {
 * 	return (
 * 		<Form method="post">
 * 			<AuthenticityTokenInput />
 * 		</Form>
 * 	);
 * }
 * ```
 *
 * The middleware automatically validates the token on non-safe requests (POST, PUT, DELETE, PATCH) and rejects requests with invalid or missing tokens with a 403 Forbidden response.
 *
 * ##### Configuration Options
 *
 * You can customize the middleware:
 *
 * ```ts
 * let [csrfTokenMiddleware, getCsrfToken] = createCsrfTokenMiddleware({
 * 	cookie,
 * 	// The name of the form field containing the token (default: "csrf")
 * 	formDataKey: "csrf",
 * 	// A secret to sign the token for extra security
 * 	secret: process.env.CSRF_SECRET,
 * 	// Custom handler for invalid tokens
 * 	onInvalidToken(error, request, context) {
 * 		return new Response("Invalid CSRF token", { status: 403 });
 * 	},
 * });
 * ```
 *
 * ##### Trusted Origins
 *
 * You can allow cross-site requests from specific trusted origins to bypass token validation:
 *
 * ```ts
 * let [csrfTokenMiddleware, getCsrfToken] = createCsrfTokenMiddleware({
 * 	cookie,
 * 	origin: "https://trusted.com",
 * });
 * ```
 *
 * Or using a RegExp for pattern matching:
 *
 * ```ts
 * let [csrfTokenMiddleware, getCsrfToken] = createCsrfTokenMiddleware({
 * 	cookie,
 * 	origin: /\.trusted\.com$/,
 * });
 * ```
 *
 * Or using an array of strings and RegExps:
 *
 * ```ts
 * let [csrfTokenMiddleware, getCsrfToken] = createCsrfTokenMiddleware({
 * 	cookie,
 * 	origin: ["https://trusted1.com", "https://trusted2.com", /\.trusted\.com$/],
 * });
 * ```
 *
 * Or using a function for dynamic validation:
 *
 * ```ts
 * let [csrfTokenMiddleware, getCsrfToken] = createCsrfTokenMiddleware({
 * 	cookie,
 * 	origin: async (origin, request, context) => {
 * 		return await checkOriginInDatabase(origin);
 * 	},
 * });
 * ```
 *
 * > [!NOTE]
 * > If you add this middleware to the root route, it will apply to every route in your application. If your app has API routes that should accept cross-site requests (e.g., for webhooks), move the CSRF middleware to a layout route that wraps only your UI routes.
 *
 *
 * > [!NOTE]
 * > Install using `bunx shadcn@latest add @remix-utils/middleware-rolling-cookie`.
 *
 * > [!NOTE]
 * > This depends on `zod`, and React Router.
 *
 * The rolling cookie middleware allows you to prolong the expiration of a cookie by updating the expiration date on every request.
 *
 * First, create a rolling cookie middleware instance:
 *
 * ```ts
 * import { createRollingCookieMiddleware } from "remix-utils/middleware/rolling-cookie";
 *
 * // This must be a Cookie or TypedCookie instance
 * import { cookie } from "~/cookies";
 *
 * export const [rollingCookieMiddleware] = createRollingCookieMiddleware({
 * 	cookie,
 * });
 * ```
 *
 * Then, add the `rollingCookieMiddleware` to the `middleware` array in your `app/root.tsx` file.
 *
 * ```ts
 * import { rollingCookieMiddleware } from "~/middleware/rolling-cookie.server";
 *
 * export const middleware: Route.MiddlewareFunction[] = [rollingCookieMiddleware];
 * ```
 *
 * Now, every request will have the cookie updated with a new expiration date.
 *
 * > [!NOTE]
 * > If you set the same cookie in your own loaders or actions, the middleware will detect this and do nothing, so you can use the middleware and set the cookie in your own code without worrying about it.
 *
 * ## Author
 *
 * - [Sergio Xalambrí](https://sergiodxa.com)
 *
 * ## License
 *
 * - MIT License
 *
 * @author [Sergio Xalambrí](https://sergiodxa.com)
 * @module Server/Middleware Utils
 */
import type { RouterContextProvider } from "react-router";

export type MiddlewareGetter<T> = (context: Readonly<RouterContextProvider>) => T;
