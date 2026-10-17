import EnglishG2P from "../src/en/g2p";
import {createPhonemizer} from "../src/core";
const api=()=>createPhonemizer({processors:[new EnglishG2P()]});
test.each([
 ["The tools exploit certain short-term visual memory and depth-mapping psychophysical processes.","exploit","ɪkˈspɫɔɪt"],
 ["The administrators invite certain players to be moderators, also known as helpers.","invite","ˌɪnˈvaɪt"],
 ["The critics record few concerts.","record","ɹɪˈkɔɹd"],
 ["They present certain records.","present","pɹɪˈzɛnt"],
])("recognizes an indefinite object phrase: %s",(sentence,word,ipa)=>{expect(api().phonemize(sentence,{language:"en-US",returnArray:true}).find(t=>t.word===word)?.phoneme).toBe(ipa);});
test.each([
 ["They bought certain records.","records","ˈɹɛkɝdz"],
 ["Other Records Both Classical Covers.","Records","ˈɹɛkɝdz"],
 ["The present moment matters.","present","ˈpɹɛzənt"],
 ["The record was clear.","record","ˈɹɛkɝd"],
])("preserves nominal and adjective controls: %s",(sentence,word,ipa)=>{expect(api().phonemize(sentence,{language:"en-US",returnArray:true}).find(t=>t.word===word)?.phoneme?.replace(/ˌ/g,"")).toBe(ipa);});
test("preserves explicit pronunciation ownership",()=>{const e=new EnglishG2P();e.addPronunciation("invite","ˈzɛmp");const own=createPhonemizer({processors:[e]});expect(own.phonemize("The administrators invite certain players.",{language:"en-US",returnArray:true}).find(t=>t.word==="invite")?.phoneme).toBe("ˈzɛmp");});
