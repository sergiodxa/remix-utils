/* eslint-disable unicorn/consistent-function-scoping */
import { describe, test, expect } from "vitest";
import { ActionFunctionArgs, json } from "@remix-run/server-runtime";
import { namedAction } from "../../src/server/named-action";

describe(namedAction.name, () => {
	test("FormData - Convention /", async () => {
		let formData = new FormData();
		formData.append("/create", "");

		let request = new Request("https://remix.utils", {
			method: "POST",
			body: formData,
		});

		async function action({ request }: ActionFunctionArgs) {
			let formData = await request.formData();
			return await namedAction(formData, {
				async create() {
					return json("created");
				},
			});
		}

		let response = await action({ request, params: {}, context: {} });

		await expect(response.json()).resolves.toEqual("created");
	});

	test("FormData - Convention intent", async () => {
		let formData = new FormData();
		formData.append("intent", "update");

		let request = new Request("https://remix.utils", {
			method: "POST",
			body: formData,
		});

		async function action({ request }: ActionFunctionArgs) {
			let formData = await request.formData();
			return await namedAction(formData, {
				async update() {
					return json("updated");
				},
			});
		}

		let response = await action({ request, params: {}, context: {} });
		await expect(response.json()).resolves.toEqual("updated");
	});

	test("FormData - Convention action", async () => {
		let formData = new FormData();
		formData.append("action", "delete");

		let request = new Request("https://remix.utils", {
			method: "POST",
			body: formData,
		});

		async function action({ request }: ActionFunctionArgs) {
			let formData = await request.formData();
			return await namedAction(formData, {
				async delete() {
					return json("deleted");
				},
			});
		}

		let response = await action({ request, params: {}, context: {} });
		await expect(response.json()).resolves.toEqual("deleted");
	});

	test("FormData - Convention _action", async () => {
		let formData = new FormData();
		formData.append("_action", "delete");

		let request = new Request("https://remix.utils", {
			method: "POST",
			body: formData,
		});

		async function action({ request }: ActionFunctionArgs) {
			let formData = await request.formData();
			return await namedAction(formData, {
				async delete() {
					return json("deleted");
				},
			});
		}

		let response = await action({ request, params: {}, context: {} });
		await expect(response.json()).resolves.toEqual("deleted");
	});

	test("URLSearchParams - Convention /", async () => {
		let request = new Request("https://remix.utils?/delete", {
			method: "POST",
		});

		async function action({ request }: ActionFunctionArgs) {
			let url = new URL(request.url);
			return await namedAction(url, {
				async delete() {
					return json("deleted");
				},
			});
		}

		let response = await action({ request, params: {}, context: {} });
		await expect(response.json()).resolves.toEqual("deleted");
	});

	test("URLSearchParams - Convention intent", async () => {
		let request = new Request("https://remix.utils?/update", {
			method: "POST",
		});

		async function action({ request }: ActionFunctionArgs) {
			let url = new URL(request.url);
			return await namedAction(url, {
				async update() {
					return json("updated");
				},
			});
		}

		let response = await action({ request, params: {}, context: {} });
		await expect(response.json()).resolves.toEqual("updated");
	});

	test("URLSearchParams - Convention action", async () => {
		let request = new Request("https://remix.utils?/update", {
			method: "POST",
		});

		async function action({ request }: ActionFunctionArgs) {
			let url = new URL(request.url);
			return await namedAction(url, {
				async update() {
					return json("updated");
				},
			});
		}

		let response = await action({ request, params: {}, context: {} });
		await expect(response.json()).resolves.toEqual("updated");
	});

	test("URLSearchParams - Convention _action", async () => {
		let url = new URL("https://remix.utils?_action=update");

		let request = new Request(url, { method: "POST" });

		async function action({ request }: ActionFunctionArgs) {
			let url = new URL(request.url);
			return await namedAction(url, {
				async update() {
					return json("updated");
				},
			});
		}

		let response = await action({ request, params: {}, context: {} });
		await expect(response.json()).resolves.toEqual("updated");
	});

	test("URL", async () => {
		let url = new URL("https://remix.utils?/update");

		let request = new Request(url, { method: "POST" });

		async function action({ request }: ActionFunctionArgs) {
			return await namedAction(request, {
				async update() {
					return json("updated");
				},
			});
		}

		let response = await action({ request, params: {}, context: {} });
		await expect(response.json()).resolves.toEqual("updated");
	});

	test("Request - URL", async () => {
		let request = new Request("https://remix.utils?/create", {
			method: "POST",
		});

		async function action({ request }: ActionFunctionArgs) {
			return await namedAction(request, {
				async create() {
					return json("created");
				},
			});
		}

		let response = await action({ request, params: {}, context: {} });
		await expect(response.json()).resolves.toEqual("created");
	});

	test("Request - FormData", async () => {
		let formData = new FormData();
		formData.append("action", "update");

		let request = new Request("https://remix.utils", {
			method: "POST",
			body: formData,
		});

		async function action({ request }: ActionFunctionArgs) {
			return await namedAction(request, {
				async update() {
					return json("updated");
				},
			});
		}

		let response = await action({ request, params: {}, context: {} });
		await expect(response.json()).resolves.toEqual("updated");
	});

	test("Default", async () => {
		let request = new Request("https://remix.utils", {
			method: "POST",
			body: new FormData(),
		});

		async function action({ request }: ActionFunctionArgs) {
			return await namedAction(request, {
				async default() {
					return json("default");
				},
			});
		}

		let response = await action({ request, params: {}, context: {} });
		await expect(response.json()).resolves.toEqual("default");
	});

	test("Error - No action with name", async () => {
		let request = new Request("https://remix.utils?/update", {
			method: "POST",
			body: new FormData(),
		});

		// eslint-disable-next-line unicorn/consistent-function-scoping
		async function action({ request }: ActionFunctionArgs) {
			return await namedAction(request, {
				async create() {
					return json("created");
				},
			});
		}

		await expect(action({ request, params: {}, context: {} })).rejects.toThrow(
			'Action "update" not found',
		);
	});

	test("Error - No action name", async () => {
		let request = new Request("https://remix.utils", {
			method: "POST",
			body: new FormData(),
		});

		// eslint-disable-next-line unicorn/consistent-function-scoping
		async function action({ request }: ActionFunctionArgs) {
			return await namedAction(request, {
				async create() {
					return json("created");
				},
			});
		}

		await expect(action({ request, params: {}, context: {} })).rejects.toThrow(
			"Action name not found",
		);
	});

	test("Typed Response", async () => {
		// eslint-disable-next-line unicorn/consistent-function-scoping
		async function action({ request }: ActionFunctionArgs) {
			return await namedAction(request, {
				async create() {
					return json("created" as const);
				},

				async update() {
					return json("updated" as const);
				},

				async delete() {
					return json("deleted" as const);
				},

				async default() {
					return json("default" as const);
				},
			});
		}

		await expect(
			action({
				request: new Request("https://remix.utils", {
					method: "POST",
					body: new URLSearchParams({ intent: "create" }),
				}),
				params: {},
				context: {},
			}).then((res) => res.json()),
		).resolves.toBe("created");

		await expect(
			action({
				request: new Request("https://remix.utils", {
					method: "POST",
					body: new URLSearchParams({ intent: "update" }),
				}),
				params: {},
				context: {},
			}).then((res) => res.json()),
		).resolves.toBe("updated");

		await expect(
			action({
				request: new Request("https://remix.utils", {
					method: "POST",
					body: new URLSearchParams({ intent: "delete" }),
				}),
				params: {},
				context: {},
			}).then((res) => res.json()),
		).resolves.toBe("deleted");

		await expect(
			action({
				request: new Request("https://remix.utils", {
					method: "POST",
					body: new URLSearchParams(),
				}),
				params: {},
				context: {},
			}).then((res) => res.json()),
		).resolves.toBe("default");
	});
});
