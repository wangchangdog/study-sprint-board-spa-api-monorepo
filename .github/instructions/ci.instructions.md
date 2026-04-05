---
applyTo: ".github/workflows/**/*.yml,.github/workflows/**/*.yaml"
---

# CI ワークフロー作成ガイド

## 基本方針

- 初学者が読める、シンプルな記述にする
- 無駄に複雑な matrix は避ける
- 実行順序: install → lint → typecheck → test → build
- Playwright がある repo では e2e も含める
- Prisma Client 生成が必要なら明示する

## ジョブ構成

- 1つのワークフローで基本検証を網羅する
- 分けるなら `quality` と `e2e` くらいまでにとどめる
- `e2e` は `quality` 成功後に実行する

## キャッシュ

- pnpm store のキャッシュは使用してよい
- 過剰なキャッシュ戦略は避ける（メンテナンスコストが上がる）
- キャッシュキーには lockfile のハッシュを含める

## 環境変数

- シークレットは GitHub Secrets を使用する
- CI 用の環境変数は workflow 内で定義する
- この repo では `DATABASE_URL`, `APP_WEB_URL`, `API_PORT`, `VITE_API_BASE_URL` などが候補

## 注意点

- CI が落ちている状態でマージしない
- テストが不安定な場合はスキップではなく修正する
- Web の E2E は demo モードで動かすと構成が単純
