import { Link, LinkProps } from "remix";

/**
 * Renders a link that will revalidate the current route.
 *
 * This works by rendering a Link to `.`, which will tell Remix to reload all
 * the loaders of the current routes and replace the position on the history
 * stack. The later is important to let users click Back and go to the previous
 * page instead of the same page with old data.
 *
 * This component is useful if you want to let users refresh manuall the data.
 *
 * @param props The props of the link, without the `to` prop.
 */
export function RevalidateLink(props: Omit<LinkProps, "to">) {
  return <Link to="." {...props} />;
}
