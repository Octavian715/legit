# LeMarkt - B2B Marketplace Platform

## Application Blueprint & Technical Description

---

## 1. EXECUTIVE OVERVIEW

**LeMarkt** is a comprehensive B2B (Business-to-Business) e-commerce marketplace platform designed to connect suppliers and buyers in a seamless digital trading environment. The platform facilitates wholesale transactions, product discovery, order management, and business relationships between companies.

### Platform Identity

- **Name:** LeMarkt
- **Type:** B2B Marketplace
- **Target Users:** Suppliers (Manufacturers/Wholesalers) & Buyers (Retailers/Businesses)
- **Industry Focus:** Multi-category wholesale commerce

### Core Value Proposition

- Digital transformation of B2B trading
- Streamlined supplier-buyer connections
- Centralized order and inventory management
- Real-time communication between trading partners

---

## 2. TECHNOLOGY STACK

### Frontend

| Technology       | Version | Purpose                       |
| ---------------- | ------- | ----------------------------- |
| **Nuxt 3**       | 3.x     | Full-stack Vue meta-framework |
| **Vue 3**        | 3.x     | Reactive UI framework         |
| **TypeScript**   | 5.x     | Type-safe JavaScript          |
| **Pinia**        | Latest  | State management              |
| **Tailwind CSS** | 3.x     | Utility-first styling         |
| **Vue I18n**     | 9.x     | Internationalization          |

### Key Libraries

| Library              | Purpose                           |
| -------------------- | --------------------------------- |
| `@nuxt/image`        | Image optimization & lazy loading |
| `@vueuse/core`       | Vue composition utilities         |
| `chart.js`           | Data visualization                |
| `floating-vue`       | Tooltips & popovers               |
| `vue-toastification` | Toast notifications               |
| `vue-select`         | Enhanced select components        |
| `socket.io-client`   | Real-time communication           |
| `zod`                | Schema validation                 |

### Architecture Pattern

```
┌─────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                    │
│  Pages (Routes) → Components → Composables               │
└─────────────────────────┬───────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────┐
│                    BUSINESS LAYER                        │
│  Pinia Stores (State) → Services (API)                   │
└─────────────────────────┬───────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────┐
│                    DATA LAYER                            │
│  REST API → Backend Server → Database                    │
└─────────────────────────────────────────────────────────┘
```

---

## 3. USER ROLES & PERMISSIONS

### 3.1 Buyer (Retailer/Business)

**Description:** Businesses looking to purchase products wholesale

**Capabilities:**

- Browse and search product catalog
- View supplier profiles and ratings
- Add products to cart and place orders
- Manage delivery addresses
- Track order status and history
- Request quotes (RFQ)
- Chat with suppliers
- Manage company profile and team members
- View spending analytics and reports

### 3.2 Supplier (Manufacturer/Wholesaler)

**Description:** Businesses selling products to other businesses

**Capabilities:**

- All Buyer capabilities PLUS:
- Create and manage product listings
- Set pricing tiers and minimum order quantities
- Manage inventory and stock levels
- Process and fulfill orders
- Configure production capabilities
- Set export/shipping options
- Manage currencies and payment terms
- View sales analytics and dashboards
- Respond to quote requests

---

## 4. CORE FEATURES

### 4.1 Product Management

#### Product Catalog

- Multi-category product organization
- Advanced search with filters (price, category, location, ratings)
- Product variants (size, color, material)
- Bulk product import/export
- Product images with gallery support

#### Pricing System

- Tiered pricing based on quantity
- Currency support (multiple currencies)
- Price visibility controls
- Minimum order quantities (MOQ)
- Sample pricing options

### 4.2 Order Management

#### Order Workflow

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Draft   │ →  │ Pending  │ →  │ Approved │ →  │Processing│
└──────────┘    └──────────┘    └──────────┘    └──────────┘
                                                      │
┌──────────┐    ┌──────────┐    ┌──────────┐         │
│ Delivered│ ←  │ Shipped  │ ←  │  Ready   │ ←───────┘
└──────────┘    └──────────┘    └──────────┘
```

#### Order Features

- Shopping cart with multi-supplier support
- Order drafts and saved carts
- Order history and reordering
- Invoice generation
- Delivery tracking
- Order notes and attachments

### 4.3 Company Profiles

#### Profile Components

- Company information (name, registration, VAT)
- Business type classification
- Contact details and team members
- Bank account information
- Certificates and compliance documents
- Production capabilities (suppliers)
- Export details and shipping regions

#### Verification System

- Email verification
- Phone verification
- Document verification
- Business registration validation

### 4.4 Communication

#### Real-time Chat

- Direct messaging between buyers and suppliers
- Chat rooms for order discussions
- File sharing in conversations
- Read receipts and typing indicators
- Push notifications

#### Notifications

- Order status updates
- New message alerts
- Quote responses
- System announcements
- Email notifications

### 4.5 Analytics & Reporting

#### Buyer Dashboard

- Total spending overview
- Spending by category
- Spending by supplier
- Order history trends
- Favorite products/suppliers

#### Supplier Dashboard

- Sales overview
- Revenue by product/category
- Orders by country/region
- Customer analytics
- Inventory alerts

### 4.6 Search & Discovery

#### Search Features

- Full-text product search
- Category browsing
- Supplier directory
- Advanced filters:
    - Price range
    - Location/country
    - Minimum order quantity
    - Ratings
    - Certifications
    - Delivery options

### 4.7 Request for Quote (RFQ)

#### RFQ Workflow

1. Buyer submits quote request
2. Suppliers receive notification
3. Suppliers submit quotes
4. Buyer compares and accepts
5. Quote converts to order

---

## 5. APPLICATION STRUCTURE

### 5.1 Page Structure

```
/                           # Home/Landing
├── /auth
│   ├── /login              # User login
│   ├── /register           # New registration
│   ├── /forgot-password    # Password recovery
│   └── /verify-email       # Email verification
│
├── /marketplace            # Product catalog
│   └── /product/[id]       # Product details
│
├── /supplier
│   ├── /dashboard          # Supplier dashboard
│   ├── /orders             # Order management
│   ├── /products           # Product management
│   ├── /inventory          # Stock management
│   └── /analytics          # Sales analytics
│
├── /buyer
│   ├── /dashboard          # Buyer dashboard
│   ├── /orders             # Order history
│   ├── /favorites          # Saved products
│   └── /analytics          # Spending analytics
│
├── /cart                   # Shopping cart
├── /checkout               # Checkout flow
│
├── /profile/[id]           # Public company profile
│
├── /chat                   # Messaging center
│
├── /settings               # Account settings
│   ├── ?tab=company-profile
│   ├── ?tab=company-details
│   ├── ?tab=account-settings
│   ├── ?tab=delivery-address
│   ├── ?tab=bank-accounts
│   ├── ?tab=certificates
│   ├── ?tab=currencies      # Supplier only
│   ├── ?tab=production      # Supplier only
│   ├── ?tab=export          # Supplier only
│   ├── ?tab=notification-settings
│   └── ?tab=subscription
│
└── /register               # Multi-step registration
    ├── /company-details
    ├── /banks
    ├── /production         # Supplier only
    └── /verification
```

### 5.2 Component Architecture

```
components/
├── ui/                     # 50+ reusable UI components
│   ├── Button.vue
│   ├── Input.vue
│   ├── Select.vue
│   ├── Modal.vue
│   ├── Table/
│   ├── Pagination/
│   └── ...
│
├── features/               # Business feature components
│   └── ecommerce/
│       ├── products/       # Product-related
│       ├── orders/         # Order-related
│       ├── cart/           # Cart components
│       ├── settings/       # Settings tabs
│       └── dashboard/      # Dashboard widgets
│
├── layout/                 # Layout components
│   ├── AppHeader.vue
│   ├── AppFooter.vue
│   ├── AppSidebar.vue
│   └── AppNavigation.vue
│
├── shared/                 # Shared utilities
│   ├── charts/
│   ├── modals/
│   └── forms/
│
└── skeletons/              # Loading skeletons
```

### 5.3 State Management (Pinia Stores)

| Store                | Purpose                             |
| -------------------- | ----------------------------------- |
| `user.ts`            | User authentication & profile       |
| `cart.ts`            | Shopping cart state                 |
| `products.ts`        | Product catalog                     |
| `orders.ts`          | Order management                    |
| `ordersDashboard.ts` | Dashboard analytics                 |
| `chat.ts`            | Messaging state                     |
| `notifications.ts`   | Notification center                 |
| `favorites.ts`       | Saved products                      |
| `register.ts`        | Registration flow                   |
| `suppliers.ts`       | Supplier directory                  |
| `staticData.ts`      | Lookup data (countries, currencies) |

### 5.4 API Services

| Service            | Endpoints                        |
| ------------------ | -------------------------------- |
| `auth.ts`          | Login, register, verify, refresh |
| `products.ts`      | CRUD products, search, filters   |
| `orders.ts`        | Create, update, track orders     |
| `cart.ts`          | Cart operations                  |
| `user.ts`          | Profile management               |
| `chat.ts`          | Messaging operations             |
| `notifications.ts` | Notification management          |
| `dashboard.ts`     | Analytics data                   |
| `invoices.ts`      | Invoice generation               |

---

## 6. DATA MODELS

### 6.1 User Model

```typescript
interface User {
    id: number
    email: string
    role: 'buyer' | 'supplier'
    company_details: CompanyDetails
    bank_accounts: BankAccount[]
    contacts: Contact[]
    factory_details: FactoryDetails[] // Supplier only
    spoken_languages: Language[]
    interesting_categories: Category[]
    subscription: Subscription
    verified: boolean
    created_at: string
}
```

### 6.2 Product Model

```typescript
interface Product {
    id: number
    name: string
    description: string
    sku: string
    category: Category
    supplier: Supplier
    variants: ProductVariant[]
    images: ProductImage[]
    pricing: PricingTier[]
    moq: number // Minimum order quantity
    stock: number
    status: 'active' | 'draft' | 'archived'
    ratings: Rating[]
    created_at: string
}
```

### 6.3 Order Model

```typescript
interface Order {
    id: number
    order_number: string
    buyer: User
    supplier: User
    items: OrderItem[]
    status: OrderStatus
    subtotal: number
    tax: number
    shipping: number
    total: number
    currency: Currency
    delivery_address: Address
    notes: string
    created_at: string
    updated_at: string
}
```

---

## 7. KEY WORKFLOWS

### 7.1 Registration Flow

```
1. Email & Password → 2. Email Verification → 3. Company Details
→ 4. Bank Accounts → 5. Production (Supplier) → 6. Categories
→ 7. Profile Complete
```

### 7.2 Purchase Flow

```
1. Browse Products → 2. Add to Cart → 3. Review Cart
→ 4. Select Delivery → 5. Confirm Order → 6. Payment
→ 7. Order Confirmation → 8. Track Delivery
```

### 7.3 Supplier Onboarding

```
1. Register Account → 2. Verify Business → 3. Setup Profile
→ 4. Add Products → 5. Configure Pricing → 6. Go Live
```

---

## 8. INTERNATIONALIZATION

### Supported Languages

- English (en) - Default
- Romanian (ro)
- Russian (ru)

### Localization Features

- UI text translation
- Currency formatting
- Date/time formatting
- Number formatting
- RTL support ready

---

## 9. INTEGRATIONS

### Current Integrations

- **Socket.IO** - Real-time messaging
- **Image CDN** - Optimized image delivery
- **Email Service** - Transactional emails

### Planned Integrations

- Payment gateways
- Shipping carriers
- ERP systems
- Accounting software

---

## 10. SECURITY FEATURES

### Authentication

- JWT token-based authentication
- Refresh token rotation
- Session management
- Password requirements enforcement

### Authorization

- Role-based access control (RBAC)
- Route-level middleware protection
- API endpoint authorization

### Data Protection

- Input validation (Zod schemas)
- XSS prevention
- CSRF protection (needs implementation)

---

## 11. PERFORMANCE FEATURES

### Optimization Techniques

- Server-side rendering (SSR)
- Image lazy loading
- Component lazy loading
- API response caching
- Bundle code splitting

### Monitoring

- Error tracking
- Performance metrics
- User analytics

---

## 12. DEPLOYMENT

### Environment Configuration

```
NUXT_PUBLIC_API_URL=https://api.lemarkt.com
NUXT_PUBLIC_SOCKET_URL=wss://socket.lemarkt.com
NUXT_PUBLIC_CDN_URL=https://cdn.lemarkt.com
```

### Build Commands

```bash
# Development
npm run dev

# Production build
npm run build

# Preview production
npm run preview

# Linting
npm run lint
npm run lint:fix
```

---

## 13. FUTURE ROADMAP

### Phase 1: Stability

- [ ] Enable security headers
- [ ] Implement test coverage
- [ ] Fix memory leaks
- [ ] Remove code duplication

### Phase 2: Enhancement

- [ ] Payment gateway integration
- [ ] Advanced analytics
- [ ] Mobile app (PWA)
- [ ] API rate limiting

### Phase 3: Scale

- [ ] Multi-tenant support
- [ ] Microservices migration
- [ ] Global CDN deployment
- [ ] Advanced search (Elasticsearch)

---

## 14. GLOSSARY

| Term    | Definition             |
| ------- | ---------------------- |
| **MOQ** | Minimum Order Quantity |
| **RFQ** | Request for Quote      |
| **SKU** | Stock Keeping Unit     |
| **B2B** | Business to Business   |
| **SSR** | Server-Side Rendering  |
| **JWT** | JSON Web Token         |

---

_Document Version: 1.0_
_Last Updated: November 21, 2025_
_Platform: LeMarkt B2B Marketplace_
