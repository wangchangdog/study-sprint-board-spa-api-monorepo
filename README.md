# Study Sprint Board

Study Sprint Board は、学習や制作の進捗をチームで管理するための Web アプリです。この見本では、**Vite SPA と独立 Express API を契約でつなぐモノレポ** を教材として示します。

## カリキュラム見本としての位置づけ

このリポジトリは、`graduation-works/` 配下の 3 つ目の比較見本です。機能差ではなく、**責務境界と配備単位の違い** を読み取れるようにしています。

| 見本 | 中核構成 | 主な学び |
| --- | --- | --- |
| `study-sprint-board-next-monorepo/` | Next.js App Router 一体型 | UI と API が同居するフルスタック構成 |
| `study-sprint-board-supabase/` | Vite SPA + Supabase | BaaS に責務を委譲する構成 |
| `study-sprint-board-spa-api-monorepo/` | Vite SPA + Express API | SPA と API を分離し、OpenAPI を境界に置く構成 |

## 採用技術

| カテゴリ | 技術 | 役割 |
| --- | --- | --- |
| Web | Vite, React, React Router, TypeScript | SPA の画面と操作フロー |
| API | Express, TypeScript, Zod | 認証付き JSON API |
| 永続化 | Prisma, PostgreSQL | スキーマ管理と DB アクセス |
| UI | Tailwind CSS | 最小構成のスタイリング |
| テスト | Vitest, Testing Library, Playwright | ユニットテストと E2E |
| モノレポ | pnpm, Turborepo | ワークスペース管理と一括実行 |
| 契約 | OpenAPI | Web と API の外部契約の正本 |

## この構成で見せたいこと

- **UI から DB を直接触らない**: `apps/web` は API 契約だけを見ます。
- **API を独立配備しやすい**: `apps/api` を別サービスとして動かせます。
- **契約を先に確認できる**: `docs/api/openapi.yaml` を読むと通信内容が追えます。
- **比較学習しやすい**: 同じ `Study Sprint Board` を別構成で並べて読めます。

## 仕様の正本

| ファイル | 役割 |
| --- | --- |
| `docs/api/openapi.yaml` | SPA と API の HTTP 契約の正本 |
| `apps/api/prisma/schema.prisma` | DB モデルと関連の正本 |
| `docs/auth.md` | セッション Cookie と認証境界の補足 |
| `docs/deployment.md` | SPA と API を分離して運用する前提の補足 |

`packages/shared` は純粋関数、画面用型、seed データの共有に使いますが、**契約の正本そのものではありません**。

## セットアップ

### 必要な環境

- Node.js 20 以上
- pnpm 10 以上
- Docker

### 手順

```bash
cp .env.example .env
pnpm install
docker compose up -d
pnpm db:generate
pnpm db:push
pnpm db:seed
pnpm dev
```

起動後の URL:

- Web: `http://127.0.0.1:4173`
- API: `http://127.0.0.1:4010`
- Health check: `http://127.0.0.1:4010/health`

`pnpm dev` は Turborepo 経由で SPA と API を同時に起動します。

### 開発用アカウント

| メールアドレス | パスワード | ロール |
| --- | --- | --- |
| `admin@example.com` | `password123` | `admin` |
| `user1@example.com` | `password123` | `user` |
| `user2@example.com` | `password123` | `user` |

### demo モード

API や DB を起動せず画面だけを確認したい場合は、`.env` で `VITE_ENABLE_API="false"` に切り替えてください。`apps/web` は localStorage ベースの demo repository を使います。

## 開発コマンド

| コマンド | 説明 |
| --- | --- |
| `pnpm dev` | Web と API を同時起動 |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | TypeScript 型チェック |
| `pnpm test` | Vitest（coverage 付き） |
| `pnpm build` | 本番ビルド |
| `pnpm e2e` | Playwright |
| `pnpm db:generate` | Prisma Client 生成 |
| `pnpm db:push` | スキーマを DB に反映 |
| `pnpm db:migrate` | 開発用 migration 作成と適用 |
| `pnpm db:seed` | seed データ投入 |
| `pnpm db:studio` | Prisma Studio |

## ディレクトリ構成

```text
study-sprint-board-spa-api-monorepo/
├─ apps/
│  ├─ web/
│  │  ├─ src/
│  │  │  ├─ components/
│  │  │  ├─ features/
│  │  │  ├─ lib/
│  │  │  └─ routes/
│  │  └─ tests/
│  └─ api/
│     ├─ prisma/
│     └─ src/
│        ├─ lib/
│        └─ services/
├─ packages/
│  ├─ config-eslint/
│  ├─ config-typescript/
│  └─ shared/
├─ docs/
│  ├─ api/openapi.yaml
│  ├─ architecture.md
│  ├─ auth.md
│  ├─ deployment.md
│  ├─ er-diagram.md
│  ├─ roadmap.md
│  ├─ screens.md
│  └─ setup.md
└─ .github/
   ├─ agents/
   ├─ instructions/
   └─ workflows/
```

## 設計思想

### Web 側

- React Router 配下のページは薄く保ち、表示と操作に集中します。
- 通信は `apps/web/src/lib/repository.ts` から始め、visual component に `fetch` を散らしません。
- `apps/web` は API モードと demo モードを切り替えられます。

### API 側

- Express の route は入力検証と HTTP 変換に専念します。
- 業務ルールは `apps/api/src/services/board-service.ts` に寄せます。
- Prisma は `prisma-board-store.ts` に閉じ込め、サービス層の外へ漏らしません。

### 契約

- API の外部契約は `docs/api/openapi.yaml` を正本にします。
- Markdown の `docs/api-spec.md` は授業用の補足です。
- 仕様変更時は OpenAPI と実装を同時に更新します。

## Copilot Instructions / Agents

この見本には、継続運用しやすいように GitHub Copilot 向けの補助ファイルを最初から含めています。

| ファイル | 役割 |
| --- | --- |
| `AGENTS.md` | リポジトリ全体の作業ルール |
| `.github/copilot-instructions.md` | 全体設計と編集方針 |
| `.github/instructions/web.instructions.md` | `apps/web` 向けの実装指針 |
| `.github/instructions/docs.instructions.md` | `docs/` と README 向けの文書指針 |
| `.github/instructions/ci.instructions.md` | GitHub Actions 向けの方針 |
| `.github/agents/scaffold-feature.agent.md` | 小さな機能追加用エージェント |
| `.github/agents/review-sample.agent.md` | 教材品質レビュー用エージェント |

## ドキュメント

| ドキュメント | 内容 |
| --- | --- |
| `docs/architecture.md` | レイヤー構成と比較軸 |
| `docs/screens.md` | 画面一覧と導線 |
| `docs/er-diagram.md` | DB モデルと関連 |
| `docs/api/openapi.yaml` | 機械可読な API 仕様の正本 |
| `docs/api-spec.md` | API の読み方と補足 |
| `docs/setup.md` | セットアップ詳細 |
| `docs/auth.md` | 認証とセッション Cookie |
| `docs/deployment.md` | 分離配備の考え方 |
| `docs/roadmap.md` | 今後の発展案と TODO |

## TODO / 今後の拡張

詳細は `docs/roadmap.md` にまとめています。特に次は教材として拡張余地があります。

- OpenAPI からの型生成や API client 自動生成
- TypeSpec を導入し、OpenAPI を生成物として扱う構成
- フィルタ、ソート、ページネーション
- OAuth 連携やセッション更新の強化
- 本番向けの admin API と認可ルール追加

## ライセンス

教育目的の見本リポジトリです。
