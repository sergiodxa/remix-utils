export {
  suspendAll,
  suspendAny,
  suspendAllSettled,
  suspendRace,
} from "suspend-concurrently";
import { Await } from "@remix-run/react";
import { suspendAll } from "suspend-concurrently";

export interface AwaitAllProps<Resolve extends readonly unknown[] | []> {
  resolve: Resolve;
  children:
    | React.ReactNode
    | ((
        value: Awaited<
          Promise<{ -readonly [P in keyof Resolve]: Awaited<Resolve[P]> }>
        >
      ) => React.ReactNode);
  errorElement?: React.ReactNode;
}

export function AwaitAll<T extends readonly unknown[] | []>({
  resolve,
  ...props
}: AwaitAllProps<T>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <Await {...(props as any)} resolve={suspendAll(resolve)} />;
}

// TODO: Add te rest of the components
