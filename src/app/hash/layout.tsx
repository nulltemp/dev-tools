import JsonLd from "../JsonLd";
import { toolJsonLd, toolMetadata } from "../tools";

export const metadata = toolMetadata("/hash");

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <JsonLd data={toolJsonLd("/hash")} />
      {children}
    </>
  );
}
