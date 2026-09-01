import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import currentBank from '../src/data/vocabularyBank.json';
import {
  prepareVocabularyImport,
  summarizeVocabularyBank,
  type ImportVocabularyItem,
} from '../src/data/vocabularyImport';

const inputPath = process.argv.slice(2).find((argument) => argument !== '--');
const bankPath = resolve(process.cwd(), 'src/data/vocabularyBank.json');

if (!inputPath) {
  console.error('Usage: pnpm run import:vocabulary -- path/to/formal-vocabulary.json');
  process.exit(1);
}

const incoming = JSON.parse(await readFile(resolve(process.cwd(), inputPath), 'utf8')) as unknown;
const preparation = prepareVocabularyImport(currentBank as ImportVocabularyItem[], incoming);

console.log(`新增候选题目: ${preparation.newItems.length}`);
console.log(`替换旧未审核题目: ${preparation.replacements.length}`);
console.log(`跳过重复题目: ${preparation.duplicateWords.length}`);
console.log(`格式错误题目: ${preparation.issues.length}`);

if (preparation.duplicateWords.length > 0) {
  console.log(`重复单词: ${preparation.duplicateWords.join(', ')}`);
}

if (preparation.issues.length > 0) {
  for (const issue of preparation.issues) {
    const label = issue.word ? `${issue.index + 1} (${issue.word})` : String(issue.index + 1);
    console.error(`第 ${label} 条: ${issue.errors.join('; ')}`);
  }
  console.error('导入已取消：请修正格式错误后再导入，当前题库未修改。');
  process.exit(1);
}

const replacementsByWord = new Map(
  preparation.replacements.map((item) => [item.word.trim().toLocaleLowerCase(), item]),
);
const nextBank = [
  ...(currentBank as ImportVocabularyItem[]).map(
    (item) => replacementsByWord.get(item.word.trim().toLocaleLowerCase()) ?? item,
  ),
  ...preparation.newItems,
];
await writeFile(bankPath, `${JSON.stringify(nextBank, null, 2)}\n`, 'utf8');

const summary = summarizeVocabularyBank(nextBank);
console.log(`verified=true: ${summary.verifiedTrue}`);
console.log(`verified=false: ${summary.verifiedFalse}`);
console.log(`Foundation: ${summary.byDifficulty.Foundation}`);
console.log(`Current: ${summary.byDifficulty.Current}`);
console.log(`Target: ${summary.byDifficulty.Target}`);
console.log(`Challenge: ${summary.byDifficulty.Challenge}`);
console.log(`Real Word: ${summary.real}`);
console.log(`Fake Word: ${summary.fake}`);