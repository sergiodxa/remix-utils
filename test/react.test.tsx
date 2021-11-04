import { render } from "@testing-library/react";
import {
  AuthenticityTokenInput,
  AuthenticityTokenProvider,
} from "../src/react";

describe("React Utils", () => {
  describe("CSRF", () => {
    render(
      <AuthenticityTokenProvider token="testing-token">
        <AuthenticityTokenInput />
      </AuthenticityTokenProvider>
    );
  });
});
