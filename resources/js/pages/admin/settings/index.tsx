import { Head, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { dashboard } from '@/routes';
import settings from '@/routes/admin/settings/clinic';

type Social = {
    platform: string;
    label: string;
    base: string;
    handle: string | null;
};

type Props = {
    socials: Social[];
    chat_enabled: boolean;
    chat_greeting: string;
};

export default function ClinicSettings({
    socials,
    chat_enabled,
    chat_greeting,
}: Props) {
    const form = useForm({
        socials: Object.fromEntries(
            socials.map((s) => [s.platform, s.handle ?? '']),
        ),
        chat_enabled: chat_enabled ? 1 : 0,
        chat_greeting,
    });

    return (
        <>
            <Head title="Clinic settings" />
            <div className="flex flex-1 flex-col gap-8 px-4 py-6 md:px-8 md:py-8">
                <header>
                    <h1 className="font-display text-3xl md:text-4xl">
                        Clinic settings
                    </h1>
                    <p className="mt-2 max-w-2xl text-muted-foreground">
                        The things this clinic owns rather than the software.
                        Saved here, they survive the next deployment, which a
                        config file would not.
                    </p>
                </header>

                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        form.patch(settings.update().url, {
                            preserveScroll: true,
                        });
                    }}
                    className="space-y-10"
                >
                    <section className="max-w-2xl space-y-4">
                        <div>
                            <h2 className="font-display text-xl">
                                Social media
                            </h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                A handle or a full profile link, whichever is
                                easier to copy. Anything left blank is not shown
                                on the website at all.
                            </p>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            {socials.map((social) => (
                                <div
                                    key={social.platform}
                                    className="grid gap-1"
                                >
                                    <Label htmlFor={social.platform}>
                                        {social.label}
                                    </Label>
                                    <div className="flex items-center">
                                        <span className="shrink-0 border border-r-0 border-border bg-mist px-2 py-2 text-sm text-muted-foreground dark:bg-white/5">
                                            {social.base}
                                        </span>
                                        <Input
                                            id={social.platform}
                                            value={
                                                form.data.socials[
                                                    social.platform
                                                ] ?? ''
                                            }
                                            onChange={(e) =>
                                                form.setData('socials', {
                                                    ...form.data.socials,
                                                    [social.platform]:
                                                        e.target.value,
                                                })
                                            }
                                            placeholder="handle"
                                            className="rounded-none border-l-0"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                    <section className="max-w-2xl space-y-4">
                        <div>
                            <h2 className="font-display text-xl">Chat</h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Whether the website offers a chat window, and
                                how it greets a visitor.
                            </p>
                        </div>

                        <label className="flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={form.data.chat_enabled === 1}
                                onChange={(e) =>
                                    form.setData(
                                        'chat_enabled',
                                        e.target.checked ? 1 : 0,
                                    )
                                }
                            />
                            Show the chat window on the website
                        </label>

                        <div className="grid gap-1">
                            <Label htmlFor="chat_greeting">Greeting</Label>
                            <Input
                                id="chat_greeting"
                                value={form.data.chat_greeting}
                                onChange={(e) =>
                                    form.setData(
                                        'chat_greeting',
                                        e.target.value,
                                    )
                                }
                                maxLength={200}
                            />
                            {form.errors.chat_greeting && (
                                <p className="text-sm text-destructive">
                                    {form.errors.chat_greeting}
                                </p>
                            )}
                        </div>
                    </section>

                    <Button type="submit" disabled={form.processing}>
                        {form.processing ? (
                            <>
                                <Spinner /> Saving...
                            </>
                        ) : (
                            'Save settings'
                        )}
                    </Button>
                </form>
            </div>
        </>
    );
}

ClinicSettings.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Clinic settings', href: settings.index() },
    ],
};
