#!/usr/bin/env node

const { phonemize, useG2P } = require('../dist/index');
const ChineseG2P = require('../dist/zh-g2p');
const JapaneseG2P = require('../dist/ja-g2p');
const KoreanG2P = require('../dist/ko-g2p');
const RussianG2P = require('../dist/ru-g2p');

useG2P(new ChineseG2P());
useG2P(new JapaneseG2P());
useG2P(new KoreanG2P());
useG2P(new RussianG2P());

function runPerformanceBenchmark() {
  // Test different scenarios
  const scenarios = [
    { name: 'Basic words', words: ['hello', 'world', 'phonemize', 'testing', 'performance'], iterations: 1000 },
    { name: 'Compound words', words: ['supercar', 'playground', 'superman', 'overload'], iterations: 500 },
    { name: 'Long words', words: ['pneumonoultramicroscopicsilicovolcanoconiosis', 'supercalifragilisticexpialidocious'], iterations: 100 },
    { name: 'Multilingual', words: ['hello', '中文', 'こんにちは', '한국어'], iterations: 200, options: { anyAscii: true } }
  ];
  
  let totalTime = 0;
  let totalWords = 0;
  let results = [];
  
  scenarios.forEach(scenario => {
    const start = process.hrtime.bigint();
    for (let i = 0; i < scenario.iterations; i++) {
      scenario.words.forEach(word => phonemize(word, scenario.options || {}));
    }
    const end = process.hrtime.bigint();
    const duration = Number(end - start) / 1000000;
    const wordCount = scenario.words.length * scenario.iterations;
    const avgPerWord = duration / wordCount;
    
    totalTime += duration;
    totalWords += wordCount;
    
    results.push({
      name: scenario.name,
      duration: duration.toFixed(2),
      wordCount,
      avgPerWord: avgPerWord.toFixed(4)
    });
  });
  
  const overallAvg = (totalTime / totalWords).toFixed(4);
  const throughput = Math.round(totalWords / (totalTime / 1000));
  
  console.log('## 🚀 Performance Test Results');
  console.log('');
  console.log('| Scenario | Words | Duration (ms) | Avg per word (ms) |');
  console.log('|----------|-------|---------------|-------------------|');
  results.forEach(r => {
    console.log(`| ${r.name} | ${r.wordCount} | ${r.duration} | ${r.avgPerWord} |`);
  });
  console.log('');
  console.log(`**Overall Performance:**`);
  console.log(`- Total words processed: ${totalWords}`);
  console.log(`- Total time: ${totalTime.toFixed(2)}ms`);
  console.log(`- Average per word: ${overallAvg}ms`);
  console.log(`- Throughput: ${throughput} words/second`);
  console.log('');
  
  if (totalTime > 10000) {
    console.log('⚠️ **Performance Warning**: Test took longer than expected');
    process.exit(1);
  } else if (throughput < 5000) {
    console.log('⚠️ **Performance Warning**: Throughput below 5000 words/second');
    process.exit(1);
  } else {
    console.log('✅ **Performance**: All benchmarks passed');
  }
}

// Run the benchmark
runPerformanceBenchmark(); 