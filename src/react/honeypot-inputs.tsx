import * as React from "react";
import { useRouteLoaderData } from "@remix-run/react";
import type { HoneypotInputProps } from "../server/honeypot.jsx";

export function HoneypotInputs() {
  let rootLoaderData = useRouteLoaderData(
    "root"
  ) as Partial<HoneypotInputProps>;

  if (!rootLoaderData) throw new Error("Missing loader data from root");

  if (!rootLoaderData.nameFieldName) {
    throw new Error("Missing Honeypot's nameFieldName on root loader data");
  }

  if (!rootLoaderData.validFromFieldName) {
    throw new Error(
      "Missing Honeypot's validFromFieldName on root loader data"
    );
  }

  if (!rootLoaderData.encryptedValidFrom) {
    throw new Error(
      "Missing Honeypot's encryptedValidFrom on root loader data"
    );
  }

  return (
    <div
      id={`${rootLoaderData.nameFieldName}_wrap`}
      style={{ display: "none" }}
      aria-hidden="true"
    >
      <input
        id={rootLoaderData.nameFieldName}
        name={rootLoaderData.nameFieldName}
        type="text"
        defaultValue=""
        autoComplete="off"
        tabIndex={-1}
      />
      <input
        name={rootLoaderData.validFromFieldName}
        type="text"
        value={rootLoaderData.encryptedValidFrom}
        autoComplete="off"
        tabIndex={-1}
      />
    </div>
  );
}
