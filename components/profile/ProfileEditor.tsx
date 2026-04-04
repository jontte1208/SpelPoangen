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

    const res = await fetch("/api/profile/upload-avatar", {
      method: "POST",
      body: formData,
    });

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

                {/* Avatar mode selector */}
                <div className="mb-4 flex gap-2">
                  <button
                    onClick={() => setAvatarMode("discord")}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold transition-all ${
                      avatarMode === "discord"
                        ? "border-neon-cyan/40 bg-neon-cyan/10 text-white"
                        : "border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:text-white"
                    }`}
                  >
                    <MessageCircle size={14} />
                    Discord-avatar
                  </button>
                  <button
                    onClick={() => setAvatarMode("custom")}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold transition-all ${
                      avatarMode === "custom"
                        ? "border-neon-cyan/40 bg-neon-cyan/10 text-white"
                        : "border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:text-white"
                    }`}
                  >
                    <Upload size={14} />
                    Egen bild
                  </button>
                </div>

                <div className="flex items-center gap-4">
                  {/* Preview */}
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-white/15">
                    {previewImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={previewImage} alt="Preview" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-neon-cyan/10 text-sm text-neon-cyan">SP</div>
                    )}
                  </div>

                  {avatarMode === "discord" ? (
                    <p className="text-sm text-slate-400">
                      Din Discord-profilbild används automatiskt.
                    </p>
                  ) : (
                    <div className="flex-1 space-y-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="w-full"
                      >
                        {uploading ? "Laddar upp..." : "Ladda upp bild"}
                      </Button>
                      <p className="text-[10px] text-slate-500">Max 2 MB. PNG, JPG, WebP eller GIF.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-white/5 px-5 py-4">
              <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Avbryt</Button>
              <Button size="sm" onClick={save} disabled={saving || uploading}>
                {saving ? "Sparar..." : "Spara"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
