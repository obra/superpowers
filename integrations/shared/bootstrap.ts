import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export interface BootstrapDiagnostic {
	level: "warning";
	code: "bootstrap-read-failed";
	harness: string;
	path: string;
	error: string;
}

export interface BootstrapControllerConfig {
	harness: string;
	bootstrapSkillPath: string;
	bootstrapMarker: string;
	loadedMessage: string;
	toolMapping: string;
	reportDiagnostic?: (diagnostic: BootstrapDiagnostic) => void;
}

export interface BootstrapController<Message = unknown> {
	arm(): void;
	disarm(): void;
	inject(messages: Message[]): { messages: Message[] } | undefined;
}

export function createBootstrapController<Message = unknown>(
	config: BootstrapControllerConfig,
): BootstrapController<Message> {
	const bootstrapSkillPath = resolve(config.bootstrapSkillPath);
	let armed = false;
	let cachedBootstrap: string | null | undefined;

	function getBootstrap(): string | null {
		if (cachedBootstrap !== undefined) return cachedBootstrap;

		try {
			const body = stripFrontmatter(readFileSync(bootstrapSkillPath, "utf8"));
			cachedBootstrap = `<EXTREMELY_IMPORTANT>
${config.bootstrapMarker}

You have superpowers.

${config.loadedMessage}

${body}

${config.toolMapping}
</EXTREMELY_IMPORTANT>`;
			return cachedBootstrap;
		} catch (error) {
			cachedBootstrap = null;
			try {
				config.reportDiagnostic?.({
					level: "warning",
					code: "bootstrap-read-failed",
					harness: config.harness,
					path: bootstrapSkillPath,
					error: error instanceof Error ? error.message : String(error),
				});
			} catch (callbackError) {
				void callbackError;
			}
			return null;
		}
	}

	return {
		arm() {
			armed = true;
		},
		disarm() {
			armed = false;
		},
		inject(messages) {
			if (!armed || messages.some(messageContainsMarker)) return undefined;

			const bootstrap = getBootstrap();
			if (bootstrap === null) return undefined;

			const bootstrapMessage = {
				role: "user" as const,
				content: [{ type: "text" as const, text: bootstrap }],
				timestamp: Date.now(),
			} as Message;
			const insertAt = firstNonCompactionSummaryIndex(messages);
			return {
				messages: [
					...messages.slice(0, insertAt),
					bootstrapMessage,
					...messages.slice(insertAt),
				],
			};
		},
	};

	function messageContainsMarker(message: unknown): boolean {
		if (!isRecord(message)) return false;
		const { content } = message;
		if (typeof content === "string") {
			return content.includes(config.bootstrapMarker);
		}
		if (!Array.isArray(content)) return false;

		return content.some((part) => {
			return (
				isRecord(part) &&
				part.type === "text" &&
				typeof part.text === "string" &&
				part.text.includes(config.bootstrapMarker)
			);
		});
	}
}

function stripFrontmatter(content: string): string {
	const match = content.match(/^---\n[\s\S]*?\n---\n([\s\S]*)$/);
	return (match ? match[1] : content).trim();
}

function firstNonCompactionSummaryIndex(messages: unknown[]): number {
	let index = 0;
	while (true) {
		const message = messages[index];
		if (!isRecord(message) || message.role !== "compactionSummary")
			return index;
		index += 1;
	}
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === "object";
}
