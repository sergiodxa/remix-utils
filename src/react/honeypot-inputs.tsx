import * as React from "react";
import { type HoneypotInputProps } from "../server/honeypot.js";

type HoneypotContextType = Partial<HoneypotInputProps>;

const HoneypotContext = React.createContext<HoneypotContextType>({});

export function HoneypotInputs(): JSX.Element {
  const context = React.useContext(HoneypotContext);

  const {
    nameFieldName = "name__confirm",
    validFromFieldName = "from__confirm",
    encryptedValidFrom,
  } = context;

  return (
    <div
      id={`${nameFieldName}_wrap`}
      style={{ display: "none" }}
      aria-hidden="true"
    >
      <label htmlFor={nameFieldName}>Please leave this field blank</label>
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
          <label htmlFor={validFromFieldName}>
            Please leave this field blank
          </label>
          <input
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

export function HoneypotProvider({
  children,
  ...context
}: {
  children: React.ReactNode;
} & HoneypotContextType) {
  return <HoneypotContext.Provider value={context} children={children} />;
}
