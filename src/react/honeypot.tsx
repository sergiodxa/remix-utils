import * as React from "react";
import type { HoneypotInputProps } from "../server/honeypot.js";

type HoneypotContextType = Partial<HoneypotInputProps>;

const HoneypotContext = React.createContext<HoneypotContextType>({});

export function HoneypotInputs({
	label = "Please leave this field blank",
	nonce,
}: {
	label?: string;
	nonce?: string;
}) {
	let context = React.useContext(HoneypotContext);

	let {
		nameFieldName = "name__confirm",
		validFromFieldName = "from__confirm",
		encryptedValidFrom,
	} = context;

	return (
		<div
			id={`${nameFieldName}_wrap`}
			className="__honeypot_inputs"
			aria-hidden="true"
		>
			<style nonce={nonce}>{`.__honeypot_inputs { display: none; }`}</style>
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

export type HoneypotProviderProps = HoneypotContextType & {
	children: React.ReactNode;
};

export function HoneypotProvider({
	children,
	...context
}: HoneypotProviderProps) {
	return (
		<HoneypotContext.Provider value={context}>
			{children}
		</HoneypotContext.Provider>
	);
}
