import type { LinkProps } from "@remix-run/react";

type To = Partial<Pick<URL, "hostname" | "pathname" | "hash" | "search">> & {
  searchParams?: ConstructorParameters<typeof URLSearchParams>["0"];
};

export function to(partial: To): LinkProps["to"] {
  let url = new URL("http://localhost");

  if (partial.hostname) url.hostname = partial.hostname;
  if (partial.pathname) url.pathname = partial.pathname;
  if (partial.search) url.search = partial.search;
  if (partial.searchParams) {
    url.search = new URLSearchParams(partial.searchParams).toString();
  }
  if (partial.hash) url.hash = partial.hash;

  let string = url.toString();

  if (partial.hostname) return string;
  if (partial.pathname) return string.slice("http://localhost".length);
  return string.slice("http://localhost/".length);
}
