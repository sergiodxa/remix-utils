/**
 * @jest-environment jsdom
 */
import { render } from "@testing-library/react";
import * as React from "react";
import {
  AuthenticityTokenInput,
  AuthenticityTokenProvider,
} from "../src/react";

describe("React Utils", () => {
  describe("CSRF", () => {
    it("should work", () => {
      render(
        <AuthenticityTokenProvider token="testing-token">
          <AuthenticityTokenInput />
        </AuthenticityTokenProvider>
      );
    });
  });
});
