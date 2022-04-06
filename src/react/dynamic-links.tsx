import { useMatches } from "@remix-run/react";
import type { AppData, LinkDescriptor } from "@remix-run/server-runtime";

export interface DynamicLinksFunction<Data extends AppData = AppData> {
  (args: { data: Data }): LinkDescriptor[];
}

export function DynamicLinks() {
  let links: LinkDescriptor[] = useMatches().flatMap((match) => {
    let fn = match.handle?.dynamicLinks;
    if (typeof fn !== "function") return [];
    return fn({ data: match.data });
  });

  return (
    <>
      {links.map((link) => (
        <link {...link} key={link.integrity || JSON.stringify(link)} />
      ))}
    </>
  );
}
