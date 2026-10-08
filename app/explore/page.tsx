import { Suspense } from "react";
import AdventureHub from "../../components/AdventureHub";
export default function Page() {
  return (
    <Suspense fallback={<p>Opening your field guide…</p>}>
      <AdventureHub />
    </Suspense>
  );
}
