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
    map_url?: string | null;
};

export type Testimonial = {
    id: number;
    author_name: string;
    author_meta: string | null;
    quote: string;
    rating: number;
};

export type Faq = { id: number; question: string; answer: string };

export type MembershipTier = {
    id: number;
    name: string;
    slug?: string;
    tagline: string;
    price_monthly: number;
    benefits: string[];
    note?: string | null;
    is_featured?: boolean;
};

export type Promotion = {
    id: number;
    title: string;
    slug: string;
    summary: string;
    description: string;
    details: string[] | null;
    badge: string | null;
    ends_on: string | null;
    image: string | null;
    treatment_id: number | null;
    treatment?: Pick<
        Treatment,
        'id' | 'name' | 'slug' | 'price' | 'promo_price'
    > | null;
};

export type Post = {
    id: number;
    title: string;
    slug: string;
    category: string;
    excerpt: string;
    image: string | null;
    author_name: string;
    read_minutes: number;
    published_at: string;
};

export type PostDetail = Post & {
    paragraphs: string[];
    takeaways: string[];
};

export type LegalSection = { heading: string; paragraphs: string[] };

export type LegalPage = {
    title: string;
    slug: string;
    summary: string | null;
    sections: LegalSection[];
    reviewed_on: string | null;
};

export type CompareCase = {
    id: number;
    name: string;
    slug: string;
    summary: string;
    image: string | null;
    category: string | null;
};
