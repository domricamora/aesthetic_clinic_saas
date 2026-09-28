import { usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

const CLIPS = ['hero-40552', 'hero-52144', 'hero-51172'];

/**
 * Full-bleed background film: short muted clips that crossfade in turn.
 * Reduced-motion visitors get the still poster of the first clip.
 */
export default function HeroVideo() {
    const { mediaUrl } = usePage().props;
    const base = mediaUrl.replace(/photos$/, 'video');
    const [active, setActive] = useState(0);
    const [still, setStill] = useState(false);
    const refs = useRef<(HTMLVideoElement | null)[]>([]);

    useEffect(() => {
        setStill(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    }, []);

    useEffect(() => {
        if (still) {
            return;
        }

        const video = refs.current[active];

        if (video) {
            video.currentTime = 0;
            void video.play().catch(() => setStill(true));
        }
    }, [active, still]);

    return (
        <div aria-hidden="true" className="absolute inset-0 -z-20">
            {still ? (
                <img
                    src={`${base}/${CLIPS[0]}.jpg`}
                    alt=""
                    className="h-full w-full object-cover"
                />
            ) : (
                CLIPS.map((clip, i) => (
                    <video
                        key={clip}
                        ref={(el) => {
                            refs.current[i] = el;
                        }}
                        src={`${base}/${clip}.mp4`}
                        poster={i === 0 ? `${base}/${clip}.jpg` : undefined}
                        muted
                        playsInline
                        preload={i === 0 ? 'auto' : 'metadata'}
                        onEnded={() => setActive((active + 1) % CLIPS.length)}
                        className={cn(
                            'absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-out',
                            i === active ? 'opacity-100' : 'opacity-0',
                        )}
                    />
                ))
            )}
        </div>
    );
}
