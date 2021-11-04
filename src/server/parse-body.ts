export let bodyParser = {
  /**
   * Parse the body of a Request to an URLSearchParams instance.
   * @example
   * async function action({ request }: ActionArgs): Promise<ActionReturn> {
   *  const body = await bodyParser.toParams(request);
   *  await doSomething(body);
   *  return redirect("/target");
   * }
   */
  async toParams(request: Request): Promise<URLSearchParams> {
    const body = await request.text();
    return new URLSearchParams(body);
  },

  /**
   * Parse the body of a Request to a JSON object.
   *
   * The result is an unknown type since it's not possible to know the type of
   * the object and the properties it will have after parsed from the body.
   *
   * You are encouraged to validate the result before using it.
   * @example
   * async function action({ request }: ActionArgs): Promise<ActionReturn> {
   *   const params = await bodyParser.toJSON(request);
   *   await doSomething(params);
   *   return redirect("/target");
   * }
   */
  async toJSON(request: Request): Promise<unknown> {
    let params = await this.toParams(request);
    return Object.fromEntries(params.entries()) as unknown;
  },
};
