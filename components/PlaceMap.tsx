"use client";
import UiIcon from "./UiIcon";
import { useEffect, useRef, useState } from "react";
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
  const [failed, setFailed] = useState(false);
  const longitude = coords[0],
    latitude = coords[1];
  useEffect(() => {
    let dispose = () => {};
    let cancelled = false;
    setFailed(false);
    const fail = () => {
      if (!cancelled) setFailed(true);
    };
    import("maplibre-gl")
      .then((maplibre) => {
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
                attribution:
                  '<a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">© OpenStreetMap contributors</a>',
              },
            },
            layers: [{ id: "osm", type: "raster", source: "osm" }],
          },
          center: [longitude, latitude],
          zoom: accuracy === "venue" ? 15 : 11,
          cooperativeGestures: true,
        });
        // Assign cleanup before controls or markers can throw on unsupported devices.
        dispose = () => map.remove();
        map.on("error", fail);
        map.addControl(new maplibre.NavigationControl());
        new maplibre.Marker({ color: "#234aff" })
          .setLngLat([longitude, latitude])
          .setPopup(
            new maplibre.Popup().setText(
              accuracy === "venue" ? name : `${name} — city reference point`,
            ),
          )
          .addTo(map);
      })
      .catch(fail);
    return () => {
      cancelled = true;
      dispose();
    };
  }, [longitude, latitude, name, accuracy]);
  const external =
    accuracy === "venue"
      ? `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=16/${latitude}/${longitude}`
      : `https://www.openstreetmap.org/#map=11/${latitude}/${longitude}`;
  return (
    <div className="street-map-wrapper">
      <div
        className="street-map"
        ref={ref}
        aria-label={
          accuracy === "venue" ? `Street map of ${name}` : `City reference map for ${name}`
        }
      />
      {failed && (
        <p className="map-fallback" role="status">
          The street map couldn’t load. You can still open the map or get directions.
        </p>
      )}
      <a className="street-map-link" href={external} target="_blank" rel="noreferrer">
        {accuracy === "venue" ? "Open street map" : "Open city reference map"}{" "}
        <UiIcon name="arrow-up-right" />
      </a>
    </div>
  );
}
