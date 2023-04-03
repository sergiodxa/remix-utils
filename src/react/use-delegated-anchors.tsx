import { PrefetchPageLinks, useNavigate } from "@remix-run/react";
import {
  createContext,
  ReactNode,
  RefObject,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

const context = createContext(false);

export function isLinkEvent(event: MouseEvent) {
  if (!(event.target instanceof HTMLElement)) return;
  let a = event.target.closest("a");
  if (a && a.hasAttribute("href") && a.host === window.location.host) return a;
  return;
}

export function useDelegatedAnchors(nodeRef: RefObject<HTMLElement>) {
  let navigate = useNavigate();
  let hasParentPrefetch = useContext(context);

  useEffect(() => {
    // if you call useDelegatedAnchors as a children of a PrefetchPageAnchors
    // then do nothing
    if (hasParentPrefetch) return;

    let node = nodeRef.current;

    node?.addEventListener("click", handleClick);
    return () => node?.removeEventListener("click", handleClick);

    function handleClick(event: MouseEvent) {
      if (!node) return;

      let anchor = isLinkEvent(event);

      if (!anchor) return;
      if (event.button !== 0) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (event.metaKey || event.altKey || event.ctrlKey || event.shiftKey) {
        return;
      }

      if (anchor.hasAttribute("download")) return;

      let { pathname, search, hash } = anchor;
      navigate({ pathname, search, hash });

      event.preventDefault();
    }
  }, [hasParentPrefetch, navigate, nodeRef]);
}

export function PrefetchPageAnchors({ children }: { children: ReactNode }) {
  let nodeRef = useRef<HTMLDivElement>(null);
  let [page, setPage] = useState<null | string>(null);
  let hasParentPrefetch = useContext(context);

  // prefetch is useless without delegated anchors, so we enable it
  useDelegatedAnchors(nodeRef);

  useEffect(() => {
    if (hasParentPrefetch) return;

    let node = nodeRef.current;

    node?.addEventListener("mouseenter", handleMouseEnter, true);
    return () => node?.removeEventListener("mouseenter", handleMouseEnter);

    function handleMouseEnter(event: MouseEvent) {
      if (!nodeRef.current) return;
      let anchor = isLinkEvent(event);
      if (!anchor) return;

      let { pathname, search } = anchor;
      setPage(pathname + search);
    }
  }, [hasParentPrefetch]);

  return (
    <div ref={nodeRef} style={{ display: "contents" }}>
      <context.Provider value={true}>{children}</context.Provider>
      {page && !hasParentPrefetch && <PrefetchPageLinks page={page} />}
    </div>
  );
}
