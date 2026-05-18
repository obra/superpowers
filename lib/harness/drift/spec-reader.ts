// lib/harness/drift/spec-reader.ts

import * as fs from 'fs';
import { parseSpec } from '../completeness/spec-parser';

export interface SpecRequirement {
  id: string;
  type: 'acceptance-criterion' | 'architecture' | 'constraint' | 'non-functional';
  description: string;
  keywords: string[];
}

export function readSpecRequirements(specPath: string): { title: string; requirements: SpecRequirement[] } {
  const { title, criteria } = parseSpec(specPath);

  const requirements: SpecRequirement[] = criteria.map(c => ({
    id: c.id,
    type: 'acceptance-criterion',
    description: c.description,
    keywords: c.keywords,
  }));

  const content = fs.readFileSync(specPath, 'utf-8');

  const archSection = content.split(/##?\s*Architecture\s*/i)[1];
  if (archSection) {
    const archItems = archSection.split('\n').filter(l => l.trim().startsWith('-') || /^\d+\./.test(l.trim()));
    archItems.forEach((line, i) => {
      const desc = line.replace(/^[-\d.\s]+/, '').trim();
      if (desc) requirements.push({ id: `ARCH-${i + 1}`, type: 'architecture', description: desc, keywords: desc.toLowerCase().split(/\s+/).filter(w => w.length > 3) });
    });
  }

  const constraintSection = content.split(/##?\s*Constraints?\s*/i)[1];
  if (constraintSection) {
    const constraintItems = constraintSection.split('\n').filter(l => l.trim().startsWith('-') || /^\d+\./.test(l.trim()));
    constraintItems.forEach((line, i) => {
      const desc = line.replace(/^[-\d.\s]+/, '').trim();
      if (desc) requirements.push({ id: `CONST-${i + 1}`, type: 'constraint', description: desc, keywords: desc.toLowerCase().split(/\s+/).filter(w => w.length > 3) });
    });
  }

  return { title, requirements };
}
