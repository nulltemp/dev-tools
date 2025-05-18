import Link from "next/link";

export default function Home() {
  return (
    <div>
      <main>
        <ul>
          <li>
            <Link href="/char-count">
              文字数カウンター
            </Link>
          </li>
          <li>
            <Link href="/json-formatter">
              JSON整形
            </Link>
          </li>
        </ul>
      </main>
    </div>
  );
}
