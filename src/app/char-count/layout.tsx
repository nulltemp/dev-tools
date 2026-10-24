import { toolMetadata } from "../tools";

export const metadata = toolMetadata("/char-count");

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
