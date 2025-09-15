/**
 * Stream utilities for HyperHTTP
 * Provides stream conversion and manipulation utilities
 */

import type { StreamOptions } from './types.js';

/**
 * Convert a Web Stream to Node.js Readable
 */
export function streamToNodeReadable(stream: ReadableStream): NodeJS.ReadableStream {
  // This is a simplified implementation
  // In a real implementation, you'd need to handle the conversion properly
  const reader = stream.getReader();
  
  return {
    read() {
      return reader.read().then(({ done, value }) => ({
        done,
        value: done ? null : Buffer.from(value)
      }));
    },
    [Symbol.asyncIterator]() {
      return this;
    },
    async next() {
      const result = await this.read();
      return { done: result.done, value: result.value };
    }
  } as any;
}

/**
 * Convert a Node.js Readable to Web Stream
 */
export function nodeReadableToStream(readable: NodeJS.ReadableStream): ReadableStream {
  return new ReadableStream({
    start(controller) {
      readable.on('data', (chunk) => {
        controller.enqueue(new Uint8Array(chunk));
      });
      
      readable.on('end', () => {
        controller.close();
      });
      
      readable.on('error', (error) => {
        controller.error(error);
      });
    }
  });
}

/**
 * Create a transform stream
 */
export function createTransformStream<T, U>(
  transform: (chunk: T) => U | Promise<U>,
  options: StreamOptions = {}
): TransformStream<T, U> {
  return new TransformStream({
    transform(chunk, controller) {
      const result = transform(chunk);
      
      if (result instanceof Promise) {
        return result.then(transformed => {
          controller.enqueue(transformed);
        });
      } else {
        controller.enqueue(result);
      }
    }
  });
}

/**
 * Create a filter stream
 */
export function createFilterStream<T>(
  predicate: (chunk: T) => boolean | Promise<boolean>,
  options: StreamOptions = {}
): TransformStream<T, T> {
  return new TransformStream({
    async transform(chunk, controller) {
      const shouldInclude = await predicate(chunk);
      if (shouldInclude) {
        controller.enqueue(chunk);
      }
    }
  });
}

/**
 * Create a map stream
 */
export function createMapStream<T, U>(
  mapper: (chunk: T) => U | Promise<U>,
  options: StreamOptions = {}
): TransformStream<T, U> {
  return createTransformStream(mapper, options);
}

/**
 * Create a reduce stream
 */
export function createReduceStream<T, U>(
  reducer: (accumulator: U, chunk: T) => U | Promise<U>,
  initialValue: U,
  options: StreamOptions = {}
): TransformStream<T, U> {
  let accumulator = initialValue;
  
  return new TransformStream({
    async transform(chunk, controller) {
      accumulator = await reducer(accumulator, chunk);
      controller.enqueue(accumulator);
    }
  });
}

/**
 * Convert stream to buffer
 */
export async function streamToBuffer(stream: ReadableStream): Promise<Buffer> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  
  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  
  return Buffer.from(result);
}

/**
 * Convert stream to string
 */
export async function streamToString(stream: ReadableStream, encoding: BufferEncoding = 'utf8'): Promise<string> {
  const buffer = await streamToBuffer(stream);
  return buffer.toString(encoding);
}

/**
 * Convert stream to JSON
 */
export async function streamToJSON<T = any>(stream: ReadableStream): Promise<T> {
  const text = await streamToString(stream);
  return JSON.parse(text);
}

/**
 * Convert buffer to stream
 */
export function bufferToStream(buffer: Buffer): ReadableStream {
  return new ReadableStream({
    start(controller) {
      controller.enqueue(new Uint8Array(buffer));
      controller.close();
    }
  });
}

/**
 * Convert string to stream
 */
export function stringToStream(str: string, encoding: BufferEncoding = 'utf8'): ReadableStream {
  const buffer = Buffer.from(str, encoding);
  return bufferToStream(buffer);
}

/**
 * Convert JSON to stream
 */
export function jsonToStream(obj: any): ReadableStream {
  const json = JSON.stringify(obj);
  return stringToStream(json);
}

/**
 * Pipe streams together
 */
export function pipeStreams<T>(
  source: ReadableStream<T>,
  ...transforms: TransformStream<T, any>[]
): ReadableStream {
  let current = source;
  
  for (const transform of transforms) {
    current = current.pipeThrough(transform);
  }
  
  return current;
}

/**
 * Create a limit stream (limit number of chunks)
 */
export function createLimitStream<T>(limit: number): TransformStream<T, T> {
  let count = 0;
  
  return new TransformStream({
    transform(chunk, controller) {
      if (count < limit) {
        controller.enqueue(chunk);
        count++;
      } else {
        controller.terminate();
      }
    }
  });
}

/**
 * Create a skip stream (skip first N chunks)
 */
export function createSkipStream<T>(skip: number): TransformStream<T, T> {
  let count = 0;
  
  return new TransformStream({
    transform(chunk, controller) {
      if (count >= skip) {
        controller.enqueue(chunk);
      }
      count++;
    }
  });
}

/**
 * Create a take stream (take first N chunks)
 */
export function createTakeStream<T>(take: number): TransformStream<T, T> {
  return createLimitStream(take);
}

/**
 * Create a collect stream (collect all chunks into an array)
 */
export function createCollectStream<T>(): TransformStream<T, T[]> {
  const chunks: T[] = [];
  
  return new TransformStream({
    transform(chunk, controller) {
      chunks.push(chunk);
    },
    flush(controller) {
      controller.enqueue([...chunks]);
    }
  });
}

/**
 * Create a split stream (split by delimiter)
 */
export function createSplitStream(delimiter: string): TransformStream<string, string> {
  let buffer = '';
  
  return new TransformStream({
    transform(chunk, controller) {
      buffer += chunk;
      const parts = buffer.split(delimiter);
      
      // Keep the last part in buffer (might be incomplete)
      buffer = parts.pop() || '';
      
      // Emit all complete parts
      for (const part of parts) {
        if (part) {
          controller.enqueue(part);
        }
      }
    },
    flush(controller) {
      if (buffer) {
        controller.enqueue(buffer);
      }
    }
  });
}

/**
 * Stream options interface
 */
export interface StreamOptions {
  highWaterMark?: number;
  encoding?: BufferEncoding;
  objectMode?: boolean;
}

/**
 * Stream utilities class
 */
export class StreamUtils {
  /**
   * Create a readable stream from an async iterator
   */
  static fromAsyncIterator<T>(iterator: AsyncIterator<T>): ReadableStream<T> {
    return new ReadableStream({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await iterator.next();
            if (done) {
              controller.close();
              break;
            }
            controller.enqueue(value);
          }
        } catch (error) {
          controller.error(error);
        }
      }
    });
  }
  
  /**
   * Create a readable stream from an array
   */
  static fromArray<T>(array: T[]): ReadableStream<T> {
    return new ReadableStream({
      start(controller) {
        for (const item of array) {
          controller.enqueue(item);
        }
        controller.close();
      }
    });
  }
  
  /**
   * Create a readable stream from a generator
   */
  static fromGenerator<T>(generator: Generator<T> | AsyncGenerator<T>): ReadableStream<T> {
    return new ReadableStream({
      async start(controller) {
        try {
          for await (const value of generator) {
            controller.enqueue(value);
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      }
    });
  }
  
  /**
   * Create a readable stream from a promise
   */
  static fromPromise<T>(promise: Promise<T>): ReadableStream<T> {
    return new ReadableStream({
      async start(controller) {
        try {
          const value = await promise;
          controller.enqueue(value);
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      }
    });
  }
  
  /**
   * Create a readable stream that emits values at intervals
   */
  static fromInterval<T>(
    interval: number,
    valueFactory: () => T | Promise<T>
  ): ReadableStream<T> {
    return new ReadableStream({
      start(controller) {
        const timer = setInterval(async () => {
          try {
            const value = await valueFactory();
            controller.enqueue(value);
          } catch (error) {
            controller.error(error);
          }
        }, interval);
        
        // Clean up on cancel
        controller.desiredSize = 0;
        return () => clearInterval(timer);
      }
    });
  }
  
  /**
   * Create a readable stream that emits values from an event emitter
   */
  static fromEventEmitter<T>(
    emitter: NodeJS.EventEmitter,
    eventName: string
  ): ReadableStream<T> {
    return new ReadableStream({
      start(controller) {
        const handler = (value: T) => {
          controller.enqueue(value);
        };
        
        emitter.on(eventName, handler);
        
        // Clean up on cancel
        return () => {
          emitter.off(eventName, handler);
        };
      }
    });
  }
}