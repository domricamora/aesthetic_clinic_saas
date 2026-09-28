import type { Auth } from '@/types/auth';
import type { Clinic, Module } from '@/types/clinic';

declare module 'react' {
    interface InputHTMLAttributes<T> {
        passwordrules?: string;
    }
}

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            name: string;
            clinic: Clinic;
            modules: Record<Module, boolean>;
            // Fingerprint of the compiled assets, shown in the sidebar so a
            // screen that does not match the server can be identified at a glance.
            build: string;
            mediaUrl: string;
            flash: { success: string | null };
            auth: Auth;
            sidebarOpen: boolean;
            [key: string]: unknown;
        };
    }
}
