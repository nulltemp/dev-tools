import Link from "next/link";
import { tools } from "./tools";

export default function Home() {
  return (
    <div className="container">
      <div className="main">
        <h1 className="title">デベロッパーツール</h1>
        <div className="cards">
          {tools.map((tool) => (
            <Link key={tool.href} href={tool.href} className="card">
              <div className="card-content">
                <h2>{tool.name}</h2>
                <p>{tool.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
