import { useMatches } from "@remix-run/react";
import type { AppData, LinkDescriptor } from "@remix-run/server-runtime";
import type { Params } from "react-router-dom";

export interface DynamicLinksFunction<Data extends AppData = AppData> {
  (args: { id: string; data: Data; params: Params }): LinkDescriptor[];
}

export function DynamicLinks() {
  let links: LinkDescriptor[] = useMatches().flatMap((match) => {
    let fn = match.handle?.dynamicLinks;
    if (typeof fn !== "function") return [];
    return fn({ id: match.id, data: match.data, params: match.params });
  });

  return (
    <>
      {links.map((link) => (
        <link {...link} key={link.integrity || JSON.stringify(link)} />
      ))}
    </>
  );
}
