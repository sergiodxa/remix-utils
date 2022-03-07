import { useMatches } from "@remix-run/react";
import type { Thing, WithContext } from "schema-dts";

export type StructuredDatum = WithContext<Thing>;

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
    handle !== undefined &&
    (handle as HandleStructuredData).structuredData !== undefined &&
    typeof (handle as HandleStructuredData).structuredData === "function"
  );
}

export type StructuredDataFunction<T = unknown> = (
  data: T
) => StructuredDatum | StructuredDatum[];

/**
 * Render "application/ld+json" script tags for structured data (https://developers.google.com/search/docs/advanced/structured-data/intro-structured-data)
 * @example
 * // This route uses the data to render structured data (e.g. BreadcrumbList and BlogPosting)
 * export let handle = {
 *    structuredData: (data: LoaderData) => {
 *      let { post } = data;
 *
 *      let postSchema: WithContext<BlogPosting> = {
 *        '@context': 'https://schema.org',
 *        '@type': 'BlogPosting',
 *        datePublished: post.published,
 *        mainEntityOfPage: {
 *          '@type': 'WebPage',
 *          '@id': post.postUrl,
 *        },
 *        image: post.featuredImage,
 *        author: {
 *          '@type': 'Person',
 *          name: post.authorName,
 *        },
 *      };
 *
 *      return postSchema;
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

  if (structuredData.length === 0) {
    return null;
  }

  const renderedScript =
    structuredData.length === 1
      ? JSON.stringify(structuredData[0])
      : JSON.stringify(structuredData);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: renderedScript,
      }}
    />
  );
}
