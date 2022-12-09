type Actions = Record<string, () => Promise<Response>>;

/**
 * Runs an action based on the request's action name
 * @param request The request to parse for an action name
 * @param actions The map of actions to run
 * @returns The response from the action
 * @throws {ReferenceError} Action name not found
 * @throws {ReferenceError} Action "${name}" not found
 */
export function namedAction(
  request: Request,
  actions: Actions
): Promise<Response>;
export function namedAction(url: URL, actions: Actions): Promise<Response>;
export function namedAction(
  searchParams: URLSearchParams,
  actions: Actions
): Promise<Response>;
export function namedAction(
  formData: FormData,
  actions: Actions
): Promise<Response>;
export async function namedAction(
  input: Request | URL | URLSearchParams | FormData,
  actions: Actions
) {
  let name = await getActionName(input);

  if (name && name in actions) return actions[name]();

  if (name === null && "default" in actions) return actions["default"]();

  if (name === null) throw new ReferenceError("Action name not found");

  throw new ReferenceError(`Action "${name}" not found`);
}

async function getActionName(
  input: Request | URL | URLSearchParams | FormData
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
