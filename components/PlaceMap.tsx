"use client";
import { useEffect, useRef } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
export default function PlaceMap({
  coords,
  name,
  accuracy,
}: {
  coords: number[];
  name: string;
  accuracy: "venue" | "city";
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let dispose = () => {};
    let cancelled = false;
    import("maplibre-gl").then((maplibre) => {
      if (cancelled || !ref.current) return;
      const map = new maplibre.Map({
        container: ref.current,
        style: {
          version: 8,
          sources: {
            osm: {
              type: "raster",
              tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
              tileSize: 256,
              attribution: "© OpenStreetMap contributors",
            },
          },
          layers: [{ id: "osm", type: "raster", source: "osm" }],
        },
        center: [coords[0], coords[1]],
        zoom: accuracy === "venue" ? 15 : 11,
        cooperativeGestures: true,
      });
      map.addControl(new maplibre.NavigationControl());
      new maplibre.Marker({ color: "#234aff" })
        .setLngLat([coords[0], coords[1]])
        .setPopup(
          new maplibre.Popup().setText(
            accuracy === "venue" ? name : `${name} — city reference point`,
          ),
        )
        .addTo(map);
      dispose = () => map.remove();
    });
    return () => {
      cancelled = true;
      dispose();
    };
  }, [coords, name, accuracy]);
  return <div className="street-map" ref={ref} />;
}
