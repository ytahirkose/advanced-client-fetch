/**
 * Progress tracking plugin for upload/download progress
 */

import type { Plugin, Context, RequestOptions } from '@advanced-client-fetch/core';

export interface ProgressPluginOptions {
  /** Enable upload progress tracking */
  enableUploadProgress?: boolean;
  /** Enable download progress tracking */
  enableDownloadProgress?: boolean;
  /** Progress event debounce interval in ms */
  debounceInterval?: number;
  /** Custom progress handler */
  onProgress?: (event: ProgressEvent, type: 'upload' | 'download') => void;
}

export interface ProgressEvent {
  loaded: number;
  total: number;
  lengthComputable: boolean;
  percent?: number;
}

/**
 * Progress tracking plugin
 */
export function progress(options: ProgressPluginOptions = {}): Plugin {
  const {
    enableUploadProgress = true,
    enableDownloadProgress = true,
    debounceInterval = 100,
    onProgress
  } = options as any;

  let lastProgressTime = 0;

  return {
    name: 'progress',
    priority: 1000,
    
    async onRequest(context: Context): Promise<void> {
      const { req, options } = context;
      
      // Upload progress tracking
      if (enableUploadProgress && options.onUploadProgress && req.body) {
        const body = req.body;
        if (body instanceof ReadableStream) {
          const reader = body.getReader();
          let loaded = 0;
          let total = 0;
          
          // Try to get content length
          const contentLength = req.headers.get('content-length');
          if (contentLength) {
            total = parseInt(contentLength, 10);
          }
          
          const progressStream = new ReadableStream({
            start(controller) {
              function pump(): Promise<void> {
                return reader.read().then(({ done, value }) => {
                  if (done) {
                    controller.close();
                    return;
                  }
                  
                  loaded += value.length;
                  
                  // Debounce progress events
                  const now = Date.now();
                  if (now - lastProgressTime >= debounceInterval) {
                    const progressEvent: ProgressEvent = {
                      loaded,
                      total,
                      lengthComputable: total > 0,
                      percent: total > 0 ? (loaded / total) * 100 : undefined
                    };
                    
                    options.onUploadProgress!(progressEvent);
                    if (onProgress) {
                      onProgress(progressEvent, 'upload');
                    }
                    
                    lastProgressTime = now;
                  }
                  
                  controller.enqueue(value);
                  return pump();
                });
              }
              
              return pump();
            }
          });
          
          // Replace the body with progress tracking stream
          context.req = new Request(req, {
            body: progressStream,
            headers: req.headers
          });
        }
      }
    },
    
    async onResponse(context: Context): Promise<void> {
      const { res, options } = context;
      
      // Download progress tracking
      if (enableDownloadProgress && options.onDownloadProgress) {
        const contentLength = res.headers.get('content-length');
        const total = contentLength ? parseInt(contentLength, 10) : 0;
        
        if (total > 0) {
          let loaded = 0;
          const reader = res.body?.getReader();
          
          if (reader) {
            const progressStream = new ReadableStream({
              start(controller) {
                function pump(): Promise<void> {
                  return reader.read().then(({ done, value }) => {
                    if (done) {
                      controller.close();
                      return;
                    }
                    
                    loaded += value.length;
                    
                    // Debounce progress events
                    const now = Date.now();
                    if (now - lastProgressTime >= debounceInterval) {
                      const progressEvent: ProgressEvent = {
                        loaded,
                        total,
                        lengthComputable: true,
                        percent: (loaded / total) * 100
                      };
                      
                      options.onDownloadProgress!(progressEvent);
                      if (onProgress) {
                        onProgress(progressEvent, 'download');
                      }
                      
                      lastProgressTime = now;
                    }
                    
                    controller.enqueue(value);
                    return pump();
                  });
                }
                
                return pump();
              }
            });
            
            // Replace the response body with progress tracking stream
            context.res = new Response(progressStream, {
              status: res.status,
              statusText: res.statusText,
              headers: res.headers
            });
          }
        }
      }
    }
  };
}

export default progress;
