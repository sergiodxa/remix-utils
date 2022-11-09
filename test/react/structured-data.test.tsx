/**
 * @jest-environment jsdom
 */
import { useMatches } from "@remix-run/react";
import { render } from "@testing-library/react";
import * as React from "react";
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

      let scripts = window.document.querySelectorAll("script");

      expect(scripts).toHaveLength(0);
    });

    let testLoaderData: TestPostData = {
      post: {
        title: "Structured Data in Remix",
        headline: "Use structured json+ld data in Remix",
        published: "2022-03-14",
        url: "https://example.com/blog/post/structured-data",
        authorName: "Example Author",
      },
    };

    describe("with a matched handle", () => {
      let handle: HandleStructuredData<TestPostData, BlogPosting> = {
        structuredData: ({ data: { post } }) => {
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
          let testLoaderData: TestPostData = {
            post: null,
          };

          let matches: ReturnType<typeof useMatches> = [
            {
              id: "route-id",
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

          let scripts = window.document.querySelectorAll("script");

          expect(scripts).toHaveLength(0);
        });
      });

      describe("and the loader data contains a post", () => {
        it("should render a json+ld script tag with the stringified data", () => {
          let matches: ReturnType<typeof useMatches> = [
            {
              id: "route-id",
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

          let scripts = window.document.querySelectorAll("script");

          expect(scripts).toHaveLength(1);
          expect(scripts[0].getAttribute("type")).toBe("application/ld+json");
          expect(scripts[0].innerHTML).toBe(
            JSON.stringify(
              handle.structuredData({
                id: "route-id",
                data: testLoaderData,
                params: { slug: "structured-data" },
                location: {
                  hash: "",
                  key: "location-key",
                  pathname: "/blog/post/structured-data",
                  search: "",
                  state: undefined,
                },
                parentsData: [],
              })
            )
          );
        });
      });
    });

    describe("and the structuredData fn retuns multiple datums", () => {
      let handle: HandleStructuredData<TestPostData> = {
        structuredData: ({ data: { post } }) => {
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
        let matches: ReturnType<typeof useMatches> = [
          {
            id: "route-id",
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

        let scripts = window.document.querySelectorAll("script");

        expect(scripts).toHaveLength(1);
        expect(scripts[0].getAttribute("type")).toBe("application/ld+json");
        expect(scripts[0].innerHTML).toBe(
          JSON.stringify(
            handle.structuredData({
              id: "route-id",
              data: testLoaderData,
              params: { slug: "structured-data" },
              location: {
                hash: "",
                key: "location-key",
                pathname: "/blog/post/structured-data",
                search: "",
                state: undefined,
              },
              parentsData: [],
            })
          )
        );
      });
    });
  });
});
