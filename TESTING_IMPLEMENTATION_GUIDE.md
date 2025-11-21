# Testing Implementation Guide

Complete step-by-step guide to implement testing infrastructure for LeMarkt platform.

---

## Phase 1: Foundation Setup (Week 1-2)

### Step 1: Install Dependencies

```bash
# Core testing framework
npm install --save-dev vitest@^1.0.0
npm install --save-dev @vitest/ui@^1.0.0
npm install --save-dev @vitest/coverage-v8@^1.0.0

# Vue testing utilities
npm install --save-dev @vue/test-utils@^2.4.0
npm install --save-dev @testing-library/vue@^8.0.0

# Test environment
npm install --save-dev happy-dom@^12.0.0

# Type definitions
npm install --save-dev @types/vitest

# Optional: Pre-commit hooks
npm install --save-dev husky@^8.0.0
npm install --save-dev lint-staged@^15.0.0
```

### Step 2: Create vitest.config.ts

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'happy-dom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'tests/setup.ts',
        '.nuxt/',
        '.output/',
        '**/*.d.ts',
        '**/mockData.ts'
      ],
      all: true,
      lines: 80,
      functions: 80,
      branches: 75,
      statements: 80
    },
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.{test,spec}.{js,ts}'],
    exclude: ['node_modules']
  },
  resolve: {
    alias: {
      '~': path.resolve(__dirname, './'),
      '@': path.resolve(__dirname, './')
    }
  }
})
```

### Step 3: Create tests/setup.ts

```typescript
// tests/setup.ts
import { vi } from 'vitest'
import { config } from '@vue/test-utils'

// Mock nuxt auto-imports
global.defineNuxtConfig = vi.fn()
global.defineNuxtPlugin = vi.fn()
global.useRouter = vi.fn()
global.useRoute = vi.fn()
global.navigateTo = vi.fn()
global.useRuntimeConfig = vi.fn(() => ({
  public: {
    apiBaseURL: 'http://localhost:3000/api',
    locale: 'en'
  }
}))
global.useCookie = vi.fn()
global.useState = vi.fn()
global.useNuxtApp = vi.fn(() => ({
  $i18n: { t: (key) => key }
}))
global.useRequestHeaders = vi.fn()
global.$fetch = vi.fn()

// Mock localStorage/sessionStorage
global.localStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
}

global.sessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
}

config.global.mocks = {
  $t: (key) => key
}
```

### Step 4: Update package.json Scripts

```json
{
  "scripts": {
    "dev": "nuxt dev",
    "build": "nuxt build",
    "preview": "nuxt preview",
    "start": "node .output/server/index.mjs",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest --watch",
    "test:debug": "vitest --inspect-brk --inspect --single-thread",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "format": "prettier --write .",
    "check": "eslint . && prettier --check .",
    "prepare": "husky install"
  }
}
```

### Step 5: Create Directory Structure

```bash
mkdir -p tests/unit/services
mkdir -p tests/unit/composables
mkdir -p tests/unit/middleware
mkdir -p tests/unit/stores
mkdir -p tests/unit/utils
mkdir -p tests/unit/validators
mkdir -p tests/components
mkdir -p tests/fixtures
mkdir -p tests/mocks
```

### Step 6: Fix Environment Security

**Update .gitignore:**
```
# Add these lines
env.txt
env_prod_test.txt
```

**Create .env.example:**
```
# LeMarkt Environment Template
# Copy to .env.local and modify for your environment

# API Configuration
NUXT_PUBLIC_SITE_URL=http://localhost:3000
NUXT_PUBLIC_DOMAIN=http://localhost:3000/api
NUXT_PUBLIC_API_BASE_URL=http://localhost:3000/api

# Development
NODE_ENV=development
NUXT_PUBLIC_DEBUG_MODE=true
NUXT_PUBLIC_LOCALE=en

# Features
NUXT_PUBLIC_USE_MOCKS=true
NUXT_ICON_SPRITE_PATH=/sprite.svg

# WebSocket
SOCKET_URL=http://localhost:3001
```

### Step 7: Setup Husky Pre-commit Hooks (Optional but Recommended)

```bash
# Initialize husky
npx husky install

# Create pre-commit hook
npx husky add .husky/pre-commit "npx lint-staged"

# Create pre-push hook (optional)
npx husky add .husky/pre-push "npm run test:run"
```

**Create .lintstagedrc:**
```json
{
  "*.{ts,js,vue}": [
    "eslint --fix",
    "prettier --write"
  ]
}
```

---

## Phase 2: Write First Tests (Week 2-3)

### Test 1: TokenService (tests/unit/services/token.service.test.ts)

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { TokenService } from '~/services/token'

// Mock the utilities
vi.mock('~/utils/cookies', () => ({
  createCookie: vi.fn(),
  getCookieValue: vi.fn(),
  setCookieValue: vi.fn(),
  removeCookie: vi.fn()
}))

describe('TokenService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Token Getters', () => {
    it('should get auth token', () => {
      // Test implementation
      expect(TokenService.getAuthToken).toBeDefined()
    })

    it('should get refresh token', () => {
      expect(TokenService.getRefreshToken).toBeDefined()
    })

    it('should get registration token', () => {
      expect(TokenService.getRegistrationToken).toBeDefined()
    })
  })

  describe('Token Setters', () => {
    it('should set auth and refresh tokens', () => {
      TokenService.setAuthTokens('access-token', 'refresh-token')
      expect(TokenService.getAuthToken()).toBe('access-token')
      expect(TokenService.getRefreshToken()).toBe('refresh-token')
    })

    it('should clear registration token when setting auth tokens', () => {
      TokenService.setAuthTokens('access-token')
      // Add assertion
    })
  })

  describe('Token Validation', () => {
    it('should check if valid token exists', () => {
      expect(typeof TokenService.hasValidToken()).toBe('boolean')
    })
  })

  describe('Request Headers', () => {
    it('should include Authorization header when token exists', () => {
      TokenService.setAuthTokens('test-token')
      const headers = TokenService.getRequestHeaders()
      expect(headers.Authorization).toBe('Bearer test-token')
    })

    it('should include Content-Type header', () => {
      const headers = TokenService.getRequestHeaders()
      expect(headers['Content-Type']).toBe('application/json')
    })
  })

  describe('Token Clearing', () => {
    it('should clear all tokens', () => {
      TokenService.setAuthTokens('test-token')
      TokenService.clearAllTokens()
      expect(TokenService.getAuthToken()).toBeNull()
    })
  })
})
```

### Test 2: Error Handling Utility (tests/unit/utils/errors.test.ts)

```typescript
import { describe, it, expect } from 'vitest'
import { createAppError, handleApiError } from '~/utils/errors'

describe('Error Utilities', () => {
  describe('createAppError', () => {
    it('should create error with all properties', () => {
      const error = createAppError(
        'AUTH_ERROR',
        'Auth failed',
        { userId: 123 },
        401
      )

      expect(error.code).toBe('AUTH_ERROR')
      expect(error.message).toBe('Auth failed')
      expect(error.details).toEqual({ userId: 123 })
      expect(error.statusCode).toBe(401)
      expect(error.timestamp).toBeDefined()
    })

    it('should create error with optional properties', () => {
      const error = createAppError('UNKNOWN_ERROR', 'Something went wrong')
      expect(error.details).toBeUndefined()
      expect(error.statusCode).toBeUndefined()
    })
  })

  describe('handleApiError', () => {
    it('should classify 401 as AUTH_ERROR', () => {
      const error = {
        statusCode: 401,
        message: 'Unauthorized'
      }
      const appError = handleApiError(error)
      expect(appError.code).toBe('AUTH_ERROR')
    })

    it('should classify 403 as FORBIDDEN_ERROR', () => {
      const error = { statusCode: 403 }
      const appError = handleApiError(error)
      expect(appError.code).toBe('FORBIDDEN_ERROR')
    })

    it('should classify 422 as VALIDATION_ERROR', () => {
      const error = { statusCode: 422 }
      const appError = handleApiError(error)
      expect(appError.code).toBe('VALIDATION_ERROR')
    })

    it('should classify network errors', () => {
      const error = { code: 'ERR_NETWORK' }
      const appError = handleApiError(error)
      expect(appError.code).toBe('NETWORK_ERROR')
    })

    it('should default to UNKNOWN_ERROR', () => {
      const error = { message: 'Something broke' }
      const appError = handleApiError(error)
      expect(appError.code).toBe('UNKNOWN_ERROR')
    })
  })
})
```

### Test 3: Validation Schema (tests/unit/validators/loginSchema.test.ts)

```typescript
import { describe, it, expect } from 'vitest'
import Ajv from 'ajv'
import { loginSchema, type LoginFormData } from '~/utils/validator/schemas/auth/loginSchema'

const ajv = new Ajv()
const validate = ajv.compile(loginSchema)

describe('Login Schema Validation', () => {
  it('should validate correct login data', () => {
    const validData: LoginFormData = {
      email: 'user@example.com',
      password: 'password123',
      remember: false
    }
    expect(validate(validData)).toBe(true)
  })

  it('should require email field', () => {
    const invalidData = {
      password: 'password123',
      remember: false
    }
    expect(validate(invalidData)).toBe(false)
  })

  it('should validate email format', () => {
    const invalidData = {
      email: 'invalid-email',
      password: 'password123',
      remember: false
    }
    expect(validate(invalidData)).toBe(false)
  })

  it('should require minimum password length', () => {
    const invalidData: LoginFormData = {
      email: 'user@example.com',
      password: 'pass',
      remember: false
    }
    expect(validate(invalidData)).toBe(false)
  })

  it('should reject additional properties', () => {
    const invalidData = {
      email: 'user@example.com',
      password: 'password123',
      remember: false,
      extra: 'field'
    }
    expect(validate(invalidData)).toBe(false)
  })

  it('should set default remember value', () => {
    const data = {
      email: 'user@example.com',
      password: 'password123'
    }
    const result = ajv.compile({
      ...loginSchema,
      defaults: true
    })(data)
    expect(result).toBe(true)
  })
})
```

---

## Running Tests

### Run all tests
```bash
npm run test
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Run tests with UI
```bash
npm run test:ui
```

### Run tests with coverage
```bash
npm run test:coverage
```

### Run specific test file
```bash
npm run test -- tests/unit/services/token.service.test.ts
```

### Debug tests
```bash
npm run test:debug
```

---

## Coverage Report

After running `npm run test:coverage`, open:
```
coverage/index.html
```

Targets by component:
- Services: 90%+
- Utilities: 90%+
- Middleware: 85%+
- Stores: 85%+
- Composables: 80%+
- Components: 60%+

---

## Common Testing Patterns

### Mocking API Calls
```typescript
import { vi } from 'vitest'

vi.mock('~/composables/useApi', () => ({
  useApi: () => ({
    request: vi.fn().mockResolvedValue({ data: {} })
  })
}))
```

### Mocking Pinia Store
```typescript
import { createPinia, setActivePinia } from 'pinia'

beforeEach(() => {
  setActivePinia(createPinia())
})
```

### Testing Async Code
```typescript
it('should handle async operations', async () => {
  const result = await someAsyncFunction()
  expect(result).toBeDefined()
})
```

### Testing Component Emissions
```typescript
const wrapper = mount(MyComponent)
wrapper.emit('my-event', { data: 'value' })
expect(wrapper.emitted('my-event')).toBeTruthy()
```

---

## Continuous Integration

### GitHub Actions Workflow

Create `.github/workflows/test.yml`:

```yaml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18.x, 20.x]

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'

      - run: npm ci
      - run: npm run lint
      - run: npm run test:run
      - run: npm run test:coverage

      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

---

## Troubleshooting

### Issue: Module not found errors
**Solution:** Ensure vitest.config.ts alias paths match tsconfig.json

### Issue: Cannot find module 'vue'
**Solution:** Check that @vitejs/plugin-vue is installed

### Issue: Tests timeout
**Solution:** Increase timeout: `it('test', async () => {...}, 10000)`

### Issue: Mocking not working
**Solution:** Place mocks before imports in test file

---

## Next Steps

1. Complete Phase 1 setup this week
2. Write first 5 critical tests (TokenService, etc.)
3. Get team trained on testing patterns
4. Schedule Phase 2 kickoff for next week
5. Plan CI/CD pipeline implementation

---

## Resources

- Vitest Docs: https://vitest.dev
- Vue Test Utils: https://test-utils.vuejs.org
- Testing Library Vue: https://testing-library.com/docs/vue-testing-library/intro
- Pinia Testing: https://pinia.vuejs.org/cookbook/testing.html

