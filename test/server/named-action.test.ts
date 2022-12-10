/* eslint-disable unicorn/consistent-function-scoping */
import { ActionFunction, json } from "@remix-run/server-runtime";
import { namedAction } from "../../src";

describe(namedAction.name, () => {
  test("FormData - Convention /", async () => {
    let formData = new FormData();
    formData.append("/create", "");

    let request = new Request("https://remix.utils", {
      method: "POST",
      body: formData,
    });

    let action: ActionFunction = async ({ request }) => {
      let formData = await request.formData();
      return await namedAction(formData, {
        async create() {
          return json("created");
        },
      });
    };

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

    let action: ActionFunction = async ({ request }) => {
      let formData = await request.formData();
      return await namedAction(formData, {
        async update() {
          return json("updated");
        },
      });
    };

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

    let action: ActionFunction = async ({ request }) => {
      let formData = await request.formData();
      return await namedAction(formData, {
        async delete() {
          return json("deleted");
        },
      });
    };

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

    let action: ActionFunction = async ({ request }) => {
      let formData = await request.formData();
      return await namedAction(formData, {
        async delete() {
          return json("deleted");
        },
      });
    };

    let response = await action({ request, params: {}, context: {} });
    await expect(response.json()).resolves.toEqual("deleted");
  });

  test("URLSearchParams - Convention /", async () => {
    let request = new Request("https://remix.utils?/delete", {
      method: "POST",
    });

    let action: ActionFunction = async ({ request }) => {
      let url = new URL(request.url);
      return await namedAction(url, {
        async delete() {
          return json("deleted");
        },
      });
    };

    let response = await action({ request, params: {}, context: {} });
    await expect(response.json()).resolves.toEqual("deleted");
  });

  test("URLSearchParams - Convention intent", async () => {
    let request = new Request("https://remix.utils?/update", {
      method: "POST",
    });

    let action: ActionFunction = async ({ request }) => {
      let url = new URL(request.url);
      return await namedAction(url, {
        async update() {
          return json("updated");
        },
      });
    };

    let response = await action({ request, params: {}, context: {} });
    await expect(response.json()).resolves.toEqual("updated");
  });

  test("URLSearchParams - Convention action", async () => {
    let request = new Request("https://remix.utils?/update", {
      method: "POST",
    });

    let action: ActionFunction = async ({ request }) => {
      let url = new URL(request.url);
      return await namedAction(url, {
        async update() {
          return json("updated");
        },
      });
    };

    let response = await action({ request, params: {}, context: {} });
    await expect(response.json()).resolves.toEqual("updated");
  });

  test("URLSearchParams - Convention _action", async () => {
    let url = new URL("https://remix.utils?_action=update");

    let request = new Request(url, { method: "POST" });

    let action: ActionFunction = async ({ request }) => {
      let url = new URL(request.url);
      return await namedAction(url, {
        async update() {
          return json("updated");
        },
      });
    };

    let response = await action({ request, params: {}, context: {} });
    await expect(response.json()).resolves.toEqual("updated");
  });

  test("URL", async () => {
    let url = new URL("https://remix.utils?/update");

    let request = new Request(url, {
      method: "POST",
    });

    let action: ActionFunction = async ({ request }) => {
      return await namedAction(request, {
        async update() {
          return json("updated");
        },
      });
    };

    let response = await action({ request, params: {}, context: {} });
    await expect(response.json()).resolves.toEqual("updated");
  });

  test("Request - URL", async () => {
    let request = new Request("https://remix.utils?/create", {
      method: "POST",
    });

    let action: ActionFunction = async ({ request }) => {
      return await namedAction(request, {
        async create() {
          return json("created");
        },
      });
    };

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

    let action: ActionFunction = async ({ request }) => {
      return await namedAction(request, {
        async update() {
          return json("updated");
        },
      });
    };

    let response = await action({ request, params: {}, context: {} });
    await expect(response.json()).resolves.toEqual("updated");
  });

  test("Default", async () => {
    let request = new Request("https://remix.utils", {
      method: "POST",
      body: new FormData(),
    });

    let action: ActionFunction = async ({ request }) => {
      return await namedAction(request, {
        async default() {
          return json("default");
        },
      });
    };

    let response = await action({ request, params: {}, context: {} });
    await expect(response.json()).resolves.toEqual("default");
  });

  test("Error - No action with name", async () => {
    let request = new Request("https://remix.utils?/update", {
      method: "POST",
      body: new FormData(),
    });

    // eslint-disable-next-line unicorn/consistent-function-scoping
    let action: ActionFunction = async ({ request }) => {
      return await namedAction(request, {
        async create() {
          return json("created");
        },
      });
    };

    await expect(action({ request, params: {}, context: {} })).rejects.toThrow(
      'Action "update" not found'
    );
  });

  test("Error - No action name", async () => {
    let request = new Request("https://remix.utils", {
      method: "POST",
      body: new FormData(),
    });

    // eslint-disable-next-line unicorn/consistent-function-scoping
    let action: ActionFunction = async ({ request }) => {
      return await namedAction(request, {
        async create() {
          return json("created");
        },
      });
    };

    await expect(action({ request, params: {}, context: {} })).rejects.toThrow(
      "Action name not found"
    );
  });
});
