import { render } from "@testing-library/react";
import * as React from "react";
// @vitest-environment happy-dom
import { describe, test } from "vitest";
import {
	AuthenticityTokenInput,
	AuthenticityTokenProvider,
} from "../src/react/authenticity-token";
// TODO Fix this
describe.skip("React Utils", () => {
	describe("CSRF", () => {
		test("should work", () => {
			render(
				<AuthenticityTokenProvider token="testing-token">
					<AuthenticityTokenInput />
				</AuthenticityTokenProvider>,
			);
		});
	});
});
