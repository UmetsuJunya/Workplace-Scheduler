# Docker で Workplace Scheduler を起動する

このドキュメントでは、Docker を使用して Workplace Scheduler (フルスタック: NestJS + Next.js) を起動する方法を説明します。

## 前提条件

- Docker がインストールされていること
- Docker Compose がインストールされていること（Docker Desktop に含まれています）

## アーキテクチャ

このアプリケーションは以下の3つのコンテナで構成されています：

- **postgres** (PostgreSQL 16): ポート 5432 でデータベースが動作
- **backend** (NestJS + Prisma 7.2.0): ポート 3001 で API サーバー + WebSocketサーバーが動作
- **frontend** (Next.js): ポート 3000 でWebアプリケーションが動作

すべてのコンテナは Docker ネットワークで接続され、リアルタイムデータ同期が可能です。

### 技術スタック

- **Backend**: NestJS 10.x + Prisma 7.2.0 (PostgreSQLアダプター使用)
- **Frontend**: Next.js 16.1.0 + React 19.2.0
- **Database**: PostgreSQL 16
- **WebSocket**: Socket.IO 4.8.1
- **Container**: Docker + Docker Compose

## 起動方法

### 1. Docker Compose を使用して起動（推奨）

```bash
# イメージをビルドしてコンテナを起動
docker-compose up -d

# ログを確認（全体）
docker-compose logs -f

# バックエンドのみログ確認
docker-compose logs -f backend

# フロントエンドのみログ確認
docker-compose logs -f frontend

# 停止
docker-compose down

# データも含めて完全に削除
docker-compose down -v
```

### 2. 個別にコンテナを起動

#### バックエンドのみ起動

```bash
cd backend
docker build -t workplace-scheduler-backend .
docker run -d -p 3001:3001 --name workplace-scheduler-backend workplace-scheduler-backend
```

#### フロントエンドのみ起動

```bash
cd frontend
docker build -t workplace-scheduler-frontend .

# フロントエンドコンテナを起動
docker run -d -p 3000:3000 --name workplace-scheduler-frontend \
  -e NEXT_PUBLIC_API_URL=http://localhost:3001 \
  workplace-scheduler-frontend
```

## アクセス

ブラウザで以下のURLにアクセスしてください：

- **フロントエンド**: http://localhost:3000
- **バックエンドAPI**: http://localhost:3001
- **WebSocket**: ws://localhost:3001 (Socket.IO)

### リアルタイム同期の確認

複数のブラウザウィンドウで http://localhost:3000 を開いてください。
一方のウィンドウでデータを変更すると、もう一方のウィンドウにもリアルタイムで反映されます。

## データの永続化について

PostgreSQLのデータはDockerボリュームに保存されます。
`docker-compose down -v` を実行しない限り、データは保持されます。

データの保存場所：
- Docker ボリューム `postgres-data` にPostgreSQLのデータが保存されます

## トラブルシューティング

### ポートが既に使用されている場合

docker-compose.yml の ports セクションを変更してください：

#### フロントエンド (デフォルト: 3000)
```yaml
frontend:
  ports:
    - "8080:3000"  # ホストの8080ポートにマッピング
```

#### バックエンド (デフォルト: 3001)
```yaml
backend:
  ports:
    - "8081:3001"  # ホストの8081ポートにマッピング
```

### イメージを再ビルドする場合

```bash
# 全てのイメージをキャッシュを使用せずに再ビルド
docker-compose build --no-cache

# 特定のサービスのみ再ビルド
docker-compose build --no-cache backend
docker-compose build --no-cache frontend
```

### コンテナ内のログを確認

```bash
# 全サービスのログ
docker-compose logs -f

# バックエンドのみ
docker-compose logs -f backend

# フロントエンドのみ
docker-compose logs -f frontend
```

### データベースをリセットしたい場合

```bash
# コンテナとボリュームを削除
docker-compose down -v

# 再度起動
docker-compose up -d
```

### 環境変数の設定

本番環境では、`docker-compose.yml` の環境変数を適切に設定してください：

```yaml
postgres:
  environment:
    - POSTGRES_PASSWORD=strong-password-here  # 必ず変更してください

backend:
  environment:
    - DATABASE_URL=postgresql://postgres:strong-password-here@postgres:5432/workplace_scheduler?schema=public
    - JWT_SECRET=your-production-secret-key  # 必ず変更してください
    - FRONTEND_URL=https://your-domain.com
```

### ネットワーク構成

コンテナ間通信は Docker ネットワークで行われます：

- フロントエンド → バックエンド: HTTP (REST API) + WebSocket (Socket.IO)
- バックエンド → PostgreSQL: PostgreSQL プロトコル
- ブラウザ → フロントエンド: HTTP
- ブラウザ → バックエンド: WebSocket (リアルタイム同期)

## 開発モードでの起動

開発モードで起動したい場合は、Docker を使用せず、以下のコマンドを実行してください：

### バックエンド

```bash
cd backend
npm install
npm run start:dev
```

バックエンドは http://localhost:3001 で起動します。

### フロントエンド

```bash
cd frontend
npm install
npm run dev
```

フロントエンドは http://localhost:3000 で起動します。

## 機能

### リアルタイムデータ同期

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

## API ドキュメント

バックエンドAPIとWebSocketイベントの詳細なドキュメントは [README.backend.md](README.backend.md) を参照してください。
