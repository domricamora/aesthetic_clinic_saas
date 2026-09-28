# CLAUDE CODE MASTER BUILD PLAN

## Veloura Aesthetic Clinic

### AI-Ready Aesthetic Clinic Management, CRM, POS, ERP & Booking Platform

---

# 1. PROJECT VISION

Build a premium, modern, cloud-based **Aesthetic Clinic Management & Business Operations Platform** designed initially for clinics in the Philippines.

The platform must combine:

- Premium public marketing website
- Online appointment booking
- Patient/client portal
- CRM
- Lead management
- Patient management
- Electronic medical/clinical records
- Consultation management
- Treatment planning
- Before/after photography
- Treatment packages
- Memberships
- Loyalty
- POS
- Payments
- Inventory
- Product management
- Procurement
- Suppliers
- Expenses
- Accounting
- Payroll
- Employee management
- Scheduling
- Staff management
- Commission management
- Branch management
- Marketing automation
- SMS/email notifications
- Reports
- Analytics
- Dashboards
- AI-assisted business tools
- Multi-tenant SaaS architecture

The system must be designed so that a single clinic can use it initially, while the architecture can later support:

- Multiple branches
- Multiple clinics
- Franchise operations
- Multiple organizations
- SaaS subscriptions
- Per-module billing
- Enterprise accounts
- White-label deployments

---

# 2. DEVELOPMENT PRIORITY

Do NOT attempt to build every backend module before having something visually impressive.

The project should be developed in these phases:

## PHASE 1 — PREMIUM MARKETING WEBSITE

Build this first.

Purpose:

> Create a fully functional demonstration website that can be shown to potential clinic clients.

The marketing site should make the product appear to be an established premium healthcare technology platform.

It should contain:

- Home
- About
- Services
- Treatments
- Doctors / Specialists
- Clinic Locations
- Pricing / Packages
- Membership
- Before & After
- Promotions
- Blog
- FAQs
- Contact
- Book Appointment
- Patient Login
- Privacy Policy
- Terms
- Data Privacy Notice

The marketing website should already connect to the Laravel backend for:

- Contact forms
- Lead capture
- Appointment requests
- Booking
- Newsletter signup
- Promotion signup
- CRM lead creation

---

# 3. TEMPORARY BRAND

Use:

# Veloura Aesthetic Clinic

Tagline:

> Modern Beauty. Personalized Care.

Positioning:

> A premium aesthetic and wellness clinic powered by intelligent technology.

Important:

The brand is fictional/demo-only.

Create all branding in a configuration layer so the following can easily be changed:

- Clinic name
- Logo
- Colors
- Tagline
- Address
- Phone
- Email
- Social media
- Currency
- Timezone
- Business hours

Do not hard-code the brand throughout the application.

---

# 4. VISUAL DESIGN SYSTEM

The visual direction should communicate:

- Premium
- Medical
- Elegant
- Modern
- Trustworthy
- Calm
- Sophisticated
- High-end beauty
- Technology

Avoid the typical:

- Generic hospital blue
- Overly pink beauty-clinic aesthetic
- Excessive gradients
- Cheap-looking glassmorphism
- Template-like UI

## PRIMARY COLOR SYSTEM

Use a sophisticated neutral + botanical + champagne palette.

### Primary

Deep Forest / Emerald:

`#173B35`

Represents:

- Trust
- Wellness
- Nature
- Stability
- Premium healthcare

### Secondary

Warm Ivory:

`#F7F3EC`

### Accent

Champagne Gold:

`#C8A96B`

Use sparingly.

### Dark

`#18201E`

### Muted

`#68736F`

### Surface

`#FFFFFF`

### Soft Green

`#DDE9E2`

### Optional Blush Accent

`#E9D8D1`

Use only for subtle treatment/patient-facing areas.

The system should support light and dark UI modes for the administrative application.

---

# 5. COLOR THEORY

The design system should follow:

60/30/10 composition.

60%:

Ivory / white / neutral surfaces

30%:

Forest green / dark neutral

10%:

Champagne gold and subtle blush accents

Gold should communicate premium quality without becoming visually excessive.

Healthcare information should remain highly readable and accessible.

Do not use gold for critical alerts.

Use semantic colors:

Success:

- Green

Warning:

- Amber

Danger:

- Red

Information:

- Blue

---

# 6. HERO SECTION

The homepage hero should contain a premium 3D animation.

Use:

- Three.js
- React Three Fiber
- Drei

Possible concept:

A floating abstract 3D sculpture representing:

- Skin
- Beauty
- Wellness
- Precision
- Technology

Example:

A translucent organic skin-cell-inspired structure with subtle particles and champagne highlights floating over a deep forest background.

The animation must be:

- Lightweight
- GPU-aware
- Responsive
- Reduced-motion friendly
- Lazy-loaded
- Mobile optimized

Do not make the 3D animation interfere with the primary CTA.

Desktop:

3D object occupies approximately 40–50% of hero.

Mobile:

Simplify or replace the 3D experience with a lightweight animated visual.

Primary CTA:

> Book Your Consultation

Secondary CTA:

> Explore Treatments

---

# 7. WEBSITE ANIMATION SYSTEM

Use subtle premium animation throughout.

Preferred technologies:

- Framer Motion / Motion
- GSAP only where justified
- React Three Fiber for 3D
- Intersection Observer
- CSS transitions

Animations should include:

- Fade-up sections
- Staggered cards
- Image reveals
- Text reveal
- Number counters
- Parallax
- Hover interactions
- Floating elements
- Scroll-triggered transitions
- Treatment-card interactions
- Before/after slider
- Testimonial carousel

Avoid excessive animation.

Performance is more important than visual effects.

Respect:

`prefers-reduced-motion`.

---

# 8. HOMEPAGE STRUCTURE

Create a highly polished conversion-focused homepage.

## HERO

Headline:

> A More Intelligent Approach to Aesthetic Care.

Supporting text:

> Personalized aesthetic treatments, seamless appointments, and a modern patient experience — powered by intelligent clinic technology.

Buttons:

BOOK A CONSULTATION

EXPLORE TREATMENTS

3D visual.

---

## TRUST SECTION

Display:

- Licensed Professionals
- Personalized Treatment Plans
- Modern Technology
- Secure Patient Records
- Convenient Online Booking

---

# 9. TREATMENTS

Create treatment categories.

Examples:

## Facial Treatments

- Hydra Facial
- Chemical Peel
- Acne Treatment
- Skin Rejuvenation
- Carbon Laser Facial

## Injectables

- Botox
- Dermal Fillers
- Skin Boosters

## Body

- Body Contouring
- RF Body Treatment
- Fat Reduction
- Cellulite Treatment

## Hair

- Hair Restoration
- Scalp Treatments
- PRP

## Wellness

- IV Therapy
- Wellness Consultation
- Vitamin Treatments

All treatments must be database-driven.

Treatment fields:

- Name
- Slug
- Description
- Category
- Duration
- Price
- Promotional price
- Images
- Before/after images
- Contraindications
- Preparation instructions
- Aftercare instructions
- Recommended sessions
- Featured status
- Active status

---

# 10. ONLINE BOOKING

The public booking system should support:

1. Select service
2. Select branch
3. Select practitioner
4. Select date
5. Select available time
6. Enter patient information
7. Login/register or continue as guest
8. Confirm booking
9. Deposit/payment
10. Confirmation

Booking statuses:

- Pending
- Confirmed
- Checked In
- In Consultation
- In Treatment
- Completed
- Cancelled
- No Show
- Rescheduled

Prevent double booking using database-level transaction/locking logic.

---

# 11. APPOINTMENT ENGINE

Build a reusable scheduling engine.

Entities:

- Clinics
- Branches
- Rooms
- Treatment rooms
- Staff
- Doctors
- Therapists
- Services
- Schedules
- Breaks
- Holidays
- Leave
- Appointments
- Appointment statuses

Support:

- Working hours
- Staff availability
- Room availability
- Service duration
- Buffer time
- Multiple practitioners
- Multiple rooms
- Holidays
- Blocked times
- Recurring schedules

---

# 12. PATIENT PORTAL

Patient dashboard:

- Upcoming appointments
- Appointment history
- Treatment history
- Treatment plans
- Medical/clinical information
- Consent forms
- Documents
- Invoices
- Payments
- Packages
- Membership
- Loyalty points
- Before/after photos
- Notifications
- Profile
- Privacy controls

Patients should be able to:

- Book
- Reschedule
- Cancel
- Pay
- Upload documents
- Complete forms
- Sign consent
- View treatment instructions

---

# 13. CRM

Create a full CRM.

## Lead sources

- Website
- Facebook
- Instagram
- TikTok
- Google
- Referral
- Walk-in
- Phone
- Email
- Campaign
- Partner

CRM pipeline:

NEW LEAD

→ CONTACTED

→ CONSULTATION BOOKED

→ CONSULTATION COMPLETED

→ TREATMENT RECOMMENDED

→ TREATMENT BOOKED

→ CUSTOMER

→ REPEAT CUSTOMER

→ VIP

---

# 14. CRM FEATURES

Lead profile:

- Name
- Contact information
- Source
- Campaign
- Interests
- Treatment interest
- Assigned staff
- Notes
- Tags
- Communication history
- Appointments
- Purchases
- Treatment history

CRM should support:

- Tasks
- Follow-ups
- Notes
- Calls
- Emails
- SMS
- Campaigns
- Automations
- Lead scoring
- Pipeline management

---

# 15. PATIENT / CRM SEPARATION

Do not treat every lead as a medical patient.

Separate:

`Lead`

from

`Customer`

from

`Patient`

A lead may eventually become a patient.

Medical information should only be accessible to authorized clinical personnel.

---

# 16. ELECTRONIC CLINICAL RECORD

Create a clinical record module.

Possible sections:

- Patient profile
- Medical history
- Allergies
- Medications
- Previous procedures
- Skin concerns
- Treatment history
- Consultation notes
- Clinical assessment
- Treatment plan
- Follow-up
- Clinical photos
- Consent
- Documents

The architecture must support future interoperability without hard-coding the system to one vendor.

Health information is sensitive personal information under Philippine privacy law, so clinical records must have stronger access controls than ordinary CRM information.

---

# 17. CONSENT MANAGEMENT

Create digital consent forms.

Examples:

- General treatment consent
- Photography consent
- Botox consent
- Filler consent
- Laser consent
- Chemical peel consent
- PRP consent
- Data privacy consent
- Marketing consent

Features:

- Versioning
- Digital signature
- Timestamp
- IP/device metadata where legally appropriate
- Staff witness
- Document storage
- Immutable audit trail

Never overwrite an old consent version.

---

# 18. BEFORE / AFTER MANAGEMENT

Create a secure clinical media system.

Each photo:

- Patient
- Treatment
- Date
- Practitioner
- Body area
- Before/after designation
- Visibility
- Consent reference

Public marketing usage requires separate explicit consent.

Clinical photos must not automatically become marketing material.

---

# 19. POS

Create a complete clinic POS.

POS should support:

- Services
- Products
- Packages
- Memberships
- Gift certificates
- Discounts
- Promotions
- Deposits
- Partial payments
- Refunds
- Receipts/invoices
- Multiple payment methods

Payment methods:

- Cash
- Card
- Bank transfer
- GCash
- Maya
- Online payment gateway
- Other configurable methods

Create a payment abstraction layer so payment providers can be swapped.

---

# 20. PHILIPPINE PAYMENT ARCHITECTURE

Create payment-provider interfaces.

Example:

```text
PaymentGatewayInterface
    ├── PayMongoGateway
    ├── GCashGateway
    ├── MayaGateway
    └── ManualPaymentGateway
```

Support:

- Payment intent
- Payment confirmation
- Webhooks
- Refund
- Failed payment
- Partial payment
- Deposit
- Payment reconciliation

Never trust payment status sent directly by the browser.

---

# 21. INVENTORY MANAGEMENT

Create complete inventory management.

Products:

- Retail products
- Medical consumables
- Injectables
- Skincare
- Equipment supplies
- Office supplies

Inventory concepts:

- SKU
- Barcode
- Batch
- Lot number
- Expiry
- Supplier
- Cost
- Selling price
- Tax
- Stock quantity
- Reorder level
- Location
- Branch

Inventory transactions:

- Purchase
- Receive
- Sale
- Treatment consumption
- Transfer
- Adjustment
- Return
- Damage
- Expired stock

---

# 22. EXPIRY MANAGEMENT

This is especially important for clinic inventory.

Dashboard alerts:

- Expiring in 30 days
- Expiring in 60 days
- Expired
- Low stock
- Out of stock

Use FEFO:

> First Expired, First Out

where appropriate.

---

# 23. PROCUREMENT

Build:

- Suppliers
- Purchase requisitions
- Purchase orders
- Goods received
- Supplier invoices
- Returns
- Supplier payments

Workflow:

REQUEST

→ APPROVAL

→ PURCHASE ORDER

→ RECEIVING

→ INVENTORY

→ SUPPLIER BILL

→ PAYMENT

---

# 24. ACCOUNTING

Create a modular accounting system.

Core:

- Chart of Accounts
- General Ledger
- Accounts Receivable
- Accounts Payable
- Cash
- Bank accounts
- Expenses
- Income
- Journal entries
- Trial balance
- Profit & Loss
- Balance Sheet
- Cash flow
- Tax reporting
- Financial periods

Every financial transaction should create auditable accounting entries.

Use double-entry accounting.

Do not build accounting as simple income/expense tables.

---

# 25. BIR / PHILIPPINE ACCOUNTING CONSIDERATIONS

The system should be designed to support Philippine tax and accounting workflows.

Include configurable:

- VAT
- Non-VAT
- Discounts
- Official invoice/receipt numbering
- Tax configuration
- Books of accounts
- Accounting periods
- BIR reporting exports
- POS/CAS integration architecture

BIR specifically has registration requirements involving computerized accounting systems and POS systems, so the commercial version should undergo Philippine accounting/tax compliance review before being represented as BIR-compliant.

Do not advertise the demo as "BIR compliant" until formally validated.

---

# 26. PAYROLL

Create payroll designed for Philippine businesses.

Employee records:

- Employee
- Position
- Department
- Branch
- Salary
- Pay schedule
- Employment status
- Allowances
- Commission
- Overtime
- Leave
- Deductions

Payroll calculations should be configurable for:

- SSS
- PhilHealth
- Pag-IBIG
- Withholding tax
- Loans
- Other deductions

Support:

- Monthly
- Semi-monthly
- Custom pay periods

Payroll workflow:

TIMEKEEPING

→ ATTENDANCE REVIEW

→ PAYROLL CALCULATION

→ APPROVAL

→ PAYSLIPS

→ PAYMENT

→ ACCOUNTING POSTING

Have Philippine payroll calculations reviewed by an accountant/payroll specialist before production use.

---

# 27. STAFF COMMISSION

This is particularly important for aesthetic clinics.

Commission rules should support:

- Percentage of treatment
- Percentage of product sale
- Fixed amount
- Tiered commission
- Package commission
- Individual service commission
- Team commission
- Referral commission

Example:

```text
Treatment Sale
      ↓
Commission Rule
      ↓
Practitioner Commission
      ↓
Payroll
      ↓
Accounting
```

---

# 28. EMPLOYEE MANAGEMENT

Modules:

- Employee profiles
- Attendance
- Time-in/out
- Schedules
- Leave
- Overtime
- Performance
- Commission
- Payroll
- Documents
- Training
- Certifications

---

# 29. MULTI-BRANCH

Build branch architecture from the beginning.

Example:

Organization

→ Branch

→ Rooms

→ Staff

→ Services

→ Inventory

→ POS

→ Appointments

→ Accounting

Users can have:

- Global access
- Organization access
- Branch access
- Department access

---

# 30. ROLE-BASED ACCESS CONTROL

Roles:

- Super Admin
- Organization Owner
- Clinic Administrator
- Branch Manager
- Doctor
- Nurse
- Aesthetician
- Therapist
- Receptionist
- Cashier
- Accountant
- HR Manager
- Inventory Manager
- Marketing Manager
- Patient

Use granular permissions rather than relying only on roles.

Examples:

```text
patients.view
patients.create
patients.edit
patients.delete

clinical_records.view
clinical_records.create
clinical_records.edit

financial_reports.view
payroll.process
inventory.adjust
pos.refund
```

Clinical access must be tightly restricted.

---

# 31. AUDIT LOGGING

Log sensitive actions:

- Login
- Logout
- Patient record access
- Clinical record changes
- Medical record exports
- Photo access
- Consent changes
- Financial transactions
- Refunds
- Inventory adjustments
- Payroll changes
- Permission changes
- User impersonation
- Data exports

Audit records should be append-only.

---

# 32. PHILIPPINE DATA PRIVACY

Treat privacy as a first-class architecture requirement.

The Philippine Data Privacy Act specifically identifies health information and health records as sensitive personal information.

Implement:

- Encryption at rest where appropriate
- TLS
- Secure sessions
- RBAC
- Permission policies
- Audit logs
- Data minimization
- Consent management
- Privacy notices
- Data retention configuration
- Secure backups
- Access monitoring
- Export controls
- Deletion/anonymization workflows where legally applicable

The DOH Health Privacy Code also addresses electronic archiving, authorized access, and medical-record retention.

Build configurable retention policies rather than hard-coding deletion.

---

# 33. NOTIFICATIONS

Create a notification abstraction layer.

Channels:

- Email
- SMS
- In-app
- Push
- WhatsApp-ready architecture

Events:

- Appointment booked
- Appointment confirmed
- Appointment reminder
- Appointment cancelled
- Appointment rescheduled
- Payment received
- Treatment follow-up
- Birthday
- Membership expiry
- Package expiry
- Low inventory
- Expiring inventory
- Payroll ready
- Lead follow-up

---

# 34. AUTOMATION ENGINE

Create a generic automation engine.

Example:

```text
TRIGGER
   ↓
CONDITION
   ↓
ACTION
```

Example:

```text
Appointment Completed
        ↓
Wait 2 Days
        ↓
Send Aftercare Email
        ↓
Wait 14 Days
        ↓
Create Follow-up Task
```

Actions:

- Send email
- Send SMS
- Create task
- Add tag
- Move CRM stage
- Create appointment reminder
- Notify staff
- Create discount
- Create follow-up

Design the system so n8n can later integrate with it.

---

# 35. MARKETING AUTOMATION

Create:

- Campaigns
- Segments
- Email templates
- SMS templates
- Promotions
- Coupons
- Referral campaigns
- Abandoned booking recovery
- Lead nurturing
- Reactivation campaigns

Example:

```text
Lead submits consultation form
        ↓
CRM Lead
        ↓
Lead Score
        ↓
Sales Pipeline
        ↓
Automated Follow-up
        ↓
Booking
        ↓
Treatment
        ↓
Post-treatment follow-up
        ↓
Review request
        ↓
Retention campaign
```

---

# 36. MEMBERSHIP

Create subscription/membership functionality.

Examples:

### Glow Membership

- Monthly facial
- Member pricing
- Birthday benefit
- Priority booking

### Premium Membership

- Monthly treatment allowance
- Product discounts
- Priority appointment
- Exclusive promotions

Track:

- Membership
- Billing
- Renewal
- Benefits
- Usage
- Expiry
- Cancellation

---

# 37. PACKAGES

Examples:

```text
Acne Transformation Package

6 Facial Treatments
2 Chemical Peels
1 Consultation
```

Track package:

- Purchased
- Remaining sessions
- Used sessions
- Expiry
- Assigned patient
- Transfer rules

---

# 38. LOYALTY

Create points system.

Earn points from:

- Treatments
- Product purchases
- Referrals
- Reviews
- Birthday
- Campaigns

Redeem points for:

- Discounts
- Treatments
- Products
- Vouchers

---

# 39. REVIEWS

Create review management.

After completed appointment:

```text
Appointment Complete
        ↓
Delay
        ↓
Review Request
        ↓
Rating
        ↓
CRM
```

Public reviews require patient permission before publishing identifying information.

---

# 40. ANALYTICS DASHBOARD

Dashboard widgets:

### Revenue

- Today
- This week
- This month
- YTD

### Appointments

- Today
- Upcoming
- Cancelled
- No-shows

### CRM

- New leads
- Conversion
- Consultation conversion
- Treatment conversion

### Patients

- New patients
- Returning patients
- VIP

### Inventory

- Low stock
- Expiring
- Inventory value

### Staff

- Attendance
- Utilization
- Revenue
- Commission

### Financial

- Revenue
- Expenses
- Gross profit
- Net income
- AR
- AP

---

# 41. AI FEATURES

Design an AI layer but do NOT allow AI to autonomously make medical decisions.

Possible AI functionality:

### AI CRM Assistant

- Summarize patient communications
- Summarize lead history
- Suggest follow-up tasks

### AI Marketing Assistant

- Campaign ideas
- Email drafts
- Social content
- Promotion copy

### AI Business Assistant

Ask:

> "What were our top treatments this month?"

> "Which services have declining sales?"

> "Which products are close to expiry?"

> "How many consultations converted this week?"

### AI Administrative Assistant

- Summarize appointments
- Generate reports
- Create follow-up task suggestions

Medical AI must remain assistive and subject to clinician review.

---

# 42. REPORTING

Reports:

## Sales

- Daily sales
- Monthly sales
- Service sales
- Product sales
- Practitioner sales
- Branch sales

## Clinical

- Treatment volume
- Patient demographics
- Treatment history
- Follow-ups

## CRM

- Lead source
- Conversion
- Campaign performance

## Inventory

- Stock movement
- Inventory valuation
- Expiry
- Purchase history

## Accounting

- P&L
- Balance sheet
- Cash flow
- AR
- AP

## Payroll

- Payroll register
- Employee compensation
- Commission
- Government deductions

All reports must support:

- Date range
- Branch
- Export PDF
- Export Excel/CSV

---

# 43. TECHNICAL ARCHITECTURE

Use:

```text
Laravel 13
PHP 8.3+
React
TypeScript
Inertia
Tailwind CSS 4
Vite
shadcn/ui
PostgreSQL or MySQL
Redis
Laravel Queue
Laravel Scheduler
WebSockets
Three.js
React Three Fiber
Motion
```

Laravel's current architecture is particularly suitable for AI-assisted development because of its predictable conventions, dependency injection, queues, testing and scalable infrastructure.

---

# 44. FRONTEND ARCHITECTURE

Use:

```text
resources/js/

components/
components/ui/
components/forms/
components/charts/
components/tables/
components/booking/
components/clinical/
components/crm/
components/pos/

layouts/
pages/
hooks/
lib/
types/
services/
```

Use TypeScript everywhere.

Avoid JavaScript unless there is a compelling reason.

---

# 45. DESIGN SYSTEM

Build reusable components first.

Components:

- Button
- Input
- Select
- Date picker
- Calendar
- Modal
- Drawer
- Dialog
- Tabs
- Badge
- Card
- Data table
- Command palette
- Toast
- Dropdown
- Tooltip
- Avatar
- Timeline
- Charts
- File uploader
- Image viewer
- Signature pad
- Appointment calendar
- Patient timeline

Use shadcn/ui as the foundation but customize it heavily for the clinic brand.

---

# 46. DATABASE ARCHITECTURE

Core entities:

```text
organizations
branches
users
roles
permissions
employees
patients
leads
doctors
practitioners
services
service_categories
treatments
treatment_plans
appointments
appointment_statuses
rooms
schedules
availability
medical_records
clinical_notes
medical_history
allergies
medications
consents
consent_versions
patient_documents
patient_photos
products
product_categories
inventory
inventory_transactions
suppliers
purchase_orders
purchase_order_items
goods_receipts
sales
sale_items
payments
refunds
packages
package_items
package_usages
memberships
membership_transactions
loyalty_accounts
loyalty_transactions
expenses
accounts
journal_entries
journal_entry_lines
employees
attendance
leave
payroll
payroll_items
commissions
crm_pipelines
crm_stages
crm_activities
campaigns
notifications
automation_workflows
audit_logs
```

Use UUID/ULID identifiers where appropriate.

---

# 47. DATABASE PRINCIPLES

Use:

- Foreign keys
- Proper indexes
- Unique constraints
- Transactions
- Soft deletes only where appropriate
- Audit history
- Immutable financial records
- Immutable clinical history where required
- Database constraints
- Optimistic locking where useful

Never rely exclusively on frontend validation.

---

# 48. API ARCHITECTURE

Even though the first application can use Inertia, design service boundaries so APIs can later support:

- Mobile app
- Patient app
- Third-party integrations
- Kiosks
- External booking
- AI services

Use:

```text
REST API
Webhooks
Events
Service classes
DTOs
Policies
Jobs
Actions
```

---

# 49. SECURITY

Implement:

- Laravel authentication
- MFA-ready architecture
- Passkey-ready architecture
- RBAC
- Policies
- Rate limiting
- CSRF
- XSS protection
- SQL injection protection
- File validation
- Secure uploads
- Signed URLs
- Secure password reset
- Session management
- Login throttling
- Audit logging
- Encryption for sensitive values
- Backup strategy

Never expose sensitive patient data through public URLs.

---

# 50. FILE STORAGE

Use private storage for:

- Medical records
- Patient photos
- Consent documents
- Payroll documents
- Employee documents

Public storage only for:

- Marketing images
- Website assets
- Public treatment images
- Public blog media

Use temporary signed URLs for private assets.

---

# 51. SEARCH

Implement global search.

Search:

- Patients
- Leads
- Appointments
- Treatments
- Products
- Employees
- Transactions

Use database full-text search initially.

Keep architecture compatible with:

- Meilisearch
- Typesense
- Elasticsearch/OpenSearch

---

# 52. REAL-TIME FEATURES

Use WebSockets/realtime events for:

- Appointment updates
- POS
- Notifications
- Staff dashboards
- Queue management
- Patient check-in
- Inventory alerts

---

# 53. PATIENT CHECK-IN

Build reception workflow:

```text
Patient arrives
      ↓
Search appointment
      ↓
Check in
      ↓
Queue
      ↓
Consultation
      ↓
Treatment
      ↓
Payment
      ↓
Aftercare
      ↓
Follow-up
```

Display queue status on staff dashboard.

---

# 54. CLINIC WORKFLOW

Example complete workflow:

```text
Website Visitor
       ↓
Lead
       ↓
Consultation Booking
       ↓
Appointment
       ↓
Check-in
       ↓
Patient Registration
       ↓
Medical History
       ↓
Consent
       ↓
Consultation
       ↓
Treatment Plan
       ↓
Treatment
       ↓
POS
       ↓
Payment
       ↓
Inventory Consumption
       ↓
Accounting Entry
       ↓
Commission
       ↓
Aftercare
       ↓
Follow-up
       ↓
Review
       ↓
Retention Campaign
```

This workflow should be one of the main architectural principles of the application.

---

# 55. MARKETING SITE → CRM CONNECTION

Every meaningful conversion should create a CRM event.

Examples:

```text
Contact form
Booking request
Treatment inquiry
Download
Membership inquiry
Promotion signup
Newsletter
```

Store:

- UTM source
- UTM medium
- UTM campaign
- Landing page
- Referrer
- Device
- Timestamp

This will make marketing ROI measurable.

---

# 56. SEO

Marketing website must implement:

- Semantic HTML
- Meta titles
- Meta descriptions
- Canonical URLs
- Open Graph
- Twitter/X metadata
- Schema.org
- LocalBusiness schema
- MedicalBusiness where appropriate
- Service schema
- FAQ schema
- Breadcrumb schema
- XML sitemap
- Robots.txt
- Image optimization
- WebP/AVIF
- Lazy loading
- Internal linking

Do not make unsupported medical claims.

---

# 57. PERFORMANCE

Target:

- Excellent Lighthouse scores
- LCP under approximately 2.5 seconds
- Minimal CLS
- Fast TTFB
- Optimized images
- Lazy-loaded 3D
- Code splitting
- Route-level loading
- CDN
- Redis caching
- Database indexes

The 3D hero must never be allowed to destroy Core Web Vitals.

---

# 58. ADMIN APPLICATION DESIGN

The admin interface should feel like a premium modern SaaS.

Navigation:

```text
Dashboard

CRM
  Leads
  Customers
  Pipeline
  Campaigns

Patients
  Patient List
  Clinical Records
  Treatment Plans
  Documents
  Photos
  Consents

Appointments
  Calendar
  Today
  Waiting Queue
  Availability

Treatments
  Services
  Categories
  Packages
  Memberships

POS
  Sales
  Payments
  Refunds
  Registers

Inventory
  Products
  Stock
  Suppliers
  Purchases
  Expiry

Accounting
  Dashboard
  Accounts
  Transactions
  Expenses
  Reports

Payroll
  Employees
  Attendance
  Leave
  Payroll
  Commissions

Marketing
  Campaigns
  Promotions
  Reviews

Reports

Settings
```

---

# 59. COMMAND PALETTE

Implement a global command palette.

Example:

`Ctrl + K`

Search:

> Find patient

> New appointment

> New sale

> Create lead

> Search product

> Open today's appointments

This should make the system feel like modern enterprise software.

---

# 60. MOBILE RESPONSIVENESS

The public website must be mobile-first.

The admin system should be:

- Desktop optimized
- Tablet compatible
- Mobile usable

Reception staff should be able to use the system from tablets.

---

# 61. TESTING

Claude Code must write tests as part of development.

Use:

### Backend

- PHPUnit / Pest
- Feature tests
- Unit tests
- Database tests
- Authorization tests

### Frontend

- Vitest
- React Testing Library

### Browser

- Playwright

Test:

- Booking
- Authentication
- Permissions
- POS
- Inventory
- Payroll
- Accounting
- Patient access
- Consent
- File uploads
- Payment webhooks

---

# 62. CI/CD

Set up:

- GitHub Actions
- Automated tests
- Static analysis
- Code formatting
- Dependency auditing
- Build verification

Pipeline:

```text
Push
 ↓
Lint
 ↓
Type check
 ↓
PHP tests
 ↓
Frontend tests
 ↓
Build
 ↓
Security checks
 ↓
Deploy
```

---

# 63. CODE QUALITY

Use:

- Laravel Pint
- PHPStan/Larastan
- ESLint
- Prettier
- TypeScript strict mode

No:

- giant controllers
- duplicated business logic
- inline SQL unless justified
- hard-coded business rules
- hard-coded clinic configuration

Prefer:

```text
Actions
Services
DTOs
Policies
Jobs
Events
Listeners
Repositories only when actually useful
```

---

# 64. CLAUDE CODE WORKFLOW

Claude Code must work incrementally.

Before implementing:

1. Inspect repository.
2. Inspect existing architecture.
3. Inspect package versions.
4. Inspect existing Claude instructions.
5. Inspect existing `CLAUDE.md`.
6. Inspect `ai.md` if present.
7. Inspect project skills.
8. Inspect Git configuration.
9. Create implementation plan.
10. Confirm architecture against existing project conventions.

Do not blindly overwrite existing conventions.

---

# 65. CLAUDE CODE INSTRUCTIONS

Create:

```text
CLAUDE.md
```

and:

```text
ai.md
```

The files should instruct Claude to:

- Think before coding
- Inspect before changing
- Follow existing conventions
- Reuse existing components
- Avoid unnecessary dependencies
- Prefer maintainable solutions
- Write tests
- Run tests after changes
- Validate migrations
- Validate TypeScript
- Validate production builds
- Never expose secrets
- Never commit `.env`
- Never fabricate credentials
- Never claim compliance without verification
- Document architectural decisions
- Keep modules loosely coupled
- Use current stable package versions
- Check official documentation when APIs change
- Perform security review on sensitive functionality
- Keep healthcare data protected
- Never make autonomous medical decisions
- Require human approval for clinical workflows
- Never delete production data during development

---

# 66. AI AGENT DEVELOPMENT RULE

For every feature:

```text
RESEARCH
↓
PLAN
↓
DATABASE
↓
BACKEND
↓
TEST
↓
FRONTEND
↓
TEST
↓
INTEGRATION
↓
SECURITY REVIEW
↓
PERFORMANCE REVIEW
↓
DOCUMENTATION
```

Do not implement massive features in a single uncontrolled generation.

---

# 67. GIT STRATEGY

Use feature branches.

Example:

```text
main
develop

feature/marketing-site
feature/booking
feature/crm
feature/patients
feature/pos
feature/inventory
feature/accounting
feature/payroll
```

Commit messages:

```text
feat:
fix:
refactor:
test:
docs:
security:
performance:
```

---

# 68. INITIAL PHASE — MARKETING SITE ONLY

The first milestone must NOT attempt to finish the entire ERP.

Build:

### Public

- Home
- Treatments
- Services
- About
- Specialists
- Packages
- Membership
- Before/After
- Blog
- Contact
- Booking
- Login

### Backend

- CMS
- Services
- Treatments
- Specialists
- Testimonials
- Promotions
- Blog
- Leads
- Booking
- Contact submissions

### Admin

- Dashboard
- Leads
- Appointments
- Services
- Content
- Media
- Settings

This creates a genuinely functional sales/demo system.

---

# 69. DEMO DATA

Populate the demo with fictional data.

Example:

Clinic:

> Veloura Aesthetic Clinic

Branches:

> Makati

> BGC

> Cebu

Use fictional addresses.

Practitioners:

- Dr. Sofia Reyes
- Dr. Adrian Santos
- Dr. Maya Navarro

Use fictional profiles and clearly treat them as demo content.

Do not use real patients.

---

# 70. DEMO DASHBOARD

Make the admin dashboard immediately impressive.

Show:

```text
₱428,650
Monthly Revenue

128
Appointments

42
New Patients

67%
Consultation Conversion

₱86,400
Product Sales

12
Low Stock Alerts
```

Charts:

- Revenue
- Appointments
- Treatment popularity
- Lead funnel
- Revenue by branch
- Practitioner performance

All data should come from seeded database records rather than hard-coded HTML.

---

# 71. DEMO BOOKING

A visitor should be able to:

1. Visit website
2. Choose treatment
3. Choose practitioner
4. Choose branch
5. Choose date
6. Select time
7. Enter details
8. Receive confirmation

The appointment should appear immediately inside the admin dashboard.

This is essential for the sales demonstration.

---

# 72. DEMO CRM

A website booking should automatically create:

```text
Lead
+
Patient Prospect
+
Appointment
+
CRM Activity
```

The receptionist should see the new lead immediately.

---

# 73. DEMO POS

Allow admin to create a sale using:

```text
Hydra Facial
₱3,500

Skin Booster
₱8,500

Skincare Product
₱2,500
```

Payment:

```text
Cash
GCash
Card
```

The transaction should affect:

- Revenue
- Inventory
- Patient history
- Accounting
- Staff commission

---

# 74. DEMO INVENTORY

Seed products with:

- SKU
- Cost
- Retail price
- Stock
- Reorder level
- Expiry
- Supplier

Demonstrate:

```text
Sale
 ↓
Inventory decreases
 ↓
Low-stock alert
```

---

# 75. DEMO ACCOUNTING

When a sale occurs:

```text
Debit Cash/Receivable
Credit Revenue
```

For product sales:

```text
Debit COGS
Credit Inventory
```

The accounting system should eventually support proper double-entry transactions throughout the platform.

---

# 76. DEMO PAYROLL

Create sample employees.

Show:

- Basic salary
- Attendance
- Allowances
- Commission
- Deductions
- Net pay

Generate a sample payslip.

---

# 77. SAAS ARCHITECTURE

Even if Phase 1 is single-clinic, use:

```text
organization_id
```

on tenant-owned data.

Future structure:

```text
SaaS Platform
   ↓
Organization
   ↓
Branches
   ↓
Departments
   ↓
Users
```

This prevents an expensive rewrite later.

---

# 78. MODULE BILLING

Prepare architecture for subscription billing.

Potential modules:

```text
Core
Booking
CRM
Patient Records
POS
Inventory
Accounting
Payroll
Marketing
Membership
Analytics
AI
Multi-Branch
```

Each can eventually have:

- Enabled
- Disabled
- Trial
- Subscription
- Usage limit

---

# 79. FEATURE FLAGS

Implement feature flags from the beginning.

Example:

```text
crm.enabled
booking.enabled
pos.enabled
inventory.enabled
accounting.enabled
payroll.enabled
ai.enabled
multi_branch.enabled
```

This will make the eventual SaaS product much easier to sell in different packages.

---

# 80. OBSERVABILITY

Prepare:

- Application logs
- Error tracking
- Queue monitoring
- Performance monitoring
- Database monitoring
- Audit logs
- Security alerts

Never log:

- Passwords
- Payment credentials
- Sensitive medical information
- Authentication tokens

---

# 81. BACKUPS

Production architecture should eventually include:

- Automated database backups
- Encrypted backups
- File backups
- Backup retention
- Restore testing
- Disaster recovery plan

A backup that has never been restored should not be considered fully validated.

---

# 82. DEPLOYMENT

Initial deployment should support common PHP hosting while keeping the architecture ready for VPS/cloud deployment.

Recommended production architecture:

```text
Cloudflare
     ↓
Load Balancer / Web
     ↓
Laravel
     ↓
Redis
     ↓
Database
     ↓
Object Storage
```

For early demos, simpler hosting is acceptable.

---

# 83. SEO + MARKETING CONTENT

Generate realistic fictional content for:

- Homepage
- Treatments
- Services
- Clinic
- Specialists
- FAQs
- Blog

Content should sound like a premium Philippine aesthetic clinic.

Avoid:

- Guaranteed results
- Unrealistic medical claims
- "100% safe"
- "Permanent results"
- Unsupported superiority claims

---

# 84. LEAD-GENERATION FEATURES

Include:

### Consultation CTA

> Book a Consultation

### Lead Magnet

> Discover Your Personalized Skin Plan

### Promotion

> Get Your First Consultation Package

### Exit intent

Use carefully.

### Sticky mobile CTA

> Book Now

### Messenger/social CTA

Future integration-ready.

---

# 85. MARKETING SITE UX

Homepage flow:

```text
Hero
 ↓
Trust
 ↓
Featured Treatments
 ↓
Why Veloura
 ↓
Interactive Before/After
 ↓
Specialists
 ↓
Technology
 ↓
Membership
 ↓
Testimonials
 ↓
Clinic Locations
 ↓
FAQ
 ↓
CTA
 ↓
Footer
```

---

# 86. ACCESSIBILITY

Implement:

- WCAG-conscious contrast
- Keyboard navigation
- Focus states
- Semantic HTML
- ARIA where necessary
- Accessible forms
- Screen-reader labels
- Reduced-motion support

---

# 87. RESPONSIVE BREAKPOINTS

Design intentionally for:

- Mobile
- Tablet
- Laptop
- Desktop
- Large desktop

Do not simply shrink the desktop layout.

---

# 88. FINAL MARKETING DEMO STANDARD

Before declaring Phase 1 complete, Claude must verify:

```text
✓ Homepage
✓ 3D hero
✓ Responsive layout
✓ Animations
✓ Services
✓ Treatments
✓ Booking
✓ Contact
✓ CRM lead creation
✓ Admin login
✓ Admin dashboard
✓ Appointment calendar
✓ Service management
✓ Content management
✓ Demo data
✓ SEO metadata
✓ Sitemap
✓ Structured data
✓ Mobile
✓ Accessibility
✓ Performance
✓ Security
✓ Tests
✓ Production build
```

---

# 89. PHASE 2

After the marketing/demo site is approved:

Build:

- Authentication
- Patients
- CRM
- Appointments
- Scheduling
- Patient portal
- Clinical records
- Consent
- Documents
- Treatment plans

---

# 90. PHASE 3

Build:

- POS
- Payments
- Packages
- Membership
- Loyalty
- Inventory
- Suppliers
- Purchasing
- Stock management

---

# 91. PHASE 4

Build:

- Accounting
- Expenses
- General ledger
- AR/AP
- Financial reports
- Payroll
- Attendance
- Leave
- Commission

---

# 92. PHASE 5

Build:

- Marketing automation
- Campaigns
- SMS/email
- Reviews
- Referral
- Analytics
- AI assistant

---

# 93. PHASE 6

Build:

- Multi-branch
- SaaS subscriptions
- Module billing
- Organization management
- White labeling
- Enterprise controls

---

# 94. PHASE 7

Build integrations:

- PayMongo
- Maya
- GCash/payment providers where technically available
- Email provider
- SMS provider
- Google Calendar
- Facebook/Instagram lead sources
- n8n
- Accounting exports
- Future health-data interoperability

PhilHealth's National Health Data Repository framework is relevant to future interoperability planning, so the data model should avoid making external health-data integration impossible later.

---

# 95. IMPORTANT CLINICAL SAFETY RULE

The platform is an administrative and clinical-record system.

It must NOT autonomously:

- Diagnose patients
- Prescribe medication
- Determine treatment suitability
- Override clinician decisions
- Generate medical decisions without human review

AI can assist with administration and information organization, but clinical decisions remain with qualified healthcare professionals.

---

# 96. DEFINITION OF DONE

A feature is not complete merely because the UI exists.

A feature is complete only when:

```text
Database
+
Backend
+
Authorization
+
Validation
+
Frontend
+
Loading states
+
Error handling
+
Empty states
+
Tests
+
Audit logging where required
+
Security review
+
Responsive UI
+
Documentation
```

are complete.

---

# 97. CLAUDE CODE OPERATING PRINCIPLE

Claude should behave as:

> Senior Laravel Architect + Senior React Engineer + Product Designer + QA Engineer + DevOps Engineer + Security Engineer + Healthcare Systems Analyst

rather than simply generating code.

For every significant architectural decision:

1. Explain the problem.
2. Identify options.
3. Choose the maintainable approach.
4. Implement.
5. Test.
6. Document.

Do not sacrifice architecture for speed.

---

# 98. FIRST CLAUDE CODE TASK

The first Claude Code task should be:

> Inspect the existing repository and environment. Read all existing Claude Code instructions, project skills, AI instructions, package manifests, environment configuration, Git history, and project structure. Do not modify anything yet.

Then generate:

```text
docs/
  architecture.md
  product-requirements.md
  design-system.md
  database-architecture.md
  security-model.md
  privacy-model.md
  implementation-roadmap.md
```

Also create/update:

```text
CLAUDE.md
ai.md
```

Only after this analysis should implementation begin.

---

# 99. FIRST IMPLEMENTATION TASK

Build ONLY:

```text
Marketing Website
+
CMS foundation
+
CRM lead capture
+
Services
+
Treatments
+
Booking foundation
+
Admin dashboard
```

Do not begin payroll/accounting/clinical modules until the marketing/demo product is polished.

The objective of Phase 1 is:

> "A potential aesthetic clinic owner should be able to see the product, book a fictional appointment, and immediately understand that this is a complete clinic operating platform."

---

# 100. SUCCESS CRITERIA

The final product should feel closer to a combination of:

```text
Premium aesthetic clinic website
        +
Modern CRM
        +
Clinic management system
        +
EMR/clinical workflow
        +
POS
        +
Inventory
        +
Accounting
        +
Payroll
        +
Marketing automation
        +
SaaS platform
```

than a traditional clinic website.

The architecture must allow all of these systems to communicate through a unified patient/customer/business data model while maintaining strict separation between marketing, CRM, clinical, financial, and administrative permissions.

The first deliverable is the **premium marketing/demo experience**, but every architectural decision should prepare the product for the complete clinic operating system that follows.

---

# END OF MASTER PLAN

## Initial milestone

**Veloura Aesthetic Clinic — Premium Marketing + Booking + CRM Demo**

After that milestone is visually polished and functional, continue into the clinic operating system modules without rebuilding the foundation.
