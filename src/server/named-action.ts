import type { UNSAFE_DataWithResponseInit } from "react-router";

type ActionsRecord = Record<
	string,
	() => Promise<UNSAFE_DataWithResponseInit<unknown>>
>;

type ResponsesRecord<Actions extends ActionsRecord> = {
	[Action in keyof Actions]: Actions[Action] extends () => Promise<
		UNSAFE_DataWithResponseInit<infer Result>
	>
		? Result
		: never;
};

type ResponsesUnion<Actions extends ActionsRecord> =
	ResponsesRecord<Actions>[keyof Actions];

/**
 * Runs an action based on the request's action name
 * @param request The request to parse for an action name
 * @param actions The map of actions to run
 * @returns The response from the action
 * @throws {ReferenceError} Action name not found
 * @throws {ReferenceError} Action "${name}" not found
 */
export function namedAction<Actions extends ActionsRecord>(
	request: Request,
	actions: Actions,
): Promise<UNSAFE_DataWithResponseInit<ResponsesUnion<Actions>>>;
export function namedAction<Actions extends ActionsRecord>(
	url: URL,
	actions: Actions,
): Promise<UNSAFE_DataWithResponseInit<ResponsesUnion<Actions>>>;
export function namedAction<Actions extends ActionsRecord>(
	searchParams: URLSearchParams,
	actions: Actions,
): Promise<UNSAFE_DataWithResponseInit<ResponsesUnion<Actions>>>;
export function namedAction<Actions extends ActionsRecord>(
	formData: FormData,
	actions: Actions,
): Promise<UNSAFE_DataWithResponseInit<ResponsesUnion<Actions>>>;
export async function namedAction<Actions extends ActionsRecord>(
	input: Request | URL | URLSearchParams | FormData,
	actions: Actions,
): Promise<UNSAFE_DataWithResponseInit<ResponsesUnion<Actions>>> {
	let name = await getActionName(input);

	if (name && name in actions) {
		return actions[name]() as unknown as UNSAFE_DataWithResponseInit<
			ResponsesUnion<Actions>
		>;
	}

	if (name === null && "default" in actions) {
		return actions.default() as unknown as UNSAFE_DataWithResponseInit<
			ResponsesUnion<Actions>
		>;
	}

	if (name === null) throw new ReferenceError("Action name not found");

	throw new ReferenceError(`Action "${name}" not found`);
}

async function getActionName(
	input: Request | URL | URLSearchParams | FormData,
): Promise<string | null> {
	if (input instanceof Request) {
		let actionName = findNameInURL(new URL(input.url).searchParams);
		if (actionName) return actionName;
		return findNameInFormData(await input.clone().formData());
	}

	if (input instanceof URL) {
		return findNameInURL(input.searchParams);
	}

	if (input instanceof URLSearchParams) {
		return findNameInURL(input);
	}

	if (input instanceof FormData) {
		return findNameInFormData(input);
	}

	return null;
}

function findNameInURL(searchParams: URLSearchParams) {
	for (let key of searchParams.keys()) {
		if (key.startsWith("/")) return key.slice(1);
	}

	let actionName = searchParams.get("intent");
	if (typeof actionName === "string") return actionName;

	actionName = searchParams.get("action");
	if (typeof actionName === "string") return actionName;

	actionName = searchParams.get("_action");
	if (typeof actionName === "string") return actionName;

	return null;
}

function findNameInFormData(formData: FormData) {
	for (let key of formData.keys()) {
		if (key.startsWith("/")) return key.slice(1);
	}

	let actionName = formData.get("intent");
	if (typeof actionName === "string") return actionName;

	actionName = formData.get("action");
	if (typeof actionName === "string") return actionName;

	actionName = formData.get("_action");
	if (typeof actionName === "string") return actionName;

	return null;
}
