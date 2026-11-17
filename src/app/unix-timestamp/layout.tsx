import JsonLd from "../JsonLd";
import { toolJsonLd, toolMetadata } from "../tools";

export const metadata = toolMetadata("/unix-timestamp");

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <JsonLd data={toolJsonLd("/unix-timestamp")} />
      {children}
    </>
  );
}
