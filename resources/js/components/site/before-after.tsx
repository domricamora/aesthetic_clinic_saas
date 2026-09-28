import { useState } from 'react';

/**
 * Comparison slider. The demo uses one stock portrait with a simulated
 * "before" treatment, so it is labelled as an illustration, never a result.
 */
export default function BeforeAfter({ src, alt }: { src: string; alt: string }) {
    const [position, setPosition] = useState(50);

    return (
        <figure>
            <div className="relative aspect-[4/3] overflow-hidden bg-mist select-none">
                <img src={src} alt={alt} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
                <img
                    src={src}
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover [filter:saturate(0.75)_contrast(1.12)_brightness(0.93)_sepia(0.12)]"
                    style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
                />
                <span className="absolute top-4 left-4 bg-ink/80 px-2.5 py-1 text-xs text-white">Before</span>
                <span className="absolute top-4 right-4 bg-white/90 px-2.5 py-1 text-xs text-ink">After</span>
                <span aria-hidden="true" className="absolute inset-y-0 w-px bg-white" style={{ left: `${position}%` }}>
                    <span className="absolute top-1/2 left-1/2 grid size-11 -translate-x-1/2 -translate-y-1/2 place-items-center border border-white bg-plum text-white shadow-lg">
                        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.75">
                            <path d="M9 6l-6 6 6 6M15 6l6 6-6 6" />
                        </svg>
                    </span>
                </span>
                <input
                    type="range"
                    min={0}
                    max={100}
                    value={position}
                    onChange={(e) => setPosition(Number(e.target.value))}
                    aria-label="Compare before and after"
                    className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
                />
            </div>
            <figcaption className="mt-3 text-xs text-muted-foreground">
                Illustrative simulation for this demo, not a patient result.
            </figcaption>
        </figure>
    );
}
