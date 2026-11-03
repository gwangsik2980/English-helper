import { PhraseBook } from "@/features/phrases/PhraseBook";
import { requirePageUser } from "@/server/http";
import { listPhrases } from "@/server/services/phrases";

export const metadata = { title: "표현장 · ENGLISH QUEST" };

export default async function PhrasesPage() {
  const userId = await requirePageUser();
  const items = await listPhrases(userId);

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <header>
        <p className="eyebrow reveal">Phrasebook</p>
        <h1 className="display reveal-lines mt-4 text-4xl sm:text-5xl">
          <span className="line">
            <span>내 표현장</span>
          </span>
        </h1>
      </header>
      <PhraseBook initial={items.map(({ id, phrase, meaningKo }) => ({ id, phrase, meaningKo }))} />
    </div>
  );
}
