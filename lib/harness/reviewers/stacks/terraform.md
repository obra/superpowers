# Terraform Review Rules

## State Management
- Remote state configured (S3 + DynamoDB, Terraform Cloud, etc.)
- State locking enabled
- No hardcoded state paths

## Resource Design
- Resources are parameterized (no hardcoded values)
- Variables have descriptions and validation rules
- Outputs are documented
- Modules used for reusable patterns

## Security
- No public S3 buckets, open security groups, or 0.0.0.0/0 CIDRs
- IAM follows least privilege (no wildcard actions)
- Secrets not stored in state (use AWS Secrets Manager, etc.)
- Encryption enabled for data at rest and in transit

## Best Practices
- terraform fmt and validate pass
- tflint warnings addressed
- Version constraints pinned (not latest)
- Lifecycle rules for prevent_destroy on critical resources
