import { useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";

function initialsOf(name?: string) {
  return (
    name
      ?.split(" ")
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() ?? "?"
  );
}

export function Avatar({
  name,
  src,
  size = 56,
  onUpload,
}: {
  name?: string;
  src?: string | null;
  size?: number;
  onUpload?: (file: File) => Promise<void>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !onUpload) return;
    setUploading(true);
    try {
      await onUpload(file);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <div
      className="group relative shrink-0 overflow-hidden rounded-full bg-primary/15"
      style={{ width: size, height: size }}
    >
      {src ? (
        <img src={src} alt={name ?? "Avatar"} className="h-full w-full object-cover" />
      ) : (
        <div
          className="flex h-full w-full items-center justify-center font-semibold text-primary"
          style={{ fontSize: size * 0.36 }}
        >
          {initialsOf(name)}
        </div>
      )}

      {onUpload && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="absolute inset-0 flex items-center justify-center bg-black/0 text-transparent transition-colors group-hover:bg-black/40 group-hover:text-white"
          aria-label="Change avatar"
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
        </button>
      )}
      {onUpload && (
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={handleFile}
        />
      )}
    </div>
  );
}
