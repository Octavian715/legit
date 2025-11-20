# Agents Guide for LeMarkt

## Build & Commands

- **Dev**: `npm run dev` (starts server on http://localhost:3000)
- **Build**: `npm run build` (production build)
- **Lint**: `npm run lint` or `npm run lint:fix`
- **Format**: `npm run format` (Prettier) or `npm run check` (both lint & format)
- **Preview**: `npm run preview` (test production build locally)
- **Clean**: `npm run clean` (remove build artifacts)

## Architecture & Codebase

**Framework**: Nuxt 3 (Vue 3) with TypeScript  
**State Management**: Pinia with persistent cookies  
**Styling**: Tailwind CSS + Sass  
**Backend**: Nitro server with API routes in `server/api/`  
**Key Stores**: `stores/*.ts` (global, dashboard, chat, network, orders)  
**Composables**: Auto-imported from `composables/` (reusable logic)  
**Types**: Shared types in `types/` directory  
**i18n**: Multi-language via `@nuxtjs/i18n` in `i18n/locales/`  
**Modules**: Image optimization, SEO, security, floating tooltips

## Code Style & Conventions

**Imports**: Use `~/*` path aliases for absolute imports  
**Formatting**: Prettier (4-space tabs, 100 char line width, single quotes, no semicolons)  
**Linting**: ESLint + Vue 3 rules; components kebab-case; unused vars must start with `_`  
**Types**: Strict TypeScript enabled; composables use `<T>` generics  
**Naming**: Components PascalCase, files/folders kebab-case, variables camelCase  
**Vue**: Use `<script setup>` syntax; computed/reactive auto-imported from Pinia  
**Errors**: Handle via plugin system, avoid try-catch bloat
