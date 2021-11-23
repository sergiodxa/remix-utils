import { useEffect, useRef } from "react";
import { useRevalidate } from "..";

// eslint-disable-next-line @typescript-eslint/no-empty-function
let noop = () => {};

type NetworkStatus = "online" | "offline";

export interface DetectNetworkStatusChangeOptions {
  /**
   * Set for how long (in ms) the user must have been offline before
   * revalidation is triggered.
   * @default 1000
   */
  threshold?: number;
  onStatusChange?(status: NetworkStatus): void;
  onBackOnline?(): void;
  onOffline?(): void;
  onOnline?(): void;
}

export function useDetectNetworkStatusChange({
  threshold = 1000,
  onStatusChange = noop,
  onBackOnline = noop,
  onOffline = noop,
  onOnline = noop,
}: DetectNetworkStatusChangeOptions = {}) {
  let isOnline = useRef<NetworkStatus>("online");
  let lastOnline = useRef(Date.now());

  useEffect(
    function detectNetworkChange() {
      function onNetworkStatusChange() {
        let status: NetworkStatus = navigator.onLine ? "online" : "offline";
        onStatusChange(status);

        if (status === "offline") return onOffline();
        onOnline();

        if (status === isOnline.current) return;

        isOnline.current = status;

        if (onBackOnline) {
          let lastOnlineDelta = Date.now() - lastOnline.current;
          lastOnline.current = Date.now();
          if (threshold <= lastOnlineDelta && onBackOnline) {
            onBackOnline();
          }
        }
      }

      window.addEventListener("online", onNetworkStatusChange, false);
      window.addEventListener("offline", onNetworkStatusChange, false);

      return function cleanup() {
        window.removeEventListener("online", onNetworkStatusChange);
        window.removeEventListener("offline", onNetworkStatusChange);
      };
    },
    [onBackOnline, onOffline, onOnline, onStatusChange, threshold]
  );
}

interface Options {
  /**
   * Use it to control if revalidation should work or not.
   */
  enabled?: boolean;
  /**
   * Set for how long (in ms) the user must have been offline before
   * revalidation is triggered.
   * @default 1000
   */
  threshold?: number;
}

/**
 * Trigger a revalidation in case the user lose the internet connection and
 * recovers it.
 * @example
 * useRevalidateOnNetworkChange({ enabled: true, threshold: 1000 }) });
 */
export function useRevalidateOnNetworkStatus({
  enabled = true,
  threshold = 1000,
}: Options = {}) {
  let revalidate = useRevalidate();
  // we start with online, if this loaded the user is online
  let isOnline = useRef(true);
  let lastOnline = useRef(Date.now());

  useEffect(
    function detectNetworkChange() {
      if (!enabled) return;

      function onNetworkStatusChange() {
        if (navigator.onLine !== isOnline.current) {
          isOnline.current = navigator.onLine;
          let lastOnlineDelta = Date.now() - lastOnline.current;
          if (navigator.onLine) lastOnline.current = Date.now();
          if (navigator.onLine && threshold <= lastOnlineDelta) revalidate();
        }
      }

      window.addEventListener("online", onNetworkStatusChange, false);
      window.addEventListener("offline", onNetworkStatusChange, false);

      return function cleanup() {
        window.removeEventListener("online", onNetworkStatusChange);
        window.removeEventListener("offline", onNetworkStatusChange);
      };
    },
    [enabled, revalidate, threshold]
  );
}
