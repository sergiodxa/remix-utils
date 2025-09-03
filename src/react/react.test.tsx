import { describe, test } from "bun:test";
import { render } from "@testing-library/react";
import {
	AuthenticityTokenInput,
	AuthenticityTokenProvider,
} from "./authenticity-token.js";

// biome-ignore lint/suspicious/noSkippedTests: Fix this
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
