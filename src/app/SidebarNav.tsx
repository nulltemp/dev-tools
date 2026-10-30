"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { tools } from "./tools";

// 現在地の判定に usePathname が必要なため、レイアウトからナビ部分だけをクライアントコンポーネントに切り出している
export default function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav>
      <ul className="sidebar-nav">
        {tools.map((tool) => (
          <li key={tool.href}>
            <Link
              href={tool.href}
              aria-current={pathname === tool.href ? "page" : undefined}
            >
              {tool.name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
