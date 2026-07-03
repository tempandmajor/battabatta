"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";
import { ghostButtonClass } from "@/components/ui";

/**
 * Optional precise-location capture via the browser. Coordinates are stored
 * privately and only ever shown to others as bucketed distances; the public
 * label is what appears on profiles and posts.
 */
export function LocationField() {
  const [status, setStatus] = useState<"idle" | "locating" | "set" | "error">("idle");
  const [coords, setCoords] = useState<{ latitude: string; longitude: string }>({ latitude: "", longitude: "" });

  function locate() {
    if (!navigator.geolocation) {
      setStatus("error");
      return;
    }
    setStatus("locating");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6)
        });
        setStatus("set");
      },
      () => setStatus("error"),
      { timeout: 8000 }
    );
  }

  return (
    <div className="space-y-2">
      <input type="hidden" name="latitude" value={coords.latitude} />
      <input type="hidden" name="longitude" value={coords.longitude} />
      <button type="button" onClick={locate} className={ghostButtonClass} disabled={status === "locating"}>
        <MapPin size={14} className="mr-1.5" />
        {status === "locating" ? "Locating..." : status === "set" ? "Location captured" : "Use my current location"}
      </button>
      <p className="text-xs leading-5 text-muted">
        {status === "set"
          ? "Saved privately. Others only ever see approximate distances like “1-5 mi”."
          : status === "error"
            ? "Could not get your location. You can skip this; local discovery will just show all local posts."
            : "Optional. Enables distance filters for local discovery. Never shown to others precisely."}
      </p>
    </div>
  );
}
