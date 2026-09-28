import { Link, useForm, usePage } from '@inertiajs/react';
import { Menu, X } from 'lucide-react';
import type { FormEvent, ReactNode } from 'react';
import { useEffect, useState } from 'react';
import Wordmark from '@/components/site/wordmark';
import { cn } from '@/lib/utils';
import { book, home, login } from '@/routes';
import leads from '@/routes/leads';
import treatments from '@/routes/treatments';

const nav = [
    { label: 'Treatments', href: treatments.index().url },
    { label: 'Specialists', href: `${home().url}#specialists` },
    { label: 'Membership', href: `${home().url}#membership` },
    { label: 'Locations', href: `${home().url}#locations` },
    { label: 'FAQ', href: `${home().url}#faq` },
];

export default function SiteLayout({ children }: { children: ReactNode }) {
    const { clinic, flash } = usePage<{ flash?: { success?: string | null } }>().props;
    const [open, setOpen] = useState(false);

    useEffect(() => {
        document.body.style.overflow = open ? 'hidden' : '';
    }, [open]);

    return (
        <div className="site theme-light min-h-dvh bg-background text-foreground">
            <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:bg-white focus:px-4 focus:py-2">
                Skip to content
            </a>

            <header className="on-dark sticky top-0 z-40 border-b border-white/10 bg-plum text-white">
                <div className="flex h-20 items-center justify-between gap-6 px-4 sm:px-8 lg:px-12">
                    <Link href={home().url} className="press" aria-label={`${clinic.name} home`}>
                        <Wordmark name={clinic.short_name} />
                    </Link>

                    <nav aria-label="Main" className="hidden items-center gap-8 text-sm text-white/80 lg:flex">
                        {nav.map((item) => (
                            <Link key={item.label} href={item.href} className="transition-colors duration-150 hover:text-white">
                                {item.label}
                            </Link>
                        ))}
                    </nav>

                    <div className="flex items-center gap-3">
                        <Link href={login().url} className="hidden text-sm text-white/80 hover:text-white sm:inline">
                            Patient login
                        </Link>
                        <Link href={book().url} className="press hidden bg-gold px-5 py-2.5 text-sm font-medium text-ink hover:bg-white sm:inline-flex">
                            Book a consultation
                        </Link>
                        <button
                            type="button"
                            onClick={() => setOpen(!open)}
                            className="press -mr-2 p-2 lg:hidden"
                            aria-expanded={open}
                            aria-controls="mobile-nav"
                            aria-label={open ? 'Close menu' : 'Open menu'}
                        >
                            {open ? <X className="size-6" /> : <Menu className="size-6" />}
                        </button>
                    </div>
                </div>

                <nav id="mobile-nav" aria-label="Mobile" className={cn('fixed inset-x-0 top-20 bottom-0 bg-plum px-4 pt-6 pb-24 sm:px-8 lg:hidden', open ? 'block' : 'hidden')}>
                    <ul className="divide-y divide-white/10 border-y border-white/10">
                        {[...nav, { label: 'Patient login', href: login().url }].map((item) => (
                            <li key={item.label}>
                                <Link href={item.href} onClick={() => setOpen(false)} className="flex py-4 font-display text-2xl">
                                    {item.label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>
            </header>

            <main id="main">{children}</main>

            <SiteFooter />

            <div className="fixed inset-x-0 bottom-0 z-30 border-t border-plum/10 bg-white/95 p-3 backdrop-blur sm:hidden">
                <Link href={book().url} className="press flex h-12 items-center justify-center bg-plum text-sm font-medium text-white">
                    Book now
                </Link>
            </div>

            {flash?.success && (
                <div role="status" className="fixed right-4 bottom-20 z-50 max-w-sm bg-ink px-5 py-4 text-sm text-white shadow-lg sm:bottom-6">
                    {flash.success}
                </div>
            )}
        </div>
    );
}

function SiteFooter() {
    const { clinic } = usePage().props;
    const form = useForm({ form: 'newsletter', email: '', privacy_consent: false });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        form.post(leads.store().url, { preserveScroll: true, onSuccess: () => form.reset('email') });
    };

    return (
        <footer className="on-dark bg-plum-deep pb-24 text-white/75 sm:pb-0">
            <div className="grid gap-12 px-4 py-16 sm:px-8 lg:grid-cols-12 lg:px-12 lg:py-20">
                <div className="lg:col-span-4">
                    <Wordmark name={clinic.name} className="text-white" />
                    <p className="mt-5 max-w-sm text-sm leading-relaxed">
                        {clinic.tagline} Physician-led aesthetic and wellness care in Makati, BGC and Cebu.
                    </p>
                    <p className="mt-6 text-sm">
                        <a href={`tel:${clinic.contact.phone.replace(/\s/g, '')}`} className="text-white hover:text-gold">
                            {clinic.contact.phone}
                        </a>
                        <br />
                        <a href={`mailto:${clinic.contact.email}`} className="text-white hover:text-gold">
                            {clinic.contact.email}
                        </a>
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-8 text-sm lg:col-span-4">
                    <div>
                        <h2 className="font-sans text-xs font-medium tracking-wide text-gold">Explore</h2>
                        <ul className="mt-4 space-y-3">
                            <li><Link href={treatments.index().url} className="hover:text-white">Treatments</Link></li>
                            <li><Link href={`${home().url}#specialists`} className="hover:text-white">Specialists</Link></li>
                            <li><Link href={`${home().url}#membership`} className="hover:text-white">Membership</Link></li>
                            <li><Link href={book().url} className="hover:text-white">Book online</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h2 className="font-sans text-xs font-medium tracking-wide text-gold">Clinics</h2>
                        <ul className="mt-4 space-y-3">
                            <li>Makati</li>
                            <li>BGC, Taguig</li>
                            <li>Cebu Business Park</li>
                            <li><Link href={`${home().url}#locations`} className="hover:text-white">Hours and directions</Link></li>
                        </ul>
                    </div>
                </div>

                <form onSubmit={submit} className="lg:col-span-4">
                    <h2 className="font-display text-xl text-white">Skin notes, once a month</h2>
                    <p className="mt-2 text-sm">Seasonal care tips and member offers. No spam, unsubscribe anytime.</p>
                    <label htmlFor="newsletter-email" className="sr-only">Email address</label>
                    <div className="mt-5 flex">
                        <input
                            id="newsletter-email"
                            type="email"
                            required
                            autoComplete="email"
                            value={form.data.email}
                            onChange={(e) => form.setData('email', e.target.value)}
                            placeholder="you@email.com"
                            className="h-12 min-w-0 flex-1 border border-white/20 bg-white/5 px-4 text-white placeholder:text-white/40 focus:border-gold focus:outline-none"
                        />
                        <button type="submit" disabled={form.processing} className="press h-12 bg-gold px-5 text-sm font-medium text-ink hover:bg-white disabled:opacity-50">
                            Subscribe
                        </button>
                    </div>
                    <label className="mt-3 flex items-start gap-2 text-xs">
                        <input
                            type="checkbox"
                            required
                            checked={form.data.privacy_consent}
                            onChange={(e) => form.setData('privacy_consent', e.target.checked)}
                            className="mt-0.5"
                        />
                        <span>I agree to the privacy notice and to receive email from {clinic.short_name}.</span>
                    </label>
                    {(form.errors.email || form.errors.privacy_consent) && (
                        <p role="alert" className="mt-2 text-xs text-gold">
                            {form.errors.email ?? form.errors.privacy_consent}
                        </p>
                    )}
                </form>
            </div>

            <div className="flex flex-col gap-2 border-t border-white/10 px-4 py-6 text-xs sm:flex-row sm:justify-between sm:px-8 lg:px-12">
                <p>© {new Date().getFullYear()} {clinic.name}. A demonstration clinic; names and people are fictional.</p>
                <p>Photos from Unsplash contributors, used under the Unsplash License.</p>
            </div>
        </footer>
    );
}
