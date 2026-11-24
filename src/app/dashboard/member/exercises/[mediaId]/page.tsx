import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ExerciseDetail } from "@/components/exercises/ExerciseDetail";
import { getExerciseInfo } from "@/lib/exercises/exerciseInfo";
import { parseRowIndex } from "@/lib/exercises/exerciseDetail";
import { StarterShell } from "../../starter/_shell";

type Params = Promise<{ mediaId: string }>;
type Search = Promise<Record<string, string | string[] | undefined>>;

const one = (v: string | string[] | undefined): string | null => (typeof v === "string" ? v : null);
const MEDIA_ID = /^[a-z0-9-]{1,64}$/;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { mediaId } = await params;
  const name = getExerciseInfo(mediaId)?.name;
  return {
    title: name ? `${name} · Exercise` : "Exercise",
    description: "How to do the exercise: muscles worked, steps, form cues, common mistakes and easier versions.",
  };
}

/**
 * One exercise's own page. Its guidance is the Starter exercise library, and
 * every link to it comes from Starter.
 */
export default async function ExercisePage({ params, searchParams }: { params: Params; searchParams: Search }) {
  const { mediaId } = await params;
  if (!MEDIA_ID.test(mediaId)) notFound();
  const sp = await searchParams;
  return (
    <StarterShell>
      <ExerciseDetail
        mediaId={mediaId}
        session={one(sp.session)}
        index={parseRowIndex(one(sp.i))}
        back={one(sp.back)}
      />
    </StarterShell>
  );
}
