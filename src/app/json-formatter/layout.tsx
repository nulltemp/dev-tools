import { toolMetadata } from "../tools";

export const metadata = toolMetadata("/json-formatter");

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
