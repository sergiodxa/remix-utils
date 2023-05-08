import { createJWTSessionStorage } from "../../src";

describe(createJWTSessionStorage.name, () => {
  let sessionStorage = createJWTSessionStorage({
    cookie: { name: "session", secrets: ["secret"] },
    encrypt: true,
    sign: false,
  });

  test("gets an empty session", async () => {
    let session = await sessionStorage.getSession();
    expect(session.data).toEqual({});
  });

  test("commits a session", async () => {
    let session = await sessionStorage.getSession();
    session.set("foo", "bar");

    // expect sessionStorage.commitSession(session) to resolves to any string
    await expect(sessionStorage.commitSession(session)).resolves.toEqual(
      expect.any(String)
    );
  });

  test("reads session back from cookie", async () => {
    let session = await sessionStorage.getSession();

    session.set("foo", "bar");

    let cookie = await sessionStorage.commitSession(session);

    let session2 = await sessionStorage.getSession(cookie);

    expect(session2.data).toEqual(session.data);
  });

  test("destroys returns an empty cookie", async () => {
    let session = await sessionStorage.getSession();

    session.set("foo", "bar");

    let cookie = await sessionStorage.commitSession(session);

    let session2 = await sessionStorage.getSession(cookie);

    expect(session2.data).toEqual(session.data);

    await sessionStorage.destroySession(session2);

    let session3 = await sessionStorage.getSession();

    expect(session3.data).toEqual({});
  });

  test("gets JWT from cookie", async () => {
    await expect(
      sessionStorage
        .getSession()
        .then((session) => {
          session.set("foo", "bar");
          return session;
        })
        .then(sessionStorage.commitSession)
        .then(sessionStorage.getJWT)
    ).resolves.toEqual("");
  });
});
