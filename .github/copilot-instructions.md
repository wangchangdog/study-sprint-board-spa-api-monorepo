# Copilot Instructions

## この repo の前提

Study Sprint Board の教材群のうち、この repo は **分離 SPA / API 見本** です。

- `apps/web`: Vite + React + TypeScript + React Router + Tailwind CSS
- `apps/api`: Express + TypeScript + Zod + Prisma + PostgreSQL
- `packages/shared`: 共通型、demo seed、board helper、validation
- 認証: HTTP-only セッション Cookie

## 説明するときの注意

- この repo を Next.js 構成として説明しない
- この repo を Supabase 構成として説明しない
- 教材として、**なぜ別 API にするのか** を優先して説明する
- 同じ MVP を兄弟 repo と比較できるようにする

## モノレポ運用

- ルートは `pnpm workspace` + `turbo`
- 横断コマンドはルートの `package.json` から実行する
- package 間依存は `workspace:*`

## 実装方針

### Web

- 画面ルーティングは `apps/web/src/routes`
- UI は `demo` / `api` の両モードを意識する
- localStorage は `demo-repository` に閉じ込める
- API 通信は `api-repository` に閉じ込める

### API

- エンドポイントは `apps/api/src/app.ts`
- 入力検証は Zod を通す
- セッション確認は API 側で一元化する
- 永続化の正本は `apps/api/prisma/schema.prisma`

### 共有契約

- HTTP 契約の正本は `docs/api/openapi.yaml`
- 認証説明は `docs/auth.md`
- 配備説明は `docs/deployment.md`
- shared package の型と docs をずらさない

## ドキュメント方針

- README は比較教材としての入口
- docs は「何があるか」だけでなく「なぜ分けるか」を書く
- API / auth / deployment はセットで更新する

## 検証

変更後の確認コマンド:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm e2e
```
