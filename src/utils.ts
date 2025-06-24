/**
 * Utility functions for phoneme format conversion
 */

import { IPA_TO_ARPABET, IPA_TO_STRESS, ARPABET_TO_IPA, IPA_STRESS_MAP } from "./consts";

/**
 * Convert IPA phonetic notation to ARPABET format
 * @param ipa - IPA phonetic string
 * @returns ARPABET formatted string
 */
export function ipaToArpabet(ipa: string): string {
  if (!ipa || typeof ipa !== 'string' || !ipa.trim()) {
    return "";
  }
  
  const result: string[] = [];
  let i = 0;
  
  while (i < ipa.length) {
    const char = ipa[i];
    
    // Handle stress markers
    if (IPA_TO_STRESS[char]) {
      const stress = IPA_TO_STRESS[char];
      // Apply stress to the next phoneme
      i++;
      const nextPhoneme = getNextPhoneme(ipa, i);
      if (nextPhoneme) {
        result.push(nextPhoneme.arpabet + stress);
        i += nextPhoneme.length;
      }
      continue;
    }
    
    // Try two-character IPA symbols first
    const twoChar = ipa.substring(i, i + 2);
    if (IPA_TO_ARPABET[twoChar]) {
      result.push(IPA_TO_ARPABET[twoChar]);
      i += 2;
      continue;
    }
    
    // Try single character
    if (IPA_TO_ARPABET[char]) {
      result.push(IPA_TO_ARPABET[char]);
      i++;
      continue;
    }
    
    // Handle unknown characters
    if (char === ' ') {
      if (result.length > 0 && result[result.length - 1] !== ' ') {
        result.push(' ');
      }
    } else if (char.trim()) {
      // Unknown non-space character - push as undefined
      result.push('undefined');
    }
    i++;
  }
  
  return result.join(' ').replace(/\s+/g, ' ').trim();
}

/**
 * Convert ARPABET phonetic notation to IPA format
 * @param arpabet - ARPABET phonetic string  
 * @returns IPA formatted string
 */
export function arpabetToIpa(arpabet: string): string {
  if (!arpabet || typeof arpabet !== 'string' || !arpabet.trim()) {
    return "";
  }
  
  const phonemes = arpabet.split(/\s+/).filter(p => p.trim());
  const result: string[] = [];
  
  for (const phoneme of phonemes) {
    const stressMatch = phoneme.match(/([012])$/);
    const stress = stressMatch?.[0] || "";
    const basePhoneme = phoneme.replace(/[012]$/, "");
    
    const ipaPhoneme = ARPABET_TO_IPA[basePhoneme];
    if (ipaPhoneme) {
      const stressMarker = stress ? IPA_STRESS_MAP[stress] : "";
      result.push(stressMarker + ipaPhoneme);
    } else {
      // Preserve unknown phonemes as-is
      result.push(phoneme);
    }
  }
  
  return result.join("");
}

/**
 * Helper function to extract the next phoneme from IPA string
 * @param ipa - IPA string
 * @param startIndex - Starting index
 * @returns Object with ARPABET equivalent and length
 */
function getNextPhoneme(ipa: string, startIndex: number): { arpabet: string; length: number } | null {
  // Try two-character symbols first
  const twoChar = ipa.substring(startIndex, startIndex + 2);
  if (IPA_TO_ARPABET[twoChar]) {
    return { arpabet: IPA_TO_ARPABET[twoChar], length: 2 };
  }
  
  // Try single character
  const oneChar = ipa[startIndex];
  if (IPA_TO_ARPABET[oneChar]) {
    return { arpabet: IPA_TO_ARPABET[oneChar], length: 1 };
  }
  
  return null;
}
