// lib/harness/drift/gap-classifier.ts

import type { DriftItem } from "./types";
import type { ImplementationSummary } from "./semantic-diff";

export function classifyGaps(
	summaries: ImplementationSummary[],
	_allProjectFiles: string[],
): DriftItem[] {
	return summaries.map((summary) => {
		const { requirement, matchingFiles, matchRatio } = summary;
		let status: DriftItem["status"];
		let severity: DriftItem["severity"];
		let implementationSummary: string;
		let gapDescription: string;
		let suggestedFix: string;

		if (matchingFiles.length === 0) {
			status = "missing";
			severity =
				requirement.type === "acceptance-criterion" ? "critical" : "high";
			implementationSummary = "NOT FOUND — no implementation detected";
			gapDescription = `No code found matching requirement: ${requirement.description}`;
			suggestedFix = `Implement ${requirement.type}: ${requirement.description}`;
		} else if (matchRatio < 0.3) {
			status = "partial";
			severity = "high";
			implementationSummary = `Partial — ${matchingFiles.length} file(s) with limited keyword overlap`;
			gapDescription = `Implementation appears incomplete. Only ${Math.round(matchRatio * 100)}% of spec keywords found in code.`;
			suggestedFix = `Expand implementation to cover all aspects of: ${requirement.description}`;
		} else if (matchRatio < 0.7) {
			status = "partial";
			severity = "medium";
			implementationSummary = `Partial — ${matchingFiles.length} file(s) found, some gaps`;
			gapDescription = `Implementation covers most of the requirement but may be missing edge cases or details.`;
			suggestedFix = `Review implementation against full requirement: ${requirement.description}`;
		} else {
			status = "aligned";
			severity = "low";
			implementationSummary = `${matchingFiles.length} file(s) implementing this requirement`;
			gapDescription = "";
			suggestedFix = "";
		}

		return {
			requirement: requirement.description,
			requirementId: requirement.id,
			status,
			severity,
			specDescription: requirement.description,
			implementationSummary,
			files: matchingFiles,
			gapDescription,
			suggestedFix,
		};
	});
}

export function detectExtraFiles(
	_allProjectFiles: string[],
	_requirementsFiles: Set<string>,
): DriftItem[] {
	return [];
}
