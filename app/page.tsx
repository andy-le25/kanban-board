import Image from "next/image";
import Counter from "@/src/components/Counter";

export default function Home() {
  return (
    <main className = "min-h-screen flex items-center justify-center">
        <Counter initial={0} />
    </main>
  );
}
