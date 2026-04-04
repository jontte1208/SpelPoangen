"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BANNERS } from "@/lib/banners";
import { Button } from "@/components/ui/Button";
import { Pencil, X, Check, Upload, MessageCircle } from "lucide-react";

interface Props {
  currentBannerKey: string;
  currentImage: string | null;
  discordImage: string | null;
}

type AvatarMode = "discord" | "custom";

export function ProfileEditor({ currentBannerKey, currentImage, discordImage }: Props) {
  const [open, setOpen] = useState(false);
  const [selectedBanner, setSelectedBanner] = useState(currentBannerKey);
  const [avatarMode, setAvatarMode] = useState<AvatarMode>(currentImage ? "custom" : "discord");
  const [customImageUrl, setCustomImageUrl] = useState(currentImage ?? "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const previewImage = avatarMode === "custom" && customImageUrl ? customImageUrl : discordImage;

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("Bilden får vara max 2 MB.");
      return;
    }
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/profile/upload-avatar", { method: "POST", body: formData });
    if (res.ok) {
      const data = await res.json();
      setCustomImageUrl(data.url);
      setAvatarMode("custom");
    }
    setUploading(false);
  }

  async function save() {
    setSaving(true);
    const imageToSave = avatarMode === "discord" ? "" : customImageUrl;
    await fetch("/api/profile/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bannerKey: selectedBanner, customImage: imageToSave }),
    });
    setSaving(false);
    setOpen(false);
    router.refresh();
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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="flex w-full max-w-md flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl" style={{ maxHeight: "90vh" }}>
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-white/5 px-5 py-3">
              <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-white">Redigera profil</h2>
              <button onClick={() => setOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-white/5 hover:text-white">
                <X size={16} />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">

              {/* Banner picker */}
              <div>
                <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Banner</p>
                <div className="grid grid-cols-4 gap-1.5">
                  {BANNERS.map((banner) => (
                    <button
                      key={banner.key}
                      onClick={() => setSelectedBanner(banner.key)}
                      className="relative overflow-hidden rounded-lg border-2 transition-all"
                      style={{ borderColor: selectedBanner === banner.key ? "#00f5ff" : "rgba(255,255,255,0.07)" }}
                    >
                      <div className="h-10 w-full" style={{ background: banner.style }} />
                      {selectedBanner === banner.key && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/25">
                          <Check size={14} className="text-neon-cyan drop-shadow" />
                        </div>
                      )}
                      <p className="bg-black/50 py-0.5 text-center text-[9px] font-semibold uppercase tracking-[0.08em] text-white/80">
                        {banner.label}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-white/5" />

              {/* Profile image */}
              <div>
                <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Profilbild</p>

                <div className="flex items-center gap-3">
                  {/* Preview */}
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full border-2 border-white/15">
                    {previewImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={previewImage} alt="Preview" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-neon-cyan/10 text-xs text-neon-cyan">SP</div>
                    )}
                  </div>

                  {/* Mode buttons */}
                  <div className="flex flex-1 flex-col gap-2">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setAvatarMode("discord")}
                        className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border py-2 text-[11px] font-semibold transition-all ${
                          avatarMode === "discord"
                            ? "border-neon-cyan/40 bg-neon-cyan/10 text-white"
                            : "border-white/10 bg-white/5 text-slate-400 hover:text-white"
                        }`}
                      >
                        <MessageCircle size={12} />
                        Discord
                      </button>
                      <button
                        onClick={() => setAvatarMode("custom")}
                        className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border py-2 text-[11px] font-semibold transition-all ${
                          avatarMode === "custom"
                            ? "border-neon-cyan/40 bg-neon-cyan/10 text-white"
                            : "border-white/10 bg-white/5 text-slate-400 hover:text-white"
                        }`}
                      >
                        <Upload size={12} />
                        Ladda upp
                      </button>
                    </div>

                    {avatarMode === "discord" ? (
                      <p className="text-[11px] text-slate-500">Din Discord-avatar används automatiskt.</p>
                    ) : (
                      <>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/png,image/jpeg,image/webp,image/gif"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploading}
                          className="w-full rounded-lg border border-white/10 bg-white/5 py-2 text-[11px] font-semibold text-slate-300 transition-all hover:border-neon-cyan/30 hover:bg-neon-cyan/10 hover:text-white disabled:opacity-50"
                        >
                          {uploading ? "Laddar upp..." : customImageUrl ? "Byt bild" : "Välj fil (max 2 MB)"}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex shrink-0 justify-end gap-2 border-t border-white/5 px-5 py-3">
              <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Avbryt</Button>
              <Button size="sm" onClick={save} disabled={saving || uploading}>
                {saving ? "Sparar..." : "Spara ändringar"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
