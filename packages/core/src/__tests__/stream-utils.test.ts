/**
 * Stream utilities tests
 */

import { describe, it, expect, vi } from 'vitest';
import {
  streamToNodeReadable,
  nodeReadableToStream,
  createTransformStream,
  createFilterStream,
  createMapStream,
  createReduceStream,
  streamToBuffer,
  streamToString,
  streamToJSON,
  bufferToStream,
  stringToStream,
  jsonToStream,
  pipeStreams,
  createLimitStream,
  createSkipStream,
  createTakeStream,
  createCollectStream,
  createSplitStream,
  StreamUtils
} from '../stream-utils.js';

describe('streamToNodeReadable', () => {
  it('should convert Web Stream to Node.js Readable', async () => {
    const webStream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('hello'));
        controller.enqueue(new TextEncoder().encode('world'));
        controller.close();
      }
    });

    const nodeReadable = streamToNodeReadable(webStream);
    const chunks: Buffer[] = [];

    for await (const chunk of nodeReadable) {
      chunks.push(chunk);
    }

    expect(chunks).toHaveLength(2);
    expect(chunks[0].toString()).toBe('hello');
    expect(chunks[1].toString()).toBe('world');
  });
});

describe('nodeReadableToStream', () => {
  it('should convert Node.js Readable to Web Stream', async () => {
    const nodeReadable = {
      on: vi.fn((event: string, handler: Function) => {
        if (event === 'data') {
          setTimeout(() => handler(Buffer.from('hello')), 0);
          setTimeout(() => handler(Buffer.from('world')), 10);
        } else if (event === 'end') {
          setTimeout(() => handler(), 20);
        }
      }),
      off: vi.fn()
    } as any;

    const webStream = nodeReadableToStream(nodeReadable);
    const chunks: Uint8Array[] = [];

    const reader = webStream.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }
    } finally {
      reader.releaseLock();
    }

    expect(chunks).toHaveLength(2);
    expect(new TextDecoder().decode(chunks[0])).toBe('hello');
    expect(new TextDecoder().decode(chunks[1])).toBe('world');
  });
});

describe('createTransformStream', () => {
  it('should transform stream data', async () => {
    const transform = createTransformStream<string, string>((chunk) => chunk.toUpperCase());
    const input = new ReadableStream({
      start(controller) {
        controller.enqueue('hello');
        controller.enqueue('world');
        controller.close();
      }
    });

    const output = input.pipeThrough(transform);
    const chunks: string[] = [];

    const reader = output.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }
    } finally {
      reader.releaseLock();
    }

    expect(chunks).toEqual(['HELLO', 'WORLD']);
  });

  it('should handle async transforms', async () => {
    const transform = createTransformStream<string, string>(async (chunk) => {
      await new Promise(resolve => setTimeout(resolve, 1));
      return chunk.toUpperCase();
    });

    const input = new ReadableStream({
      start(controller) {
        controller.enqueue('hello');
        controller.close();
      }
    });

    const output = input.pipeThrough(transform);
    const chunks: string[] = [];

    const reader = output.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }
    } finally {
      reader.releaseLock();
    }

    expect(chunks).toEqual(['HELLO']);
  });
});

describe('createFilterStream', () => {
  it('should filter stream data', async () => {
    const filter = createFilterStream<number>((n) => n % 2 === 0);
    const input = new ReadableStream({
      start(controller) {
        controller.enqueue(1);
        controller.enqueue(2);
        controller.enqueue(3);
        controller.enqueue(4);
        controller.close();
      }
    });

    const output = input.pipeThrough(filter);
    const chunks: number[] = [];

    const reader = output.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }
    } finally {
      reader.releaseLock();
    }

    expect(chunks).toEqual([2, 4]);
  });
});

describe('createMapStream', () => {
  it('should map stream data', async () => {
    const map = createMapStream<number, number>((n) => n * 2);
    const input = new ReadableStream({
      start(controller) {
        controller.enqueue(1);
        controller.enqueue(2);
        controller.enqueue(3);
        controller.close();
      }
    });

    const output = input.pipeThrough(map);
    const chunks: number[] = [];

    const reader = output.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }
    } finally {
      reader.releaseLock();
    }

    expect(chunks).toEqual([2, 4, 6]);
  });
});

describe('createReduceStream', () => {
  it('should reduce stream data', async () => {
    const reduce = createReduceStream<number, number>((acc, n) => acc + n, 0);
    const input = new ReadableStream({
      start(controller) {
        controller.enqueue(1);
        controller.enqueue(2);
        controller.enqueue(3);
        controller.close();
      }
    });

    const output = input.pipeThrough(reduce);
    const chunks: number[] = [];

    const reader = output.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }
    } finally {
      reader.releaseLock();
    }

    expect(chunks).toEqual([1, 3, 6]);
  });
});

describe('streamToBuffer', () => {
  it('should convert stream to buffer', async () => {
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('hello'));
        controller.enqueue(new TextEncoder().encode('world'));
        controller.close();
      }
    });

    const buffer = await streamToBuffer(stream);
    expect(buffer.toString()).toBe('helloworld');
  });
});

describe('streamToString', () => {
  it('should convert stream to string', async () => {
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('hello world'));
        controller.close();
      }
    });

    const str = await streamToString(stream);
    expect(str).toBe('hello world');
  });
});

describe('streamToJSON', () => {
  it('should convert stream to JSON', async () => {
    const data = { message: 'hello', count: 42 };
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(JSON.stringify(data)));
        controller.close();
      }
    });

    const result = await streamToJSON(stream);
    expect(result).toEqual(data);
  });
});

describe('bufferToStream', () => {
  it('should convert buffer to stream', async () => {
    const buffer = Buffer.from('hello world');
    const stream = bufferToStream(buffer);
    const chunks: Uint8Array[] = [];

    const reader = stream.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }
    } finally {
      reader.releaseLock();
    }

    expect(chunks).toHaveLength(1);
    expect(new TextDecoder().decode(chunks[0])).toBe('hello world');
  });
});

describe('stringToStream', () => {
  it('should convert string to stream', async () => {
    const str = 'hello world';
    const stream = stringToStream(str);
    const chunks: Uint8Array[] = [];

    const reader = stream.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }
    } finally {
      reader.releaseLock();
    }

    expect(chunks).toHaveLength(1);
    expect(new TextDecoder().decode(chunks[0])).toBe('hello world');
  });
});

describe('jsonToStream', () => {
  it('should convert JSON to stream', async () => {
    const data = { message: 'hello', count: 42 };
    const stream = jsonToStream(data);
    const chunks: Uint8Array[] = [];

    const reader = stream.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }
    } finally {
      reader.releaseLock();
    }

    expect(chunks).toHaveLength(1);
    const result = JSON.parse(new TextDecoder().decode(chunks[0]));
    expect(result).toEqual(data);
  });
});

describe('pipeStreams', () => {
  it('should pipe streams together', async () => {
    const input = new ReadableStream({
      start(controller) {
        controller.enqueue('hello');
        controller.enqueue('world');
        controller.close();
      }
    });

    const transform1 = createTransformStream<string, string>((chunk) => chunk.toUpperCase());
    const transform2 = createTransformStream<string, string>((chunk) => `[${chunk}]`);

    const output = pipeStreams(input, transform1, transform2);
    const chunks: string[] = [];

    const reader = output.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }
    } finally {
      reader.releaseLock();
    }

    expect(chunks).toEqual(['[HELLO]', '[WORLD]']);
  });
});

describe('createLimitStream', () => {
  it('should limit number of chunks', async () => {
    const limit = createLimitStream<number>(2);
    const input = new ReadableStream({
      start(controller) {
        controller.enqueue(1);
        controller.enqueue(2);
        controller.enqueue(3);
        controller.enqueue(4);
        controller.close();
      }
    });

    const output = input.pipeThrough(limit);
    const chunks: number[] = [];

    const reader = output.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }
    } finally {
      reader.releaseLock();
    }

    expect(chunks).toEqual([1, 2]);
  });
});

describe('createSkipStream', () => {
  it('should skip first N chunks', async () => {
    const skip = createSkipStream<number>(2);
    const input = new ReadableStream({
      start(controller) {
        controller.enqueue(1);
        controller.enqueue(2);
        controller.enqueue(3);
        controller.enqueue(4);
        controller.close();
      }
    });

    const output = input.pipeThrough(skip);
    const chunks: number[] = [];

    const reader = output.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }
    } finally {
      reader.releaseLock();
    }

    expect(chunks).toEqual([3, 4]);
  });
});

describe('createTakeStream', () => {
  it('should take first N chunks', async () => {
    const take = createTakeStream<number>(2);
    const input = new ReadableStream({
      start(controller) {
        controller.enqueue(1);
        controller.enqueue(2);
        controller.enqueue(3);
        controller.enqueue(4);
        controller.close();
      }
    });

    const output = input.pipeThrough(take);
    const chunks: number[] = [];

    const reader = output.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }
    } finally {
      reader.releaseLock();
    }

    expect(chunks).toEqual([1, 2]);
  });
});

describe('createCollectStream', () => {
  it('should collect all chunks into array', async () => {
    const collect = createCollectStream<number>();
    const input = new ReadableStream({
      start(controller) {
        controller.enqueue(1);
        controller.enqueue(2);
        controller.enqueue(3);
        controller.close();
      }
    });

    const output = input.pipeThrough(collect);
    const chunks: number[][] = [];

    const reader = output.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }
    } finally {
      reader.releaseLock();
    }

    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toEqual([1, 2, 3]);
  });
});

describe('createSplitStream', () => {
  it('should split stream by delimiter', async () => {
    const split = createSplitStream('\n');
    const input = new ReadableStream({
      start(controller) {
        controller.enqueue('hello\nworld\n');
        controller.close();
      }
    });

    const output = input.pipeThrough(split);
    const chunks: string[] = [];

    const reader = output.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }
    } finally {
      reader.releaseLock();
    }

    expect(chunks).toEqual(['hello', 'world']);
  });
});

describe('StreamUtils', () => {
  it('should create stream from array', async () => {
    const array = [1, 2, 3, 4, 5];
    const stream = StreamUtils.fromArray(array);
    const chunks: number[] = [];

    const reader = stream.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }
    } finally {
      reader.releaseLock();
    }

    expect(chunks).toEqual(array);
  });

  it('should create stream from promise', async () => {
    const promise = Promise.resolve('hello');
    const stream = StreamUtils.fromPromise(promise);
    const chunks: string[] = [];

    const reader = stream.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }
    } finally {
      reader.releaseLock();
    }

    expect(chunks).toEqual(['hello']);
  });

  it('should create stream from generator', async () => {
    function* generator() {
      yield 1;
      yield 2;
      yield 3;
    }

    const stream = StreamUtils.fromGenerator(generator());
    const chunks: number[] = [];

    const reader = stream.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }
    } finally {
      reader.releaseLock();
    }

    expect(chunks).toEqual([1, 2, 3]);
  });

  it('should create stream from async generator', async () => {
    async function* asyncGenerator() {
      yield 1;
      yield 2;
      yield 3;
    }

    const stream = StreamUtils.fromGenerator(asyncGenerator());
    const chunks: number[] = [];

    const reader = stream.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }
    } finally {
      reader.releaseLock();
    }

    expect(chunks).toEqual([1, 2, 3]);
  });
});
