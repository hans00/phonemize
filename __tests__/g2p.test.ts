import { 
  G2PProcessor, 
  detectLanguage
} from '../src/g2p';

// Mock G2P processor for testing
class MockG2PProcessor implements G2PProcessor {
  readonly id = "mock-processor";
  readonly name = "Mock G2P Processor";
  readonly supportedLanguages = ["en", "test"];

  predict(word: string, language?: string, pos?: string): string | null {
    if (language && !this.supportedLanguages.includes(language)) {
      return null;
    }
    return `mock-${word}`;
  }

  addPronunciation(word: string, pronunciation: string): void {
    // Mock implementation
  }
}

class MockG2PProcessor2 implements G2PProcessor {
  readonly id = "mock-processor-2";
  readonly name = "Mock G2P Processor 2";
  readonly supportedLanguages = ["zh", "ja"];

  predict(word: string, language?: string, pos?: string): string | null {
    if (language && !this.supportedLanguages.includes(language)) {
      return null;
    }
    return `mock2-${word}`;
  }

  addPronunciation(word: string, pronunciation: string): void {
    // Mock implementation
  }
}

// Create a local registry class for testing
class TestG2PRegistry {
  private processors: Map<string, G2PProcessor> = new Map();
  private languageMap: Map<string, G2PProcessor[]> = new Map();
  
  register(processor: G2PProcessor): void {
    this.processors.set(processor.id, processor);
    
    for (const lang of processor.supportedLanguages) {
      if (!this.languageMap.has(lang)) {
        this.languageMap.set(lang, []);
      }
      this.languageMap.get(lang)!.push(processor);
    }
  }
  
  getProcessor(id: string): G2PProcessor | undefined {
    return this.processors.get(id);
  }
  
  getProcessorsForLanguage(language: string): G2PProcessor[] {
    return this.languageMap.get(language) || [];
  }
  
  getAllProcessors(): G2PProcessor[] {
    return Array.from(this.processors.values());
  }
  
  findBestProcessor(word: string, language?: string): G2PProcessor | null {
    if (language) {
      const langProcessors = this.getProcessorsForLanguage(language);
      if (langProcessors.length > 0) {
        return langProcessors[0];
      }
    }
    
    const allProcessors = Array.from(this.processors.values());
    if (allProcessors.length > 0) {
      return allProcessors[0];
    }
    
    return null;
  }

  clear(): void {
    this.processors.clear();
    this.languageMap.clear();
  }
}

describe('G2P Registry and Language Detection', () => {
  let registry: TestG2PRegistry;
  let processor1: MockG2PProcessor;
  let processor2: MockG2PProcessor2;

  beforeEach(() => {
    registry = new TestG2PRegistry();
    processor1 = new MockG2PProcessor();
    processor2 = new MockG2PProcessor2();
  });

  describe('G2PRegistry', () => {
    it('should register processors correctly', () => {
      registry.register(processor1);
      registry.register(processor2);

      expect(registry.getProcessor("mock-processor")).toEqual(processor1);
      expect(registry.getProcessor("mock-processor-2")).toEqual(processor2);
    });

    it('should get processors for specific language', () => {
      registry.register(processor1);
      registry.register(processor2);

      const enProcessors = registry.getProcessorsForLanguage("en");
      expect(enProcessors).toHaveLength(1);
      expect(enProcessors[0]).toEqual(processor1);

      const zhProcessors = registry.getProcessorsForLanguage("zh");
      expect(zhProcessors).toHaveLength(1);
      expect(zhProcessors[0]).toEqual(processor2);
    });

    it('should get all processors', () => {
      registry.register(processor1);
      registry.register(processor2);

      const allProcessors = registry.getAllProcessors();
      expect(allProcessors).toHaveLength(2);
      expect(allProcessors).toContain(processor1);
      expect(allProcessors).toContain(processor2);
    });

    it('should find best processor for word and language', () => {
      registry.register(processor1);
      registry.register(processor2);

      // Test with specific language
      const enProcessor = registry.findBestProcessor("test", "en");
      expect(enProcessor).toEqual(processor1);

      const zhProcessor = registry.findBestProcessor("test", "zh");
      expect(zhProcessor).toEqual(processor2);

      // Test without language specification
      const anyProcessor = registry.findBestProcessor("test");
      expect(anyProcessor).toEqual(processor1); // First registered processor
    });

    it('should return null when no processor found', () => {
      const processor = registry.findBestProcessor("test", "unknown");
      expect(processor).toBeNull();
    });

    it('should clear all processors', () => {
      registry.register(processor1);
      registry.register(processor2);

      expect(registry.getAllProcessors()).toHaveLength(2);

      registry.clear();

      expect(registry.getAllProcessors()).toHaveLength(0);
      expect(registry.getProcessorsForLanguage("en")).toHaveLength(0);
    });
  });

  describe('Language Detection', () => {
    it('should detect Chinese characters', () => {
      expect(detectLanguage('你好')).toEqual('zh');
      expect(detectLanguage('世界')).toEqual('zh');
    });

    it('should detect Japanese characters', () => {
      expect(detectLanguage('こんにちは')).toEqual('ja');
      expect(detectLanguage('カタカナ')).toEqual('ja');
    });

    it('should detect Korean characters', () => {
      expect(detectLanguage('안녕하세요')).toEqual('ko');
      expect(detectLanguage('한국어')).toEqual('ko');
    });

    it('should detect Russian characters', () => {
      expect(detectLanguage('привет')).toEqual('ru');
      expect(detectLanguage('мир')).toEqual('ru');
    });

    it('should detect German characters', () => {
      expect(detectLanguage('grüße')).toEqual('de');
      expect(detectLanguage('Müller')).toEqual('de');
    });

    it('should detect Arabic characters', () => {
      expect(detectLanguage('مرحبا')).toEqual('ar');
      expect(detectLanguage('عالم')).toEqual('ar');
    });

    it('should detect Thai characters', () => {
      expect(detectLanguage('สวัสดี')).toEqual('th');
      expect(detectLanguage('โลก')).toEqual('th');
    });

    it('should return null for unsupported languages', () => {
      expect(detectLanguage('hello')).toBeNull();
      expect(detectLanguage('123')).toBeNull();
      expect(detectLanguage('')).toBeNull();
    });
  });

  describe('Processor Integration', () => {
    it('should handle processor prediction with language filtering', () => {
      registry.register(processor1);
      registry.register(processor2);

      // Test English processor
      const enResult = processor1.predict("hello", "en");
      expect(enResult).toEqual("mock-hello");

      // Test Chinese processor
      const zhResult = processor2.predict("你好", "zh");
      expect(zhResult).toEqual("mock2-你好");

      // Test language mismatch
      const mismatchResult = processor1.predict("hello", "zh");
      expect(mismatchResult).toBeNull();
    });

    it('should handle processor prediction without language specification', () => {
      registry.register(processor1);
      registry.register(processor2);

      const result1 = processor1.predict("hello");
      expect(result1).toEqual("mock-hello");

      const result2 = processor2.predict("你好");
      expect(result2).toEqual("mock2-你好");
    });
  });
}); 