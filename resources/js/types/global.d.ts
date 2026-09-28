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
            mediaUrl: string;
            flash: { success: string | null };
            auth: Auth;
            sidebarOpen: boolean;
            [key: string]: unknown;
        };
    }
}
