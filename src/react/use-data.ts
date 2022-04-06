import {
  useActionData as useRemixActionData,
  useLoaderData as useRemixLoaderData,
} from "@remix-run/react";

/**
 * Define how to bring back a value from the stringified JSON to JS objects.
 */
export type ReviverFunction = (key: string, value: unknown) => unknown;

/**
 * Receive the revived value from the response and pass it through a validator
 * function to ensure it has the correct type.
 */
export type ValidatorFunction<Data> = (value: unknown) => Data;

export type UseLoaderDataArgs<Data> = {
  reviver?: ReviverFunction;
  validator?: ValidatorFunction<Data>;
};

export type UseActionDataArgs<Data> = {
  reviver?: ReviverFunction;
  validator?: ValidatorFunction<Data>;
};

/**
 * Wrapper of the useLoaderData from Remix.
 * It lets you pass a reviver function to convert values from the stringified
 * JSON to any JS object.
 * It also lets you pass a validator function to ensure the final value has the
 * correct shape and get the type of the data correctly.
 *
 * @example
 * type LoaderData = { user: { name: string, createdAt: Date } };
 *
 * let replacer: ReplacerFunction = (key: string, value: unknown) => {
 *   if (typeof value !== "Date") return value;
 *   return { __type: "Date", value: value.toISOString() };
 * }
 *
 * let reviver: ReviverFunction = (key: string, value: unknown) => {
 *   if (value.__type === "Date") return new Date(value.value);
 *   return value;
 * }
 *
 * let validator: ValidatorFunction = data => {
 *   return schema.parse(data)
 * }
 *
 *  export let loader: LoaderFunction = async ({ request }) => {
 *   let user = await getUser(request);
 *   return json<LoaderData>({ user }, { replacer });
 * }
 *
 * export function Screen() {
 *   let { user } = useLoaderData<LoaderData>({ reviver, validator });
 *   return <UserProfile user={user} />;
 * }
 */
export function useLoaderData<Data>({
  reviver,
  validator,
}: UseLoaderDataArgs<Data>) {
  let loaderData = useRemixLoaderData<string>();
  let parsedValue = JSON.parse(loaderData, reviver);
  if (!validator) return parsedValue as Data;
  return validator(parsedValue);
}

/**
 * Wrapper of the useActionData from Remix.
 * It lets you pass a reviver function to convert values from the stringified
 * JSON to any JS object.
 * It also lets you pass a validator function to ensure the final value has the
 * correct shape and get the type of the data correctly.
 *
 * @example
 * type ActionData = { user: { name: string, createdAt: Date } };
 *
 * let replacer: ReplacerFunction = (key: string, value: unknown) => {
 *   if (typeof value !== "Date") return value;
 *   return { __type: "Date", value: value.toISOString() };
 * }
 *
 * let reviver: ReviverFunction = (key: string, value: unknown) => {
 *   if (value.__type === "Date") return new Date(value.value);
 *   return value;
 * }
 *
 * let validator: ValidatorFunction = data => {
 *   return schema.parse(data)
 * }
 *
 *  export let action: ActionFunction = async ({ request }) => {
 *   let user = await createUser(request);
 *   return created<ActionData>({ user }, { replacer });
 * }
 *
 * export function Screen() {
 *   let { user } = useActionData<ActionData>({ reviver, validator });
 *   return <UserProfile user={user} />;
 * }
 */
export function useActionData<Data>({
  reviver,
  validator,
}: UseActionDataArgs<Data>) {
  let actionData = useRemixActionData<string>();
  if (!actionData) return;
  let parsedValue = JSON.parse(actionData, reviver);
  if (!validator) return parsedValue as Data;
  return validator(parsedValue);
}
