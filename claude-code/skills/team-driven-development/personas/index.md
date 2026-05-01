# Persona Reference Index

Worker spawn 시 태스크에 맞는 페르소나 파일을 선택하기 위한 인덱스.

## 선택 가이드

| 태스크 키워드 / 파일 패턴 | 페르소나 파일 |
|---|---|
| `.svelte`, SvelteKit, Svelte 5, runes | `frontend-svelte5.md` |
| `.tsx`, `.jsx`, React, Next.js | `frontend-react.md` |
| `.vue`, Vue, Nuxt | `frontend-vue.md` |
| `.rb`, Rails, ActiveRecord, Hotwire | `backend-rails8.md` |
| `.cs`, C#, .NET, ASP.NET, Entity Framework | `backend-csharp.md` |
| `.ts`, `.js`, Express, Fastify, NestJS, Node | `backend-node.md` |
| `.py`, Django, FastAPI, SQLAlchemy | `backend-python.md` |
| `.go`, Gin, Echo, Go modules | `backend-go.md` |
| `.swift`, SwiftUI, UIKit, iOS, Xcode | `mobile-swift.md` |
| `.kt`, Kotlin, Jetpack Compose, Android | `mobile-kotlin.md` |
| `.dart`, Flutter, Widget | `mobile-flutter.md` |
| React Native, Expo, `.tsx` (mobile) | `mobile-react-native.md` |
| SQL, migration, schema, ORM, index | `database-specialist.md` |
| Docker, CI/CD, Terraform, deploy, k8s | `infrastructure.md` |
| test, spec, coverage, mock, fixture | `qa-engineer.md` |
| auth, encryption, OWASP, token, CORS | `security-engineer.md` |
| performance, cache, optimize, profile | `performance-engineer.md` |
| API design, OpenAPI, REST, GraphQL, docs | `api-designer.md` |

## 복합 태스크

하나의 태스크가 여러 도메인을 걸칠 경우, 주 도메인의 페르소나를 선택한다.
프론트엔드 + 백엔드가 혼합된 경우, 별도 Worker로 분리하여 각각 해당 페르소나를 주입한다.
