import KhweziMoment from "./KhweziMoment";
export default function RouteLoading() {
  return (
    <main className="brand-route-loading" role="status" aria-live="polite" aria-busy="true">
      <KhweziMoment pose="loading" />
    </main>
  );
}
