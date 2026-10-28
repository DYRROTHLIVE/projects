import { describe, expect, it } from 'vitest';
import { loginSchema, registrationSchema, categorySchema } from '../src/lib/validators';

describe('validation schemas', () => {
  it('accepts a valid login payload', () => {
    expect(loginSchema.safeParse({ email: 'user@example.com', password: 'Password123' }).success).toBe(true);
  });

  it('rejects weak registration credentials', () => {
    const parsed = registrationSchema.safeParse({
      displayName: 'Alex',
      email: 'alex@example.com',
      password: 'weak',
    });
    expect(parsed.success).toBe(false);
  });

  it('validates a category slug', () => {
    expect(categorySchema.safeParse({ name: 'Design', slug: 'design' }).success).toBe(true);
    expect(categorySchema.safeParse({ name: 'Design', slug: 'Bad Slug' }).success).toBe(false);
  });
});
