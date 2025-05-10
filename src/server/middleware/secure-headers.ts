/**
 * The secure headers middleware simplifies the setup of security headers. Inspired in part by the version from Hono `secureHeaders` middleware.
 *
 * ```ts
 * import { unstable_createSecureHeadersMiddleware } from "remix-utils/middleware/secure-headers";
 *
 * export const [secureHeadersMiddleware] =
 *   unstable_createSecureHeadersMiddleware();
 * ```
 *
 * To use it, you need to add it to the `unstable_middleware` array in your `app/root.tsx` file.
 *
 * ```ts
 * import { secureHeadersMiddleware } from "~/middleware/secure-headers.server";
 * export const unstable_middleware = [secureHeadersMiddleware];
 * ```
 *
 * Now, every response will have the security header responses.
 *
 * The secure headers middleware middleware can be customized by passing an options object to the `unstable_createSecureHeadersMiddleware` function.
 *
 * The options let's you configure the headers key values. The middleware accepts the same options as the Hono Secure Headers Middleware.
 * @author [Floryan Simar](https://github.com/TheYoxy)
 * @module Middleware/Secure Headers
 * @see {@link https://hono.dev/docs/middleware/builtin/secure-headers | Hono Secure Headers Middleware}
 */
import type { unstable_MiddlewareFunction } from "react-router";

/**
 * Secure Headers Middleware for React-router.
 *
 * @param {Partial<SecureHeadersOptions>} [customOptions] - The options for the secure headers middleware.
 * @param {ContentSecurityPolicyOptions} [customOptions.contentSecurityPolicy] - Settings for the Content-Security-Policy header.
 * @param {ContentSecurityPolicyOptions} [customOptions.contentSecurityPolicyReportOnly] - Settings for the Content-Security-Policy-Report-Only header.
 * @param {overridableHeader} [customOptions.crossOriginEmbedderPolicy=false] - Settings for the Cross-Origin-Embedder-Policy header.
 * @param {overridableHeader} [customOptions.crossOriginResourcePolicy=true] - Settings for the Cross-Origin-Resource-Policy header.
 * @param {overridableHeader} [customOptions.crossOriginOpenerPolicy=true] - Settings for the Cross-Origin-Opener-Policy header.
 * @param {overridableHeader} [customOptions.originAgentCluster=true] - Settings for the Origin-Agent-Cluster header.
 * @param {overridableHeader} [customOptions.referrerPolicy=true] - Settings for the Referrer-Policy header.
 * @param {ReportingEndpointOptions[]} [customOptions.reportingEndpoints] - Settings for the Reporting-Endpoints header.
 * @param {ReportToOptions[]} [customOptions.reportTo] - Settings for the Report-To header.
 * @param {overridableHeader} [customOptions.strictTransportSecurity=true] - Settings for the Strict-Transport-Security header.
 * @param {overridableHeader} [customOptions.xContentTypeOptions=true] - Settings for the X-Content-Type-Options header.
 * @param {overridableHeader} [customOptions.xDnsPrefetchControl=true] - Settings for the X-DNS-Prefetch-Control header.
 * @param {overridableHeader} [customOptions.xDownloadOptions=true] - Settings for the X-Download-Options header.
 * @param {overridableHeader} [customOptions.xFrameOptions=true] - Settings for the X-Frame-Options header.
 * @param {overridableHeader} [customOptions.xPermittedCrossDomainPolicies=true] - Settings for the X-Permitted-Cross-Domain-Policies header.
 * @param {overridableHeader} [customOptions.xXssProtection=true] - Settings for the X-XSS-Protection header.
 * @param {boolean} [customOptions.removePoweredBy=true] - Settings for remove X-Powered-By header.
 * @param {PermissionsPolicyOptions} [customOptions.permissionsPolicy] - Settings for the Permissions-Policy header.
 * @returns {MiddlewareHandler} The middleware handler function.
 */
export function unstable_createSecureHeadersMiddleware(
	customOptions?: unstable_createSecureHeadersMiddleware.SecureHeadersOptions,
): unstable_createSecureHeadersMiddleware.ReturnType {
	let options = { ...DEFAULT_OPTIONS, ...customOptions };
	let headersToSet = getFilteredHeaders(options);

	if (options.contentSecurityPolicy) {
		let value = getCSPDirectives(options.contentSecurityPolicy);
		headersToSet.push(["Content-Security-Policy", value]);
	}

	if (options.contentSecurityPolicyReportOnly) {
		let value = getCSPDirectives(options.contentSecurityPolicyReportOnly);
		headersToSet.push(["Content-Security-Policy-Report-Only", value]);
	}

	if (
		options.permissionsPolicy &&
		Object.keys(options.permissionsPolicy).length > 0
	) {
		headersToSet.push([
			"Permissions-Policy",
			getPermissionsPolicyDirectives(options.permissionsPolicy),
		]);
	}

	if (options.reportingEndpoints) {
		headersToSet.push([
			"Reporting-Endpoints",
			getReportingEndpoints(options.reportingEndpoints),
		]);
	}

	if (options.reportTo) {
		headersToSet.push(["Report-To", getReportToOptions(options.reportTo)]);
	}

	return [
		async function secureHeaders(_, next) {
			// should evaluate callbacks before next()
			// some callback calls ctx.set() for embedding nonce to the page
			let response = await next();
			setHeaders(response, headersToSet);

			if (options?.removePoweredBy) {
				response.headers.delete("X-Powered-By");
			}
			return response;
		},
	];
}

export namespace unstable_createSecureHeadersMiddleware {
	export interface SecureHeadersOptions {
		contentSecurityPolicy?: ContentSecurityPolicyOptions;
		contentSecurityPolicyReportOnly?: ContentSecurityPolicyOptions;
		crossOriginEmbedderPolicy?: overridableHeader;
		crossOriginResourcePolicy?: overridableHeader;
		crossOriginOpenerPolicy?: overridableHeader;
		originAgentCluster?: overridableHeader;
		referrerPolicy?: overridableHeader;
		reportingEndpoints?: Array<ReportingEndpointOptions>;
		reportTo?: Array<ReportToOptions>;
		strictTransportSecurity?: overridableHeader;
		xContentTypeOptions?: overridableHeader;
		xDnsPrefetchControl?: overridableHeader;
		xDownloadOptions?: overridableHeader;
		xFrameOptions?: overridableHeader;
		xPermittedCrossDomainPolicies?: overridableHeader;
		xXssProtection?: overridableHeader;
		removePoweredBy?: boolean;
		permissionsPolicy?: PermissionsPolicyOptions;
	}

	export type ReturnType = [unstable_MiddlewareFunction<Response>];

	export interface Logger {
		error(...message: string[]): void;
		warn(...message: string[]): void;
		info(...message: string[]): void;
		debug(...message: string[]): void;
	}
}

// https://github.com/w3c/webappsec-permissions-policy/blob/main/features.md

type PermissionsPolicyDirective =
	| StandardizedFeatures
	| ProposedFeatures
	| ExperimentalFeatures;

/**
 * These features have been declared in a published version of the respective
 * specification.
 */
type StandardizedFeatures =
	| "accelerometer"
	| "ambientLightSensor"
	| "attributionReporting"
	| "autoplay"
	| "battery"
	| "bluetooth"
	| "camera"
	| "chUa"
	| "chUaArch"
	| "chUaBitness"
	| "chUaFullVersion"
	| "chUaFullVersionList"
	| "chUaMobile"
	| "chUaModel"
	| "chUaPlatform"
	| "chUaPlatformVersion"
	| "chUaWow64"
	| "computePressure"
	| "crossOriginIsolated"
	| "directSockets"
	| "displayCapture"
	| "encryptedMedia"
	| "executionWhileNotRendered"
	| "executionWhileOutOfViewport"
	| "fullscreen"
	| "geolocation"
	| "gyroscope"
	| "hid"
	| "identityCredentialsGet"
	| "idleDetection"
	| "keyboardMap"
	| "magnetometer"
	| "microphone"
	| "midi"
	| "navigationOverride"
	| "payment"
	| "pictureInPicture"
	| "publickeyCredentialsGet"
	| "screenWakeLock"
	| "serial"
	| "storageAccess"
	| "syncXhr"
	| "usb"
	| "webShare"
	| "windowManagement"
	| "xrSpatialTracking";

/**
 * These features have been proposed, but the definitions have not yet been
 * integrated into their respective specs.
 */
type ProposedFeatures =
	| "clipboardRead"
	| "clipboardWrite"
	| "gemepad"
	| "sharedAutofill"
	| "speakerSelection";

/**
 * These features generally have an explainer only, but may be available for
 * experimentation by web developers.
 */
type ExperimentalFeatures =
	| "allScreensCapture"
	| "browsingTopics"
	| "capturedSurfaceControl"
	| "conversionMeasurement"
	| "digitalCredentialsGet"
	| "focusWithoutUserActivation"
	| "joinAdInterestGroup"
	| "localFonts"
	| "runAdAuction"
	| "smartCard"
	| "syncScript"
	| "trustTokenRedemption"
	| "unload"
	| "verticalScroll";

export interface SecureHeadersVariables {
	secureHeadersNonce?: string;
}

type ContentSecurityPolicyOptionValue = Array<string>;

interface ContentSecurityPolicyOptions {
	defaultSrc?: ContentSecurityPolicyOptionValue;
	baseUri?: ContentSecurityPolicyOptionValue;
	childSrc?: ContentSecurityPolicyOptionValue;
	connectSrc?: ContentSecurityPolicyOptionValue;
	fontSrc?: ContentSecurityPolicyOptionValue;
	formAction?: ContentSecurityPolicyOptionValue;
	frameAncestors?: ContentSecurityPolicyOptionValue;
	frameSrc?: ContentSecurityPolicyOptionValue;
	imgSrc?: ContentSecurityPolicyOptionValue;
	manifestSrc?: ContentSecurityPolicyOptionValue;
	mediaSrc?: ContentSecurityPolicyOptionValue;
	objectSrc?: ContentSecurityPolicyOptionValue;
	reportTo?: string;
	sandbox?: ContentSecurityPolicyOptionValue;
	scriptSrc?: ContentSecurityPolicyOptionValue;
	scriptSrcAttr?: ContentSecurityPolicyOptionValue;
	scriptSrcElem?: ContentSecurityPolicyOptionValue;
	styleSrc?: ContentSecurityPolicyOptionValue;
	styleSrcAttr?: ContentSecurityPolicyOptionValue;
	styleSrcElem?: ContentSecurityPolicyOptionValue;
	upgradeInsecureRequests?: ContentSecurityPolicyOptionValue;
	workerSrc?: ContentSecurityPolicyOptionValue;
}

interface ReportToOptions {
	group: string;
	max_age: number;
	endpoints: Array<ReportToEndpoint>;
}

interface ReportToEndpoint {
	url: string;
}

interface ReportingEndpointOptions {
	name: string;
	url: string;
}

type PermissionsPolicyValue = "*" | "self" | "src" | "none" | (string & {});

type PermissionsPolicyOptions = Partial<
	Record<PermissionsPolicyDirective, Array<PermissionsPolicyValue> | boolean>
>;

type overridableHeader = boolean | string;

type HeadersMap = {
	[key in keyof unstable_createSecureHeadersMiddleware.SecureHeadersOptions]: [
		string,
		string,
	];
};

const HEADERS_MAP: HeadersMap = {
	crossOriginEmbedderPolicy: ["Cross-Origin-Embedder-Policy", "require-corp"],
	crossOriginResourcePolicy: ["Cross-Origin-Resource-Policy", "same-origin"],
	crossOriginOpenerPolicy: ["Cross-Origin-Opener-Policy", "same-origin"],
	originAgentCluster: ["Origin-Agent-Cluster", "?1"],
	referrerPolicy: ["Referrer-Policy", "no-referrer"],
	strictTransportSecurity: [
		"Strict-Transport-Security",
		"max-age=15552000; includeSubDomains",
	],
	xContentTypeOptions: ["X-Content-Type-Options", "nosniff"],
	xDnsPrefetchControl: ["X-DNS-Prefetch-Control", "off"],
	xDownloadOptions: ["X-Download-Options", "noopen"],
	xFrameOptions: ["X-Frame-Options", "SAMEORIGIN"],
	xPermittedCrossDomainPolicies: ["X-Permitted-Cross-Domain-Policies", "none"],
	xXssProtection: ["X-XSS-Protection", "0"],
};

const DEFAULT_OPTIONS: unstable_createSecureHeadersMiddleware.SecureHeadersOptions =
	{
		crossOriginEmbedderPolicy: false,
		crossOriginResourcePolicy: true,
		crossOriginOpenerPolicy: true,
		originAgentCluster: true,
		referrerPolicy: true,
		strictTransportSecurity: true,
		xContentTypeOptions: true,
		xDnsPrefetchControl: true,
		xDownloadOptions: true,
		xFrameOptions: true,
		xPermittedCrossDomainPolicies: true,
		xXssProtection: true,
		removePoweredBy: true,
		permissionsPolicy: {},
	};

function getFilteredHeaders(
	options: unstable_createSecureHeadersMiddleware.SecureHeadersOptions,
): Array<[string, string]> {
	return Object.entries(HEADERS_MAP)
		.filter(
			([key]) =>
				options[
					key as keyof unstable_createSecureHeadersMiddleware.SecureHeadersOptions
				],
		)
		.map(([key, defaultValue]) => {
			let overrideValue =
				options[
					key as keyof unstable_createSecureHeadersMiddleware.SecureHeadersOptions
				];
			return typeof overrideValue === "string"
				? [defaultValue[0], overrideValue]
				: defaultValue;
		});
}

function getCSPDirectives(
	contentSecurityPolicy: ContentSecurityPolicyOptions,
): string {
	let resultValues: Array<string> = [];

	for (let [directive, value] of Object.entries(contentSecurityPolicy)) {
		let valueArray = Array.isArray(value) ? value : [value];
		resultValues.push(
			directive.replace(/[A-Z]+(?![a-z])|[A-Z]/g, (match, offset) =>
				offset ? `-${match.toLowerCase()}` : match.toLowerCase(),
			),
			...valueArray.flatMap((value) => [" ", value]),
			"; ",
		);
	}
	resultValues.pop();

	return resultValues.join("");
}

function getPermissionsPolicyDirectives(
	policy: PermissionsPolicyOptions,
): string {
	return Object.entries(policy)
		.map(([directive, value]) => {
			let kebabDirective = camelToKebab(directive);

			if (typeof value === "boolean") {
				return `${kebabDirective}=${value ? "*" : "none"}`;
			}

			if (Array.isArray(value)) {
				if (value.length === 0) {
					return `${kebabDirective}=()`;
				}
				if (value.length === 1 && (value[0] === "*" || value[0] === "none")) {
					return `${kebabDirective}=${value[0]}`;
				}
				let allowlist = value.map((item) =>
					["self", "src"].includes(item) ? item : `"${item}"`,
				);
				return `${kebabDirective}=(${allowlist.join(" ")})`;
			}

			return "";
		})
		.filter(Boolean)
		.join(", ");
}

function camelToKebab(str: string): string {
	return str.replace(/([a-z\d])([A-Z])/g, "$1-$2").toLowerCase();
}

function getReportingEndpoints(
	reportingEndpoints: unstable_createSecureHeadersMiddleware.SecureHeadersOptions["reportingEndpoints"] = [],
): string {
	return reportingEndpoints
		.map((endpoint) => `${endpoint.name}="${endpoint.url}"`)
		.join(", ");
}

function getReportToOptions(
	reportTo: unstable_createSecureHeadersMiddleware.SecureHeadersOptions["reportTo"] = [],
): string {
	return reportTo.map((option) => JSON.stringify(option)).join(", ");
}

function setHeaders(response: Response, headersToSet: Array<[string, string]>) {
	for (let [header, value] of headersToSet) {
		response.headers.set(header, value);
	}
}
