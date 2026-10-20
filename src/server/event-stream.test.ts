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
		let response = eventStream(
			controller.signal,
			(send, _) => {
				send({ data: "hello" });
				send({ event: "multi-line", data: "hello\nworld" });
				send({ event: "crlf", data: "hello\r\nworld" });
				return () => {};
			},
			undefined,
			// Allow the synchronous burst in setup without tripping backpressure.
			new CountQueuingStrategy({ highWaterMark: 10 }),
		);

		controller.abort();

		if (!response.body) throw new Error("Response body is undefined");

		let reader = response.body.getReader();
		let decoder = new TextDecoder();

		let { value: hello } = await reader.read();
		expect(decoder.decode(hello)).toEqual("event: message\ndata: hello\n\n");

		let { value: multiLine } = await reader.read();
		expect(decoder.decode(multiLine)).toEqual("event: multi-line\ndata: hello\ndata: world\n\n");

		let { value: crlf } = await reader.read();
		expect(decoder.decode(crlf)).toEqual("event: crlf\ndata: hello\ndata: world\n\n");

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

	test("calls cleanup when the reader cancels without aborting the signal", async () => {
		let cleaned = false;
		let sends = 0;
		let controller = new AbortController();

		let response = eventStream(controller.signal, (send) => {
			let intervalId = setInterval(() => {
				send({ data: "tick" });
				sends++;
			}, 5);
			return () => {
				cleaned = true;
				clearInterval(intervalId);
			};
		});

		if (!response.body) throw new Error("Response body is undefined");
		let reader = response.body.getReader();
		await reader.read();
		await reader.cancel("client disconnected");

		await Bun.sleep(30);

		expect(cleaned).toBe(true);
		expect(controller.signal.aborted).toBe(false);

		let sendsAfterCleanup = sends;
		await Bun.sleep(30);
		expect(sends).toBe(sendsAfterCleanup);
	});

	test("drops events while the stream is under backpressure", async () => {
		let controller = new AbortController();
		let response = eventStream(
			controller.signal,
			(send) => {
				send({ data: "first" });
				send({ data: "second" }); // dropped: default highWaterMark is 1
				return () => {};
			},
			undefined,
			new CountQueuingStrategy({ highWaterMark: 1 }),
		);

		controller.abort();

		if (!response.body) throw new Error("Response body is undefined");
		let reader = response.body.getReader();
		let decoder = new TextDecoder();

		let { value } = await reader.read();
		expect(decoder.decode(value)).toEqual("event: message\ndata: first\n\n");

		let { done } = await reader.read();
		expect(done).toBe(true);
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
