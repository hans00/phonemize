# English 詞素分析、句法與 IPA 檢查設計

2026-10-27。狀態：診斷入口與複合詞候選保留已實作；新的拆字選擇與 POS 決策仍未啟用。

採用有型別的多候選詞素樹、整句特徵文法，以及獨立的 IPA 音系檢查器。目標是讓拆字與句法有一致、可追溯的規則，而不是持續增加單詞條件與鄰字視窗。

本文件以目前的 [AGENTS.md](../AGENTS.md) 為準。舊的 `g2p-redesign.md` 包含已停用的 gram／LTS 實驗，不作為本提案的實作要求。

## 第一批實作與試用

本地 checkout 已提供 `inspectIpa`、`analyzeEnglishSentence`、legacy 結構 trace，以及 optional sentence hook。以下章節仍描述最終架構；目前的 trace 記錄舊拆法，尚未產生完整的多候選詞素樹。

```sh
node --require tsx/cjs scripts/analyze-english.ts word automotive
node --require tsx/cjs scripts/analyze-english.ts forest underclassmen
node --require tsx/cjs scripts/analyze-english.ts ipa 'bnɪk'
node --require tsx/cjs scripts/analyze-english.ts sentence 'I will read yesterday’s notes.'
```

一般環境也可使用 `yarn analyze:en` 加上相同參數。新的 named exports 由本地建置的 `phonemize/en-g2p` 提供，尚未發行到 npm。

`new EnglishG2P({ analysis: "shadow" })` 開啟觀察模式；預設不執行新的句法 chart。觀察模式會每句計算一次新分析，再把同一不可變物件帶到逐 occurrence 的 `tagWord` 與預測入口。舊 tagger 目前仍逐字執行，供後續比較；新的候選沒有覆寫舊 POS 或讀音。

第一版 chart 已處理基本 NP、PP、助動詞鏈、主詞一致與候選附著。內容詞的詞性、未知特殊動詞形態與配價仍是假設；複雜協調、關係子句、headline 與省略尚未完整支援。`parsed` 只表示目前有限文法有覆蓋整句的解析，不能當作句法金標或內容詞分析已獨立證實。

IPA 檢查器實作 broad English 轉寫的有限音系 profile，接受本專案的 `l/ɫ`、`r/ɹ`、`g/ɡ` 記號慣例。它不校正 IPA，也不以相容性認定單字讀音正確。每次 syllable search 預設上限 4096 次狀態展開，輸入超過 8192 個 UTF-16 code units 回報資訊不足；句法預設同樣上限 4096 次展開與 64 tokens。超限皆明示，不推論唯一答案。

驗證結果：

- 全套 448 suites／7663 tests 通過，包含 32 個新功能測試；typecheck 與 Rollup 建置通過，CJS／ESM standalone exports 已實際載入。
- 1,296,684-row before/after 發音快照逐位元相同，SHA-256 為 `4dd1e7c0b179529e278892b75a5e682dfaccca3431d06279b190388887a4e7a8`。
- 現行 context 四格的每個 row 完全相同；觀察模式另比對 432 個格次與 216 次完整文章 token 輸出，差異為零，Known-POS 只改目標 occurrence。
- 上述 216 次分析是固定 108 個案例在 default／rules 兩種模式的重複執行：20 次 parsed、192 次 unparsed、4 次 truncated。這是覆蓋描述，不是句法正確率，也沒有用這批 eval 結果挑選文法修正。
- 字典、compound parts、原 context baseline 與其他發音規則檔 hash 不變。沒有重建或重設基準，也沒有宣稱發音增益。
- TypeScript AST 按實際 token 所在行計數、忽略註解及空白：原五模組 3390 → 3385，`g2p.ts` 1155 → 1150，既有 cap 3395 保留。結構 trace 共用回傳建立與 helper 簡化，未把原發音規則搬到新檔規避計數。新增的診斷模組另外保留在 diff 中。

此次 evidence 位於 `/tmp/phonemize-analysis-20261027/verification.json`，包含來源 hash、快照與 context 比較。第一批無新發音行為，所以使用現有固定資料做等價驗證；後續採用新拆字或 POS 行為時，仍需依下列完整 adoption gates 重建字典及比較。

## 第二批：保留實際複合詞候選

`EnglishG2P.analyzeWord(word)` 與 `analyze:en word` 現在列出未拆規則讀法，以及原 `tryCompoundSplit` 在選定切點之前觀察到的每個候選。候選直接來自原有 guards，串接也共用 runtime composer；沒有複製一套近似拆字器。每個候選包含 UTF-16 邊界、片段讀音、舊長度分數、重音持有者與 IPA 診斷。`actual` 另保留這個實例真正選用的最終讀音與 route。

範圍明示為 `legacy-compound-alternatives`，尚非完整的遞迴詞素森林：不列出所有 derivation、inflection 或 DP 路徑。`enumerated` 只表示原 compound 邊界迴圈完成；遇到原有整字優先 guard 時標為 `short-circuited`，不把先前觀察到的候選宣稱為完整搜尋。非 ASCII 字、內部撇號等輸入保留舊讀音並標為 `unsupported`；空字或超過 64 UTF-16 units 拒絕分析。這不限制原 `predict()` 的輸入。

候選的 `componentIpa` 在共同 phonotactics、方言轉換及情境弱化之前，不能直接與最終 runtime 分數相比。邊界仍標為 `unclassified`，表示左右片段獨立出現過，尚未證明本次組合的語義或詞素關係。`castaway` 同時保留 `cast+away`、`casta+way`；`automotive` 保留 `/ˌɔtəˈmoʊtɪv/` 與 `/ˌɔtoʊˈmoʊtɪv/`，兩者都可通過目前音系檢查。

離線反證實驗透過實際遞迴 dispatch，將每次 compound 命中替換成未拆規則實現，再走原有後處理。固定 common-v67 的 6990 字中，303 字輸出改變，按原 stress-stripped strict 參考有 10 wins、124 losses。因此拒絕「一律採未拆」；沒有改 runtime 決策。這些只是該反事實實驗的計數，並非已採用的改善；其中 `webpage` 的既有參考爭議仍須獨立處理。實驗未用來修改 homograph／context eval 文法。

第二批 evidence 在 `/tmp/phonemize-forest-20261027/`：`unsplit-replay.json` 保留全部改變，`replay.cjs` 保留實際 dispatch 攔截方式。1,296,684-row 發音快照與第一批逐位元相同。全套 449 suites／7676 tests 通過；補上終止 guard 案例後，word-analysis 的 14 tests 與 typecheck 再次通過。Rollup 建置通過。五模組計數為 3380，`g2p.ts` 1145；neutral 壓縮僅合併參數列表與 destructuring，cap 不變。沒有重建字典、重設 baseline 或計入發音增益。

## 句法 train 試跑與修正

離線 adapter 曾嘗試在完整解析的目標只有一種 N／V／ADJ 時覆寫舊 POS。最初 default/auto 從 742/918 降到 740/918，rules/auto 從 467/918 降到 466/918，因此沒有接管 runtime。兩個退步來自文法覆蓋不足：缺少 `that` 的有限補語子句，把嵌入句的 `learned` 擠成名詞；以右側 `Pirates` 的表面複數代表整個 `the game Puzzle Pirates` 的數，排除了真正的 `uses` 謂語。

chart 現已加入 C + S 的有限補語、VP 的補語附著，以及大寫名稱作同位修飾的候選，保留普通名詞與其他解析。大寫只是名稱假設，沒有新增名稱表，也不據此認定品牌或外來語。新增成對測試維持 `she is/are`、`They use/uses` 的一致性限制。

修正後重新執行相同 918-occurrence train：default/auto 742、default/gold 732、rules/auto 467、rules/gold 422，四格 target IPA 每個 row 都與舊 pipeline 相同，沒有發音增益。因此仍不啟用 POS 接管。離線 adapter、原退步報告與最終比較保存在第二批 evidence 目錄。觀察模式再核對 eval 的 432 個格次與 216 次完整文章輸出，差異仍為零；文法狀態為 22 parsed、190 unparsed、4 truncated，只作覆蓋描述，沒有據此調整文法。

最終版本重新跑完整 449 suites／7679 tests 全數通過，並重新生成 1,296,684-row 快照，與凍結版本逐位元相同；typecheck、Rollup 與建置後 CJS／ESM 的單字／句法入口均已驗證。最終證據索引為第二批目錄的 `verification.json`。90% 發音目標尚未完成，本批不計發音收益，也未提交低於門檻的改善 commit。

## 第三批：分層相容森林與並列句法

`analyzeWordForest(word, maxStates = 256)` 已建立共享節點的 compound 森林。`underclassmen` 能保留 `under + classmen`，並在同一右側 span 中保留 `class + men`；相同 span、片段 IPA 的 choice 節點可重用。`whole` 記錄原規則或實際片段證據，`compound` 連到左右 choice，候選邊界仍是 `unclassified`。這是既有 compound dispatch 的結構化，不代表已證實構詞語義，也沒有移入新詞表或改動發音規則。

父節點只能連到產生其指定 IPA 的子分析。單一可見的慣例適配是 `secondary-projection`：僅移除次重音符號，原字串與來源節點完整保留；不能更動音段或主要重音。因此 `classmen` 的 `/ˈkɫæsˌmɛn/` 結構可對應原片段 `/ˈkɫæsmɛn/`，卻不能把 `auto` 的完整母音擅自改成 schwa。這個適配只描述既有片段的讀音慣例，不改 scorer 或 runtime 輸出。

搜尋以活動次數計數，預設 256 次；超限標為 `truncated`，root 可能尚未建立，不能拿部分森林宣稱唯一拆法。原整字優先 guard 會被尊重，`guardedSpans` 明示其數量；unsupported 輸入保留既有 actual 讀音但不建立森林。範圍仍是 `legacy-compound-forest`，不包含全部 inflection、derivation 或 DP handler，不能把 complete 解讀成完整英文詞素解析。

句法新增 NP／VP／子句／形容詞並列，保留有限／非限定形態、助動詞選擇、主詞數與代名詞格。NP 的 `and` 取複數，`or` 保留最近 conjunct 的一致性；這是目前支持的 agreement profile，不宣稱涵蓋所有方言或所有 or 協調慣例。標題 NP 可作全 span root，非限定過去分詞可作縮減關係修飾，避免把缺少這些結構誤當 POS 唯一性的證明。句末標點僅能在輸入末端附著，不能跨句繼續接謂語。

chart 另重用舊 tagger 的 quantifier 判斷；`all/many` 等不再同時被假設成一般未知名詞、形容詞與特殊動詞。`certain/other/such` 保留內容詞的歧義，沒有改動原 function-word 弱化表。`parsed` 現在也包含完整 NP fragment；覆蓋增加不是句法正確率增加。

本批驗證了兩個前提：

- 單靠未拆讀法支持的 combining-form 弱化仍不安全。實際遞迴 dispatch 的全字典反事實有 9 strict wins、43 losses；common 2 wins／0 losses 並不足以採用，且 `autopacific` 控制退步。一般詞 `endoscope`、`nanogram` 也在 losses，不能把原因全歸給品牌。evidence：`/tmp/phonemize-weak-combining-20261027/`。
- IPA 檢查器在 compound marked／unsplit compatible 時切換的反事實，沒有改變任何全字典輸出。音系合法性不能代替構詞辨識。evidence：`/tmp/phonemize-phonotactic-choice-20261027/`。

新的並列文法最初令無條件 POS 接管的 train default/auto 降到 740/918；補上 fragment、縮減關係與 quantifier 後恢復 742/918。最短／較簡單結構偏好反而降到 734/918，已拒絕。只考慮未知特殊形態、未經支持的補語配價，並限定舊 tagger 的未知 fallback 時，四格仍為 742、732、467、422，沒有新增正確讀音，因此沒有接管 default。完整解析中的未知詞性與配價仍不能當作已核實的證據。所有選擇、診斷及權重試驗只在 train 執行，未以 eval 挑選規則。

第三批 evidence 位於 `/tmp/phonemize-coordination-20261027/`；發音改變仍未採用，基準與字典未重設。本批留下的實作是相容的分層候選與文法覆蓋，發音增益仍為零。

最終驗證：450 suites／7690 tests、typecheck、Rollup，以及建置後 CJS／ESM 的遞迴森林與並列句法入口通過。1,296,684 筆發音快照與第二批逐位元相同，字典、原五模組中的其他發音規則及原 context baseline hash 不變。觀察模式 432 個格次與 216 次完整文章比對仍為零差異；其 grammar 狀態為 32 parsed、168 unparsed、16 truncated，只是固定案例重複執行的覆蓋描述。五模組總計 3381 code lines，`g2p.ts` 1146，cap 3395 不變；沒有把發音規則移入 forest 模組。來源 hash 與完整證據索引見本批 `verification.json`。

## 先修正反例的適用範圍

Auto Europe 與 AutoPacific 確實有品牌用法，分別見 [Auto Europe 官網](https://www.autoeurope.com/) 與 [AutoPacific 官網](https://www.autopacific.com/)。品牌身分不等於已證實發音，也不能單憑大小寫辨識任意輸入的品牌身分。

目前 `autoeurope`、`autopacific` 的 runtime 已走 compound 路徑，並非整個名稱查表。完整來源字典收有這些拼法，compound miner 利用其讀音取得片段證據。它們可以作為透明串接的控制，卻不足以否定 `automotive` 之類自然構詞的元音弱化。

`automotive` 的一般路徑為字典 `/ˌɔtəˈmoʊtɪv/`；規則路徑為 `auto + motive`，輸出 `/ˌɔtoʊˈmoʊtɪv/`。[Cambridge US](https://dictionary.cambridge.org/us/pronunciation/english/automotive) 支持弱化元音。改善方向是區分自由詞串接與 combining form 的發音域；不能重新加入只對 `auto + motive` 生效的條件。

`webpage` 的規則路徑已產生 `/ˈwɛbˌpeɪdʒ/`，符合 [Cambridge web page](https://dictionary.cambridge.org/us/pronunciation/english/web-page)；[其詞條亦列出 webpage 拼法](https://dictionary.cambridge.org/us/dictionary/english/web-page)。生成字典的 `/ˈwɛbpɪdʒ/` 應列為來源核查項目。來源修正與基準版本變更另外記錄，不計作規則增益。

## 現有架構的問題

| 現行責任 | 已核對的行為 | 對設計的影響 |
|---|---|---|
| `scripts/mine-compound-parts.ts` | 左右片段分別累積拼接命中；最低一次命中、10% 命中率。輸出不保留支持案例或詞素關係。 | 片段存在只是候選證據，不能直接證明新的組合成立。 |
| `src/en/g2p.ts` 的 `tryCompoundSplit` | 主要依較短半邊的字母數選切點，立刻串接 IPA。 | 沒有與未拆候選比較，也丟失邊界與重音域。 |
| 同檔的 `tryDecomposition` | DP 每個前綴只留一條較少片段的路徑，通常用 exceptions 查片段。 | 採礦後 exceptions 的增刪也可能改變拆字。 |
| `src/tokenizer.ts` | 已保留完整句子與索引，但逐字呼叫 `tagWord`。 | 缺少共享、彼此相容的句法分析。 |
| `src/en/phonotactics.ts` | 會依原字、POS 與字典路徑旗標改寫 IPA。 | 它是發音實現的一部分，不能直接當純 IPA validator。 |

## 呼叫方式與責任

公開的 `phonemize()` 用法維持既有契約。下例描述最終內部接線；第一批 hook 已實作，但 `tagWord` 尚未改用新分析作決策。

```ts
// tokenizer 在建立完整句子後，每句、每 processor、每方言只分析一次。
const analysis = english.analyzeSentence?.(sentenceWords, language);
const context = { words: sentenceWords, index, analysis };
// 保留每個 occurrence 的既有 hook；最終 adapter 讀 analysis，不重新解析。
const tagged = english.tagWord(surfaceWord, { prev, next, sentence: context });
const effectivePos = tagged.pos;
const ipa = english.predictWithContext(surfaceWord, context, language, effectivePos);

// 孤立單字維持原入口；無句子時不假造句法證據。
const isolated = english.predict("webpage", "en-US");

// 純 IPA 檢查完全不接收 spelling、POS 或預期讀音。
const report = inspectIpa("ˈwɛbpɪdʒ", { dialect: "en-US" });
```

`LanguageProcessor` 增加 optional `analyzeSentence` hook；沒有實作的語言延續既有流程。`PredictionContext` 可帶入不可變的共同分析結果。共用介面只含按原 token index 排列的語法證據與完成狀態，English 的解析森林留在 English 模組內，不讓 tokenizer 理解英文文法。

tokenizer 仍對每個 occurrence 呼叫一次 `tagWord` adapter，`effectivePos` 來自其回傳。這保留目前 context evaluator 蒐集標籤與注入目標 Known-POS 的契約。`analyzeSentence` 的候選生成不得呼叫可被攔截的 public `tagWord`，以免多算標籤或將 override 洩漏進全句解析。

| 責任 owner | 唯一責任 |
|---|---|
| `morph-parser.ts` 與 `morph-table.ts` 擴充 | 詞素候選、附著條件、拼字還原、結構與重音域。 |
| 新的 `syntax.ts` | 整句候選、文法統一、子句與依存關係。原 POS tagger 漸進改為 adapter。 |
| 發音 composer | 根據選定的詞素結構實現音段與重音，維持現有 postlex／phonotactics 的順序。第一階段由 `g2p.ts` 原流程持有。 |
| 新的 `ipa-plausibility.ts` | 只解析與檢查 IPA，提供疑慮與原因，不改讀音。 |

詞素模組不自行輸出另一套後處理 IPA；句法模組不改音；validator 不代替 composer。對外只有 English processor 協調發音，不要求呼叫者自行安排分析順序。

內部的型別草圖如下。`Span`、來源證據、詞綴 ID 與解析森林由其 owner 建立；這些是提案中的 domain types，沒有新增可執行的 stub。

```ts
type MorphNode =
  | { kind: "whole"; span: Span; evidence: RootEvidence }
  | { kind: "inflection"; base: MorphNode; affix: AffixId }
  | { kind: "derivation"; base: MorphNode; affix: AffixId }
  | { kind: "combiningForm"; base: MorphNode; form: CombiningFormId }
  | { kind: "compound"; left: MorphNode; right: MorphNode; boundary: FreeBoundary };

type SearchResult<T> =
  | { kind: "complete"; analyses: readonly [T, ...T[]] }
  | { kind: "partial"; analyses: readonly T[]; reason: string }
  | { kind: "truncated"; analyses: readonly T[]; budget: BudgetUse }
  | { kind: "unparsed"; reason: string };

// 完整相容的解析世界保存在內部 packed forest；不能從每字 POS 集合任意重組。
declare function analyzeSentence(words: readonly string[], language?: string): SentenceAnalysis;
declare function inspectIpa(ipa: string, options: PhonologyOptions): IpaReport;
```

`unparsed` 表示目前文法未提供完整解析，不能直接宣告輸入不是英文。POS、verb form 與其他 token 的關聯留在完整解析內；逐 token 的讀取只是投影，不會把不同解析的證據混用。

## 可維護的拆字：詞素文法與多候選樹

### 保留有意義的結構

分析節點至少區分整詞、屈折、派生、combining form 與自由複合詞。每個節點保留 spelling span、根據的規則、來源與可用詞性；附著節點另外保留重音域與 allomorph 條件。

這些標籤是「有證據支持的候選關係」，不是依字形猜出的語源或品牌真值。未知類別維持未知，不能補成 native、品牌或已知詞性。

例如 `webpages` 的一個結構為 `[[web + page] + plural-s]`。`page` 的元音由該詞幹保留；複數音變根據 stem-final `/dʒ/` 選擇。詞素樹的語法中心與重音所在位置分開保存，不能假定右側詞素或左側片段必定持有主重音。

### 如何產生與選擇候選

1. 保留目前模式允許的整詞候選與未拆規則候選。`disableDict` 的整詞查詢限制不變。
2. 用既有 runtime 詞幹、compound parts 與已聲明的詞綴產生候選。任意規則生成的短字串不能自動取得自由詞資格。
3. 以動態規劃保存相同 span 的共享節點，保留不同附著結構，避免只存「最長」或「最少段」的一個答案。
4. 檢查詞綴附著類別、屈折順序、拼字還原與重音域。數字或大小寫特徵只能提供證據，不能直接證明詞素關係。
5. 用完整句法證據限制候選；未知詞性仍可保留相容候選，但不把未知當成獨立的正面支持。
6. composer 最後才實現 IPA。validator 可報告候選的音系疑慮，不能僅憑「更像英語」選成另一個錯詞的合法讀音。

沒有可靠的唯一分析時，保留多解與既有 fallback，並在 trace 顯示原因。多個結構若導出同一 IPA，可以選共同讀音，結構仍標為歧義。

既有字典在 normal route 的來源優先序先維持。發現 `webpage` 這類來源疑點時，走有權威來源的字典核查，不能新增「遇到某字時偏好拆字」的 G2P 分支。

### 規則寫的是類別

詞綴規則宣告輸入類別、輸出類別、可附著順序、拼字變化與重音效果。例如名詞複數和動詞第三人稱的 `-s` 是不同規則，不能因同形而合併成同一形態特徵。

每條規則需要自然詞、派生、屈折、OOV 組合與不適用環境的成對控制。新宣告規則在建構時檢查零長度循環、重複與型別衝突。相容結構可能不只一個，不能把正常歧義當編譯錯誤。

不新增 full-dict、POS 語料、名字表或訓練參數到 runtime。既有資源缺少詞根證據時，明示覆蓋不足；資料重建前後比較 root membership 與所有相依衍生詞。build-time 的支持案例與來源 hash 留在診斷報告，不偷偷變成新的 runtime 逐字答案。

維護目標是每個詞素類別有一個 owner、相同條件跨單字共用、分析選擇可重現。未標記的拼字本來就可能多解，例如 `unlockable`；不能把「總是回傳一個切法」當作穩定性的定義。

## 只看 IPA 的音系檢查

可以實作語言與方言專用的 phonotactic checker。[MIT 的音系課程](https://ocw.mit.edu/courses/24-961-introduction-to-phonology-fall-2014/04c7d3864dd7a43e95c92939f3b22607_MIT24_961F14_Lecture5.pdf) 說明音串限制、可行的新詞與可接受度的漸變性。這支持「結構相容性檢查」，不支持由 IPA 判定詞義或拼字。

檢查器依序處理 IPA 符號、組合符號、雙元音、塞擦音、音節核、可行音節切分與重音位置。接著按方言檢查 onset、coda 與跨音節限制。響度排序只是其中一類條件；英語 `/s/` 叢集、屈折尾音與音節化輔音需要自己的合法路徑。

輸入允許 IPA 內既有的詞界、音節界與重音標記；缺少邊界時檢查器保留可行分析，不從原始單字取得邊界。它不使用現有拼字驅動的 `syllabify()` 來驗證 IPA。

| 回報 | 意義 | 例子與處理 |
|---|---|---|
| `malformed` | 在指定輸入契約下，標記或組合符號結構不完整。 | 單獨的重音標記沒有後續可附著音節。 |
| `unsupported` | 是有效 IPA，但實作尚無法處理該符號或特徵。 | 不能把尚未支援的符號誤報成非法 IPA。 |
| `compatible` | 至少有一種符合所選音系的結構。 | `/wɛbpɪdʒ/` 與 `/wɛbpeɪdʒ/` 都可能通過。 |
| `marked` | 不符合目前原生音系路徑，或需額外邊界／借詞分析。 | 單一原生詞的開頭 `/bn/` 可提出疑慮，不直接改寫外來姓名。 |
| `undetermined` | 邊界、轉寫契約或搜尋資源不足。 | 不能把已搜尋的唯一切法當作完整音系證明。 |

回報可同時列出多項診斷及位置。`compatible` 只表示聲音序列可成立，絕不命名成 `correctPronunciation`。

`/wɛb.pɪdʒ/` 各音節可以組成一個假想英語詞；只有把 `page` 的詞素與 `/peɪdʒ/` 讀音帶回來，才能發現它不符合目前對 `webpage` 的分析。同樣，`/kæt/` 與 `/dɔɡ/` 都合法，IPA-only 函式無法知道題目要求哪個詞。

字典記號與音系規則也要分開：缺少詞界時不能要求整段只有一個主重音，弱讀詞可以不帶重音，方言外音或外來音不能一律判錯。現行 STRUT adapter 等記號契約仍由原 pipeline 處理，不能為了 checker 分數重新定義。

## 純程式句法：特徵文法與 chart parser

「只靠程式碼」在此指不使用模型、服務、訓練權重或新的 runtime 語料。文法是程式定義；既有功能詞與詞幹資訊可用，沒有的內容詞特徵保持多個候選。助動詞與冠詞等有限文法類別，不是目標單詞的發音例外表。

採 feature-unification chart parser：保存多個短語解析，並統一 number、person、finite、base、participle、子句與依存資訊。可參考 [NLTK 特徵文法](https://www.nltk.org/book/ch09.html) 與其 [Feature Earley 實作介面](https://www.nltk.org/api/nltk.parse.earleychart.html)。這是演算法參考，不引入 Python runtime 或 NLTK 相依。

以下為最小文法示意，實作需明確處理協調、存在句與省略，不能把單一 agreement 規則套用所有英文句型：

```text
Clause        → NP[agreement=A] VP[finite, agreement=A]
NP            → Determiner Adjective* Noun
NP            → NominalModifier* Noun
PP            → Preposition NP
Infinitive    → to VP[base]
VerbGroup     → Modal V[base]
VerbGroup     → have V[past-participle]
VerbGroup     → be V[progressive]
VerbGroup     → be V[past-participle]       # passive candidate
VP            → VerbGroup NP? PP*
```

`be + adjective` 另有繫詞分析。`-s` 同時保留名詞複數與動詞第三人稱候選。未知詞性或數量是變數，不是已知符合的詞彙事實；文法可限制變數，輸出仍須記錄其證據不足。

解析器每句算一次，保存原 token index、重複出現與標點，不用小寫詞字串當快取 key。每次 `phonemize` 呼叫內按 sentence object、processor instance 與方言保存結果，避免字典更新與跨實例狀態污染。

### 具體句型

| 輸入 | 可提供的結構證據 | 必須保留的限制 |
|---|---|---|
| `Women broadcasters invite women.` | `[Women broadcasters]` NP 與 `invite` VP 的完整結構，比修飾詞數量更有用。 | 詞幹特徵不足時不宣稱字形已證明所有名詞數量。 |
| `Stone offers produce boxes for delivery.` | 可分析 `Stone` 主語、`offers` 謂語、`produce boxes` 受詞。 | `[stone offers]` NP 加 `produce boxes` VP 也有語法可行性；純句法不能保證選出預期意思。 |
| `Aust wins invite to next year's summit.` | headline 文法允許無冠詞受詞；`to + NP` 是 PP。 | headline 只作另一候選，不能靠大小寫直接宣告；`wins` 的名詞／動詞同形仍可能多解。 |
| `I will read yesterday's notes.` | `will` 選 base，`yesterday's` 位於名詞片語內。 | 不讓最近的時間詞覆寫助動詞選形。 |
| `I read that book yesterday.` | POS 是動詞；子句時間附加語提供過去解讀線索。 | 時間解讀與純句法分開，不能把時間推論偽裝成 POS。 |
| `I saw her duck.` | `her duck` NP 與 `her` 受詞加 `duck` 動作，是兩種結構。 | 文法能表示兩種，詞彙及語境不足時不能知道說話者的意思。 |

文法先涵蓋 NP、PP、助動詞鏈與簡單子句，再按成對案例增加協調、關係子句、插入語與省略。以 [Universal Dependencies](https://universaldependencies.org/u/overview/simple-syntax.html) 的主語、受詞、助動詞關係作共同術語，不使用其 treebank 作 runtime 資料，也不宣稱輸出已符合完整 UD 標注標準。

### 語法確定與讀音一致分開

分析結果有三個獨立維度：

- 搜尋是否完整，或仍有未支援／超限範圍。
- POS 與結構是否仍有多解。
- 存活解析導出的讀音是否相同。

完整解析下的「一致」只針對已支援的文法與候選，並非對所有英文解析的絕對證明。資源超限時，即使已探索的答案都同音，也不能宣稱全體一致。partial 或 truncated 需要採用既有 fallback 並明示狀態。

不以人造的 0.9 分數當可靠概率。若引入一般結構偏好，輸出的是 preferred 而非唯一正確，並由 train 與獨立控制衡量實際精度。

POS、verb form、時間線索與 sense 各自保存。同詞性不同詞義的讀音仍需詞義證據。Known-POS 測試只在目標 token 的讀音選擇限制 POS，使用不可變的局部 view；不能重新解析整句後改掉其他 token，也不能推入 gold IPA、時態或 sense。

## 遷移與驗收

1. **保留舊行為的結構適配。** 以目前 route、規則與輸出建立 trace 節點，尚無完整分析的路徑用 opaque 標記。不要先把全部程序式規則編譯成 FST。固定快照必須 byte-identical。
2. **觀察模式。** 在旁路產生詞素森林、句法證據與 IPA 診斷，保留輸出差異、拒絕原因、未知特徵與資源用量。這個階段不算發音增益。
3. **按類別取代。** 在 train 設計一個詞素或句法類別，通過所有 gate 後取代同責任的舊 handler。過渡 adapter 有明確移除範圍，避免兩套規則長期共同寫出不同答案。
4. **重建與比較。** 每次採用行為變更前先凍結 predictions 與來源 hash，重建字典後審查所有變更及相依衍生詞，執行 AGENTS 全部 accuracy、stress、parity、homograph 與 context gates。

規則搬到新檔仍計入原壓縮政策的實質範圍；不得用新增模組規避 3395 cap。新增引擎與移除舊邏輯的淨代碼量、壓縮觸發與快照證據均需記錄。一般改善 commit 仍須達到既有最小增益。

新的結構驗證不改舊的評分契約。可增加 evaluation-only 的詞素界線與句法標注集，明確獨立版本與來源；人工／權威核對的語法參考不進 runtime。舊固定分母、每 reading／每 POS 子集與顯式控制繼續保留。

| 檢查 | 合格條件 |
|---|---|
| 詞素規則 | 正例與反例同時驗證；依詞族分割 train，檢查所有受影響的既有正確項目。 |
| 句法 | 分報已解析精度、覆蓋、多解與 fallback，不能靠少回答來宣稱整體分數改善。每個讀音與不同詞性的控制不得退步。 |
| IPA checker | 分報合法參考的誤報與人工結構破壞的檢出率；含方言、音節化輔音、外來音與無邊界輸入。 |
| 資源與性能 | 量測候選／chart state 數、時間、記憶體和超限率；尚未量測前不承諾速度。 |
| 行為採用 | 至少一項既定發音指標提高，其他 tracked 指標不降，顯式控制零退步。來源修正獨立記錄。 |

## 比較後的選擇

比較了兩種架構：A 為多候選詞素樹加整句 chart，B 為編譯式詞素 FST 加逐步句法約束傳播。採 A，因為它能先適配現有路徑、保留完整歧義，不要求先重寫全部形態邏輯。獨立 review 的五項評分為 A 12/15、B 10/15；這是設計評分，並非發音或效能數據。環境沒有技能預設的外部模型家族，兩案與 review 均使用此環境可用的繼承模型。

從 B 採入兩點：保留互斥解析的相容世界，並分開語法多解與同音；對新宣告的附著規則檢查型別與循環。沒有採用全面 FST 編譯或「局部約束傳播必然更快」的主張。有限狀態方法仍適合日後編譯確定的詞綴子集，見 [Finite State Morphology](https://web.stanford.edu/group/cslipublications/cslipublications/site/1575864347.shtml)。

本設計已用現有路徑、signature、真實反例與來源做 review。第一批實作與實際驗證見前節；尚未採用新的發音決策。

已完成舊 route 的結構 trace、獨立 IPA 診斷入口、觀察模式 chart、複合詞候選列舉及其相容的分層森林。未完成項目是 derivation／inflection／DP 的遞迴森林，以及能通過全部 gates 的詞素邊界選擇與 POS 接管。

2026-10-27 的首批發音改善沿用既有 composer，修復 silent-e 複合詞的規則複數及詞幹移除後的衍生讀音；不是讓森林或 shadow 句法分析接管預設輸出。固定 common 嚴格分數未變，CMU 預設／規則各多對兩字；完整比較與仍未通過的基準條件見 [silent-e 驗證紀錄](next-release-accuracy.md#silent-e-compound-inflections-and-eviction-controls-2026-10-27)。遞迴 derivation／inflection／DP 森林及 POS 接管仍待後續驗證。
