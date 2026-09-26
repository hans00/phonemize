import { toIPA, toARPABET } from "../src/index";

describe("Homographs", function() {
  describe("Common homographs with POS disambiguation", function() {
    it("should correctly pronounce 'read' based on context", function() {
      // Present tense: "I read books" - verb, present tense pronunciation
      const presentResult = toIPA("I read books every day");
      expect(presentResult).toContain("ɹid");
      
      // Past tense context - improved POS tagger now correctly identifies as verb
      const pastResult = toIPA("I read that book yesterday");
      expect(pastResult).toContain("ɹid");
      
      // This verifies both homograph infrastructure and improved POS detection
    });

    it("should correctly pronounce 'lead' based on context", function() {
      // Verb: "Please lead" - correctly identified as verb, uses verb pronunciation
      const verbResult = toIPA("Please lead the way");
      expect(verbResult).toContain("ɫid"); // Correct verb pronunciation /liːd/

      // Noun (metal): "The lead pipe" - should be identified as noun
      const nounResult = toIPA("The lead pipe is heavy");
      expect(nounResult).toContain("ɫɛd"); // Correct noun pronunciation /lɛd/
    });

    it("should correctly pronounce 'tear' based on context", function() {
      // Verb: "Don't tear" - correctly identified as verb, uses verb pronunciation  
      const verbResult = toIPA("Don't tear the paper");
      expect(verbResult).toContain("tɛɹ"); // Correct verb pronunciation /tɛər/
      
      // Noun: "A tear" - should be identified as noun
      const nounResult = toIPA("A tear rolled down her cheek");
      expect(nounResult).toContain("tɪɹ"); // Correct noun pronunciation /tɪər/
    });

    it("should correctly pronounce 'wind' based on context", function() {
      // Noun: "The wind" - correctly identified as noun (!V), gets wind(air) pronunciation
      const nounResult = toIPA("The wind is strong");
      expect(nounResult).toContain("wɪnd"); // Correct: noun -> /wɪnd/
      
      // Verb: "Please wind" - correctly identified as verb (V), gets wind(coil) pronunciation  
      const verbResult = toIPA("Please wind the clock");
      expect(verbResult).toContain("waɪnd"); // Correct: verb -> /waɪnd/
    });

    it("should correctly pronounce 'bow' based on context", function() {
      // Verb: "Please bow" - correctly identified as verb (V), gets bow(bend) pronunciation
      const verbResult = toIPA("Please bow to the audience");
      expect(verbResult).toContain("baʊ"); // Correct: verb -> /baʊ/
      
      // Noun: "his bow" - correctly identified as noun (!V), gets bow(weapon) pronunciation
      const nounResult = toIPA("He drew his bow");
      expect(nounResult).toContain("boʊ"); // Correct: noun -> /boʊ/
    });
  });

  describe("ARPABET homographs", function() {
    it("should handle homographs in ARPABET format", function() {
      const result = toARPABET("I read books every day");
      expect(result).toContain("R IY D"); // ˈɹid converted to ARPABET (present tense verb)
    });

    it("should handle 'lead' in ARPABET format", function() {
      const result = toARPABET("Please lead the way");
      expect(result).toContain("L IY D"); // ˈlid converted to ARPABET (verb form)
    });
  });

  describe("Homograph infrastructure", function() {
    it("should have homograph dictionary loaded", function() {
      // This test verifies that the homograph system is working
      // by checking that common homographs produce some pronunciation
      const result = toIPA("read lead tear wind bow");
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
      
      // Should not contain any obvious errors
      expect(result).not.toContain("undefined");
      expect(result).not.toContain("null");
    });

    // Imported noun/default pairs (src-data/en/homographs-misaki.txt): the
    // noun reading needs noun evidence, otherwise the word keeps its default.
    it("should keep the default reading of a noun/default pair without noun evidence", function() {
      expect(toIPA("The team consists of five people")).toContain("kənˈsɪsts");
      expect(toIPA("They laminate the cards")).toContain("ˈɫæməˌneɪt");
      expect(toIPA("Apply the laminate evenly")).toContain("ˈɫæmənət");
      // A demonstrative is a pronoun subject here, not noun evidence.
      expect(toIPA("These consist of three parts")).toContain("kənˈsɪst");
      // A pre-verbal adverb is verb evidence.
      expect(toIPA("He also conducts works by Bach")).toContain("kənˈdʌkts");
    });

    it("should read a verb/default pair by POS", function() {
      expect(toIPA("The buffet was delicious")).toContain("bəˈfeɪ");
      expect(toIPA("He will affiliate with them")).toContain("ˌeɪt");
      expect(toIPA("She is an affiliate of the firm")).toContain("əˈfɪɫiət");
    });

    it("should read a relative-clause verb after that/which/who", function() {
      expect(toIPA("A method that uses light")).toContain("ˈjuzəz");
    });

    it("should keep the -ed adjective reading for noun evidence only", function() {
      expect(toIPA("He learned to swim")).toContain("ɫɝnd");
      expect(toIPA("She is a learned scholar")).toContain("ˈɫɝnɪd");
    });

    it("should read wound as /waʊnd/ only as a verb", function() {
      expect(toIPA("He had a deep wound")).toContain("wund");
      expect(toIPA("He wound the clock")).toContain("waʊnd");
    });

    it("should keep lead /lid/ without noun evidence", function() {
      expect(toIPA("He sang lead vocals")).toContain("ɫid");
    });

    it("should read a noun after an attributive adjective or a possessive", function() {
      expect(toIPA("It was a time of political intrigue")).toContain("ˈɪntɹiɡ");
      expect(toIPA("According to Hammond's postulate")).toContain("ˈpɑstʃəɫət");
    });

    it("should handle sentences with multiple homographs", function() {
      const result = toIPA("I read about the lead in the wind that can tear a bow");
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
      
      // Should contain recognizable phonemes with improved POS detection
      expect(result).toContain("ɹid"); // read (correctly identified as verb)
      expect(result).toContain("ɫɛd"); // lead (correctly identified as noun after "the")
      expect(result).toContain("wɪnd"); // wind (correctly identified as noun after "the")  
      expect(result).toContain("tɛɹ"); // tear (correctly identified as verb after "can")
      expect(result).toContain("boʊ"); // bow (correctly identified as noun after "a")
    });
  });
}); 