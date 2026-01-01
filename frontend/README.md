# Workplace Scheduler - Frontend

Next.js 16.1.0 で構築された Workplace Scheduler のフロントエンドアプリケーション

## 技術スタック

- **Next.js 16.1.0** - React フレームワーク
- **React 19.2.0** - UIライブラリ
- **TypeScript** - 型安全な開発
- **Jotai 2.16.1** - 状態管理
- **Tailwind CSS 4.1.9** - スタイリング
- **Socket.IO Client 4.8.1** - WebSocketクライアント (リアルタイム同期)

## セットアップ

### 前提条件

このアプリケーションはバックエンドAPIとの連携が必須です。

- **バックエンドAPI** (NestJS + PostgreSQL) が起動していること
- バックエンドは `http://localhost:3001` で実行されていること

### 依存関係のインストール

```bash
npm install
```

### 環境変数の設定（オプション）

必要に応じて `.env.local` ファイルを作成し、バックエンドAPIのURLを指定できます：

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

デフォルト値は `http://localhost:3001` です。

### 開発サーバーの起動

1. バックエンドを起動（別ターミナル）：

```bash
cd ../backend
npm install
npm run prisma:migrate
npm run start:dev
```

2. フロントエンドを起動：

```bash
npm run dev
```

http://localhost:3000 でアクセスできます。

## ビルド

```bash
# プロダクションビルド
npm run build

# プロダクションサーバー起動
npm run start
```

## プロジェクト構造

```
frontend/
├── app/                    # Next.js App Router
│   ├── page.tsx           # メインページ
│   ├── layout.tsx         # ルートレイアウト
│   └── globals.css        # グローバルスタイル
├── components/            # Reactコンポーネント
│   ├── cell-editor.tsx
│   ├── user-management.tsx
│   ├── project-management.tsx
│   ├── location-management.tsx
│   └── export-import.tsx
├── lib/                   # ユーティリティとストア
│   ├── types.ts          # 型定義
│   ├── utils.ts          # ユーティリティ関数
│   ├── api-client.ts     # APIクライアント
│   ├── websocket.ts      # WebSocketクライアント
│   ├── atoms.ts          # Jotai状態管理
│   └── storage-adapter.ts # データ永続化アダプター
├── public/               # 静的ファイル
│   ├── icon.svg
│   ├── icon-light-32x32.png
│   ├── icon-dark-32x32.png
│   └── apple-icon.png
├── package.json
├── tsconfig.json
├── next.config.mjs
├── tailwind.config.ts
└── Dockerfile
```

## 主な機能

- **ユーザー管理**: チームメンバーの追加・編集・削除
- **スケジュール管理**: 日付ごとにAM/PMの勤務地を設定
- **プロジェクト管理**: プロジェクトとメンバーの紐付け
- **勤務地プリセット**: よく使う勤務地を登録・管理
- **勤務地背景色設定**: 勤務地ごとに背景色を設定
  - 6つのプリセット色（白、グレー、薄い赤、薄い青、薄い緑、薄い黄色）
  - カスタムカラーピッカーで任意の色を選択可能
  - スケジュール画面で設定した背景色が自動的に反映
- **絞り込み機能**: ユーザーやプロジェクトでフィルタリング
- **一括編集**: 複数日をまとめて編集
- **ドラッグ&ドロップ**: スケジュールの移動や勤務地の並び替え
- **データエクスポート/インポート**: JSON形式でデータの保存・読み込み
- **リアルタイム同期**: WebSocket (Socket.IO) による複数ブラウザ間のリアルタイムデータ同期
- **認証機能**: メールアドレスベースのユーザー登録・ログイン（環境変数で有効化）

## リアルタイム同期

このアプリケーションは Socket.IO を使用したリアルタイムデータ同期機能を搭載しています：

- **即座の反映**: 一方のブラウザで変更したデータが、他のすべてのブラウザに即座に反映されます
- **双方向通信**: WebSocketによる効率的な双方向通信
- **自動再接続**: 接続が切れた場合は自動的に再接続を試みます

### 対応データ

以下のデータがリアルタイムで同期されます：
- スケジュール（勤務地情報）
- ユーザー
- プロジェクト
- 勤務地プリセット

## Docker

フルスタックの起動方法については、プロジェクトルートの [README.docker.md](../README.docker.md) を参照してください。

```bash
# プロジェクトルートから実行
docker-compose up -d
```

これにより、以下のサービスが起動します：
- **PostgreSQL** (port 5432) - データベース
- **Backend** (port 3001) - NestJS API + WebSocket
- **Frontend** (port 3000) - Next.js アプリケーション

## ライセンス

MIT
