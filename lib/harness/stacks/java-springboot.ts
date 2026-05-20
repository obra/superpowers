import * as fs from "node:fs";
import * as path from "node:path";
import { BaseStackHandler } from "./base";
import type { SecurityTool, DomainCheck } from "../types";

export class JavaSpringBootStack extends BaseStackHandler {
	name = "java-springboot";

	detect(projectRoot: string): boolean {
		try {
			// Check for Maven
			const pomPath = path.join(projectRoot, "pom.xml");
			if (fs.existsSync(pomPath)) {
				const pom = fs.readFileSync(pomPath, "utf-8");
				if (
					pom.includes("spring-boot-starter-web") ||
					pom.includes("spring-boot-starter")
				) {
					return true;
				}
			}

			// Check for Gradle
			const gradleFiles = ["build.gradle", "build.gradle.kts"];
			for (const gradleFile of gradleFiles) {
				const gradlePath = path.join(projectRoot, gradleFile);
				if (fs.existsSync(gradlePath)) {
					const gradle = fs.readFileSync(gradlePath, "utf-8");
					if (
						gradle.includes("spring-boot") ||
						gradle.includes("org.springframework.boot")
					) {
						return true;
					}
				}
			}

			return false;
		} catch {
			return false;
		}
	}

	lintCmd(): string {
		// Try Maven first, fallback to Gradle
		if (fs.existsSync(path.join(process.cwd(), "pom.xml"))) {
			return "mvn checkstyle:check";
		}
		return "./gradlew checkstyleMain";
	}
	typecheckCmd(): string {
		if (fs.existsSync(path.join(process.cwd(), "pom.xml"))) {
			return "mvn compile -q";
		}
		return "./gradlew compileJava";
	}
	testCmd(files?: string[]): string {
		if (fs.existsSync(path.join(process.cwd(), "pom.xml"))) {
			return "mvn test";
		}
		return "./gradlew test";
	}
	coverageCmd(): string {
		if (fs.existsSync(path.join(process.cwd(), "pom.xml"))) {
			return "mvn jacoco:report";
		}
		return "./gradlew jacocoTestReport";
	}

	securityTools(): SecurityTool[] {
		return [
			{
				name: "owasp-dependency-check",
				npmPackage: "dependency-check",
				cmd: "mvn dependency-check:check",
				outputFormat: "json",
			},
		];
	}

	domainChecks(domain: "frontend" | "backend" | "infra"): DomainCheck[] {
		if (domain === "backend") {
			return [
				{
					name: "openapi-validate",
					cmd: "mvn springdoc-openapi:generate",
					threshold: undefined,
				},
			];
		}
		return [];
	}
}
