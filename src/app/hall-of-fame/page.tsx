import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { HallOfFameClient } from "./HallOfFameClient";

export const metadata: Metadata = {
  title: "Hall of Fame — ThreadBeef 🥩",
  description:
    "The greatest internet arguments of all time. Most voted, biggest beatdowns, and rising beef.",
};

export default function HallOfFamePage() {
  return (
    <main>
      <Navbar />
      <HallOfFameClient />
    </main>
  );
}
