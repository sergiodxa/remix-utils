/* eslint-disable @typescript-eslint/no-empty-function */
import { vi, describe, test, expect } from "vitest";
import { eventStream } from "../../src/server/event-stream";

describe(eventStream, () => {
	describe("Emitter API", () => {
		test("returns a response", () => {
			let controller = new AbortController();
			let response = eventStream(controller.signal, () => {
				return () => {};
			});
			controller.abort();
			expect(response).toBeInstanceOf(Response);
		});

		test("response is a readable stream", async () => {
			let controller = new AbortController();
			let response = eventStream(controller.signal, () => {
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
			let response = eventStream(controller.signal, (send) => {
				send({ data: "hello" });
				return () => {};
			});

			controller.abort();

			if (!response.body) throw new Error("Response body is undefined");

			let reader = response.body.getReader();

			let { value: event } = await reader.read();
			expect(event).toEqual(new TextEncoder().encode("event: message\n"));

			let { value: data } = await reader.read();
			expect(data).toEqual(new TextEncoder().encode("data: hello\n\n"));

			let { done } = await reader.read();
			expect(done).toBe(true);
		});

		test("cleanup function is called when the client closes the connection", () => {
			let fn = vi.fn();

			let controller = new AbortController();

			eventStream(controller.signal, () => fn);

			controller.abort();

			expect(fn).toHaveBeenCalledOnce();
		});

		describe("Headers Overrides", () => {
			test("overrrides Content-Type header", () => {
				let spy = vi.spyOn(console, "warn").mockImplementation(() => {});

				let response = eventStream(
					new AbortController().signal,
					(_, abort) => {
						return () => abort();
					},
					{ headers: { "Content-Type": "text/html" } },
				);

				expect(spy).toHaveBeenCalledWith(
					"Overriding Content-Type header to `text/event-stream`",
				);

				expect(response.headers.get("Content-Type")).toBe("text/event-stream");
			});

			test("overrides Cache-Control", () => {
				let spy = vi.spyOn(console, "warn").mockImplementation(() => {});

				let response = eventStream(
					new AbortController().signal,
					(_, abort) => {
						return () => abort();
					},
					{ headers: { "Cache-Control": "max-age=60" } },
				);

				expect(spy).toHaveBeenCalledWith(
					"Overriding Cache-Control header to `no-cache`",
				);

				expect(response.headers.get("Content-Type")).toBe("text/event-stream");
			});

			test("overrides Connection", () => {
				let spy = vi.spyOn(console, "warn").mockImplementation(() => {});

				let response = eventStream(
					new AbortController().signal,
					(_, abort) => {
						return () => abort();
					},
					{ headers: { Connection: "close" } },
				);

				expect(spy).toHaveBeenCalledWith(
					"Overriding Connection header to `keep-alive`",
				);

				expect(response.headers.get("Content-Type")).toBe("text/event-stream");
			});
		});
	});

	describe("Stream API", () => {
		test("returns a response", () => {
			let controller = new AbortController();
			let response = eventStream(controller.signal, {
				cleanup() {},
				handle() {},
			});
			controller.abort();
			expect(response).toBeInstanceOf(Response);
		});

		test("response is a readable stream", async () => {
			let controller = new AbortController();
			let response = eventStream(controller.signal, {
				cleanup() {},
				handle() {},
			});
			controller.abort();
			if (!response.body) throw new Error("Response body is undefined");
			let reader = response.body.getReader();
			let { done } = await reader.read();
			expect(done).toBe(true);
		});

		test("can send data to the client with the send function", async () => {
			let controller = new AbortController();
			let response = eventStream(controller.signal, {
				cleanup() {},
				handle(send) {
					send({ data: "hello" });
				},
			});

			controller.abort();

			if (!response.body) throw new Error("Response body is undefined");

			let reader = response.body.getReader();

			let { value: event } = await reader.read();
			expect(event).toEqual(new TextEncoder().encode("event: message\n"));

			let { value: data } = await reader.read();
			expect(data).toEqual(new TextEncoder().encode("data: hello\n\n"));

			let { done } = await reader.read();
			expect(done).toBe(true);
		});

		test("cleanup function is called when the client closes the connection", () => {
			let fn = vi.fn();

			let controller = new AbortController();

			eventStream(controller.signal, { cleanup: fn, handle() {} });

			controller.abort();

			expect(fn).toHaveBeenCalledOnce();
		});

		test("subscribes to stream of data and cleanup", async () => {
			let controller = new AbortController();

			let fn = vi.fn();

			let stream = createStream();
			let response = eventStream(controller.signal, {
				async cleanup() {
					fn(await stream.return(10));
				},
				async handle(send, abort) {
					for await (let chunk of stream) send({ data: chunk.toString() });
					abort();
				},
			});

			if (!response.body) throw new Error("Response body is undefined");

			let buffer = await response.arrayBuffer();

			expect(new TextDecoder().decode(buffer)).toMatchInlineSnapshot(`
				"event: message
				data: 1

				event: message
				data: 2

				event: message
				data: 3

				event: message
				data: 4

				event: message
				data: 5

				"
			`);

			expect(fn).toHaveBeenCalledWith({ done: true, value: 10 });
		});

		describe("Headers Overrides", () => {
			test("overrrides Content-Type header", () => {
				let spy = vi.spyOn(console, "warn").mockImplementation(() => {});

				let response = eventStream(
					new AbortController().signal,
					{ cleanup() {}, handle() {} },
					{ headers: { "Content-Type": "text/html" } },
				);

				expect(spy).toHaveBeenCalledWith(
					"Overriding Content-Type header to `text/event-stream`",
				);

				expect(response.headers.get("Content-Type")).toBe("text/event-stream");
			});

			test("overrides Cache-Control", () => {
				let spy = vi.spyOn(console, "warn").mockImplementation(() => {});

				let response = eventStream(
					new AbortController().signal,
					{ cleanup() {}, handle() {} },
					{ headers: { "Cache-Control": "max-age=60" } },
				);

				expect(spy).toHaveBeenCalledWith(
					"Overriding Cache-Control header to `no-cache`",
				);

				expect(response.headers.get("Content-Type")).toBe("text/event-stream");
			});

			test("overrides Connection", () => {
				let spy = vi.spyOn(console, "warn").mockImplementation(() => {});

				let response = eventStream(
					new AbortController().signal,
					{ cleanup() {}, handle() {} },
					{ headers: { Connection: "close" } },
				);

				expect(spy).toHaveBeenCalledWith(
					"Overriding Connection header to `keep-alive`",
				);

				expect(response.headers.get("Content-Type")).toBe("text/event-stream");
			});
		});
	});
});

async function* createStream() {
	let count = 0;
	while (count < 5) yield ++count;
	return count;
}
