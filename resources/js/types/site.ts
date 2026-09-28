export type Category = {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    image: string | null;
    treatments_count?: number;
    treatments?: Treatment[];
};

export type Treatment = {
    id: number;
    treatment_category_id?: number;
    name: string;
    slug: string;
    summary?: string;
    description?: string;
    duration_minutes: number;
    price: number;
    promo_price: number | null;
    image: string | null;
    recommended_sessions?: string | null;
    is_featured?: boolean;
    preparation?: string | null;
    aftercare?: string | null;
    contraindications?: string | null;
    category?: { id: number; name: string; slug?: string };
};

export type Specialist = {
    id: number;
    name: string;
    slug?: string;
    title: string;
    credentials?: string | null;
    bio?: string;
    photo: string | null;
    focus?: string[];
    branches?: string[];
    branch_ids?: number[];
};

export type Branch = {
    id: number;
    name: string;
    slug: string;
    address: string | null;
    city: string | null;
    phone?: string | null;
    email?: string | null;
    image?: string | null;
    hours?: Record<string, string> | null;
};

export type Testimonial = {
    id: number;
    author_name: string;
    author_meta: string | null;
    quote: string;
    rating: number;
};

export type Faq = { id: number; question: string; answer: string };
