# Terraform / Infrastructure as Code Evaluation Rules

## State Management & Concurrency

- **Backend Lock**: Ensure remote state storage is activated (S3 + DynamoDB table lock, Terraform Cloud, or equivalent). State paths must use dynamic variables or explicit workspace isolation — no hardcoded backend keys. State locking enabled.

## Resource Engineering & Variables

- **Modularity & Type Rigid**: Resources must be strictly parameterized. Hardcoded environment tags, IDs, or CIDRs are immediate failures. All `variable` blocks must declare an explicit `type`, `description`, and a `validation` block where constraints apply. Outputs are documented. Modules used for reusable patterns.
- **Lifecycle Safety**: Critical data persistence engines (databases, storage buckets) must explicitly possess `lifecycle { prevent_destroy = true }` to avoid accidental teardowns via automation.

## Cloud Security Guardrails

- **Network & IAM Isolation**: Zero tolerance for wide-open security groups (`0.0.0.0/0` on ingress ports other than HTTP/S) or public S3 buckets without explicit, documented architecture sign-offs. IAM roles must implement the Principle of Least Privilege (no `Action = ["*"]`).
- **Encryption**: Data at rest (EBS, RDS, S3) and in-transit must enforce cryptographic encryption configurations. Secrets not stored in state (use AWS Secrets Manager, etc.).

## Best Practices

- `terraform fmt` and `validate` pass. tflint warnings addressed. Version constraints pinned (not `latest`).