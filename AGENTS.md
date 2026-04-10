# AGENTS.md

## このリポジトリについて

このリポジトリは `Study Sprint Board` の **Vite SPA + 独立 Express API 見本** です。同じ題材でも Next.js 一体型や Supabase 構成とは違い、**HTTP 契約を境界にして Web と API を分ける** ことが主題です。

- 主な変更対象は `apps/web` と `apps/api`
- `packages/shared` は共有型・validation・seed helper の置き場であり、契約の唯一の正本ではありません
- docs と実装のずれは教材として致命的なので、境界変更時は関連 docs も必ず更新します

## まず確認するファイル

| 目的 | ファイル |
| --- | --- |
| 全体像 | `README.md`, `docs/architecture.md` |
| 通信契約 | `docs/api/openapi.yaml`, `docs/api-spec.md` |
| 認証境界 | `docs/auth.md`, `apps/api/src/app.ts` |
| 配備境界 | `docs/deployment.md` |
| 永続化モデル | `apps/api/prisma/schema.prisma` |
| 領域別の詳細ルール | `.github/instructions/web.instructions.md`, `.github/instructions/docs.instructions.md`, `.github/instructions/ci.instructions.md` |

## 実行コマンド

| 目的 | コマンド |
| --- | --- |
| Web + API 開発起動 | `pnpm dev` |
| lint | `pnpm lint` |
| typecheck | `pnpm typecheck` |
| テスト一式 | `pnpm test` |
| Web の単体テスト 1 ファイル | `pnpm --filter web test -- src/lib/repository.test.ts` |
| API の単体テスト 1 ファイル | `pnpm --filter api test -- src/app.test.ts` |
| build | `pnpm build` |
| E2E 一式 | `pnpm e2e` |
| E2E 1 ファイル | `pnpm --filter web e2e -- tests/e2e/app.spec.ts` |
| Prisma Client 再生成 | `pnpm db:generate` |

## 高レベルアーキテクチャ

- ルートは `pnpm` ワークスペース + `turbo` で、実行可能なアプリは `apps/web` と `apps/api` の 2 つです。
- Web 側では `apps/web/src/lib/repository.ts` が `demo` / `api` モードを切り替えます。画面は repository 境界越しにしかデータへ触れません。
- API 側では `apps/api/src/app.ts` が CORS、Cookie、Zod 検証、HTTP レスポンス変換を担当し、業務ルールは `apps/api/src/services/board-service.ts` に集約します。
- 永続化は `apps/api/src/services/prisma-board-store.ts` と `apps/api/prisma/schema.prisma` に閉じ込めます。

| 正本 | 役割 |
| --- | --- |
| `docs/api/openapi.yaml` | SPA と API の通信契約 |
| `apps/api/prisma/schema.prisma` | DB モデルと永続化契約 |
| `docs/auth.md` | セッション Cookie と認証境界の補足 |
| `docs/deployment.md` | SPA / API 分離配備の補足 |

## この repo で重要な約束

- localStorage は `demo-repository` に、`fetch` は `api-repository` に閉じ込め、画面コンポーネントへ散らしません。
- 認証の本体は Web ではなく API 側にあります。Cookie セッションと認可説明は API 前提で考えます。
- Express route は薄く保ち、HTTP 変換と Zod 検証に集中させ、業務ルールは `board-service.ts` に寄せます。
- `packages/shared` は重複削減のための共有物であり、OpenAPI や Prisma schema の代わりにはしません。
- Web / API の Vitest はどちらも 100% coverage 閾値を前提にしているため、テストを減らす変更より境界を保つ変更を優先します。
