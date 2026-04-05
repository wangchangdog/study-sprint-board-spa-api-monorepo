# アーキテクチャ

## 概要

Study Sprint Board は、**Vite + React の SPA** と **Express + Prisma の独立 API** を同じモノレポで管理する見本です。Next.js 一体型でも BaaS 委譲型でもなく、**HTTP 契約を境界にして責務を分ける構成** を教材化しています。

## 構成図

```text
ブラウザ
  │
  ▼
apps/web (Vite SPA)
  ├─ routes / features / components
  ├─ repository abstraction
  └─ demo mode (localStorage) or api mode (HTTP)
                │
                ▼
docs/api/openapi.yaml
                │
                ▼
apps/api (Express API)
  ├─ route layer
  ├─ validation layer (Zod)
  ├─ service layer
  └─ store adapter
                │
                ▼
Prisma
  │
  ▼
PostgreSQL
```

## レイヤー構成

| レイヤー | 主な責務 | 配置 |
| --- | --- | --- |
| 画面層 | 画面表示、フォーム操作、遷移 | `apps/web/src/routes`, `apps/web/src/features`, `apps/web/src/components` |
| Web 境界層 | API 呼び出し、demo/api 切替 | `apps/web/src/lib/repository.ts`, `apps/web/src/lib/api-repository.ts` |
| API 入口層 | ルーティング、Cookie、Zod 検証、HTTP 変換 | `apps/api/src/app.ts` |
| サービス層 | 認証済みユーザー判定、タスク処理、集計 | `apps/api/src/services/board-service.ts` |
| 永続化層 | Prisma 経由の DB 入出力 | `apps/api/src/services/prisma-board-store.ts` |
| 契約・補助 | 共通型、seed、純粋関数 | `packages/shared` |

## この見本で重視している設計原則

### 1. UI と DB を直接つながない

`apps/web` は API 契約だけを見ます。DB モデルや Prisma の知識は `apps/api` 側に閉じ込め、フロントエンドが永続化詳細に引きずられないようにします。

### 2. ルートは薄く、業務ルールはサービス層に寄せる

Express ルートの役割は、入力検証と HTTP レスポンス変換です。タスク作成、更新、コメント追加、ダッシュボード集計のような業務ルールは `board-service.ts` に集約します。

### 3. 契約の正本を明示する

この見本の契約は複数ありますが、役割は混ぜません。

| 正本 | 役割 |
| --- | --- |
| `docs/api/openapi.yaml` | SPA と API の通信契約 |
| `apps/api/prisma/schema.prisma` | DB の永続化モデル |
| `docs/auth.md` | セッション Cookie と認証境界の人間向け補足 |
| `docs/deployment.md` | 分離配備と無料枠運用の前提 |

`packages/shared` は Web と API の重複削減に使いますが、**仕様の唯一の正本** ではありません。

### 4. demo モードを教材用の逃げ道として残す

`apps/web` は `demo` モードと `api` モードを切り替えられます。これにより、学生はまず画面と状態遷移を追い、その後で API 接続に進めます。

## なぜ機械可読な API 仕様書が必要か

SPA と独立 API を分けると、画面とバックエンドが別々に進みやすくなります。そのぶん、仕様が曖昧だとずれが起きやすくなります。

1. **正解を共有できる**: 実装がずれたとき、OpenAPI を根拠に議論できます。
2. **曖昧さを減らせる**: enum、必須項目、日付形式を文章ではなく構造で表せます。
3. **自動化に使える**: モック、型生成、契約チェックに流用できます。
4. **レビューしやすい**: docs と実装の差分を客観的に確認できます。
5. **引き継ぎしやすい**: 新メンバーが画面実装から逆算せず API を読めます。

## なぜ OpenAPI を正本にしているか

この見本では、まず **実務で広く通じる成果物** を学生に残させたいので OpenAPI を正本にしています。TypeSpec は有力ですが、ここでは必須にせず、`docs/roadmap.md` の拡張案に留めています。

## 既存 2 見本との比較

| 見本 | 主な境界 | 契約の中心 |
| --- | --- | --- |
| `study-sprint-board-next-monorepo/` | UI と API が同一アプリ内 | OpenAPI + Prisma |
| `study-sprint-board-supabase/` | アプリと BaaS の境界 | SQL migration + generated types + RLS docs |
| `study-sprint-board-spa-api-monorepo/` | SPA と独立 API の境界 | OpenAPI + Prisma + Auth/Deployment docs |

## 将来の拡張余地

- OpenAPI から API client を生成する
- TypeSpec を記述元にして OpenAPI を生成する
- `apps/web` と `apps/api` を別リポジトリへ切り出せるようにする
- admin 専用 API と認可ルールを追加する
