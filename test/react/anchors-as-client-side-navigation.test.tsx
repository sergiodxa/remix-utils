/**
 * @jest-environment jsdom
 */
import * as React from "react";
import { TreatAnchorsAsClientSideNavigation } from "../../src/react/anchors-as-client-side-navigation";
import { render, screen, fireEvent } from "@testing-library/react";
import { useNavigate } from "@remix-run/react";

jest.mock("@remix-run/react");

const navigate = jest.fn();

beforeAll(() => {
  (useNavigate as jest.MockedFunction<typeof useNavigate>).mockReturnValue(
    navigate
  );
});

afterEach(jest.clearAllMocks);

test("it treats child anchors as links", () => {
  render(
    <TreatAnchorsAsClientSideNavigation>
      <a href="/link">Some link</a>
    </TreatAnchorsAsClientSideNavigation>
  );

  fireEvent.click(screen.getByText("Some link"));

  expect(navigate).toHaveBeenCalledWith("/link");
});

test("handles query string and hash", () => {
  render(
    <TreatAnchorsAsClientSideNavigation>
      <a href="/link#hash?query=string">Some link</a>
    </TreatAnchorsAsClientSideNavigation>
  );

  fireEvent.click(screen.getByText("Some link"));

  expect(navigate).toHaveBeenCalledWith("/link#hash?query=string");
});

test("handles children inside anchor", () => {
  render(
    <TreatAnchorsAsClientSideNavigation>
      <a href="/link">
        <span>
          <span>Some link</span>
        </span>
      </a>
    </TreatAnchorsAsClientSideNavigation>
  );

  fireEvent.click(screen.getByText("Some link"));

  expect(navigate).toHaveBeenCalledWith("/link");
});

test("ignores non-anchors", () => {
  render(
    <TreatAnchorsAsClientSideNavigation>
      <div>Not a link</div>
    </TreatAnchorsAsClientSideNavigation>
  );

  fireEvent.click(screen.getByText("Not a link"));

  expect(navigate).not.toHaveBeenCalled();
});

test("ignores external links", () => {
  render(
    <TreatAnchorsAsClientSideNavigation>
      <a href="https://example.com">A link</a>
    </TreatAnchorsAsClientSideNavigation>
  );

  fireEvent.click(screen.getByText("A link"));

  expect(navigate).not.toHaveBeenCalled();
});

test("ignores internal download links", () => {
  render(
    <TreatAnchorsAsClientSideNavigation>
      <a href="/download" download>
        A link
      </a>
    </TreatAnchorsAsClientSideNavigation>
  );

  fireEvent.click(screen.getByText("A link"));

  expect(navigate).not.toHaveBeenCalled();
});

test("ignore clicks with modifiers and right clicks", () => {
  render(
    <TreatAnchorsAsClientSideNavigation>
      <a href="/link">A link</a>
    </TreatAnchorsAsClientSideNavigation>
  );

  fireEvent.click(screen.getByText("A link"), {
    ctrlKey: true,
  });
  fireEvent.click(screen.getByText("A link"), {
    metaKey: true,
  });
  fireEvent.click(screen.getByText("A link"), {
    shiftKey: true,
  });
  fireEvent.click(screen.getByText("A link"), {
    button: 1,
  });

  expect(navigate).not.toHaveBeenCalled();
});

test("ignores links with target=_blank", () => {
  render(
    <TreatAnchorsAsClientSideNavigation>
      <a href="/link" target="_blank">
        A link
      </a>
    </TreatAnchorsAsClientSideNavigation>
  );

  fireEvent.click(screen.getByText("A link"));

  expect(navigate).not.toHaveBeenCalled();
});

describe("nested configuration checks", () => {
  const mockedConsoleError = jest.fn();
  beforeAll(() => {
    jest.spyOn(console, "error").mockImplementation(mockedConsoleError);
  });
  afterAll(() => {
    jest.spyOn(console, "error").mockRestore();
  });

  const nested = (
    <TreatAnchorsAsClientSideNavigation>
      <TreatAnchorsAsClientSideNavigation>
        <a href="/link">A link</a>
      </TreatAnchorsAsClientSideNavigation>
    </TreatAnchorsAsClientSideNavigation>
  );

  test("it only calls navigate once", () => {
    render(nested);
    fireEvent.click(screen.getByText("A link"));

    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith("/link");
  });

  test("it warns when nested", () => {
    render(nested);
    expect(mockedConsoleError).toHaveBeenCalledWith(
      "TreatAnchorsAsClientSideNavigation can't be nested inside another TreatAnchorsAsClientSideNavigation. Ignoring this instance."
    );
  });

  test("it doesn't render the nested div", () => {
    const { container } = render(nested);
    expect(
      container.querySelectorAll('div[data-anchors-as-links="true"]')
    ).toHaveLength(1);

    expect(container).toMatchInlineSnapshot(`
      <div>
        <div
          data-anchors-as-links="true"
        >
          <a
            href="/link"
          >
            A link
          </a>
        </div>
      </div>
    `);
  });
});
