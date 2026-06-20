/**
 * > [!NOTE]
 * > Install using `bunx shadcn@latest add @remix-utils/named-action`.
 *
 * > [!NOTE]
 * > This depends on React Router.
 *
 * It's common to need to handle more than one action in the same route, there are many options here like [sending the form to a resource route](https://sergiodxa.com/articles/multiple-forms-per-route-in-remix#using-resource-routes) or using an [action reducer](https://sergiodxa.com/articles/multiple-forms-per-route-in-remix#the-action-reducer-pattern), the `namedAction` function uses some conventions to implement the action reducer pattern.
 *
 * ```tsx
 * import { namedAction } from "remix-utils/named-action";
 *
 * export async function action({ request }: Route.ActionArgs) {
 * 	return namedAction(await request.formData(), {
 * 		async create() {
 * 			// do create
 * 		},
 * 		async update() {
 * 			// do update
 * 		},
 * 		async delete() {
 * 			// do delete
 * 		},
 * 	});
 * }
 *
 * export default function Component() {
 * 	return (
 * 		<>
 * 			<Form method="post">
 * 				<input type="hidden" name="intent" value="create" />
 * 				...
 * 			</Form>
 *
 * 			<Form method="post">
 * 				<input type="hidden" name="intent" value="update" />
 * 				...
 * 			</Form>
 *
 * 			<Form method="post">
 * 				<input type="hidden" name="intent" value="delete" />
 * 				...
 * 			</Form>
 * 		</>
 * 	);
 * }
 * ```
 *
 * This function can follow this convention:
 *
 * You can pass a FormData object to the `namedAction`, then it will try to find a field named `intent` and use the value as the action name.
 *
 * If, in any case, the action name is not found, the `actionName` then the library will try to call an action named `default`, similar to a `switch` in JavaScript.
 *
 * If the `default` is not defined it will throw a ReferenceError with the message `Action "${name}" not found`.
 *
 * If the library couldn't found the name at all, it will throw a ReferenceError with the message `Action name not found`
 *
 * @author [Sergio Xalambrí](https://sergiodxa.com)
 * @module Server/Named Action
 */
import type { UNSAFE_DataWithResponseInit } from "react-router";

type ActionsRecord = Record<string, () => Promise<UNSAFE_DataWithResponseInit<unknown>>>;

type ResponsesRecord<Actions extends ActionsRecord> = {
	[Action in keyof Actions]: Actions[Action] extends () => Promise<
		UNSAFE_DataWithResponseInit<infer Result>
	>
		? Result
		: never;
};

type ResponsesUnion<Actions extends ActionsRecord> = ResponsesRecord<Actions>[keyof Actions];

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
			return fn() as unknown as UNSAFE_DataWithResponseInit<ResponsesUnion<Actions>>;
		}
	}

	if (name === null && "default" in actions) {
		return actions.default() as unknown as UNSAFE_DataWithResponseInit<ResponsesUnion<Actions>>;
	}

	if (name === null) throw new ReferenceError("Action name not found");

	throw new ReferenceError(`Action "${name}" not found`);
}

function findNameInFormData(formData: FormData) {
	let actionName = formData.get("intent");
	if (typeof actionName === "string") return actionName;
	return null;
}
