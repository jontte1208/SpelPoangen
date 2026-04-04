"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BANNERS } from "@/lib/banners";
import { Button } from "@/components/ui/Button";
import { Pencil, X, Check } from "lucide-react";

interface Props {
  currentBannerKey: string;
  currentImage: string | null;
  discordImage: string | null;
}

export function ProfileEditor({ currentBannerKey, currentImage, discordImage }: Props) {
  const [open, setOpen] = useState(false);
  const [selectedBanner, setSelectedBanner] = useState(currentBannerKey);
  const [imageUrl, setImageUrl] = useState(currentImage ?? "");
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function save() {
    setSaving(true);
    await fetch("/api/profile/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bannerKey: selectedBanner, customImage: imageUrl }),
    });
    setSaving(false);
    setOpen(false);
    router.refresh();
  }

  function resetImage() {
    setImageUrl("");
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300 transition-all hover:border-neon-cyan/30 hover:bg-neon-cyan/10 hover:text-white"
      >
        <Pencil size={12} />
        Redigera profil
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
              <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-white">Redigera profil</h2>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-6 p-5">
              {/* Banner picker */}
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Välj banner</p>
                <div className="grid grid-cols-4 gap-2">
                  {BANNERS.map((banner) => (
                    <button
                      key={banner.key}
                      onClick={() => setSelectedBanner(banner.key)}
                      className="group relative overflow-hidden rounded-xl border-2 transition-all"
                      style={{
                        borderColor: selectedBanner === banner.key ? "#00f5ff" : "rgba(255,255,255,0.08)",
                      }}
                    >
                      <div
                        className="h-14 w-full"
                        style={{ background: banner.style }}
                      />
                      {selectedBanner === banner.key && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                          <Check size={16} className="text-neon-cyan" />
                        </div>
                      )}
                      <p className="bg-black/40 py-1 text-center text-[10px] font-semibold uppercase tracking-[0.1em] text-white">
                        {banner.label}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Profile image */}
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Profilbild</p>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full border border-white/15">
                    {imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={imageUrl} alt="Preview" className="h-full w-full object-cover" />
                    ) : discordImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={discordImage} alt="Discord" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-neon-cyan/10 text-xs text-neon-cyan">SP</div>
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="Klistra in bild-URL (lämna tomt för Discord-avatar)"
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-neon-cyan/40 focus:outline-none"
                    />
                  </div>
                  {imageUrl && (
                    <button onClick={resetImage} className="shrink-0 text-slate-400 hover:text-white">
                      <X size={16} />
                    </button>
                  )}
                </div>
                <p className="mt-2 text-[10px] text-slate-500">Lämna tomt för att använda Discord-avataren.</p>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-white/5 px-5 py-4">
              <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Avbryt</Button>
              <Button size="sm" onClick={save} disabled={saving}>
                {saving ? "Sparar..." : "Spara"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
