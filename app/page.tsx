"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

function TypingMessages() {
  const messages = ["Team not found.", "Finding team...", "Team not found."];
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const currentMessage = messages[currentMessageIndex];

    if (!isDeleting && displayedText === currentMessage) {
      timeoutId = setTimeout(() => setIsDeleting(true), 2000);
    } else if (isDeleting && displayedText === "") {
      setIsDeleting(false);
      setCurrentMessageIndex((prev) => (prev + 1) % messages.length);
    } else {
      timeoutId = setTimeout(
        () => {
          const nextText = isDeleting
            ? currentMessage.substring(0, displayedText.length - 1)
            : currentMessage.substring(0, displayedText.length + 1);
          setDisplayedText(nextText);
        },
        isDeleting ? 50 : 100,
      );
    }

    return () => clearTimeout(timeoutId);
  }, [displayedText, isDeleting, currentMessageIndex, messages]);

  return (
    <div className="absolute left-[48.5%] md:left-[47.5%] lg:left-[48.5%] -translate-x-1/2 bottom-[32%] z-30 w-[110px] sm:w-[130px] flex justify-start text-left">
      <p className="font-nokia text-[#2A3616] text-[10px] sm:text-[14px] leading-tight break-words min-h-[1.5em]">
        {displayedText}
        <motion.span
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
          className="inline-block w-1.5 h-3 bg-[#2A3616] ml-1 align-middle"
        />
      </p>
    </div>
  );
}

function Navbar() {
  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 w-[95%] max-w-5xl z-50 pointer-events-none">
      <nav className="pointer-events-auto backdrop-blur-md rounded-full bg-transparent border border-black/10 flex justify-between items-center px-6 py-3">
        <div className="font-instrument text-[28px] tracking-tight text-[#1a1a1a]">
          TeamUp.
        </div>

        <Link
          href="/profile/setup"
          className="group relative bg-[var(--brand)] rounded-full px-6 py-2 shadow-[inset_0_-4px_4px_rgba(255,255,255,0.39)] outline-1 outline-[var(--brand)] -outline-offset-1 overflow-hidden pointer-events-auto"
        >
          <div className="absolute w-[80%] h-4 left-[10%] top-[1px] bg-gradient-to-b from-[#DEF0FC] to-transparent rounded-[12px] transition-transform duration-300 group-hover:scale-x-105" />
          <span className="relative z-10 font-sans text-[14px] text-white">
            Sign up
          </span>
        </Link>
      </nav>
    </div>
  );
}

function Hero() {
  return (
    <div className="relative min-h-screen bg-[#F3F4ED] pt-32 md:pt-40 flex flex-col items-center justify-start overflow-hidden">
      <div className="absolute inset-0 z-0">
        <video 
          autoPlay 
          loop 
          muted 
          playsInline 
          poster="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1600&q=80"
          className="w-full h-full object-cover"
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260427_054418_a6d194f0-ac86-4df9-abe5-ded73e596d7c.mp4"
        />
        <div className="absolute inset-0 bg-white/5" />
      </div>

      <div className="relative z-20 pointer-events-none text-center px-4 w-full flex flex-col items-center">
        <motion.h1
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
          className="font-instrument text-[38px] md:text-[56px] lg:text-[72px] leading-[0.85] tracking-tight text-[#1a1a1a] mb-6"
        >
          Find your team. <br /> Build something great.
        </motion.h1>
      </div>

      <TypingMessages />
    </div>
  );
}

export default function LandingPage() {
  return (
    <main className="font-sans antialiased fixed inset-0 z-[100] bg-[#F3F4ED] selection:bg-[var(--brand)] selection:text-white overflow-y-auto">
      <Navbar />
      <Hero />
    </main>
  );
}
