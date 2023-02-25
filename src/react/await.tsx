import { Await, AwaitProps } from "@remix-run/react";
import {
  suspendAll,
  suspendAllSettled,
  suspendAny,
  suspendRace,
} from "suspend-concurrently";

type RenderProp<T> = React.ReactNode | ((value: T) => React.ReactNode);

export interface AwaitAllProps<Resolve extends readonly unknown[] | []>
  extends AwaitProps<Resolve> {
  children: RenderProp<{ -readonly [P in keyof Resolve]: Awaited<Resolve[P]> }>;
}

export function AwaitAll<T extends readonly unknown[] | []>({
  resolve,
  ...props
}: AwaitAllProps<T>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <Await {...(props as any)} resolve={suspendAll(resolve)} />;
}

export interface AwaitAnyProps<Resolve extends readonly unknown[] | []>
  extends AwaitProps<Resolve> {
  children: RenderProp<Awaited<Resolve[number]>>;
}

export function AwaitAny<T extends readonly unknown[] | []>({
  resolve,
  ...props
}: AwaitAnyProps<T>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <Await {...(props as any)} resolve={suspendAny(resolve)} />;
}

export type AwaitRaceProps<Resolve extends readonly unknown[] | []> =
  AwaitAnyProps<Resolve>;

export function AwaitRace<T extends readonly unknown[] | []>({
  resolve,
  ...props
}: AwaitAnyProps<T>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <Await {...(props as any)} resolve={suspendRace(resolve)} />;
}

export interface AwaitAllSettledProps<Resolve extends readonly unknown[] | []>
  extends AwaitProps<Resolve> {
  children: RenderProp<{
    -readonly [P in keyof Resolve]: PromiseSettledResult<Awaited<Resolve[P]>>;
  }>;
}

export function AwaitAllSettled<T extends readonly unknown[] | []>({
  resolve,
  ...props
}: AwaitAllSettledProps<T>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <Await {...(props as any)} resolve={suspendAllSettled(resolve)} />;
}
