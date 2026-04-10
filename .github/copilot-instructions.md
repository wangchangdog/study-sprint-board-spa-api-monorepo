# Copilot Instructions

## この repo の前提

この repo は `Study Sprint Board` の **SPA / API 分離見本** です。Next.js 一体型でも Supabase 構成でもありません。`apps/web` と `apps/api` を HTTP 契約で分け、責務境界を読みやすくしています。

## 実行コマンド

| 目的 | コマンド |
| --- | --- |
| lint | `pnpm lint` |
| typecheck | `pnpm typecheck` |
| テスト一式 | `pnpm test` |
| Web の単体テスト 1 ファイル | `pnpm --filter web test -- src/lib/repository.test.ts` |
| API の単体テスト 1 ファイル | `pnpm --filter api test -- src/app.test.ts` |
| build | `pnpm build` |
| E2E 一式 | `pnpm e2e` |
| E2E 1 ファイル | `pnpm --filter web e2e -- tests/e2e/app.spec.ts` |

## 高レベルアーキテクチャ

- `apps/web/src/lib/repository.ts` が `demo` / `api` を切り替え、画面は repository 境界を越えてのみデータに触れます。
- `apps/api/src/app.ts` は CORS、Cookie セッション、Zod 検証、HTTP 変換を担当し、業務ルールは `apps/api/src/services/board-service.ts` に寄せています。
- 永続化は `apps/api/prisma/schema.prisma` と store 実装側に閉じ込めています。
- `docs/api/openapi.yaml` が通信契約の正本で、`docs/api-spec.md` は授業向け補足です。
- 認証と分離配備の説明は `docs/auth.md` と `docs/deployment.md` に分かれています。

## 重要な規約

- localStorage は `demo-repository` に、HTTP 通信は `api-repository` に閉じ込めます。
- UI から DB や Prisma を直接意識させず、API 側でセッション Cookie と認証を一元化します。
- `packages/shared` は共通型や validation の共有に使いますが、契約の唯一の正本としては扱いません。
- 通信仕様を変えるときは `docs/api/openapi.yaml` と実装を同時に更新します。
- 画面導線や auth/deployment の説明を変えたら `docs/auth.md` と `docs/deployment.md` も揃えます。
