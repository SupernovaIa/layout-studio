interface Props {
    url: string | null;
    busy: boolean;
    error: string | null;
}

export function PdfPreview({ url, busy, error }: Props) {
    return (
        <section className="rounded-xl border border-brand-line bg-white shadow-sm">
            <header className="border-b border-brand-line px-4 py-2.5">
                <span className="font-display text-[10px] font-semibold uppercase font-mono tracking-[0.18em] text-brand-mid">
                    Vista previa{busy ? " · actualizando…" : ""}
                </span>
            </header>
            {error ? (
                <p className="px-4 py-6 text-xs text-brand-coral">{error}</p>
            ) : url ? (
                <iframe
                    title="Vista previa del PDF"
                    src={`${url}#view=FitH&toolbar=1`}
                    className="h-[82vh] w-full rounded-b-xl"
                />
            ) : (
                <p className="px-4 py-16 text-center text-sm text-brand-ink-soft">
                    Genera un PDF para verlo aquí.
                </p>
            )}
        </section>
    );
}
