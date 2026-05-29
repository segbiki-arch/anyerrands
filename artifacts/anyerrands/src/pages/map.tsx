import { useEffect, useMemo, useRef } from "react";
import { useListErrands, useListCategories, ErrandStatus } from "@workspace/api-client-react";
import { getCoords } from "@/lib/ireland-coords";
import { useState } from "react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Euro, Clock, MapPin, ExternalLink, Locate } from "lucide-react";

const NENAGH: [number, number] = [52.8647, -8.1985];
const DEFAULT_ZOOM = 10;

const STATUS_COLORS: Record<string, string> = {
  open: "#e05c2a",
  accepted: "#d97706",
  completed: "#16a34a",
};

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function createPin(status: string) {
  const color = STATUS_COLORS[status] ?? "#6b7280";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36">
    <path d="M14 0C6.27 0 0 6.27 0 14c0 9.63 14 22 14 22S28 23.63 28 14C28 6.27 21.73 0 14 0z" fill="${color}"/>
    <circle cx="14" cy="14" r="6" fill="white"/>
  </svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

export default function MapPage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  const [statusFilter, setStatusFilter] = useState<string>("open");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const { data: errands, isLoading } = useListErrands({
    status: statusFilter !== "all" ? (statusFilter as ErrandStatus) : undefined,
    category: categoryFilter !== "all" ? categoryFilter : undefined,
  });
  const { data: categories } = useListCategories();

  const pinned = useMemo(() => {
    if (!errands) return [];
    return errands
      .map(e => ({ errand: e, coords: getCoords(e.requesterLocation) }))
      .filter(x => x.coords !== null) as { errand: typeof errands[0]; coords: [number, number] }[];
  }, [errands]);

  useEffect(() => {
    if (!mapRef.current) return;

    import("leaflet").then(L => {
      if (leafletMapRef.current) return;

      const map = L.map(mapRef.current!, {
        center: NENAGH,
        zoom: DEFAULT_ZOOM,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      leafletMapRef.current = map;
    });

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!leafletMapRef.current || !pinned.length) return;

    import("leaflet").then(L => {
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];

      pinned.forEach(({ errand, coords }) => {
        const icon = L.icon({
          iconUrl: createPin(errand.status),
          iconSize: [28, 36],
          iconAnchor: [14, 36],
          popupAnchor: [0, -36],
        });

        const budgetStr = errand.budgetAmount != null
          ? `€${errand.budgetAmount}`
          : "Volunteer";

        const popup = L.popup({ maxWidth: 280, className: "errand-popup" }).setContent(`
          <div style="font-family:sans-serif;min-width:220px">
            <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:#6b7280;margin-bottom:6px">
              ${escapeHtml(errand.category)}
            </div>
            <div style="font-size:15px;font-weight:700;line-height:1.3;margin-bottom:10px;color:#1c1917">
              ${escapeHtml(errand.title)}
            </div>
            <div style="display:flex;gap:12px;font-size:12px;color:#57534e;margin-bottom:12px;flex-wrap:wrap">
              ${errand.estimatedDuration ? `<span>&#x23F1; ${escapeHtml(errand.estimatedDuration)}</span>` : ""}
              <span>&#x20AC; ${errand.budgetAmount != null ? escapeHtml(errand.budgetAmount) : "Volunteer"}</span>
              <span style="color:${STATUS_COLORS[errand.status] ?? "#6b7280"};font-weight:600;text-transform:capitalize">${escapeHtml(errand.status)}</span>
            </div>
            <a href="/errands/${encodeURIComponent(errand.id)}" style="display:inline-block;background:#e05c2a;color:white;padding:6px 14px;border-radius:999px;font-size:12px;font-weight:600;text-decoration:none">
              View Details
            </a>
          </div>
        `);

        const marker = L.marker(coords, { icon }).bindPopup(popup);
        marker.addTo(leafletMapRef.current);
        markersRef.current.push(marker);
      });
    });
  }, [pinned]);

  const unmappedCount = errands ? errands.length - pinned.length : 0;

  const locateMe = () => {
    if (!navigator.geolocation || !leafletMapRef.current) return;
    navigator.geolocation.getCurrentPosition(
      pos => {
        leafletMapRef.current?.setView([pos.coords.latitude, pos.coords.longitude], 13);
      },
      () => {
        leafletMapRef.current?.setView(NENAGH, DEFAULT_ZOOM);
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 pb-4 border-b border-border/60 bg-background space-y-4">
        <div>
          <h1 className="text-3xl font-serif font-bold tracking-tight">Errands Map</h1>
          <p className="text-muted-foreground mt-1">See what's happening around Tipperary right now.</p>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]" data-testid="map-select-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]" data-testid="map-select-category">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories?.map(c => (
                <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={locateMe}
            className="rounded-full gap-1.5"
            data-testid="btn-locate-me"
          >
            <Locate className="w-3.5 h-3.5" />
            Locate me
          </Button>

          <div className="hidden md:flex items-center gap-4 ml-auto text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#e05c2a] inline-block" /> Open
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" /> Accepted
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-green-600 inline-block" /> Done
            </span>
          </div>
        </div>

        {!isLoading && (
          <p className="text-sm text-muted-foreground">
            Showing <span className="font-medium text-foreground">{pinned.length}</span> errand{pinned.length !== 1 ? "s" : ""} on map
            {unmappedCount > 0 && ` (${unmappedCount} without a recognised location)`}
          </p>
        )}
      </div>

      <div className="relative flex-1 min-h-0">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80">
            <Skeleton className="w-32 h-8" />
          </div>
        )}
        <div
          ref={mapRef}
          className="w-full h-full"
          style={{ minHeight: "500px" }}
          data-testid="map-container"
        />
      </div>
    </div>
  );
}
