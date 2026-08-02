import { useRef } from "react";

interface Props {
    value: File | null;
    onChange: (file: File | null) => void;
}

const ACCEPTED = ".png,.jpg,.jpeg,.webp,.svg";

export function LogoUpload({ value, onChange }: Props) {
    const inputRef = useRef<HTMLInputElement>(null);
    const previewUrl = value ? URL.createObjectURL(value) : null;

    const handleFile = (file: File | undefined) => {
        if (file) onChange(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        handleFile(e.dataTransfer.files[0]);
    };

    return (
        <div className="rounded-xl border border-brand-line bg-brand-card backdrop-blur-xl p-5 shadow-sm">
            <div className="flex items-baseline justify-between">
                <h2 className="font-display text-[10px] font-semibold uppercase font-mono tracking-[0.18em] text-brand-mid">
                    Logo personalizado
                </h2>
                {value && (
                    <button
                        type="button"
                        onClick={() => onChange(null)}
                        className="text-[11px] text-brand-ink-mute hover:text-brand-coral transition"
                    >
                        Quitar
                    </button>
                )}
            </div>

            {value && previewUrl ? (
                <div className="mt-3 flex items-center gap-3">
                    <img
                        src={previewUrl}
                        alt="Logo preview"
                        className="h-10 max-w-[120px] rounded border border-brand-line bg-brand-bg object-contain p-1"
                    />
                    <span className="truncate text-[11px] text-brand-ink-soft">{value.name}</span>
                </div>
            ) : (
                <div
                    role="button"
                    tabIndex={0}
                    onClick={() => inputRef.current?.click()}
                    onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    className="mt-3 flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-brand-line py-4 text-center transition hover:border-brand-accent hover:bg-brand-accent/5"
                >
                    <svg className="h-5 w-5 text-brand-ink-mute" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" />
                    </svg>
                    <span className="text-[11px] text-brand-ink-soft">
                        Arrastra o haz clic para subir
                    </span>
                    <span className="text-[10px] text-brand-ink-mute">PNG · JPG · SVG · WEBP</span>
                </div>
            )}

            <input
                ref={inputRef}
                type="file"
                accept={ACCEPTED}
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
            />
        </div>
    );
}
