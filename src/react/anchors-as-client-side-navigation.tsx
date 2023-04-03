import { useNavigate } from "@remix-run/react";
import { createContext, ReactNode, useContext, useEffect, useRef } from "react";

export interface TreatAnchorsAsClientSideNavigationProps {
  children: ReactNode;
}

const HasParentContext = createContext(false);

export function TreatAnchorsAsClientSideNavigation({
  children,
}: TreatAnchorsAsClientSideNavigationProps) {
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);
  const hasParent = useContext(HasParentContext);

  useEffect(() => {
    if (hasParent) {
      console.error(
        "TreatAnchorsAsClientSideNavigation can't be nested inside another TreatAnchorsAsClientSideNavigation. Ignoring this instance."
      );
      return;
    }

    const controller = new AbortController();
    ref.current?.addEventListener(
      "click",
      (event) => {
        const target = (event.target as Partial<HTMLElement>).closest?.("a");
        if (!target) return;

        const url = new URL(target.href, window.location.origin);
        if (
          url.origin === window.location.origin &&
          // Ignore clicks with modifiers
          !event.ctrlKey &&
          !event.metaKey &&
          !event.shiftKey &&
          // Ignore right clicks
          event.button === 0 &&
          // Ignore if `target="_blank"`
          [null, undefined, "", "self"].includes(target.target) &&
          !target.hasAttribute("download")
        ) {
          event.preventDefault();
          navigate(url.pathname + url.search + url.hash);
        }
      },
      { signal: controller.signal }
    );

    return () => controller.abort();
  }, [navigate, hasParent]);

  // Don't bother wrapping the children in a div if we're already inside a
  // TreatAnchorsAsClientSideNavigation
  // This is a misconfiguration that we warn about in the above useEffect
  return hasParent ? (
    <>{children}</>
  ) : (
    <HasParentContext.Provider value={true}>
      <div ref={ref} data-anchors-as-links>
        {children}
      </div>
    </HasParentContext.Provider>
  );
}
