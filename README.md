# Zod Mock Schema

![npm version](https://img.shields.io/npm/v/@mikemajesty/zod-mock-schema.svg)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)
![TypeScript Ready](https://img.shields.io/badge/TypeScript-Ready-blue.svg)

**Simple, type-safe mock data generator for Zod schemas with built-in Brazilian format support 🇧🇷**

A developer-friendly, class-based utility for generating realistic test data from Zod schemas. Perfect for testing, prototyping, and fixtures — with zero configuration and maximum type safety.

## ✨ Why Choose This Library?

### 🎯 **Simplicity First**
- **Clean class-based API** — instantiate once, generate many times
- **Zero configuration** — works out of the box with any Zod schema
- **Type-safe overrides** — full TypeScript intellisense and validation
- **Intuitive seeding** — `mock.seed(123)` for deterministic tests

### 🇧🇷 **Brazilian Format Support**
- **CPF, CNPJ, RG** — built-in Brazilian document formats
- **CEP** — postal code generation
- **Phone BR** — Brazilian phone numbers
- **Zero dependencies** — no extra libraries needed

### ⚡ **Developer Experience**
- **Faker.js integration** — realistic, locale-aware fake data
- **Custom Faker injection** — use different locales per test
- **Batch generation** — `generateMany()` for multiple mocks
- **Full Zod v4 support** — Union, Intersection, Record, Lazy, Pipe, and more

---

## 📦 Installation

```bash
# npm
npm install @mikemajesty/zod-mock-schema zod @faker-js/faker

# yarn
yarn add @mikemajesty/zod-mock-schema zod @faker-js/faker

# pnpm
pnpm add @mikemajesty/zod-mock-schema zod @faker-js/faker
```

> ⚠️ **Important:** `zod` and `@faker-js/faker` are **peer dependencies** and must be installed separately.

---

## 🚀 Quick Start

```ts
import { z } from 'zod';
import { ZodMockSchema } from '@mikemajesty/zod-mock-schema';

const userSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  age: z.number().int().min(18).max(99),
  isActive: z.boolean(),
  createdAt: z.date(),
});

const userMock = new ZodMockSchema(userSchema);

console.log(userMock.generate());
```

---

## 🎭 Type Inference with Generics

The library supports **generic type inference**, allowing you to specify the exact type you want:

### Using z.infer (Recommended)

The best practice is to derive the type directly from the schema using `z.infer`:

```ts
const userSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  age: z.number().int().min(18).max(99),
  isActive: z.boolean(),
  createdAt: z.date(),
});

// ✅ Best practice: infer type from schema
type User = z.infer<typeof userSchema>;

const userMock = new ZodMockSchema(userSchema);

// Type is automatically inferred as User
const user = userMock.generate<User>();
```

### Type Inference with Classes/Entities

Perfect for testing with ORM entities or class instances:

```ts
class UserEntity {
  id: string;
  name: string;
  email: string;
  age: number;
  isActive: boolean;
  createdAt: Date;
  
  get isAdult() {
    return this.age >= 18;
  }
}

// Create schema that matches entity structure
const userSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  age: z.number().int().min(18).max(99),
  isActive: z.boolean(),
  createdAt: z.date(),
});

const userMock = new ZodMockSchema(userSchema);

// Generate mock data typed as UserEntity
const user = userMock.generate<UserEntity>();
// user.id, user.name, etc. are properly typed
```

### Type Inference with generateMany

```ts
type User = z.infer<typeof userSchema>;

// Generate array of typed entities
const users = userMock.generateMany<User>(5);
// users is User[]

// With overrides
const activeUsers = userMock.generateMany<User>(3, {
  overrides: { isActive: true }
});
```

---

## 🔧 Basic Usage

### 1. Simple Mock

```ts
const productSchema = z.object({
  id: z.number(),
  title: z.string(),
  price: z.number().positive(),
  inStock: z.boolean(),
  tags: z.array(z.string()),
});

const productMock = new ZodMockSchema(productSchema);
productMock.generate();
```

### 2. Override Properties

```ts
userMock.generate({
  overrides: {
    name: 'Alice Johnson',
    age: 25,
    email: 'alice@company.com',
    createdAt: new Date('2023-01-01'),
  }
});
```

### 3. Generate Multiple Items

```ts
userMock.generateMany(3, {
  overrides: { department: 'Engineering' }
});
```
---
## 🇧🇷 Brazilian Formats

Generate valid Brazilian documents and identifiers with zero configuration:

```ts
import { ZodMockSchema, BrazilianFormat } from '@mikemajesty/zod-mock-schema';

const userSchema = z.object({
  cpf: z.string().meta({ format: 'cpf' }),      // 11-digit CPF
  cnpj: z.string().meta({ format: 'cnpj' }),   // 14-digit CNPJ
  rg: z.string().meta({ format: 'rg' }),       // Brazilian ID
  phone: z.string().meta({ format: 'phoneBR' }), // BR phone number
  cep: z.string().meta({ format: 'cep' }),     // Postal code
});

const mock = new ZodMockSchema(userSchema);
const user = mock.generate();
// {
//   cpf: "52998224725",
//   cnpj: "60676960000106",
//   rg: "238192611",
//   phone: "11987654321",
//   cep: "01001000"
// }

// TypeScript support for format validation
const format: BrazilianFormat = 'cpf'; // Type-safe!
```
```

### Why This Matters

Brazilian formats require specific validation rules that generic mock generators don't understand. This library provides:

- ✅ **Pre-validated samples** — all generated values pass real validation
- ✅ **No external APIs** — works offline, no rate limits
- ✅ **Deterministic with seeds** — same seed = same CPF/CNPJ
- ✅ **Works in arrays and nested objects** — generate multiple documents easily

```ts
// Generate multiple users with valid Brazilian docs
const users = mock.generateMany(10);
users.forEach(u => console.log(u.cpf)); // All valid CPFs
```

---

## 🧠 Full Zod Schema Support

Supports all Zod types including advanced patterns:

```ts
const complexSchema = z.object({
  status: z.union([z.literal('active'), z.literal('inactive'), z.literal('pending')]),
  userWithRole: z.object({ name: z.string() }).and(z.object({ role: z.string() })),
  metadata: z.record(z.string()),
  optionalField: z.string().optional(),
  nullableField: z.string().nullable(),
  tags: z.array(z.string()).min(1).max(5),
  score: z.number().default(0),
  nested: z.lazy(() => complexSchema.optional()),
});

const complexMock = new ZodMockSchema(complexSchema);
complexMock.generate();
```

---

## 🛒 E-commerce Example

```ts
const orderSchema = z.object({
  id: z.string().uuid(),
  customerId: z.string().uuid(),
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().positive(),
    price: z.number().positive(),
  })),
  total: z.number().positive(),
  status: z.enum(['pending', 'processing', 'shipped', 'delivered']),
  createdAt: z.date(),
  metadata: z.record(z.any()).optional(),
});

const orderMock = new ZodMockSchema(orderSchema);

orderMock.generateMany(5, {
  overrides: {
    status: 'processing',
    total: 1399.97,
  }
});
```

---

## 🏭 Factory Pattern

```ts
export class UserFactory {
  private mock = new ZodMockSchema(userSchema);

  create(overrides?: Partial<User>) {
    return this.mock.generate({ overrides });
  }

  createMany(count: number, options?: MockManyOptions<User>) {
    return this.mock.generateMany(count, options);
  }

  createAdmins(count: number) {
    return this.mock.generateMany(count, {
      overrides: { role: 'admin' }
    });
  }
}
```

---

## 🧪 Testing Patterns

### Deterministic Tests

```ts
const userMock = new ZodMockSchema(userSchema);
userMock.seed(123);
const user = userMock.generate();
```

### Using Faker Directly

You can use `faker` in overrides to generate custom values:

```ts
import { ZodMockSchema } from '@mikemajesty/zod-mock-schema';
import { faker } from '@faker-js/faker';

// Use faker directly for custom values
const user = userMock.generate({
  overrides: {
    name: faker.person.fullName(),
    email: faker.internet.email(),
    bio: faker.lorem.paragraph(),
  }
});
```

### Custom Faker Instance

Inject a custom Faker instance with different locales or configurations:

```ts
import { Faker, pt_BR } from '@faker-js/faker';

const customFaker = new Faker({ locale: pt_BR });
const user = userMock.generate({ faker: customFaker });
```

### Parallel Tests with Isolated Faker Instances

```ts
import { Faker, en, es } from '@faker-js/faker';

test('parallel test 1', () => {
  const faker1 = new Faker({ locale: en });
  faker1.seed(100);
  const user = userMock.generate({ faker: faker1 });
});

test('parallel test 2', () => {
  const faker2 = new Faker({ locale: es });
  faker2.seed(200);
  const user = userMock.generate({ faker: faker2 });
});
```

### Integration Testing

```ts
describe('User Service', () => {
  const userMock = new ZodMockSchema(userSchema);

  test('should create multiple unique users', () => {
    const users = userMock.generateMany(5);

    const emails = users.map(u => u.email);
    expect(new Set(emails).size).toBe(5);
  });
});
```

---

## 📘 API Reference

### new ZodMockSchema(schema)

Creates a mock generator for the given Zod schema.

### Methods

#### `generate(options?: MockOptions<T>): T`  
Generates a single mock object.

#### `generateMany(count: number, options?: MockManyOptions<T>): T[]`  
Generates multiple mock objects.

### Exported Types

#### `MockOptions<T>`
Configuration options for generating a single mock object.
- `overrides?: Partial<T>` — Override specific properties
- `faker?: Faker` — Custom Faker instance for localization

#### `MockManyOptions<T>`
Extends `MockOptions<T>` for batch generation.

#### `BrazilianFormat`
Type-safe union of Brazilian format identifiers:
```ts
type BrazilianFormat = 'cpf' | 'cnpj' | 'rg' | 'phoneBR' | 'cep';
```

---

## 🔄 Supported Zod Types

✓ String · Number · Boolean · Date · Array  
✓ Object · Union · Intersection · Enum  
✓ Record · Optional · Nullable · Default  
✓ Lazy · Literal · Any · Unknown  
✓ Void · Null · Pipe

---

## 🧹 Best Practices

### Keep It Simple
```ts
// ✅ Good: Reuse instances
const userMock = new ZodMockSchema(userSchema);
const user1 = userMock.generate();
const user2 = userMock.generate();

// ❌ Avoid: Creating new instances every time
const user1 = new ZodMockSchema(userSchema).generate();
const user2 = new ZodMockSchema(userSchema).generate();
```

### Use Overrides for Business Logic
```ts
// ✅ Good: Override specific fields
userMock.generate({ overrides: { role: 'admin', status: 'active' } });

// ❌ Avoid: Manually modifying generated data
const user = userMock.generate();
user.role = 'admin'; // Bypasses Zod validation
```

### Centralize Test Factories
```ts
// ✅ Good: Single source of truth
export const UserFactory = new ZodMockSchema(userSchema);

// In tests:
import { UserFactory } from './factories';
const admin = UserFactory.generate({ overrides: { role: 'admin' } });
```

### Use Seeds for Deterministic Tests
```ts
// ✅ Good: Reproducible tests
test('user creation', () => {
  userMock.seed(12345);
  const user = userMock.generate();
  expect(user.name).toBe('Alice'); // Always the same with same seed
});
```  

---

## 📄 License

MIT © Mike Majesty
