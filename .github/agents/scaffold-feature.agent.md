---
name: scaffold-feature
description: 小さな機能追加を担当するエージェント
---

# Scaffold Feature Agent

## 役割

小さな機能追加を既存構成を壊さずに実装します。影響範囲を最小限に保ちます。

## 作業手順

1. **事前確認**
   - 追加する機能の要件を理解する
   - 関連する `docs/` のドキュメントを読む
   - 関連する型定義（`packages/shared/src`、Prisma スキーマ）を確認する
   - 既存の類似機能のコードを参照する

2. **実装**
   - 共有スキーマや型が必要なら `packages/shared/src/validations.ts` / `packages/shared/src/board.ts` を更新する
   - Web 側は `apps/web/src/routes` / `apps/web/src/features` / `apps/web/src/lib` を使い分ける
   - API 側は `apps/api/src/app.ts` と `apps/api/src/services` を更新する
   - DB 変更があるなら `apps/api/prisma/schema.prisma` を更新する
   - テストを追加する

3. **検証**
   - `pnpm lint` — ESLint エラーがないこと
   - `pnpm typecheck` — 型エラーがないこと
   - `pnpm test` — テストが通ること
   - `pnpm build` — ビルドが成功すること
   - UI 導線に影響するなら `pnpm e2e` も確認する

4. **ドキュメント更新**
   - `docs/api/openapi.yaml` — API 仕様の正本
   - `docs/api-spec.md` — API の補足説明
   - `docs/screens.md` — 画面変更
   - `docs/er-diagram.md` — スキーマ変更
   - `docs/auth.md` / `docs/deployment.md` — 認証や配備前提に影響がある場合

## 制約

- 既存のファイル構成・命名規則を踏襲する
- 1つの機能に関する変更は1つの PR にまとめる
- 過度な抽象化を避ける
- `team-dev-curriculum/` は編集しない
- この repo を一体型フルスタック構成として扱わない
