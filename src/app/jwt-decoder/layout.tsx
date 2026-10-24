import { toolMetadata } from "../tools";

export const metadata = toolMetadata("/jwt-decoder");

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
