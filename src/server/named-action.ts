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
 * Runs an action based on the FormData's action name
 * @param formData The FormData to parse for an action name
 * @param actions The map of actions to run
 * @returns The response from the action
 * @throws {ReferenceError} Action name not found
 * @throws {ReferenceError} Action "${name}" not found
 */
export async function namedAction<Actions extends ActionsRecord>(
	formData: FormData,
	actions: Actions,
): Promise<UNSAFE_DataWithResponseInit<ResponsesUnion<Actions>>> {
	let name = findNameInFormData(formData);

	if (name && name in actions) {
		let fn = actions[name];
		if (fn) {
			return fn() as unknown as UNSAFE_DataWithResponseInit<
				ResponsesUnion<Actions>
			>;
		}
	}

	if (name === null && "default" in actions) {
		return actions.default() as unknown as UNSAFE_DataWithResponseInit<
			ResponsesUnion<Actions>
		>;
	}

	if (name === null) throw new ReferenceError("Action name not found");

	throw new ReferenceError(`Action "${name}" not found`);
}

function findNameInFormData(formData: FormData) {
	let actionName = formData.get("intent");
	if (typeof actionName === "string") return actionName;
	return null;
}
