export type EmployeeRow = {
    id: number;
    name: string;
    employee_no: string;
    position: string;
    department: string;
    branch: string | null;
    employment_type: string;
    status: string;
    base_salary: number;
    hire_date: string;
};

export const personTone = (status: string): string =>
    ({
        active: 'border-plum/30 text-plum bg-lilac/60',
        on_leave: 'border-gold text-gold-deep bg-background',
        resigned:
            'border-border text-muted-foreground line-through bg-background',
        pending: 'border-gold text-gold-deep bg-background',
        approved: 'border-plum/30 text-plum bg-lilac/60',
        declined: 'border-destructive/40 text-destructive bg-background',
        cancelled: 'border-border text-muted-foreground bg-background',
        draft: 'border-border text-muted-foreground bg-background',
        paid: 'border-plum/30 text-plum bg-lilac/60',
    })[status] ?? 'border-border';

export type PayslipRow = {
    id: number;
    employee: string;
    position?: string;
    days_paid: number;
    basic: number;
    allowance?: number;
    commission: number;
    overtime: number;
    unpaid_deduction: number;
    gross: number;
    sss: number;
    philhealth: number;
    pagibig: number;
    withholding_tax: number;
    other_deductions: number;
    total_deductions?: number;
    net: number;
};

export const initials = (name: string): string =>
    name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('');
