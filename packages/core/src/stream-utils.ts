/**
 * Stream utilities for HyperHTTP
 */

export interface StreamOptions {
  highWaterMark?: number;
  encoding?: string;
}

/**
 * Convert ReadableStream to Node.js Readable
 */
export function streamToNodeReadable(stream: ReadableStream): any {
  if (typeof process !== 'undefined' && process.versions?.node) {
    try {
      const { Readable } = require('node:stream');
      return Readable.fromWeb(stream);
    } catch {
      return stream;
    }
  }
  return stream;
}

/**
 * Convert Node.js Readable to ReadableStream
 */
export function nodeReadableToStream(readable: any): ReadableStream {
  if (typeof process !== 'undefined' && process.versions?.node) {
    try {
      // @ts-ignore - ReadableStream.from is available in Node.js 20+
      return ReadableStream.from(readable);
    } catch {
      return readable;
    }
  }
  return readable;
}

/**
 * Create transform stream
 */
export function createTransformStream(
  transform: (chunk: any) => any,
  options?: StreamOptions
): TransformStream {
  return new TransformStream({
    transform(chunk, controller) {
      try {
        const result = transform(chunk);
        controller.enqueue(result);
      } catch (error) {
        controller.error(error);
      }
    }
  });
}

/**
 * Create filter stream
 */
export function createFilterStream(
  predicate: (chunk: any) => boolean,
  options?: StreamOptions
): TransformStream {
  return new TransformStream({
    transform(chunk, controller) {
      if (predicate(chunk)) {
        controller.enqueue(chunk);
      }
    }
  });
}

/**
 * Create map stream
 */
export function createMapStream(
  mapper: (chunk: any) => any,
  options?: StreamOptions
): TransformStream {
  return createTransformStream(mapper, options);
}

/**
 * Create reduce stream
 */
export function createReduceStream(
  reducer: (acc: any, chunk: any) => any,
  initialValue?: any,
  options?: StreamOptions
): TransformStream {
  let accumulator = initialValue;
  
  return new TransformStream({
    start(controller) {
      if (initialValue !== undefined) {
        controller.enqueue(initialValue);
      }
    },
    transform(chunk, controller) {
      try {
        accumulator = reducer(accumulator, chunk);
        controller.enqueue(accumulator);
      } catch (error) {
        controller.error(error);
      }
    }
  });
}

/**
 * Convert stream to buffer
 */
export async function streamToBuffer(stream: ReadableStream): Promise<ArrayBuffer> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }
    
    const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }
    
    return result.buffer;
  } finally {
    reader.releaseLock();
  }
}

/**
 * Convert stream to string
 */
export async function streamToString(stream: ReadableStream, encoding: string = 'utf-8'): Promise<string> {
  const buffer = await streamToBuffer(stream);
  const decoder = new TextDecoder(encoding);
  return decoder.decode(buffer);
}

/**
 * Convert stream to JSON
 */
export async function streamToJSON(stream: ReadableStream): Promise<any> {
  const text = await streamToString(stream);
  return JSON.parse(text);
}

/**
 * Convert buffer to stream
 */
export function bufferToStream(buffer: ArrayBuffer | Uint8Array): ReadableStream {
  return new ReadableStream({
    start(controller) {
      controller.enqueue(buffer);
      controller.close();
    }
  });
}

/**
 * Convert string to stream
 */
export function stringToStream(str: string, encoding: string = 'utf-8'): ReadableStream {
  const encoder = new TextEncoder();
  return bufferToStream(encoder.encode(str));
}

/**
 * Convert JSON to stream
 */
export function jsonToStream(obj: any): ReadableStream {
  const json = JSON.stringify(obj);
  return stringToStream(json);
}

/**
 * Pipe streams
 */
export function pipeStreams(
  source: ReadableStream,
  destination: WritableStream
): Promise<void> {
  return source.pipeTo(destination);
}

/**
 * Create limit stream
 */
export function createLimitStream(limit: number, options?: StreamOptions): TransformStream {
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
 * Create skip stream
 */
export function createSkipStream(skip: number, options?: StreamOptions): TransformStream {
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
 * Create take stream
 */
export function createTakeStream(take: number, options?: StreamOptions): TransformStream {
  return createLimitStream(take, options);
}

/**
 * Create collect stream
 */
export function createCollectStream(options?: StreamOptions): TransformStream {
  const chunks: any[] = [];
  
  return new TransformStream({
    transform(chunk, controller) {
      chunks.push(chunk);
    },
    flush(controller) {
      controller.enqueue(chunks);
    }
  });
}

/**
 * Create split stream
 */
export function createSplitStream(
  separator: string | RegExp,
  options?: StreamOptions
): TransformStream {
  let buffer = '';
  
  return new TransformStream({
    transform(chunk, controller) {
      buffer += chunk;
      const parts = buffer.split(separator);
      buffer = parts.pop() || '';
      
      for (const part of parts) {
        controller.enqueue(part);
      }
    },
    flush(controller) {
      if (buffer) {
        controller.enqueue(buffer);
      }
    }
  });
}