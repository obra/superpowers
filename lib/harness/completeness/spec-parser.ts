// lib/harness/completeness/spec-parser.ts

import * as fs from 'fs';
import { AcceptanceCriterion } from './types';

interface SpecParser {
  format: 'numbered' | 'gherkin' | 'user-story' | 'checklist';
  detect(content: string): boolean;
  extract(content: string): AcceptanceCriterion[];
}

function extractKeywords(text: string): string[] {
  const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'shall', 'can', 'need', 'dare', 'ought', 'used', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'under', 'again', 'further', 'then', 'once', 'and', 'but', 'or', 'nor', 'not', 'so', 'yet', 'both', 'either', 'neither', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'only', 'own', 'same', 'than', 'too', 'very', 'just', 'because', 'if', 'when', 'where', 'how', 'all', 'that', 'this', 'these', 'those', 'it', 'its', 'i', 'me', 'my', 'we', 'our', 'you', 'your', 'he', 'him', 'his', 'she', 'her', 'they', 'them', 'their', 'what', 'which', 'who', 'whom']);
  return text.toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w))
    .filter((v, i, a) => a.indexOf(v) === i);
}

const parsers: SpecParser[] = [
  {
    format: 'numbered',
    detect: (c) => /(?:AC[-\s]?\d+|^\d+\.\s+[A-Z])/.test(c),
    extract: (content) => {
      const criteria: AcceptanceCriterion[] = [];
      const regex = /(?:AC[-\s]?(\d+)|^(\d+)\.\s+([A-Z][^\n]+))/gm;
      let match;
      while ((match = regex.exec(content)) !== null) {
        const id = `AC-${match[1] || match[2]}`;
        const desc = (match[3] || match[0]).trim();
        criteria.push({ id, description: desc, keywords: extractKeywords(desc), type: 'functional' });
      }
      return criteria;
    },
  },
  {
    format: 'gherkin',
    detect: (c) => /Given.*When.*Then/s.test(c),
    extract: (content) => {
      const criteria: AcceptanceCriterion[] = [];
      const blocks = content.split(/(?=Given\b)/i);
      blocks.forEach((block, i) => {
        const givenMatch = block.match(/Given\s+(.+?)(?=When|$)/is);
        const whenMatch = block.match(/When\s+(.+?)(?=Then|$)/is);
        const thenMatch = block.match(/Then\s+(.+?)(?=Given|When|$)/is);
        if (whenMatch && thenMatch) {
          const desc = `When ${whenMatch[1].trim()} then ${thenMatch[1].trim()}`;
          criteria.push({ id: `AC-${i + 1}`, description: desc, keywords: extractKeywords(desc), type: 'functional' });
        }
      });
      return criteria;
    },
  },
  {
    format: 'checklist',
    detect: (c) => /-\s*\[\s*\]\s+/.test(c),
    extract: (content) => {
      const criteria: AcceptanceCriterion[] = [];
      const regex = /-\s*\[\s*\]\s+(.+)/g;
      let match;
      let idx = 1;
      while ((match = regex.exec(content)) !== null) {
        const desc = match[1].trim();
        criteria.push({ id: `AC-${idx++}`, description: desc, keywords: extractKeywords(desc), type: 'functional' });
      }
      return criteria;
    },
  },
  {
    format: 'user-story',
    detect: (c) => /As a\s+.*I want\s+.*So that\s+/is.test(c),
    extract: (content) => {
      const criteria: AcceptanceCriterion[] = [];
      const acSection = content.split(/Acceptance Criteria:?\s*/i)[1];
      if (!acSection) return criteria;
      const lines = acSection.split('\n').filter(l => l.trim().startsWith('-') || /^\d+\./.test(l.trim()));
      lines.forEach((line, i) => {
        const desc = line.replace(/^[-\d.\s]+/, '').trim();
        if (desc) criteria.push({ id: `AC-${i + 1}`, description: desc, keywords: extractKeywords(desc), type: 'functional' });
      });
      return criteria;
    },
  },
];

export function parseSpec(filePath: string): { title: string; criteria: AcceptanceCriterion[] } {
  const content = fs.readFileSync(filePath, 'utf-8');
  const titleMatch = content.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1].trim() : filePath.split(/[/\\]/).pop() || 'Unknown';

  for (const parser of parsers) {
    if (parser.detect(content)) {
      return { title, criteria: parser.extract(content) };
    }
  }

  // Fallback: try all parsers and merge results
  const allCriteria: AcceptanceCriterion[] = [];
  for (const parser of parsers) {
    allCriteria.push(...parser.extract(content));
  }
  return { title, criteria: allCriteria };
}

export function detectSpecFormat(content: string): string {
  for (const parser of parsers) {
    if (parser.detect(content)) return parser.format;
  }
  return 'unknown';
}
