/**
 * Tests for Transformers
 */

import { describe, it, expect } from 'vitest';
import { createContentTypeTransformer } from '../transformers';

describe('Transformers', () => {
  it('should set content type for objects', () => {
    const transformer = createContentTypeTransformer();
    const headers = new Headers();
    const data = { test: 'value' };
    
    const result = transformer(data, headers);
    
    expect(result).toBe('{"test":"value"}'); // Should be JSON string
    expect(headers.get('content-type')).toBe('application/json; charset=utf-8');
  });
});