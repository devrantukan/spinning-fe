import Image from "next/image";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white font-sans">
      <main className="flex flex-col items-center justify-center gap-8 px-8">
        <div className="relative">
          <Image
            src="/spin8-studio.png"
            alt="Spin Studio Logo"
            width={600}
            height={600}
            priority
            unoptimized
            className="max-w-full h-auto"
          />
        </div>
        <div className="text-center animate-fade-in-up max-w-2xl">
          <h1 className="text-5xl md:text-4xl font-bold tracking-wider mb-3 animate-shimmer">
            COMING SOON
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-6 animate-fade-in-up [animation-delay:0.3s]">
            We&apos;re spinning up something amazing for you!
          </p>
          <div className="flex flex-col items-center gap-4 mt-8">
            <div className="flex items-center justify-center gap-2">
              <span className="w-3 h-3 bg-black rounded-full animate-pulse [animation-delay:0s]"></span>
              <span className="w-3 h-3 bg-black rounded-full animate-pulse [animation-delay:0.2s]"></span>
              <span className="w-3 h-3 bg-black rounded-full animate-pulse [animation-delay:0.4s]"></span>
            </div>
            <p className="text-sm text-gray-500 animate-fade-in-up [animation-delay:0.6s]">
              Stay tuned for updates
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
