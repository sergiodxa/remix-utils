/**
 * @jest-environment jsdom
 */
import { expect, test } from "@jest/globals";
import { Suspense, useState } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import * as React from "react";
import { AwaitAll, AwaitRace } from "../../src/react/await";
import { Await } from "@remix-run/react";

class Deferred<T> {
  promise: Promise<T>;
  resolve!: (value: T) => void;
  reject!: (reason?: unknown) => void;
  constructor() {
    this.promise = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }
}

function TestComponent({
  p1,
  p2,
}: {
  p1: Promise<number>;
  p2: Promise<number>;
}) {
  return (
    <Suspense fallback={<div>loading</div>}>
      <AwaitAll resolve={[p1, p2]} errorElement={<div>error</div>}>
        {([x, y]) => <div>{x + y}</div>}
      </AwaitAll>
    </Suspense>
  );
}

describe("AwaitAll", () => {
  test("call suspendAll as child of suspense", async () => {
    function Component({
      p1,
      p2,
    }: {
      p1: Promise<number>;
      p2: Promise<number>;
    }) {
      return (
        <AwaitAll resolve={[p1, p2]}>{([x, y]) => <div>{x + y}</div>}</AwaitAll>
      );
    }

    const p1 = new Deferred<number>();
    const p2 = new Deferred<number>();

    render(
      <Suspense fallback={<div>loading</div>}>
        <Component p1={p1.promise} p2={p2.promise} />
      </Suspense>
    );

    expect(screen.getByText("loading")).toBeTruthy();
    p1.resolve(1);
    expect(screen.getByText("loading")).toBeTruthy();
    p2.resolve(2);

    await screen.findByText("3");
  });

  test("create promise in parent", async () => {
    const p1 = new Deferred<number>();
    const p2 = new Deferred<number>();

    render(<TestComponent p1={p1.promise} p2={p2.promise} />);

    expect(screen.getByText("loading")).toBeTruthy();
    p1.resolve(2);
    expect(screen.getByText("loading")).toBeTruthy();
    p2.resolve(2);

    await screen.findByText("4");
  });

  test("renders error", async () => {
    const p1 = new Deferred<number>();
    const p2 = new Deferred<number>();

    render(<TestComponent p1={p1.promise} p2={p2.promise} />);

    expect(screen.getByText("loading")).toBeTruthy();
    p1.reject(new Error("error"));

    await screen.findByText("error");
  });

  test("blocking on half of the data", async () => {
    function Component({
      p1,
      p2,
    }: {
      p1: Promise<number>;
      p2: Promise<number>;
    }) {
      return (
        <>
          <Suspense fallback={<div>loading p1</div>}>
            <Await resolve={p1}>{(x) => <div>p1:{x}</div>}</Await>
          </Suspense>
          <Suspense fallback={<div>loading all</div>}>
            <AwaitAll resolve={[p1, p2]}>
              {([x, y]) => <div>sum:{x + y}</div>}
            </AwaitAll>
          </Suspense>
        </>
      );
    }

    const p1 = new Deferred<number>();
    const p2 = new Deferred<number>();

    const { container } = render(<Component p1={p1.promise} p2={p2.promise} />);
    expect(container).toMatchInlineSnapshot(`
      <div>
        <div>
          loading p1
        </div>
        <div>
          loading all
        </div>
      </div>
    `);

    p1.resolve(1);

    await screen.findByText("p1:1");
    expect(container).toMatchInlineSnapshot(`
      <div>
        <div>
          p1:
          1
        </div>
        <div>
          loading all
        </div>
      </div>
    `);

    p2.resolve(2);
    await screen.findByText("sum:3");
    expect(container).toMatchInlineSnapshot(`
      <div>
        <div>
          p1:
          1
        </div>
        <div>
          sum:
          3
        </div>
      </div>
    `);
  });

  test("state update inside", async () => {
    function Component({
      p1,
      p2,
    }: {
      p1: Promise<number>;
      p2: Promise<number>;
    }) {
      const [count, setCount] = useState(0);

      return (
        <>
          <button type="button" onClick={() => setCount(count + 1)}>
            count:{count}
          </button>
          <AwaitAll resolve={[p1, p2]}>
            {([x, y]) => <div>{x + y}</div>}
          </AwaitAll>
        </>
      );
    }

    const p1 = new Deferred<number>();
    const p2 = new Deferred<number>();

    render(
      <Suspense fallback={<div>loading</div>}>
        <Component p1={p1.promise} p2={p2.promise} />
      </Suspense>
    );

    expect(screen.getByText("loading")).toBeTruthy();
    p1.resolve(1);
    expect(screen.getByText("loading")).toBeTruthy();
    p2.resolve(2);

    await screen.findByText("3");
    fireEvent.click(screen.getByText("count:0"));
    expect(screen.getByText("count:1")).toBeTruthy();
  });
});

describe("AwaitRace", () => {
  test("promise race", async () => {
    function Component({
      p1,
      p2,
    }: {
      p1: Promise<number>;
      p2: Promise<number>;
    }) {
      return (
        <Suspense fallback={<div>loading</div>}>
          <AwaitRace resolve={[p1, p2]}>{(n) => <div>{n}</div>}</AwaitRace>
        </Suspense>
      );
    }

    const p1 = new Deferred<number>();
    const p2 = new Deferred<number>();

    render(<Component p1={p1.promise} p2={p2.promise} />);

    expect(screen.getByText("loading")).toBeTruthy();
    p1.resolve(1);

    await screen.findByText("1");
  });

  test("race both, await one", async () => {
    function Component({
      p1,
      p2,
    }: {
      p1: Promise<number>;
      p2: Promise<number>;
    }) {
      return (
        <>
          <Suspense fallback={<div>loading p1</div>}>
            <Await resolve={p1}>{(x) => <div>p1:{x}</div>}</Await>
          </Suspense>
          <Suspense fallback={<div>loading all</div>}>
            <AwaitRace resolve={[p1, p2]}>
              {(x) => <div>winner:{x}</div>}
            </AwaitRace>
          </Suspense>
        </>
      );
    }

    const p1 = new Deferred<number>();
    const p2 = new Deferred<number>();

    const { container } = render(<Component p1={p1.promise} p2={p2.promise} />);
    expect(container).toMatchInlineSnapshot(`
      <div>
        <div>
          loading p1
        </div>
        <div>
          loading all
        </div>
      </div>
    `);

    p2.resolve(1);

    await screen.findByText("winner:1");
    expect(container).toMatchInlineSnapshot(`
      <div>
        <div>
          loading p1
        </div>
        <div>
          winner:
          1
        </div>
      </div>
    `);

    p1.resolve(2);
    await screen.findByText("p1:2");
    expect(container).toMatchInlineSnapshot(`
      <div>
        <div>
          p1:
          2
        </div>
        <div>
          winner:
          1
        </div>
      </div>
    `);
  });

  test("state update inside", async () => {
    function Component({
      p1,
      p2,
    }: {
      p1: Promise<number>;
      p2: Promise<number>;
    }) {
      const [count, setCount] = useState(0);

      return (
        <>
          <button type="button" onClick={() => setCount(count + 1)}>
            count:{count}
          </button>
          <AwaitRace resolve={[p1, p2]}>{(x) => <div>{x}</div>}</AwaitRace>
        </>
      );
    }

    const p1 = new Deferred<number>();
    const p2 = new Deferred<number>();

    const { container } = render(
      <Suspense fallback={<div>loading</div>}>
        <Component p1={p1.promise} p2={p2.promise} />
      </Suspense>
    );

    expect(screen.getByText("loading")).toBeTruthy();
    p1.resolve(1);
    await screen.findByText("1");
    fireEvent.click(screen.getByText("count:0"));
    expect(screen.getByText("count:1")).toBeTruthy();
    p1.resolve(2);
    expect(container).toMatchInlineSnapshot(`
      <div>
        <button
          style=""
          type="button"
        >
          count:
          1
        </button>
        <div>
          1
        </div>
      </div>
    `);
  });
});
