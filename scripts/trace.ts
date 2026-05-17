import EnglishG2P from '../src/en-g2p';

const words = process.argv.slice(2);
if (!words.length) {
  console.error('Usage: yarn trace <word> [word...]');
  process.exit(1);
}

const withDict  = new EnglishG2P();
const rulesOnly = new EnglishG2P({ disableDict: true });

for (const word of words) {
  const d = withDict.trace(word);
  const r = rulesOnly.trace(word);

  console.log(`\n${word}`);
  console.log(`  final:     /${d.ipa}/  [${d.path}]`);
  if (d.ipa !== r.ipa)
    console.log(`  rules-only:/${r.ipa}/`);
  if (r.syllables?.length)
    console.log(`  syllables: ${r.syllables.join(' · ')}`);
  if (r.steps.length) {
    console.log('  rule hits:');
    for (const s of r.steps)
      console.log(`    "${s.grapheme}" → /${s.phoneme}/  [${s.rule}]`);
  }
}
