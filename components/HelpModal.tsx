"use client";
import { useEffect } from "react";

const EMAIL = "jeff.franzen2@redcross.org";

export default function HelpModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-bold text-slate-900">
            About this tool
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4 px-5 py-4 text-sm text-slate-700">
          <p>
            An interactive compendium of every recorded U.S. tornado,{" "}
            <strong>1950–2026</strong>, from the NOAA Storm Prediction Center
            and NCEI Storm Events databases.
          </p>

          <div>
            <h3 className="mb-1 font-semibold text-slate-900">How to use it</h3>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                <strong>Filter</strong> on the left: month, year range, state,
                county, EF intensity, minimum injuries/deaths.
              </li>
              <li>
                <strong>Quick reports</strong> apply common slices in one click
                (e.g. “May · past 20 years”, “Violent EF4+EF5”).
              </li>
              <li>
                <strong>Charts / Map / Table / 20 Findings</strong> tabs switch
                the view of your current selection.
              </li>
              <li>
                <strong>Click any chart bar</strong> to open a detail panel of
                those exact tornadoes, then jump them to the Map or Table.
              </li>
              <li>
                <strong>Map basemap</strong> selector is bottom-right; click a
                marker for event details. <strong>Table</strong> sorts on any
                column and exports to CSV.
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-1 font-semibold text-slate-900">Data notes</h3>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                EF rating <strong>“Unk”</strong> = unknown (mostly pre-2007
                records).
              </li>
              <li>
                Property loss is in actual dollars and only tracked from{" "}
                <strong>1996</strong> onward; un-adjusted for inflation.
              </li>
              <li>
                The rise in counts since the 1950s is largely better detection
                of weak tornadoes, not more storms.
              </li>
              <li>Data auto-refreshes weekly from NOAA / NCEI.</li>
            </ul>
          </div>

          <div>
            <h3 className="mb-1 font-semibold text-slate-900">Related</h3>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                Hurricane-spawned tornadoes:{" "}
                <a
                  href="https://www.spc.noaa.gov/exper/tctor/"
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-rose-700 underline hover:text-rose-800"
                >
                  SPC Tropical Cyclone Tornadoes
                </a>{" "}
                — plots tornadoes relative to a storm’s track and center.
              </li>
            </ul>
          </div>

          <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3">
            <div className="font-semibold text-slate-900">
              Questions or comments?
            </div>
            <p className="mt-0.5 text-slate-700">
              Email{" "}
              <a
                href={`mailto:${EMAIL}?subject=US%20Tornado%20Compendium`}
                className="font-semibold text-rose-700 underline hover:text-rose-800"
              >
                {EMAIL}
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
