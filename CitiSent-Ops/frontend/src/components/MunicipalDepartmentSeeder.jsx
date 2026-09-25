import React, { useState, useEffect } from "react";
import { opsApiClient } from "../services/opsApiClient";
import { Button } from "./common/Button";
import { Badge } from "./common/Badge";
import { ConfirmationModal } from "./common/ConfirmationModal";
import { useToast } from "../context/ToastContext";
import { IoCheckmarkCircle, IoCubeOutline, IoRefresh } from "react-icons/io5";

/**
 * MunicipalDepartmentSeeder Component
 *
 * Provides one-click database provisioning for municipal departments.
 * Includes idempotency guarantees, multi-select workflows, and safety confirmation gates.
 */
export function MunicipalDepartmentSeeder({ onSeeded }) {
  const { showToast } = useToast();

  const [presets, setPresets] = useState([]);
  const [selectedSlugs, setSelectedSlugs] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  async function loadPresets() {
    try {
      setLoading(true);
      const res = await opsApiClient.getDepartmentPresets();
      if (res.success && res.data?.presets) {
        setPresets(res.data.presets);
        // Pre-select presets that are not yet seeded
        const unseeded = new Set(
          res.data.presets.filter((p) => !p.alreadyExists).map((p) => p.slug)
        );
        setSelectedSlugs(unseeded);
      }
    } catch (err) {
      showToast({
        type: "error",
        title: "Load Failed",
        message: err.message || "Failed to load department presets.",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPresets();
  }, []);

  function toggleSlug(slug) {
    const next = new Set(selectedSlugs);
    if (next.has(slug)) {
      next.delete(slug);
    } else {
      next.add(slug);
    }
    setSelectedSlugs(next);
  }

  function handleSelectAll() {
    const all = new Set(presets.map((p) => p.slug));
    setSelectedSlugs(all);
  }

  function handleDeselectAll() {
    setSelectedSlugs(new Set());
  }

  function handleOpenConfirm() {
    const toSeed = presets.filter((p) => selectedSlugs.has(p.slug));
    if (toSeed.length === 0) {
      showToast({
        type: "warning",
        title: "No Selection",
        message: "Please select at least one department preset to seed.",
      });
      return;
    }
    setIsConfirmOpen(true);
  }

  async function executeSeed() {
    const toSeed = presets.filter((p) => selectedSlugs.has(p.slug));

    try {
      setSeeding(true);
      const res = await opsApiClient.seedDepartments(toSeed);
      if (res.success) {
        showToast({
          type: "success",
          title: "Departments Seeded",
          message: res.message || `Successfully initialized ${toSeed.length} departments.`,
        });
        await loadPresets();
        if (onSeeded) onSeeded();
      }
    } catch (err) {
      showToast({
        type: "error",
        title: "Seeding Failed",
        message: err.message || "Failed to seed departments into database.",
      });
    } finally {
      setSeeding(false);
      setIsConfirmOpen(false);
    }
  }

  const selectedCount = selectedSlugs.size;

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <IoCubeOutline className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-slate-100">
              One-Click Municipal Department Seeder
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Initialize standard city government departments into the clean Production database.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadPresets}
            disabled={loading || seeding}
          >
            <IoRefresh className={`w-3.5 h-3.5 mr-1 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenConfirm}
            loading={seeding}
            disabled={loading || selectedCount === 0}
          >
            <IoCheckmarkCircle className="w-4 h-4 mr-1.5" />
            Seed Selected ({selectedCount})
          </Button>
        </div>
      </div>

      {/* Quick Select Controls */}
      <div className="flex items-center justify-between text-xs text-slate-400 py-3 mt-1">
        <span>Standard Presets ({presets.length} available)</span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSelectAll}
            className="text-cyan-400 hover:underline cursor-pointer"
          >
            Select All
          </button>
          <span>&bull;</span>
          <button
            type="button"
            onClick={handleDeselectAll}
            className="text-slate-400 hover:underline cursor-pointer"
          >
            Deselect All
          </button>
        </div>
      </div>

      {/* Presets Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 animate-pulse">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-24 bg-slate-800/40 rounded-xl border border-slate-800" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {presets.map((preset) => {
            const isSelected = selectedSlugs.has(preset.slug);
            return (
              <div
                key={preset.slug}
                onClick={() => toggleSlug(preset.slug)}
                className={`p-4 rounded-xl border transition-all cursor-pointer select-none flex items-start gap-3 ${
                  isSelected
                    ? "bg-slate-800/80 border-cyan-500/40 shadow-sm"
                    : "bg-slate-900/30 border-slate-800/80 hover:border-slate-700"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => {}} // Handled by container click
                  className="mt-1 h-4 w-4 rounded border-slate-700 bg-slate-800 text-cyan-600 focus:ring-cyan-500 cursor-pointer"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-slate-200 truncate">
                      {preset.name}
                    </span>
                    {preset.alreadyExists ? (
                      <Badge variant="active" className="shrink-0 text-[10px]">
                        <IoCheckmarkCircle className="w-3 h-3 mr-1" /> Seeded
                      </Badge>
                    ) : (
                      <Badge variant="default" className="shrink-0 text-[10px]">
                        Ready to Seed
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                    {preset.description}
                  </p>
                  <span className="inline-block font-mono text-[10px] text-slate-500 mt-2">
                    slug: {preset.slug}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-4 p-3 bg-slate-950/40 rounded-xl border border-slate-800/60 text-[11px] text-slate-400">
        💡 <strong>Idempotency Protection:</strong> Seeding uses{" "}
        <code className="text-cyan-400">ON CONFLICT (slug) DO NOTHING</code>. Re-running this tool will never duplicate or overwrite existing departments.
      </div>

      {/* Safety Confirmation Modal */}
      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={() => {
          if (!seeding) setIsConfirmOpen(false);
        }}
        onConfirm={executeSeed}
        title="Confirm Department Seeding"
        message={
          <span>
            You are about to seed <strong className="text-cyan-300">{selectedCount} departments</strong> into the PostgreSQL database. Existing departments will not be duplicated. Do you want to proceed?
          </span>
        }
        confirmText="Execute Seeding"
        variant="primary"
        loading={seeding}
      />
    </div>
  );
}
