import { describe, expect, spyOn, test } from "bun:test";
import { eventStream } from "./event-stream.js";

describe(eventStream, () => {
	test("returns a response", () => {
		let controller = new AbortController();
		let response = eventStream(controller.signal, (_, __) => {
			// biome-ignore lint/suspicious/noEmptyBlockStatements: Test
			return () => {};
		});
		controller.abort();
		expect(response).toBeInstanceOf(Response);
	});

	test("response is a readable stream", async () => {
		let controller = new AbortController();
		let response = eventStream(controller.signal, (_, __) => {
			// biome-ignore lint/suspicious/noEmptyBlockStatements: Test
			return () => {};
		});
		controller.abort();
		if (!response.body) throw new Error("Response body is undefined");
		let reader = response.body.getReader();
		let { done } = await reader.read();
		expect(done).toBe(true);
	});

	test("can send data to the client with the send function", async () => {
		let controller = new AbortController();
		let response = eventStream(controller.signal, (send, _) => {
			send({ data: "hello" });
			send({ event: "multi-line", data: "hello\nworld" });
			send({ event: "crlf", data: "hello\r\nworld" });
			return () => {};
		});

		controller.abort();

		if (!response.body) throw new Error("Response body is undefined");

		let reader = response.body.getReader();
		let decoder = new TextDecoder();

		let { value: event } = await reader.read();
		expect(decoder.decode(event)).toEqual("event: message\n");

		let { value: data } = await reader.read();
		expect(decoder.decode(data)).toEqual("data: hello\n\n");

		let { value: multiLineEvent } = await reader.read();
		expect(decoder.decode(multiLineEvent)).toEqual("event: multi-line\n");

		let { value: multiLineData } = await reader.read();
		expect(decoder.decode(multiLineData)).toEqual("data: hello\ndata: world\n\n");

		let { value: crlfEvent } = await reader.read();
		expect(decoder.decode(crlfEvent)).toEqual("event: crlf\n");

		let { value: crlfData } = await reader.read();
		expect(decoder.decode(crlfData)).toEqual("data: hello\ndata: world\n\n");

		let { done } = await reader.read();
		expect(done).toBe(true);
	});

	test("accepts custom queuing strategy", () => {
		expect(() =>
			eventStream(
				new AbortController().signal,
				(_, abort) => {
					return () => abort();
				},
				undefined,
				new CountQueuingStrategy({ highWaterMark: 2 }),
			),
		).not.toThrow();
	});

	describe("Headers Overrides", () => {
		test("overrrides Content-Type header", () => {
			// biome-ignore lint/suspicious/noEmptyBlockStatements: Test
			let spy = spyOn(console, "warn").mockImplementation(() => {});

			let response = eventStream(
				new AbortController().signal,
				(_, abort) => {
					return () => abort();
				},
				{ headers: { "Content-Type": "text/html" } },
			);

			expect(spy).toHaveBeenCalledWith("Overriding Content-Type header to `text/event-stream`");

			expect(response.headers.get("Content-Type")).toBe("text/event-stream");
		});

		test("overrides Cache-Control", () => {
			// biome-ignore lint/suspicious/noEmptyBlockStatements: Test
			let spy = spyOn(console, "warn").mockImplementation(() => {});

			let response = eventStream(
				new AbortController().signal,
				(_, abort) => {
					return () => abort();
				},
				{ headers: { "Cache-Control": "max-age=60" } },
			);

			expect(spy).toHaveBeenCalledWith("Overriding Cache-Control header to `no-cache`");

			expect(response.headers.get("Content-Type")).toBe("text/event-stream");
		});

		test("overrides Connection", () => {
			// biome-ignore lint/suspicious/noEmptyBlockStatements: Test
			let spy = spyOn(console, "warn").mockImplementation(() => {});

			let response = eventStream(
				new AbortController().signal,
				(_, abort) => {
					return () => abort();
				},
				{ headers: { Connection: "close" } },
			);

			expect(spy).toHaveBeenCalledWith("Overriding Connection header to `keep-alive`");

			expect(response.headers.get("Content-Type")).toBe("text/event-stream");
		});
	});
});
