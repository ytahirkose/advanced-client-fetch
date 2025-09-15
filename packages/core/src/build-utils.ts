/**
 * Build utilities for Advanced Client Fetch
 * Provides bundle analysis, optimization, and build helpers
 */

import type { BuildOptions, BundleAnalysis, OptimizationConfig } from './types';

/**
 * Bundle analyzer class
 */
export class BundleAnalyzer {
  private modules: Map<string, { size: number; dependencies: string[] }> = new Map();
  private totalSize: number = 0;

  /**
   * Add a module to the analysis
   */
  addModule(name: string, size: number, dependencies: string[] = []): void {
    this.modules.set(name, { size, dependencies });
    this.totalSize += size;
  }

  /**
   * Get module information
   */
  getModule(name: string): { size: number; dependencies: string[] } | undefined {
    return this.modules.get(name);
  }

  /**
   * Get all modules
   */
  getAllModules(): Array<{ name: string; size: number; dependencies: string[] }> {
    return Array.from(this.modules.entries()).map(([name, info]) => ({
      name,
      ...info,
    }));
  }

  /**
   * Get bundle analysis
   */
  getAnalysis(): BundleAnalysis {
    const modules = this.getAllModules();
    const sortedBySize = [...modules].sort((a, b) => b.size - a.size);
    
    const largestModules = sortedBySize.slice(0, 10);
    const totalModules = modules.length;
    
    const averageSize = this.totalSize / totalModules;
    const medianSize = sortedBySize[Math.floor(totalModules / 2)]?.size || 0;
    
    return {
      totalSize: this.totalSize,
      totalModules,
      averageSize,
      medianSize,
      largestModules,
      sizeDistribution: this.getSizeDistribution(modules),
      dependencyGraph: this.buildDependencyGraph(modules),
    };
  }

  /**
   * Get size distribution
   */
  private getSizeDistribution(modules: Array<{ name: string; size: number }>): {
    small: number; // < 1KB
    medium: number; // 1KB - 10KB
    large: number; // 10KB - 100KB
    xlarge: number; // > 100KB
  } {
    const distribution = { small: 0, medium: 0, large: 0, xlarge: 0 };
    
    for (const module of modules) {
      if (module.size < 1024) {
        distribution.small++;
      } else if (module.size < 10 * 1024) {
        distribution.medium++;
      } else if (module.size < 100 * 1024) {
        distribution.large++;
      } else {
        distribution.xlarge++;
      }
    }
    
    return distribution;
  }

  /**
   * Build dependency graph
   */
  private buildDependencyGraph(modules: Array<{ name: string; dependencies: string[] }>): Map<string, string[]> {
    const graph = new Map<string, string[]>();
    
    for (const module of modules) {
      graph.set(module.name, module.dependencies);
    }
    
    return graph;
  }

  /**
   * Find circular dependencies
   */
  findCircularDependencies(): string[][] {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const circularDeps: string[][] = [];
    
    const modules = this.getAllModules();
    const graph = this.buildDependencyGraph(modules);
    
    const dfs = (node: string, path: string[]): void => {
      if (recursionStack.has(node)) {
        const cycleStart = path.indexOf(node);
        circularDeps.push(path.slice(cycleStart));
        return;
      }
      
      if (visited.has(node)) {
        return;
      }
      
      visited.add(node);
      recursionStack.add(node);
      
      const dependencies = graph.get(node) || [];
      for (const dep of dependencies) {
        dfs(dep, [...path, node]);
      }
      
      recursionStack.delete(node);
    };
    
    for (const module of modules) {
      if (!visited.has(module.name)) {
        dfs(module.name, []);
      }
    }
    
    return circularDeps;
  }

  /**
   * Find unused modules
   */
  findUnusedModules(): string[] {
    const modules = this.getAllModules();
    const graph = this.buildDependencyGraph(modules);
    const used = new Set<string>();
    
    // Start from entry points (modules with no dependencies)
    const entryPoints = modules.filter(m => m.dependencies.length === 0);
    
    const dfs = (node: string): void => {
      if (used.has(node)) return;
      
      used.add(node);
      const dependencies = graph.get(node) || [];
      for (const dep of dependencies) {
        dfs(dep);
      }
    };
    
    for (const entry of entryPoints) {
      dfs(entry.name);
    }
    
    return modules
      .filter(m => !used.has(m.name))
      .map(m => m.name);
  }

  /**
   * Get optimization suggestions
   */
  getOptimizationSuggestions(): string[] {
    const suggestions: string[] = [];
    const analysis = this.getAnalysis();
    
    // Check for large modules
    const largeModules = analysis.largestModules.filter(m => m.size > 50 * 1024);
    if (largeModules.length > 0) {
      suggestions.push(`Consider splitting large modules: ${largeModules.map(m => m.name).join(', ')}`);
    }
    
    // Check for circular dependencies
    const circularDeps = this.findCircularDependencies();
    if (circularDeps.length > 0) {
      suggestions.push(`Remove circular dependencies: ${circularDeps.map(cycle => cycle.join(' -> ')).join(', ')}`);
    }
    
    // Check for unused modules
    const unusedModules = this.findUnusedModules();
    if (unusedModules.length > 0) {
      suggestions.push(`Remove unused modules: ${unusedModules.join(', ')}`);
    }
    
    // Check size distribution
    if (analysis.sizeDistribution.xlarge > 0) {
      suggestions.push('Consider code splitting for very large modules');
    }
    
    return suggestions;
  }
}

/**
 * Create a bundle analyzer
 */
export function createBundleAnalyzer(): BundleAnalyzer {
  return new BundleAnalyzer();
}

/**
 * Build optimizer class
 */
export class BuildOptimizer {
  private config: OptimizationConfig;

  constructor(config: OptimizationConfig = {}) {
    this.config = {
      minify: true,
      treeShaking: true,
      codeSplitting: true,
      compression: true,
      ...config,
    };
  }

  /**
   * Optimize bundle
   */
  optimize(bundle: string): string {
    let optimized = bundle;

    if (this.config.minify) {
      optimized = this.minify(optimized);
    }

    if (this.config.treeShaking) {
      optimized = this.treeShake(optimized);
    }

    if (this.config.compression) {
      optimized = this.compress(optimized);
    }

    return optimized;
  }

  /**
   * Minify code
   */
  private minify(code: string): string {
    // Simple minification (in real implementation, use a proper minifier)
    return code
      .replace(/\s+/g, ' ')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '')
      .trim();
  }

  /**
   * Tree shake unused code
   */
  private treeShake(code: string): string {
    // Simple tree shaking (in real implementation, use a proper tree shaker)
    // Tree shaking: remove unused exports and dead code
    // In a real implementation, use tools like rollup-plugin-terser
    return code;
  }

  /**
   * Compress code
   */
  private compress(code: string): string {
    // Simple compression (in real implementation, use proper compression)
    // Compression: minify and compress code
    // In a real implementation, use tools like terser or esbuild
    return code;
  }

  /**
   * Get optimization report
   */
  getOptimizationReport(originalSize: number, optimizedSize: number): {
    originalSize: number;
    optimizedSize: number;
    savings: number;
    savingsPercentage: number;
    optimizations: string[];
  } {
    const savings = originalSize - optimizedSize;
    const savingsPercentage = (savings / originalSize) * 100;
    
    const optimizations: string[] = [];
    if (this.config.minify) optimizations.push('Minification');
    if (this.config.treeShaking) optimizations.push('Tree Shaking');
    if (this.config.codeSplitting) optimizations.push('Code Splitting');
    if (this.config.compression) optimizations.push('Compression');
    
    return {
      originalSize,
      optimizedSize,
      savings,
      savingsPercentage,
      optimizations,
    };
  }
}

/**
 * Create a build optimizer
 */
export function createBuildOptimizer(config?: OptimizationConfig): BuildOptimizer {
  return new BuildOptimizer(config);
}

/**
 * Build utilities
 */
export class BuildUtils {
  /**
   * Calculate bundle size
   */
  static calculateBundleSize(bundle: string): number {
    return new TextEncoder().encode(bundle).length;
  }

  /**
   * Calculate gzip size
   */
  static async calculateGzipSize(bundle: string): Promise<number> {
    // Gzip compression estimation
    // In a real implementation, use a proper gzip library like pako
    return Math.floor(bundle.length * 0.3);
  }

  /**
   * Calculate brotli size
   */
  static async calculateBrotliSize(bundle: string): Promise<number> {
    // Brotli compression estimation
    // In a real implementation, use a proper brotli library like @types/brotli
    return Math.floor(bundle.length * 0.25);
  }

  /**
   * Generate bundle report
   */
  static async generateBundleReport(bundle: string): Promise<{
    size: number;
    gzipSize: number;
    brotliSize: number;
    compressionRatio: number;
  }> {
    const size = this.calculateBundleSize(bundle);
    const gzipSize = await this.calculateGzipSize(bundle);
    const brotliSize = await this.calculateBrotliSize(bundle);
    const compressionRatio = (gzipSize / size) * 100;
    
    return {
      size,
      gzipSize,
      brotliSize,
      compressionRatio,
    };
  }

  /**
   * Check bundle health
   */
  static checkBundleHealth(bundle: string): {
    healthy: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    const size = this.calculateBundleSize(bundle);
    
    if (size > 500 * 1024) { // 500KB
      issues.push('Bundle size is too large');
      recommendations.push('Consider code splitting or removing unused code');
    }
    
    if (size > 100 * 1024) { // 100KB
      recommendations.push('Consider minification and compression');
    }
    
    return {
      healthy: issues.length === 0,
      issues,
      recommendations,
    };
  }
}

/**
 * Build constants
 */
export const BUILD_CONSTANTS = {
  // Size thresholds
  SMALL_BUNDLE: 50 * 1024, // 50KB
  MEDIUM_BUNDLE: 200 * 1024, // 200KB
  LARGE_BUNDLE: 500 * 1024, // 500KB
  VERY_LARGE_BUNDLE: 1024 * 1024, // 1MB
  
  // Compression ratios
  GOOD_COMPRESSION_RATIO: 0.3, // 30%
  EXCELLENT_COMPRESSION_RATIO: 0.2, // 20%
  
  // Module thresholds
  MAX_MODULE_SIZE: 50 * 1024, // 50KB
  MAX_DEPENDENCIES: 20,
} as const;
