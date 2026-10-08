import { Suspense } from "react";
import AdventureHub from "../../components/AdventureHub";
import KhweziMoment from "../../components/KhweziMoment";
export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="brand-route-loading" role="status">
          <KhweziMoment pose="loading" />
        </div>
      }
    >
      <AdventureHub />
    </Suspense>
  );
}
