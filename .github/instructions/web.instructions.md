---
applyTo: "apps/web/**/*.ts,apps/web/**/*.tsx,apps/web/**/*.css"
---

# Web アプリケーション開発ガイド

## ディレクトリ構成を尊重する

- `src/routes/` — React Router の画面
- `src/features/` — 認証ガード、画面ロジック、機能 UI
- `src/lib/` — repository、env、demo/api 接続
- `src/components/` — 汎用 UI

## この repo 特有の前提

- UI は `demo` と `api` の 2 モードを持つ
- `demo` は localStorage ベース
- `api` は別プロセス API に Cookie 付きで接続する

## 守るべき境界

- localStorage への直接アクセスは `demo-repository` に閉じ込める
- `fetch` の実装は `api-repository` に閉じ込める
- 画面コンポーネントに mode ごとの分岐を散らしすぎない
- API 認証の本体は Web ではなく API 側にある前提で考える

## ルーティング

- 画面は React Router で管理する
- 未認証時の導線は `signin -> dashboard` を基準に考える
- `/settings` は UI 側で admin ガードするが、教材としては API 側の認証説明も必要

## バリデーション

- 型・入力ルールは `packages/shared` を優先して参照する
- 画面フォームと API で意味がずれないようにする

## スタイリング

- Tailwind CSS を使う
- mode badge や状態バッジのような教材上重要な表示は壊さない
