# AGENTS.md

## このリポジトリについて

このリポジトリは **教育用の見本プロジェクト** です。複雑さを増やしすぎず、SPA と独立 API の責務分離を読める状態を保ってください。

## 基本方針

- `apps/web` と `apps/api` を中心に変更する
- `packages/shared` は補助コード置き場として使い、契約の正本にはしない
- 破壊的変更を避け、既存の教材導線を壊さない
- 過度な抽象化を追加しない
- docs と実装を必ず揃える

## 編集前に確認すること

1. 変更対象に対応する docs を確認する
2. API を変えるなら `docs/api/openapi.yaml` を先に確認する
3. DB を変えるなら `apps/api/prisma/schema.prisma` を確認する
4. `team-dev-curriculum/` は参照専用であり、このリポジトリの作業では編集しない

## コマンド実行時の確認

- 実行前: 依存する `.env`、Docker、DB 状態を確認する
- 実行後: エラーの有無だけでなく、docs と実装がずれていないかを確認する
- Prisma 関連の型が壊れた場合は `pnpm db:generate` を疑う

## 基本検証

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

画面導線や起動フローを触った場合は追加で `pnpm e2e` も確認してください。

## 変更後の検証手順

1. 影響範囲の docs を更新する
2. 基本検証を通す
3. 画面フローを変えた場合は Playwright も通す
4. README と `docs/` の説明が実装と一致していることを確認する

## 禁止事項

- `team-dev-curriculum/` をこの作業の一部として編集しない
- UI から直接 Prisma や DB へ接続しない
- OpenAPI と実装を片方だけ更新しない
- docs を古いまま残さない
