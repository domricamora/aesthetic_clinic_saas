import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { ArrowRight, BadgeCheck, CalendarCheck, ClipboardList, Cpu, Lock, Minus, Phone, Plus } from 'lucide-react';
import type { CSSProperties, FormEvent } from 'react';
import { useState } from 'react';
import AppointmentCard from '@/components/site/appointment-card';
import BeforeAfter from '@/components/site/before-after';
import HeroVideo from '@/components/site/hero-video';
import { formatDuration, formatPrice, isOpenNow, useReveal } from '@/lib/site';
import { cn } from '@/lib/utils';
import { book } from '@/routes';
import leads from '@/routes/leads';
import treatmentRoutes from '@/routes/treatments';
import type { Branch, Category, Faq, Specialist, Testimonial, Treatment } from '@/types/site';

type Props = {
    categories: Category[];
    featured: Treatment[];
    bookable: Treatment[];
    specialists: Specialist[];
    branches: Branch[];
    testimonials: Testimonial[];
    faqs: Faq[];
};

const stagger = (i: number) => ({ '--i': i }) as CSSProperties;

export default function Home({ categories, featured, bookable, specialists, branches, testimonials, faqs }: Props) {
    const { clinic, mediaUrl } = usePage().props;
    const media = (file: string) => `${mediaUrl}/${file}`;
    useReveal();

    return (
        <>
            <Head title="Physician-led aesthetic care in Makati, BGC and Cebu">
                <meta
                    name="description"
                    content={`${clinic.name}: facial treatments, injectables, body, hair and wellness care led by licensed physicians. Book a consultation online in under a minute.`}
                />
            </Head>

            {/* Hero: full-width film, the appointment card is the primary control. */}
            <section className="on-dark relative isolate overflow-hidden bg-plum-deep text-white">
                <HeroVideo />
                <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgb(42_11_61/0.92)_0%,rgb(42_11_61/0.7)_45%,rgb(42_11_61/0.35)_100%)]" />
                <div className="grid gap-10 px-4 pt-14 pb-16 sm:px-8 lg:min-h-[calc(100dvh-5rem)] lg:grid-cols-12 lg:items-center lg:gap-8 lg:px-12 lg:py-16">
                    <div className="lg:col-span-7 xl:col-span-6">
                        <h1 className="max-w-[13ch] text-[2.9rem] leading-[1.04] sm:text-6xl xl:text-[5.25rem]">
                            Aesthetics that enhance your <em className="text-gold">natural beauty.</em>
                        </h1>
                        <p className="mt-7 max-w-lg text-lg leading-relaxed text-lilac">
                            Facials, injectables, body and makeup artistry, planned with a licensed physician and booked in under a minute.
                        </p>
                        <div className="mt-9 flex flex-wrap gap-3">
                            <Link href={book().url} className="press inline-flex h-13 items-center gap-2 bg-gold px-7 font-medium text-ink hover:bg-white">
                                Book a consultation <ArrowRight className="size-4" />
                            </Link>
                            <Link href={treatmentRoutes.index().url} className="press inline-flex h-13 items-center border border-white/40 px-7 font-medium backdrop-blur-sm hover:border-white">
                                Explore treatments
                            </Link>
                        </div>
                    </div>

                    <div className="w-full min-w-0 lg:col-span-5 lg:w-[25rem] lg:justify-self-end xl:col-span-4 xl:col-start-9">
                        <AppointmentCard treatments={bookable} branches={branches} />
                    </div>
                </div>
            </section>

            {/* Trust */}
            <section aria-label="Why patients trust us" className="border-b border-border bg-white">
                <ul className="grid grid-cols-2 divide-border px-4 sm:px-8 md:grid-cols-5 md:divide-x lg:px-12">
                    {[
                        [BadgeCheck, 'Licensed professionals', 'Every treatment is led or supervised by a physician.'],
                        [ClipboardList, 'Personalized plans', 'A plan agreed with you before anything begins.'],
                        [Cpu, 'Modern technology', 'Current-generation lasers and devices.'],
                        [Lock, 'Secure patient records', 'Handled under the Data Privacy Act.'],
                        [CalendarCheck, 'Online booking', 'Pick a time in under a minute, no account needed.'],
                    ].map(([Icon, title, text], i) => {
                        const I = Icon as typeof BadgeCheck;

                        return (
                            <li key={title as string} data-reveal style={stagger(i)} className="py-6 md:px-6 md:first:pl-0">
                                <I className="size-5 text-violet" aria-hidden="true" />
                                <p className="mt-3 text-sm font-semibold">{title as string}</p>
                                <p className="mt-1 text-sm text-muted-foreground">{text as string}</p>
                            </li>
                        );
                    })}
                </ul>
            </section>

            {/* Featured treatments */}
            <section className="px-4 py-20 sm:px-8 lg:px-12 lg:py-28">
                <div className="flex flex-wrap items-end justify-between gap-6">
                    <h2 data-reveal className="max-w-2xl text-4xl sm:text-5xl">Treatments our patients book most</h2>
                    <Link href={treatmentRoutes.index().url} className="inline-flex items-center gap-2 font-medium text-plum hover:text-violet">
                        All {bookable.length} treatments <ArrowRight className="size-4" />
                    </Link>
                </div>

                {/* Bento mosaic: 4 columns, tile 0 is the 2x2 feature, the last two share the bottom row. */}
                <div className="mt-12 grid auto-rows-[17rem] gap-2 sm:grid-cols-2 lg:auto-rows-[19rem] lg:grid-cols-4">
                    {featured.slice(0, 7).map((t, i) => {
                        const big = i === 0;
                        const wide = i >= 5;

                        return (
                            <article
                                key={t.id}
                                data-reveal
                                style={stagger(i % 4)}
                                className={cn('group relative overflow-hidden bg-plum', big && 'sm:col-span-2 sm:row-span-2', wide && 'lg:col-span-2')}
                            >
                                <Link href={treatmentRoutes.show(t.slug).url} className="on-dark absolute inset-0 flex flex-col justify-end text-white">
                                    {t.image && (
                                        <img
                                            src={t.image}
                                            alt=""
                                            loading="lazy"
                                            className="absolute inset-0 -z-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                                        />
                                    )}
                                    <span aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(to_top,rgb(42_11_61/0.88)_0%,rgb(42_11_61/0.35)_45%,rgb(42_11_61/0)_75%)]" />
                                    <span aria-hidden="true" className="absolute inset-3 border border-gold/0 transition-colors duration-300 ease-out group-hover:border-gold/60" />
                                    <div className={cn('relative flex items-end justify-between gap-4', big ? 'p-8' : 'p-6')}>
                                        <div>
                                            <p className="text-[11px] tracking-[0.2em] text-gold uppercase">{t.category?.name}</p>
                                            <h3 className={cn('mt-2 leading-tight', big ? 'text-4xl sm:text-5xl' : 'text-2xl')}>{t.name}</h3>
                                            {big && <p className="mt-3 max-w-sm text-sm text-lilac">{t.summary}</p>}
                                        </div>
                                        <p className="numerals shrink-0 text-right">
                                            <span className={cn('block font-display', big ? 'text-4xl' : 'text-2xl')}>{formatPrice(t.promo_price ?? t.price)}</span>
                                            <span className="text-xs text-lilac">{formatDuration(t.duration_minutes)}</span>
                                        </p>
                                    </div>
                                </Link>
                            </article>
                        );
                    })}
                </div>
            </section>

            {/* Categories index */}
            <section className="bg-mist px-4 py-20 sm:px-8 lg:px-12 lg:py-24">
                <div className="grid gap-10 lg:grid-cols-12">
                    <div className="lg:col-span-4">
                        <h2 data-reveal className="text-4xl">Care for face, body, hair and wellbeing</h2>
                        <p className="mt-4 max-w-sm text-muted-foreground">
                            Not sure what you need? Start with a consultation and your doctor will build the plan with you.
                        </p>
                    </div>
                    <ul className="divide-y divide-plum/15 border-y border-plum/15 lg:col-span-8">
                        {categories.map((c, i) => (
                            <li key={c.id} data-reveal style={stagger(i)}>
                                <Link href={`${treatmentRoutes.index().url}#${c.slug}`} className="group grid grid-cols-[1fr_auto] items-center gap-6 py-6 sm:grid-cols-[14rem_1fr_auto]">
                                    <span className="font-display text-2xl font-semibold group-hover:text-plum">{c.name}</span>
                                    <span className="hidden text-sm text-muted-foreground sm:block">{c.description}</span>
                                    <span className="numerals flex items-center gap-3 text-sm text-muted-foreground">
                                        {c.treatments_count} treatments
                                        <ArrowRight className="size-4 text-plum transition-transform duration-200 ease-out group-hover:translate-x-1" />
                                    </span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            </section>

            {/* Why */}
            <section className="grid lg:grid-cols-2">
                <img src={media('consultation.jpg')} alt="A doctor writing notes during a patient consultation" loading="lazy" className="h-72 w-full object-cover sm:h-96 lg:h-full" />
                <div className="px-4 py-20 sm:px-8 lg:px-16 lg:py-28">
                    <h2 data-reveal className="max-w-lg text-4xl sm:text-5xl">
                        Why patients choose {clinic.short_name}
                    </h2>
                    <dl className="mt-10 divide-y divide-border border-y border-border">
                        {[
                            ['A doctor sees you first', 'Every new plan starts with a physician consultation, not a sales pitch.'],
                            ['Honest about results', 'We explain what is realistic, how many sessions it usually takes, and the possible side effects.'],
                            ['Follow-up is part of the price', 'Aftercare instructions in writing and a check-in after every treatment.'],
                            ['Your records stay private', 'Clinical notes and photos are only seen by your care team, and never used in marketing without your consent.'],
                        ].map(([title, text], i) => (
                            <div key={title} data-reveal style={stagger(i)} className="py-6">
                                <dt className="text-lg font-semibold">{title}</dt>
                                <dd className="mt-1 text-muted-foreground">{text}</dd>
                            </div>
                        ))}
                    </dl>
                </div>
            </section>

            {/* Before and after */}
            <section className="bg-white px-4 py-20 sm:px-8 lg:px-12 lg:py-28">
                <div className="grid items-center gap-12 lg:grid-cols-12">
                    <div className="lg:col-span-5">
                        <h2 data-reveal className="text-4xl sm:text-5xl">See the difference a plan makes</h2>
                        <p className="mt-5 max-w-md text-muted-foreground">
                            Drag the handle to compare. Real before and after photos are only shared with written consent from the patient, and you will see
                            relevant cases during your consultation.
                        </p>
                        <p className="mt-4 max-w-md text-sm text-muted-foreground">
                            Results vary from person to person. Your doctor will talk you through what to expect for your skin.
                        </p>
                    </div>
                    <div className="lg:col-span-7">
                        <BeforeAfter src={media('booster.jpg')} alt="Portrait used to illustrate skin texture before and after a hydration treatment" />
                    </div>
                </div>
            </section>

            {/* Specialists */}
            <section id="specialists" className="scroll-mt-20 bg-mist px-4 py-20 sm:px-8 lg:px-12 lg:py-28">
                <h2 data-reveal className="max-w-2xl text-4xl sm:text-5xl">The physicians behind your plan</h2>
                <div className="mt-12 grid gap-10 md:grid-cols-3">
                    {specialists.map((s, i) => (
                        <article key={s.id} data-reveal style={stagger(i)}>
                            <div className="aspect-[4/5] overflow-hidden bg-lilac">
                                {s.photo && <img src={s.photo} alt={`Portrait of ${s.name}`} loading="lazy" className="h-full w-full object-cover object-top" />}
                            </div>
                            <h3 className="mt-5 text-2xl">{s.name}</h3>
                            <p className="text-sm text-plum">{s.title}</p>
                            <p className="mt-1 text-xs text-muted-foreground">{s.credentials}</p>
                            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{s.bio}</p>
                            <p className="mt-4 text-xs text-muted-foreground">
                                {s.focus?.join(' · ')}
                                <br />
                                Sees patients in {s.branches?.join(' and ')}
                            </p>
                        </article>
                    ))}
                </div>
            </section>

            {/* Technology and follow-up */}
            <section className="on-dark grid bg-plum-deep text-white lg:grid-cols-2">
                <div className="px-4 py-20 sm:px-8 lg:px-12 lg:py-28">
                    <h2 data-reveal className="max-w-lg text-4xl sm:text-5xl">Technology that works for you, before and after the visit</h2>
                    <ul className="mt-10 grid gap-8 sm:grid-cols-2">
                        {[
                            ['Book in a minute', 'Live availability for every branch and doctor, confirmed by SMS and email.'],
                            ['Reminders that help', 'A reminder the day before, with preparation notes for your treatment.'],
                            ['Aftercare in writing', 'Your instructions arrive after each session, so nothing is forgotten.'],
                            ['Records under lock', 'Consent forms and clinical photos stored privately, with every access logged.'],
                        ].map(([title, text], i) => (
                            <li key={title} data-reveal style={stagger(i)} className="border-t border-white/15 pt-5">
                                <p className="font-semibold text-gold">{title}</p>
                                <p className="mt-2 text-sm text-lilac/85">{text}</p>
                            </li>
                        ))}
                    </ul>
                </div>
                <img src={media('laser.jpg')} alt="A practitioner using a handheld laser device during a treatment" loading="lazy" className="h-80 w-full object-cover lg:h-full" />
            </section>

            {/* Membership */}
            <section id="membership" className="scroll-mt-20 px-4 py-20 sm:px-8 lg:px-12 lg:py-28">
                <div className="grid gap-12 lg:grid-cols-12">
                    <div className="lg:col-span-4">
                        <h2 data-reveal className="text-4xl sm:text-5xl">Membership for skin that stays on track</h2>
                        <p className="mt-5 max-w-sm text-muted-foreground">
                            A monthly plan for patients who want regular care, member pricing and first pick of appointment times.
                        </p>
                    </div>
                    <div className="grid gap-px bg-border sm:grid-cols-2 lg:col-span-8">
                        {[
                            {
                                name: 'Glow',
                                price: 2990,
                                items: ['One Hydra Facial every month', '10% off all facial treatments', 'Birthday treatment upgrade', 'Priority booking'],
                                featured: false,
                            },
                            {
                                name: 'Premium',
                                price: 6500,
                                items: ['A monthly treatment allowance', '15% off treatments and products', 'Quarterly skin review with a doctor', 'Priority booking and member events'],
                                featured: true,
                            },
                        ].map((plan, i) => (
                            <div key={plan.name} data-reveal style={stagger(i)} className={cn('flex flex-col p-8', plan.featured ? 'bg-plum text-white' : 'bg-white')}>
                                <h3 className="text-2xl">{plan.name} Membership</h3>
                                <p className="numerals mt-6">
                                    <span className="font-display text-5xl font-semibold">{formatPrice(plan.price)}</span>
                                    <span className={cn('ml-1 text-sm', plan.featured ? 'text-lilac' : 'text-muted-foreground')}>per month</span>
                                </p>
                                <ul className={cn('mt-6 flex-1 space-y-3 text-sm', plan.featured ? 'text-lilac' : 'text-muted-foreground')}>
                                    {plan.items.map((item) => (
                                        <li key={item} className="flex gap-3">
                                            <span aria-hidden="true" className={cn('mt-2 h-px w-3 shrink-0', plan.featured ? 'bg-gold' : 'bg-plum')} />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                                <a
                                    href="#enquire"
                                    className={cn('press mt-8 inline-flex h-12 items-center justify-center font-medium', plan.featured ? 'bg-gold text-ink hover:bg-white' : 'border border-plum text-plum hover:bg-plum hover:text-white')}
                                >
                                    Ask about {plan.name}
                                </a>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="bg-mist px-4 py-20 sm:px-8 lg:px-12 lg:py-28">
                <h2 data-reveal className="max-w-2xl text-4xl sm:text-5xl">In our patients’ words</h2>
                <div className="mt-12 grid gap-px bg-plum/10 md:grid-cols-2">
                    {testimonials.map((t, i) => (
                        <figure key={t.id} data-reveal style={stagger(i)} className="bg-mist p-8 lg:p-10">
                            <blockquote className={cn('leading-relaxed', i === 0 ? 'font-display text-2xl sm:text-3xl' : 'text-lg')}>“{t.quote}”</blockquote>
                            <figcaption className="mt-6 text-sm">
                                <span className="font-semibold">{t.author_name}</span>
                                <span className="text-muted-foreground"> · {t.author_meta}</span>
                            </figcaption>
                        </figure>
                    ))}
                </div>
            </section>

            {/* Locations */}
            <section id="locations" className="scroll-mt-20 px-4 py-20 sm:px-8 lg:px-12 lg:py-28">
                <h2 data-reveal className="max-w-2xl text-4xl sm:text-5xl">Three clinics, one standard of care</h2>
                <div className="mt-12 grid gap-10 md:grid-cols-3">
                    {branches.map((b, i) => {
                        const open = isOpenNow(b);

                        return (
                            <article key={b.id} data-reveal style={stagger(i)}>
                                <div className="aspect-[4/3] overflow-hidden bg-mist">
                                    {b.image && <img src={b.image} alt={`${b.city} skyline near the ${b.name} clinic`} loading="lazy" className="h-full w-full object-cover" />}
                                </div>
                                <div className="mt-5 flex items-center justify-between gap-4">
                                    <h3 className="text-2xl">{b.name}</h3>
                                    <span className={cn('inline-flex items-center gap-2 text-xs font-medium', open ? 'text-plum' : 'text-muted-foreground')}>
                                        <span aria-hidden="true" className={cn('size-2', open ? 'bg-violet' : 'bg-muted-foreground/40')} />
                                        {open ? 'Open now' : 'Closed now'}
                                    </span>
                                </div>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    {b.address}, {b.city}
                                </p>
                                <dl className="mt-4 space-y-1 text-sm">
                                    {Object.entries(b.hours ?? {}).map(([days, time]) => (
                                        <div key={days} className="numerals flex justify-between border-b border-border py-1.5">
                                            <dt className="text-muted-foreground">{days}</dt>
                                            <dd>{time}</dd>
                                        </div>
                                    ))}
                                </dl>
                                <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium">
                                    <Link href={book({ query: { branch: b.id } }).url} className="text-plum hover:text-violet">
                                        Book at {b.name}
                                    </Link>
                                    {b.phone && (
                                        <a href={`tel:${b.phone.replace(/\s/g, '')}`} className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-ink">
                                            <Phone className="size-3.5" /> {b.phone}
                                        </a>
                                    )}
                                </div>
                            </article>
                        );
                    })}
                </div>
            </section>

            {/* FAQ */}
            <section id="faq" className="scroll-mt-20 border-t border-border px-4 py-20 sm:px-8 lg:px-12 lg:py-28">
                <div className="grid gap-10 lg:grid-cols-12">
                    <h2 data-reveal className="text-4xl sm:text-5xl lg:col-span-4">Questions, answered plainly</h2>
                    <div className="divide-y divide-border border-y border-border lg:col-span-8">
                        {faqs.map((f) => (
                            <FaqItem key={f.id} faq={f} />
                        ))}
                    </div>
                </div>
            </section>

            <EnquiryBand treatments={bookable} />
        </>
    );
}

function FaqItem({ faq }: { faq: Faq }) {
    const [open, setOpen] = useState(false);

    return (
        <div>
            <h3>
                <button
                    type="button"
                    aria-expanded={open}
                    onClick={() => setOpen(!open)}
                    className="flex w-full items-center justify-between gap-6 py-6 text-left text-lg font-semibold hover:text-plum"
                >
                    {faq.question}
                    {open ? <Minus className="size-5 shrink-0 text-plum" /> : <Plus className="size-5 shrink-0 text-plum" />}
                </button>
            </h3>
            <div className={cn('grid transition-[grid-template-rows] duration-200 ease-out', open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}>
                <p className="max-w-2xl overflow-hidden pb-0 text-muted-foreground" style={{ paddingBottom: open ? '1.5rem' : 0 }}>
                    {faq.answer}
                </p>
            </div>
        </div>
    );
}

function EnquiryBand({ treatments }: { treatments: Treatment[] }) {
    const form = useForm({ form: 'enquiry', first_name: '', phone: '', email: '', treatment_id: '', message: '', privacy_consent: false });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        form.post(leads.store().url, { preserveScroll: true, onSuccess: () => form.reset() });
    };

    const field = 'h-12 w-full border border-white/20 bg-white/5 px-4 text-white placeholder:text-white/40 focus:border-gold focus:outline-none';

    return (
        <section id="enquire" className="on-dark scroll-mt-20 bg-plum text-white">
            <div className="grid gap-12 px-4 py-20 sm:px-8 lg:grid-cols-12 lg:px-12 lg:py-28">
                <div className="lg:col-span-5">
                    <h2 className="text-4xl sm:text-5xl">Not sure where to start?</h2>
                    <p className="mt-5 max-w-md text-lg text-lilac">
                        Tell us what you would like to change. A patient coordinator will reply within one business day with a suggested first step.
                    </p>
                    <Link href={book().url} className="press mt-8 inline-flex h-12 items-center gap-2 bg-gold px-6 font-medium text-ink hover:bg-white">
                        Or book a consultation now <ArrowRight className="size-4" />
                    </Link>
                </div>

                <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2 lg:col-span-7" noValidate>
                    <div>
                        <label htmlFor="enq-name" className="text-sm text-lilac">First name</label>
                        <input id="enq-name" autoComplete="given-name" value={form.data.first_name} onChange={(e) => form.setData('first_name', e.target.value)} className={cn(field, 'mt-1.5')} />
                        {form.errors.first_name && <p role="alert" className="mt-1 text-xs text-gold">{form.errors.first_name}</p>}
                    </div>
                    <div>
                        <label htmlFor="enq-phone" className="text-sm text-lilac">Mobile number</label>
                        <input id="enq-phone" type="tel" autoComplete="tel" value={form.data.phone} onChange={(e) => form.setData('phone', e.target.value)} className={cn(field, 'mt-1.5')} placeholder="0917 123 4567" />
                    </div>
                    <div>
                        <label htmlFor="enq-email" className="text-sm text-lilac">Email <span className="text-lilac/60">(optional)</span></label>
                        <input id="enq-email" type="email" autoComplete="email" value={form.data.email} onChange={(e) => form.setData('email', e.target.value)} className={cn(field, 'mt-1.5')} />
                        {form.errors.email && <p role="alert" className="mt-1 text-xs text-gold">{form.errors.email}</p>}
                    </div>
                    <div>
                        <label htmlFor="enq-treatment" className="text-sm text-lilac">Interested in</label>
                        <select id="enq-treatment" value={form.data.treatment_id} onChange={(e) => form.setData('treatment_id', e.target.value)} className={cn(field, 'mt-1.5 cursor-pointer [&>option]:text-ink')}>
                            <option value="">Not sure yet</option>
                            {treatments.map((t) => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="sm:col-span-2">
                        <label htmlFor="enq-message" className="text-sm text-lilac">What would you like help with?</label>
                        <textarea id="enq-message" rows={4} value={form.data.message} onChange={(e) => form.setData('message', e.target.value)} className={cn(field, 'mt-1.5 h-auto py-3')} />
                    </div>
                    <label className="flex items-start gap-3 text-sm text-lilac sm:col-span-2">
                        <input type="checkbox" checked={form.data.privacy_consent} onChange={(e) => form.setData('privacy_consent', e.target.checked)} className="mt-1" />
                        <span>I agree that the clinic may contact me about my enquiry and process my details under its privacy notice.</span>
                    </label>
                    {form.errors.privacy_consent && <p role="alert" className="-mt-2 text-xs text-gold sm:col-span-2">{form.errors.privacy_consent}</p>}
                    <div className="sm:col-span-2">
                        <button type="submit" disabled={form.processing} className="press h-12 bg-white px-8 font-medium text-plum hover:bg-gold hover:text-ink disabled:opacity-50">
                            {form.processing ? 'Sending...' : 'Send enquiry'}
                        </button>
                    </div>
                </form>
            </div>
        </section>
    );
}
