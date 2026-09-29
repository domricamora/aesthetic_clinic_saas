import {
    Facebook,
    Instagram,
    Linkedin,
    Music2,
    Twitter,
    Youtube,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/** What each platform is called on the page, and how to draw it. */
const SOCIALS: Record<string, { label: string; icon: LucideIcon }> = {
    facebook: { label: 'Facebook', icon: Facebook },
    instagram: { label: 'Instagram', icon: Instagram },
    tiktok: { label: 'TikTok', icon: Music2 },
    linkedin: { label: 'LinkedIn', icon: Linkedin },
    x: { label: 'X', icon: Twitter },
    youtube: { label: 'YouTube', icon: Youtube },
};

export const SOCIAL_LABELS: Record<string, string> = Object.fromEntries(
    Object.entries(SOCIALS).map(([platform, { label }]) => [platform, label]),
);

/**
 * A brand mark, falling back to the platform's name if one is ever added to
 * the settings without a mark to go with it. A missing icon should cost a
 * little polish, never the link itself.
 */
export function SocialIcon({
    platform,
    className,
}: {
    platform: string;
    className?: string;
}) {
    const Icon = SOCIALS[platform]?.icon;

    return Icon ? (
        <Icon className={className} aria-hidden />
    ) : (
        <span className={className} aria-hidden />
    );
}
