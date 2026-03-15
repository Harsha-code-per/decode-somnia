import { Scene } from "@/components/canvas/Scene";
import { AnxietyInput } from "@/components/dom/AnxietyInput";
import { AudioDirector } from "@/components/dom/AudioDirector";
import { Cursor } from "@/components/dom/Cursor";
import { Frame } from "@/components/dom/Frame";
import { Overlay } from "@/components/dom/Overlay";

export default function Home() {
  return (
    <main
      data-somnia-stage
      className="relative h-screen w-full overflow-hidden text-white"
    >
      <Cursor />
      <Frame />
      <Scene />
      <Overlay />
      <AudioDirector />
      <AnxietyInput />
    </main>
  );
}
