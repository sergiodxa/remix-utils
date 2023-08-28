import * as React from "react";
import { useLocation, useMatches } from "@remix-run/react";
import type { AppData } from "@remix-run/server-runtime";
import { HandleConventionArguments } from "./handle-conventions.js";

export type ReferrerPolicy =
  | "no-referrer-when-downgrade"
  | "no-referrer"
  | "origin-when-cross-origin"
  | "origin"
  | "same-origin"
  | "strict-origin-when-cross-origin"
  | "strict-origin"
  | "unsafe-url";

export type CrossOrigin = "anonymous" | "use-credentials";

export type ScriptDescriptor = {
  async?: boolean;
  crossOrigin?: CrossOrigin;
  defer?: boolean;
  integrity?: string;
  noModule?: boolean;
  nonce?: string;
  referrerPolicy?: ReferrerPolicy;
  src: string;
  type?: string;
};

export interface ExternalScriptsFunction<Data extends AppData = AppData> {
  (args: HandleConventionArguments<Data>): ScriptDescriptor[];
}

export function ExternalScripts() {
  let location = useLocation();

  let scripts = useMatches().flatMap((match, index, matches) => {
    let scripts = match.handle?.scripts as ExternalScriptsFunction | undefined;
    if (typeof scripts !== "function") return [];
    let result = scripts({
      id: match.id,
      data: match.data,
      params: match.params,
      location,
      parentsData: matches.slice(0, index).map((match) => match.data),
      matches,
    });
    if (Array.isArray(result)) return result;
    return [];
  });

  return (
    <>
      {scripts.map((props) => {
        let rel = props.noModule ? "modulepreload" : "preload";
        let as = !props.noModule ? "script" : undefined;
        return (
          <link
            key={props.src}
            rel={rel}
            href={props.src}
            as={as}
            crossOrigin={props.crossOrigin}
            integrity={props.integrity}
            referrerPolicy={props.referrerPolicy}
          />
        );
      })}

      {scripts.map((props) => {
        return <script {...props} key={props.src} />;
      })}
    </>
  );
}
