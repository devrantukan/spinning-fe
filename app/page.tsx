import Image from "next/image";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white font-sans">
      <main className="flex flex-col items-center justify-center gap-8 px-8">
        <div className="relative">
          <Image
            src="/spinning-logo.jpeg"
            alt="Spin Studio Logo"
            width={600}
            height={600}
            priority
            unoptimized
            className="max-w-full h-auto"
          />
        </div>
        <div className="text-center animate-fade-in-up">
          <h1 className="text-5xl md:text-6xl font-bold tracking-wider mb-4 animate-shimmer">
            COMING SOON
          </h1>
          <div className="flex items-center justify-center gap-2 mt-6">
            <span className="w-2 h-2 bg-black rounded-full animate-bounce [animation-delay:-0.3s]"></span>
            <span className="w-2 h-2 bg-black rounded-full animate-bounce [animation-delay:-0.15s]"></span>
            <span className="w-2 h-2 bg-black rounded-full animate-bounce"></span>
          </div>
        </div>
      </main>
    </div>
  );
}
