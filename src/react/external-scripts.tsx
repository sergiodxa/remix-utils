import { useMatches } from "@remix-run/react";

type ReferrerPolicy =
  | "no-referrer-when-downgrade"
  | "no-referrer"
  | "origin-when-cross-origin"
  | "origin"
  | "same-origin"
  | "strict-origin-when-cross-origin"
  | "strict-origin"
  | "unsafe-url";

type CrossOrigin = "anonymous" | "use-credentials";

type ScriptDescriptor = {
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

export type ExternalScriptsFunction = () => ScriptDescriptor[];

export function ExternalScripts() {
  let matches = useMatches();
  let scripts = matches.flatMap((match) => {
    let scripts = match.handle?.scripts as ExternalScriptsFunction | undefined;
    if (typeof scripts === "function") return scripts();
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
