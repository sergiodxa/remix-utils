import { useLocation, useMatches } from "@remix-run/react";
import { AppData } from "@remix-run/server-runtime";
import type { Thing, WithContext } from "schema-dts";
import { HandleConventionArguments } from "./handle-conventions";

export type StructuredDatum<StructuredDataSchema extends Thing> =
  WithContext<StructuredDataSchema>;

/**
 * A convenience type for `export let handle =` to ensure the correct `handle` structure is used.
 *
 * @example
 * // This route uses the data to render structured data (e.g. BreadcrumbList and BlogPosting)
 * export let handle: HandleStructuredData<LoaderData> = {
 *    structuredData({ id, data, params }) => {
 *       return [{...}]
 *    },
 * };
 */
export type HandleStructuredData<
  LoaderData extends AppData = AppData,
  StructuredDataSchema extends Thing = Thing
> = {
  structuredData: StructuredDataFunction<LoaderData, StructuredDataSchema>;
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

export interface StructuredDataFunction<
  Data extends AppData = AppData,
  StructuredDataSchema extends Thing = Thing
> {
  (args: HandleConventionArguments<Data>):
    | StructuredDatum<StructuredDataSchema>
    | StructuredDatum<StructuredDataSchema>[]
    | null;
}

/**
 * Render "application/ld+json" script tags for structured data (https://developers.google.com/search/docs/advanced/structured-data/intro-structured-data)
 * @example
 * // This route uses the data to render structured data (e.g. BreadcrumbList and BlogPosting)
 * export let handle: HandleStructuredData<LoaderData, BlogPosting> = {
 *    structuredData({ data }) {
 *      let { post } = data;
 *
 *      return {
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
 *    },
 * };
 */
export function StructuredData() {
  let location = useLocation();

  let structuredData = useMatches().flatMap((match, index, matches) => {
    if (isHandleStructuredData(match.handle)) {
      let result = match.handle.structuredData({
        id: match.id,
        data: match.data,
        params: match.params,
        location,
        parentsData: matches.slice(0, index).map((match) => match.data),
      });
      if (result) return result;
    }

    return [];
  });

  if (structuredData.length === 0) {
    return null;
  }

  let renderedScript =
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
