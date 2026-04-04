"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BANNERS } from "@/lib/banners";
import { Pencil, X, Check, Upload, MessageCircle, CheckCircle2 } from "lucide-react";

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
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const previewImage = avatarMode === "custom" && customImageUrl ? customImageUrl : discordImage;

  async function saveField(patch: { bannerKey?: string; customImage?: string }) {
    await fetch("/api/profile/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    router.refresh();
  }

  async function selectBanner(key: string) {
    setSelectedBanner(key);
    await saveField({ bannerKey: key });
  }

  async function selectDiscord() {
    setAvatarMode("discord");
    setCustomImageUrl("");
    await saveField({ customImage: "" });
  }

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
      await saveField({ customImage: data.url });
    }
    setUploading(false);
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl">

            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
              <div className="flex items-center gap-3">
                <h2 className="font-display text-base font-semibold text-white">Redigera profil</h2>
                {saved && (
                  <span className="flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                    <CheckCircle2 size={11} />
                    Sparad!
                  </span>
                )}
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-6">

              {/* Banner */}
              <div>
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Välj banner — sparas direkt
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {BANNERS.map((banner) => (
                    <button
                      key={banner.key}
                      onClick={() => selectBanner(banner.key)}
                      className="relative overflow-hidden rounded-xl border-2 transition-all duration-150"
                      style={{
                        borderColor: selectedBanner === banner.key ? "#00f5ff" : "rgba(255,255,255,0.07)",
                        boxShadow: selectedBanner === banner.key ? "0 0 12px rgba(0,245,255,0.2)" : "none",
                      }}
                    >
                      <div className="h-14 w-full" style={{ background: banner.style }} />
                      {selectedBanner === banner.key && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                          <Check size={16} className="text-neon-cyan drop-shadow" />
                        </div>
                      )}
                      <p className="bg-black/50 py-1 text-center text-[9px] font-semibold uppercase tracking-[0.08em] text-white/80">
                        {banner.label}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-white/5" />

              {/* Avatar */}
              <div>
                <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Profilbild — sparas direkt
                </p>

                <div className="flex items-center gap-5">
                  {/* Preview */}
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full border-2 border-white/20 shadow-lg">
                    {previewImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={previewImage} alt="Preview" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-neon-cyan/10 text-sm text-neon-cyan">SP</div>
                    )}
                  </div>

                  {/* Options */}
                  <div className="flex flex-1 flex-col gap-2">
                    <button
                      onClick={selectDiscord}
                      className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all ${
                        avatarMode === "discord"
                          ? "border-neon-cyan/40 bg-neon-cyan/10 text-white"
                          : "border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:text-white"
                      }`}
                    >
                      <MessageCircle size={15} className="shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold">Discord-avatar</p>
                        <p className="text-[11px] text-slate-500">Din Discord-profilbild</p>
                      </div>
                      {avatarMode === "discord" && <Check size={14} className="text-neon-cyan" />}
                    </button>

                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all disabled:opacity-50 ${
                        avatarMode === "custom"
                          ? "border-neon-cyan/40 bg-neon-cyan/10 text-white"
                          : "border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:text-white"
                      }`}
                    >
                      <Upload size={15} className="shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold">
                          {uploading ? "Laddar upp..." : avatarMode === "custom" ? "Byt bild" : "Ladda upp bild"}
                        </p>
                        <p className="text-[11px] text-slate-500">PNG, JPG, WebP — max 2 MB</p>
                      </div>
                      {avatarMode === "custom" && !uploading && <Check size={14} className="text-neon-cyan" />}
                    </button>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-white/5 px-6 py-4">
              <button
                onClick={() => setOpen(false)}
                className="w-full rounded-xl bg-neon-cyan/10 border border-neon-cyan/25 py-2.5 text-sm font-semibold text-neon-cyan transition-all hover:bg-neon-cyan/20"
              >
                Klar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
