import { useMatches } from "@remix-run/react";
import type { Thing, WithContext } from "schema-dts";

export type StructuredDataDescriptor = {
  key: string;
  data: WithContext<Thing>;
};

/**
 * A convenience type for `export let handle =` to ensure the correct `handle` structure is used.
 *
 * @example
 * // This route uses the data to render structured data (e.g. BreadcrumbList and BlogPosting)
 * export let handle: HandleStructuredData<LoaderData> = {
 *    structuredData: (data) => {
 *       return [{...}]
 *    },
 * };
 */
export type HandleStructuredData<T = unknown> = {
  structuredData: StructuredDataFunction<T>;
};

function isHandleStructuredData(
  handle: unknown
): handle is HandleStructuredData {
  return (
    (handle as HandleStructuredData).structuredData !== undefined &&
    typeof (handle as HandleStructuredData).structuredData === "function"
  );
}

export type StructuredDataFunction<T = unknown> = (
  data: T
) => StructuredDataDescriptor[];

/**
 * Render script tags for structured data (https://developers.google.com/search/docs/advanced/structured-data/intro-structured-data)
 * @example
 * // This route uses the data to render structured data (e.g. BreadcrumbList and BlogPosting)
 * export const handle = {
 *    structuredData: (data: LoaderData) => {
 *       return postToStructuredData(data.post);
 *    },
 * };
 */
export function StructuredData() {
  const matches = useMatches();
  const structuredData = matches.flatMap((match) => {
    const { handle, data } = match;

    if (isHandleStructuredData(handle)) {
      return handle.structuredData(data);
    }

    return [];
  });

  return (
    <>
      {structuredData.map(({ key, data }) => {
        return (
          <script
            key={key}
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(data),
            }}
          />
        );
      })}
    </>
  );
}
