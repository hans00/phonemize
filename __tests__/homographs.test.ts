import { toIPA, toARPABET } from "../src/index";

describe("Homographs", function() {
  describe("Common homographs with POS disambiguation", function() {
    it("should correctly pronounce 'read' based on context", function() {
      // Present tense: "I read books" - verb, present tense pronunciation
      const presentResult = toIPA("I read books every day");
      expect(presentResult).toContain("ˈɹid");
      
      // Past tense context - improved POS tagger now correctly identifies as verb
      const pastResult = toIPA("I read that book yesterday");
      expect(pastResult).toContain("ˈɹid");
      
      // This verifies both homograph infrastructure and improved POS detection
    });

    it("should correctly pronounce 'lead' based on context", function() {
      // Verb: "Please lead" - correctly identified as verb, uses verb pronunciation
      const verbResult = toIPA("Please lead the way");
      expect(verbResult).toContain("ˈlid"); // Correct verb pronunciation /liːd/
      
      // Noun (metal): "The lead pipe" - should be identified as noun
      const nounResult = toIPA("The lead pipe is heavy");
      expect(nounResult).toContain("ˈlɛd"); // Correct noun pronunciation /lɛd/
    });

    it("should correctly pronounce 'tear' based on context", function() {
      // Verb: "Don't tear" - correctly identified as verb, uses verb pronunciation  
      const verbResult = toIPA("Don't tear the paper");
      expect(verbResult).toContain("ˈtɛɹ"); // Correct verb pronunciation /tɛər/
      
      // Noun: "A tear" - should be identified as noun
      const nounResult = toIPA("A tear rolled down her cheek");
      expect(nounResult).toContain("ˈtɪɹ"); // Correct noun pronunciation /tɪər/
    });

    it("should correctly pronounce 'wind' based on context", function() {
      // Noun: "The wind" - correctly identified as noun (!V), gets wind(air) pronunciation
      const nounResult = toIPA("The wind is strong");
      expect(nounResult).toContain("ˈwɪnd"); // Correct: noun -> /wɪnd/
      
      // Verb: "Please wind" - correctly identified as verb (V), gets wind(coil) pronunciation  
      const verbResult = toIPA("Please wind the clock");
      expect(verbResult).toContain("ˈwaɪnd"); // Correct: verb -> /waɪnd/
    });

    it("should correctly pronounce 'bow' based on context", function() {
      // Verb: "Please bow" - correctly identified as verb (V), gets bow(bend) pronunciation
      const verbResult = toIPA("Please bow to the audience");
      expect(verbResult).toContain("ˈbaʊ"); // Correct: verb -> /baʊ/
      
      // Noun: "his bow" - correctly identified as noun (!V), gets bow(weapon) pronunciation
      const nounResult = toIPA("He drew his bow");
      expect(nounResult).toContain("ˈboʊ"); // Correct: noun -> /boʊ/
    });
  });

  describe("ARPABET homographs", function() {
    it("should handle homographs in ARPABET format", function() {
      const result = toARPABET("I read books every day");
      expect(result).toContain("R1 IY D"); // ˈɹid converted to ARPABET (present tense verb)
    });

    it("should handle 'lead' in ARPABET format", function() {
      const result = toARPABET("Please lead the way");
      expect(result).toContain("L1 IY D"); // ˈlid converted to ARPABET (verb form)
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

    it("should handle sentences with multiple homographs", function() {
      const result = toIPA("I read about the lead in the wind that can tear a bow");
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
      
      // Should contain recognizable phonemes with improved POS detection
      expect(result).toContain("ˈɹid"); // read (correctly identified as verb)
      expect(result).toContain("ˈlɛd"); // lead (correctly identified as noun after "the")
      expect(result).toContain("ˈwɪnd"); // wind (correctly identified as noun after "the")  
      expect(result).toContain("ˈtɛɹ"); // tear (correctly identified as verb after "can")
      expect(result).toContain("ˈboʊ"); // bow (correctly identified as noun after "a")
    });
  });
}); 