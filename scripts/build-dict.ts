import * as fs from "fs";
import * as path from "path";
import { ipaToArpabet } from "../src/utils";

interface DictEntry {
  [word: string]: string;
}

function parseDict(content: string): DictEntry {
  const lines = content.split("\n");

  const dict: DictEntry = {};

  for (const line of lines) {
    if (line.startsWith(";;;") || line.startsWith("# ") || line.trim() === "")
      continue;

    const match = line.match(/^(.+)\t((?:\/.+\/)+)$/);
    if (!match) continue;

    let [, word, phonesStr] = match;

    const ipa = phonesStr.match(/^\/([^\/]+)\//)?.[1];
    if (!ipa) continue;
    dict[word.toLowerCase()] = ipaToArpabet(ipa);
  }

  return dict;
}

function loadCmuDict(content: string): DictEntry {
  const lines = content.split("\n");

  const arpaDict: DictEntry = {};

  for (const line of lines) {
    if (line.startsWith("#") || line.startsWith(";") || line.trim() === "")
      continue;

    const match = line.match(/^([a-zA-Z']+(?:\((\d+)\))?)\s+(.+)$/);
    if (!match) continue;

    let [, word, variantNo, phonesStr] = match;
    if (!word || !phonesStr || variantNo) continue;

    // remove comment
    phonesStr = phonesStr.replace(/# .*$/, "").trim();

    const arpaPhones = phonesStr.trim().split(/\s+/);
    const arpaPhonemes = arpaPhones.join(" ");

    arpaDict[word.toLowerCase()] = arpaPhonemes;
  }

  return arpaDict;
}

function trimDictionary(dictionary: DictEntry): DictEntry {
  const trimmedDict = { ...dictionary };
  let totalRemoved = 0;

  // Rule 1: Remove predictable plural forms (-s, -es)
  Object.keys(dictionary).forEach(word => {
    // Simple plural -s
    if (word.endsWith('s') && word.length > 2 && !word.endsWith('ss')) {
      const singular = word.slice(0, -1);
      if (dictionary[singular]) {
        const singularPron = dictionary[singular];
        const pluralPron = dictionary[word];
        
        // If plural pronunciation is singular + S/Z/IH Z, remove it
        if (pluralPron === singularPron + ' S' || 
            pluralPron === singularPron + ' Z' ||
            pluralPron === singularPron + ' IH Z') {
          delete trimmedDict[word];
          totalRemoved++;
        }
      }
    }
    
    // -es plural
    if (word.endsWith('es') && word.length > 3) {
      const singular = word.slice(0, -2);
      if (dictionary[singular]) {
        const singularPron = dictionary[singular];
        const pluralPron = dictionary[word];
        
        if (pluralPron === singularPron + ' IH Z') {
          delete trimmedDict[word];
          totalRemoved++;
        }
      }
    }
  });

  // Rule 2: Remove predictable past tense (-ed)
  Object.keys(dictionary).forEach(word => {
    if (word.endsWith('ed') && word.length > 3) {
      const base = word.slice(0, -2);
      if (dictionary[base]) {
        const basePron = dictionary[base];
        const pastPron = dictionary[word];
        
        // Check for regular past tense pronunciation
        if (pastPron === basePron + ' D' || 
            pastPron === basePron + ' T' ||
            pastPron === basePron + ' IH D') {
          delete trimmedDict[word];
          totalRemoved++;
        }
      }
    }
  });

  // Rule 3: Remove predictable present participle (-ing)
  Object.keys(dictionary).forEach(word => {
    if (word.endsWith('ing') && word.length > 4) {
      const base = word.slice(0, -3);
      if (dictionary[base]) {
        const basePron = dictionary[base];
        const presentPron = dictionary[word];
        
        // Check for regular present participle pronunciation
        if (presentPron === basePron + ' IH NG') {
          delete trimmedDict[word];
          totalRemoved++;
        }
      }
    }
  });

  console.log(`Removed ${totalRemoved} predictable word forms`);
  return trimmedDict;
}

async function main(): Promise<void> {
  console.log("Building phoneme dictionaries...");

  const projectRoot = process.cwd();
  const dataDir = path.join(projectRoot, "data");

  // Ensure data directory exists
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  {
    // Parse Dictionary
    const res = await fetch(
      "https://raw.githubusercontent.com/open-dict-data/ipa-dict/refs/heads/master/data/en_US.txt",
    );
    const dict = parseDict(await res.text());
    console.log(`Loaded ${Object.keys(dict).length} entries from Dictionary`);

    // Load custom dictionary
    const customDictPath = new URL("../src-data/custom.dict", import.meta.url)
      .pathname;
    const customDict = loadCmuDict(fs.readFileSync(customDictPath, "utf-8"));
    console.log(
      `Loaded ${Object.keys(customDict).length} entries from custom dictionary`,
    );

    // Merge dictionaries (custom overrides CMU)
    const finalArpaDict = { ...dict, ...customDict };

    // Apply dictionary trimming
    console.log("\nApplying dictionary trimming...");
    const trimmedDict = trimDictionary(finalArpaDict);
    const originalSize = Object.keys(finalArpaDict).length;
    const trimmedSize = Object.keys(trimmedDict).length;
    const reduction = originalSize - trimmedSize;
    const reductionPercent = ((reduction / originalSize) * 100).toFixed(2);
    
    console.log(`Original size: ${originalSize}`);
    console.log(`Trimmed size: ${trimmedSize}`);
    console.log(`Reduced by: ${reduction} entries (${reductionPercent}%)`);

    // Save ARPABET dictionary (now trimmed)
    const arpaPath = path.join(dataDir, "dict.json");
    fs.writeFileSync(arpaPath, JSON.stringify(trimmedDict, null, 2));
    console.log(`Saved dictionary to: ${arpaPath}`);
    console.log(`Total entries: ${Object.keys(trimmedDict).length}`);
  }

  {
    // Load and parse homographs
    const res = await fetch(
      "https://raw.githubusercontent.com/Kyubyong/g2p/master/g2p_en/homographs.en",
    );
    if (res.ok) {
      console.log(`Parsing homographs from: ${res.url}`);
      const homographDict = parseHomographs(await res.text());
      const homographsDestPath = path.join(dataDir, "homographs.json");
      fs.writeFileSync(
        homographsDestPath,
        JSON.stringify(homographDict, null, 2),
      );
      console.log(`Saved homographs to: ${homographsDestPath}`);
    }

    // Load custom homographs
    const customHomographsPath = new URL("../src-data/homographs-custom.txt", import.meta.url)
      .pathname;
    const customHomographs = parseHomographs(fs.readFileSync(customHomographsPath, "utf-8"));
    console.log(
      `Loaded ${Object.keys(customHomographs).length} entries from custom homographs`,
    );
  }

  console.log("Dictionary build complete!");
}

interface HomographEntry {
  pronunciation: string;
  pos: string;
}

interface HomographDict {
  [word: string]: HomographEntry[];
}

function parseHomographs(content: string): HomographDict {
  const lines = content.split("\n");
  const homographDict: HomographDict = {};

  for (const line of lines) {
    if (line.startsWith("#") || line.trim() === "") continue;

    const parts = line.split("|");
    if (parts.length !== 4) continue;

    const [word, pron1, pron2, pos] = parts;
    const lowerWord = word.toLowerCase();

    if (!homographDict[lowerWord]) {
      homographDict[lowerWord] = [];
    }

    // The logic is: use pron1 if the POS matches, otherwise use pron2.
    // We can store this as a condition. For simplicity, we store both with their POS triggers.
    // The runtime will decide which to use.
    homographDict[lowerWord].push({ pronunciation: pron1, pos: pos });
    homographDict[lowerWord].push({ pronunciation: pron2, pos: `!${pos}` }); // Representing "not POS"
  }

  return homographDict;
}

if (require.main === module) {
  main();
}
