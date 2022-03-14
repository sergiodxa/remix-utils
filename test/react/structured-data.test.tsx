/**
 * @jest-environment jsdom
 */

import { useMatches } from "@remix-run/react";
import { render } from "@testing-library/react";
import { BlogPosting } from "schema-dts";

import { HandleStructuredData, StructuredData } from "../../src/react";

jest.mock("@remix-run/react");

type TestPostData = {
  post: {
    title: string;
    headline: string;
    published: string;
    url: string;
    authorName: string;
  } | null;
};

describe("React Utils", () => {
  describe("StructuredData", () => {
    let matches: ReturnType<typeof useMatches> = [];

    it("should render nothing if matches is empty", () => {
      (useMatches as jest.MockedFunction<typeof useMatches>).mockReturnValue(
        matches
      );

      render(<StructuredData />);

      const scripts = window.document.querySelectorAll("script");

      expect(scripts).toHaveLength(0);
    });

    const testLoaderData: TestPostData = {
      post: {
        title: "Structured Data in Remix",
        headline: "Use structured json+ld data in Remix",
        published: "2022-03-14",
        url: "https://example.com/blog/post/structured-data",
        authorName: "Example Author",
      },
    };

    describe("with a matched handle", () => {
      const handle: HandleStructuredData<TestPostData, BlogPosting> = {
        structuredData: ({ post }) => {
          if (!post) {
            return null;
          }

          return {
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: post.headline,
            datePublished: post.published,
            mainEntityOfPage: {
              "@type": "WebPage",
              "@id": post.url,
            },
            author: {
              "@type": "Person",
              name: post.authorName,
            },
          };
        },
      };

      describe("and the structuredData fn returns null", () => {
        it("should render nothing", () => {
          const testLoaderData: TestPostData = {
            post: null,
          };

          const matches: ReturnType<typeof useMatches> = [
            {
              data: testLoaderData,
              handle: handle,
              params: { slug: "structured-data" },
              pathname: "/blog/post/structured-data",
            },
          ];

          (
            useMatches as jest.MockedFunction<typeof useMatches>
          ).mockReturnValue(matches);

          render(<StructuredData />);

          const scripts = window.document.querySelectorAll("script");

          expect(scripts).toHaveLength(0);
        });
      });

      describe("and the loader data contains a post", () => {
        it("should render a json+ld script tag with the stringified data", () => {
          const matches: ReturnType<typeof useMatches> = [
            {
              data: testLoaderData,
              handle: handle,
              params: { slug: "structured-data" },
              pathname: "/blog/post/structured-data",
            },
          ];

          (
            useMatches as jest.MockedFunction<typeof useMatches>
          ).mockReturnValue(matches);

          render(<StructuredData />);

          const scripts = window.document.querySelectorAll("script");

          expect(scripts).toHaveLength(1);
          expect(scripts[0].getAttribute("type")).toBe("application/ld+json");
          expect(scripts[0].innerHTML).toBe(
            JSON.stringify(handle.structuredData(testLoaderData))
          );
        });
      });
    });

    describe("and the structuredData fn retuns multiple datums", () => {
      const handle: HandleStructuredData<TestPostData> = {
        structuredData: ({ post }) => {
          if (!post) {
            return null;
          }

          return [
            {
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: [
                {
                  "@type": "ListItem",
                  position: 1,
                  name: "Blog",
                  item: "https://example.com/blog",
                },
                {
                  "@type": "ListItem",
                  position: 2,
                  name: post.headline,
                  item: post.url,
                },
              ],
            },
            {
              "@context": "https://schema.org",
              "@type": "BlogPosting",
              headline: post.headline,
              datePublished: post.published,
              mainEntityOfPage: {
                "@type": "WebPage",
                "@id": post.url,
              },
              author: {
                "@type": "Person",
                name: post.authorName,
              },
            },
          ];
        },
      };

      it("should render a single json+ld script tag with a stringified array of  data", () => {
        const matches: ReturnType<typeof useMatches> = [
          {
            data: testLoaderData,
            handle: handle,
            params: { slug: "structured-data" },
            pathname: "/blog/post/structured-data",
          },
        ];

        (useMatches as jest.MockedFunction<typeof useMatches>).mockReturnValue(
          matches
        );

        render(<StructuredData />);

        const scripts = window.document.querySelectorAll("script");

        expect(scripts).toHaveLength(1);
        expect(scripts[0].getAttribute("type")).toBe("application/ld+json");
        expect(scripts[0].innerHTML).toBe(
          JSON.stringify(handle.structuredData(testLoaderData))
        );
      });
    });
  });
});
