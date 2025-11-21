# LeMarkt Performance Audit - Executive Summary & Action Items

## Critical Issues (Must Fix This Week)

### 1. Memory Leak: Socket Event Listeners
**Severity**: HIGH
**Files**: 
- `/home/user/legit/plugins/02.socket.client.ts` (line 81)
- `/home/user/legit/composables/socket/useSocketManager.ts` (line 96-99)
- `/home/user/legit/composables/useChatSocket.ts` (line 228)

**Impact**: Users experience memory growth over time, browser tab becomes sluggish after extended use

**Fix Time**: 30-45 minutes

**Quick Fix**:
```typescript
// plugins/02.socket.client.ts - Add removeEventListener in disconnectSocket
const disconnectSocket = (): void => {
    if (currentSocket) {
        currentSocket.removeAllListeners()
        currentSocket.disconnect()
        currentSocket = null
    }
    // ADD THIS:
    window.removeEventListener('beforeunload', disconnectSocket)
}
```

---

### 2. Deep Watching Performance Issue
**Severity**: HIGH
**File**: `/home/user/legit/composables/usePageWrapper.ts` (line 136)

**Impact**: Causes unnecessary page refreshes and re-renders. With JSON.stringify on every change, causes CPU spike.

**Fix Time**: 15 minutes

**Quick Fix**:
```typescript
// BEFORE (line 136):
watch(watchSources, (newDeps, oldDeps) => {
    if (JSON.stringify(newDeps) !== JSON.stringify(oldDeps)) {
        refresh()
    }
}, { deep: true })

// AFTER:
watchSources.forEach(source => {
    watch(source, () => refresh(), { immediate: false })
})
```

---

### 3. Unmet Dependency
**Severity**: HIGH
**File**: `/home/user/legit/package.json`

**Impact**: May cause runtime errors in production

**Fix Time**: 5 minutes

```bash
npm install
npm ls lodash-es
# If still unmet, npm install lodash-es@^4.17.21
```

---

## Important Issues (Fix Within 2 Weeks)

### 4. Minimal Component Lazy Loading
**Severity**: MEDIUM
**Files to Update**:
- Modals: 8+ files using `ConfirmModal`, `DocumentUploadModal`, etc.
- Filter Drawers: 5+ files
- Chart components

**Expected Improvement**: 15-20% faster initial page load

**Example Implementation**:
```vue
<!-- pages/marketplace/index.vue -->
<script setup>
// Lazy load drawer
const ProductsFilterDrawer = defineAsyncComponent(() => 
  import('~/components/features/ecommerce/products/ProductsFilterDrawer.vue')
)
</script>

<template>
  <Suspense>
    <ProductsFilterDrawer v-if="showFilters" />
  </Suspense>
</template>
```

---

### 5. Image Optimization
**Severity**: MEDIUM
**Impact**: 10-15% reduction in page size

**Changes**:
1. Add AVIF format support:
```typescript
// nuxt.config.ts, line 144
format: ['avif', 'webp', 'png', 'jpg']  // Add 'avif'
```

2. Replace <img> with <NuxtImg> (38/611 components need this)

**Files Most Impactful**:
- `/home/user/legit/components/features/ecommerce/products/ProductCard/items/ProductImage.vue`
- `/home/user/legit/components/features/ecommerce/products/ImageGallery.vue`
- All avatar/profile picture components

---

### 6. Socket Timeout Cleanup
**Severity**: MEDIUM
**File**: `/home/user/legit/composables/useChatSocket.ts` (line 228)

**Fix**:
```typescript
let reconnectTimeout: NodeJS.Timeout | null = null

const reconnect = () => {
    if (reconnectAttempts.value >= maxReconnectAttempts) {
        console.error('[Chat Socket] Max reconnection attempts reached')
        return
    }

    // Clear any existing timeout
    if (reconnectTimeout) {
        clearTimeout(reconnectTimeout)
    }

    disconnect()

    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.value), 30000)
    reconnectTimeout = setTimeout(() => {
        connect()
        reconnectTimeout = null
    }, delay)
}

// Add to disconnect cleanup:
const disconnect = () => {
    if (reconnectTimeout) {
        clearTimeout(reconnectTimeout)
        reconnectTimeout = null
    }
    // ... rest of cleanup
}
```

---

## Performance Improvement Checklist

### Week 1 - Critical Fixes (4-5 hours)
- [ ] Fix unmet lodash-es dependency
- [ ] Fix deep watching in usePageWrapper
- [ ] Add setTimeout cleanup in reconnect()
- [ ] Fix beforeunload listener cleanup
- [ ] Add AVIF image format support

### Week 2-3 - Lazy Loading (6-8 hours)
- [ ] Lazy load all modals (defineAsyncComponent)
- [ ] Lazy load all filter drawers
- [ ] Lazy load chart components
- [ ] Add Suspense boundaries

### Week 4 - Image & API Optimization (4-6 hours)
- [ ] Replace all <img> with <NuxtImg>
- [ ] Implement image responsive sizing
- [ ] Consolidate cart API endpoints
- [ ] Update ISR cache headers

### Month 2 - Advanced Optimizations (10-15 hours)
- [ ] Implement service workers
- [ ] Add advanced bundle analysis
- [ ] Replace polling with real-time WebSocket updates
- [ ] Optimize large dependencies (chart.js, floating-vue)

---

## Key Metrics to Track

### Current State
- **Bundle Size**: ~777KB (package-lock.json)
- **Vue Components**: 611
- **Stores**: 20
- **Memory Leaks**: Multiple event listeners accumulating
- **Lazy Loaded Components**: 2 out of 100+

### Target State (After Fixes)
- **Bundle Size**: ~650KB (15% reduction)
- **Initial Load Time**: 15-20% faster
- **Memory Usage**: 20-30% reduction from leak fixes
- **Lazy Loaded Components**: 50+

---

## Files to Monitor During Implementation

**Priority 1 (Critical)**:
- `/home/user/legit/package.json`
- `/home/user/legit/nuxt.config.ts`
- `/home/user/legit/composables/usePageWrapper.ts`
- `/home/user/legit/composables/useChatSocket.ts`
- `/home/user/legit/plugins/02.socket.client.ts`

**Priority 2 (Important)**:
- `/home/user/legit/stores/cart.ts`
- `/home/user/legit/stores/products.ts`
- `/home/user/legit/stores/chat.ts`
- `/home/user/legit/composables/socket/useSocketManager.ts`

---

## Testing After Fixes

### Memory Leak Testing
```javascript
// Open DevTools > Memory > Heap snapshots
// Reproduce: 
// 1. Send 10+ messages in chat
// 2. Disconnect/reconnect socket 5+ times
// 3. Take heap snapshot - memory should remain stable
```

### Performance Testing
```bash
# Build with analysis
npm run build -- --analyze

# Check bundle size
npm run build
```

### Load Time Testing
```javascript
// DevTools > Lighthouse
// Target:
// - First Contentful Paint (FCP): < 2s
// - Largest Contentful Paint (LCP): < 2.5s
// - Cumulative Layout Shift (CLS): < 0.1
```

---

## Dependency Review Recommendations

### Consider Removing/Replacing
- **lodash-es** (14KB) → Use native ES methods
- **vue-multiselect** (duplicates vue-select)
- **moment** (if used) → Replace with date-fns (already installed)

### Already Good
- **Pinia** for state management ✓
- **@vueuse** for composition utilities ✓
- **Axios** for HTTP requests ✓
- **Tailwind CSS** for styling ✓

---

## Documentation References

Full detailed report: `/home/user/legit/PERFORMANCE_AUDIT.md`

Additional resources:
- Nuxt 3 Performance: https://nuxt.com/docs/guide/concepts/performance
- Vue 3 Performance: https://vuejs.org/guide/best-practices/performance.html
- Vite Optimization: https://vitejs.dev/guide/ssr.html

---

## Success Criteria

After implementing these recommendations, the application should achieve:

1. ✓ Zero memory leaks (verified with heap snapshots)
2. ✓ Initial load time < 2.5s on 4G
3. ✓ Core Web Vitals all in "Good" range
4. ✓ No console warnings about unmet dependencies
5. ✓ 50% of complex components lazy-loaded
6. ✓ All images using optimized formats (AVIF/WebP)
7. ✓ Bundle size reduced by 15-20%

---

**Generated**: 2025-11-21
**Next Review**: 2025-12-21
**Assigned To**: Development Team
