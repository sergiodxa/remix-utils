import { describe, expect, test } from "bun:test";
import { type ActionFunctionArgs, data } from "react-router";
import { namedAction } from "./named-action.js";

describe(namedAction, () => {
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
					return data("updated");
				},
			});
		}

		let response = await action({ request, params: {}, context: {} });
		expect(response.data).toEqual("updated");
	});

	test("Error - No action with name", async () => {
		let formData = new FormData();
		formData.set("intent", "update");
		let request = new Request("https://remix.utils", {
			method: "POST",
			body: formData,
		});

		async function action({ request }: ActionFunctionArgs) {
			return await namedAction(await request.formData(), {
				async create() {
					return data("created");
				},
			});
		}

		expect(action({ request, params: {}, context: {} })).rejects.toThrow(
			'Action "update" not found',
		);
	});

	test("Error - No action name", async () => {
		let request = new Request("https://remix.utils", {
			method: "POST",
			body: new FormData(),
		});

		async function action({ request }: ActionFunctionArgs) {
			return await namedAction(await request.formData(), {
				async create() {
					return data("created");
				},
			});
		}

		expect(action({ request, params: {}, context: {} })).rejects.toThrow(
			"Action name not found",
		);
	});

	test("Typed Response", async () => {
		async function action({ request }: ActionFunctionArgs) {
			return await namedAction(await request.formData(), {
				async create() {
					return data("created" as const);
				},

				async update() {
					return data("updated" as const);
				},

				async delete() {
					return data("deleted" as const);
				},

				async default() {
					return data("default" as const);
				},
			});
		}

		expect(
			action({
				request: new Request("https://remix.utils", {
					method: "POST",
					body: new URLSearchParams({ intent: "create" }),
				}),
				params: {},
				context: {},
			}).then((res) => res.data),
		).resolves.toBe("created");

		expect(
			action({
				request: new Request("https://remix.utils", {
					method: "POST",
					body: new URLSearchParams({ intent: "update" }),
				}),
				params: {},
				context: {},
			}).then((res) => res.data),
		).resolves.toBe("updated");

		expect(
			action({
				request: new Request("https://remix.utils", {
					method: "POST",
					body: new URLSearchParams({ intent: "delete" }),
				}),
				params: {},
				context: {},
			}).then((res) => res.data),
		).resolves.toBe("deleted");

		expect(
			action({
				request: new Request("https://remix.utils", {
					method: "POST",
					body: new URLSearchParams(),
				}),
				params: {},
				context: {},
			}).then((res) => res.data),
		).resolves.toBe("default");
	});
});
