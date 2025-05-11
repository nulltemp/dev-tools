import Link from "next/link";

export default function Home() {
  return (
    <div>
      <main>
        <Link href="/char-count">
          文字数カウンター
        </Link>
      </main>
    </div>
  );
}
