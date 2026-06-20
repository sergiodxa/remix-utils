/**
 * > [!NOTE]
 * > Install using `bunx shadcn@latest add @remix-utils/honeypot-server` and `bunx shadcn@latest add @remix-utils/honeypot-react`.
 *
 * > [!NOTE]
 * > This depends on `react` and `@oslojs/crypto`, and `@oslojs/encoding`.
 *
 * Honeypot is a simple technique to prevent spam bots from submitting forms. It works by adding a hidden field to the form that bots will fill, but humans won't.
 *
 * There's a pair of utils in Remix Utils to help you implement this.
 *
 * First, create a `honeypot.server.ts` where you will instantiate and configure your Honeypot.
 *
 * ```tsx
 * import { Honeypot } from "remix-utils/honeypot/server";
 *
 * // Create a new Honeypot instance, the values here are the defaults, you can
 * // customize them
 * export const honeypot = new Honeypot({
 * 	randomizeNameFieldName: false,
 * 	nameFieldName: "name__confirm",
 * 	validFromFieldName: "from__confirm", // null to disable it
 * 	encryptionSeed: undefined, // Ideally it should be unique even between processes
 * });
 * ```
 *
 * Then, in your `app/root` loader, call `honeypot.getInputProps()` and return it.
 *
 * ```ts
 * // app/root.tsx
 * import { honeypot } from "~/honeypot.server";
 *
 * export async function loader() {
 * 	// more code here
 * 	return json({ honeypotInputProps: honeypot.getInputProps() });
 * }
 * ```
 *
 * And in the `app/root` component render the `HoneypotProvider` component wrapping the rest of the UI.
 *
 * ```tsx
 * import { HoneypotProvider } from "remix-utils/honeypot/react";
 *
 * export default function Component() {
 * 	// more code here
 * 	return (
 * 		// some JSX
 * 		<HoneypotProvider {...honeypotInputProps}>
 * 			<Outlet />
 * 		</HoneypotProvider>
 * 		// end that JSX
 * 	);
 * }
 * ```
 *
 * Now, in every public form you want protect against spam (like a login form), render the `HoneypotInputs` component.
 * By default it uses the `__honeypot_inputs` class and injects a hidden CSS rule.
 * If you pass your own `className`, you can hide it with external CSS instead.
 *
 * ```tsx
 * import { HoneypotInputs } from "remix-utils/honeypot/react";
 *
 * function SomePublicForm() {
 * 	// Use the default class, or pass your own className and hide it in CSS.
 * 	return (
 * 		<Form method="post">
 * 			<HoneypotInputs label="Please leave this field blank" />
 * 			{/* more inputs and some buttons * /}
 * 		</Form>
 * 	);
 * }
 * ```
 *
 * > [!NOTE]
 * > The label value above is the default one, use it to allow the label to be localized, or remove it if you don't want to change it.
 *
 * Finally, in the action the form submits to, you can call `honeypot.check`.
 *
 * ```ts
 * import { SpamError } from "remix-utils/honeypot/server";
 * import { honeypot } from "~/honeypot.server";
 *
 * export async function action({ request }) {
 * 	let formData = await request.formData();
 * 	try {
 * 		honeypot.check(formData);
 * 	} catch (error) {
 * 		if (error instanceof SpamError) {
 * 			// handle spam requests here
 * 		}
 * 		// handle any other possible error here, e.g. re-throw since nothing else
 * 		// should be thrown
 * 	}
 * 	// the rest of your action
 * }
 * ```
 *
 * @author [Sergio Xalambrí](https://sergiodxa.com)
 * @module Component/Honeypot
 */
import * as React from "react";
import type { HoneypotInputProps } from "../server/honeypot.js";

type HoneypotContextType = Partial<HoneypotInputProps>;

const HoneypotContext = React.createContext<HoneypotContextType>({});

const DEFAULT_CLASSNAME = "__honeypot_inputs";

export function HoneypotInputs({
	label = "Please leave this field blank",
	nonce,
	className = DEFAULT_CLASSNAME,
}: HoneypotInputs.Props) {
	let context = React.useContext(HoneypotContext);

	let {
		nameFieldName = "name__confirm",
		validFromFieldName = "from__confirm",
		encryptedValidFrom,
	} = context;

	return (
		<div id={`${nameFieldName}_wrap`} className={className} aria-hidden="true">
			{className === DEFAULT_CLASSNAME ? (
				<style
					nonce={nonce}
					dangerouslySetInnerHTML={{ __html: `.${DEFAULT_CLASSNAME} { display: none; }` }}
				/>
			) : null}
			<label htmlFor={nameFieldName}>{label}</label>
			<input
				id={nameFieldName}
				name={nameFieldName}
				type="text"
				defaultValue=""
				autoComplete="nope"
				tabIndex={-1}
			/>
			{validFromFieldName && encryptedValidFrom ? (
				<>
					<label htmlFor={validFromFieldName}>{label}</label>
					<input
						id={validFromFieldName}
						name={validFromFieldName}
						type="text"
						value={encryptedValidFrom}
						readOnly
						autoComplete="off"
						tabIndex={-1}
					/>
				</>
			) : null}
		</div>
	);
}

export namespace HoneypotInputs {
	export type Props = {
		label?: string;
		nonce?: string;
		/**
		 * The classname used to hide the honeypot inputs.
		 *
		 * When omitted, the component uses the default `__honeypot_inputs` class
		 * and injects a matching hidden style tag. Pass your own class name if you
		 * want to hide it from your app's stylesheet instead.
		 * @default "__honeypot_inputs"
		 */
		className?: string;
	};
}

export type HoneypotProviderProps = HoneypotContextType & {
	children: React.ReactNode;
};

export function HoneypotProvider({ children, ...context }: HoneypotProviderProps) {
	return <HoneypotContext.Provider value={context}>{children}</HoneypotContext.Provider>;
}
