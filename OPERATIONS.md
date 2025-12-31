# Workplace Scheduler 運用マニュアル

このドキュメントは、Workplace Scheduler の日常的な運用、トラブルシューティング、メンテナンスに関する情報を提供します。

## 目次

1. [起動と停止](#起動と停止)
2. [ログの確認](#ログの確認)
3. [データベース管理](#データベース管理)
4. [バックアップとリストア](#バックアップとリストア)
5. [トラブルシューティング](#トラブルシューティング)
6. [パフォーマンス監視](#パフォーマンス監視)
7. [セキュリティ](#セキュリティ)
8. [アップデート手順](#アップデート手順)

---

## 起動と停止

### Docker環境での起動

```bash
# 全サービスを起動
docker-compose up -d

# 特定のサービスのみ起動
docker-compose up -d backend
docker-compose up -d frontend
docker-compose up -d postgres

# イメージを再ビルドして起動
docker-compose up --build -d
```

### Docker環境での停止

```bash
# 全サービスを停止
docker-compose down

# データを含めて完全に削除（注意：データが消えます）
docker-compose down -v

# 特定のサービスのみ停止
docker-compose stop backend
docker-compose stop frontend
```

### ローカル開発環境での起動

#### バックエンド

```bash
cd backend
npm install
npm run start:dev
```

バックエンドは http://localhost:3001 で起動します。

#### フロントエンド

```bash
cd frontend
npm install
npm run dev
```

フロントエンドは http://localhost:3000 で起動します。

---

## ログの確認

### Docker環境でのログ確認

```bash
# 全サービスのログを表示（リアルタイム）
docker-compose logs -f

# バックエンドのログのみ表示
docker-compose logs -f backend

# フロントエンドのログのみ表示
docker-compose logs -f frontend

# PostgreSQLのログのみ表示
docker-compose logs -f postgres

# 最新100行のみ表示
docker-compose logs --tail 100 backend

# タイムスタンプ付きで表示
docker-compose logs -t backend
```

### 個別コンテナのログ確認

```bash
# コンテナ名を指定してログ確認
docker logs workplace-scheduler-backend
docker logs workplace-scheduler-frontend
docker logs workplace-scheduler-postgres

# リアルタイムでログを追跡
docker logs -f workplace-scheduler-backend
```

### ログの保存

```bash
# ログをファイルに保存
docker-compose logs backend > backend-logs-$(date +%Y%m%d-%H%M%S).log
docker-compose logs frontend > frontend-logs-$(date +%Y%m%d-%H%M%S).log
```

---

## データベース管理

### データベース接続

#### Docker環境からの接続

```bash
# PostgreSQLコンテナに接続
docker exec -it workplace-scheduler-postgres psql -U postgres -d workplace_scheduler

# SQL実行例
docker exec workplace-scheduler-postgres psql -U postgres -d workplace_scheduler -c "SELECT * FROM users;"
```

#### ローカル環境からの接続

```bash
# psqlコマンドを使用（PostgreSQLクライアントがインストールされている場合）
psql -h localhost -p 5432 -U postgres -d workplace_scheduler
```

### Prismaマイグレーション

#### マイグレーションの実行

```bash
# Docker環境でマイグレーションを適用
docker exec workplace-scheduler-backend npx prisma migrate deploy

# ローカル環境でマイグレーションを作成
cd backend
npx prisma migrate dev --name <migration_name>

# マイグレーション状態の確認
docker exec workplace-scheduler-backend npx prisma migrate status
```

#### マイグレーションのロールバック

Prisma Migrateは自動ロールバックをサポートしていません。手動でロールバックする必要があります：

```bash
# 1. データベースに接続
docker exec -it workplace-scheduler-postgres psql -U postgres -d workplace_scheduler

# 2. マイグレーション履歴を確認
SELECT * FROM _prisma_migrations ORDER BY finished_at DESC;

# 3. 手動でSQLを実行してロールバック
# （マイグレーションファイルの逆操作を実行）

# 4. _prisma_migrationsテーブルからレコードを削除
DELETE FROM _prisma_migrations WHERE migration_name = '<migration_name>';
```

### Prisma Studioの起動

データベースの内容をGUIで確認・編集できます：

```bash
# ローカル環境で起動
cd backend
npx prisma studio

# Docker環境で起動（ポート5555でアクセス可能）
docker exec workplace-scheduler-backend npx prisma studio --browser none
```

ブラウザで http://localhost:5555 にアクセスしてください。

---

## バックアップとリストア

### データベースのバックアップ

#### 完全バックアップ

```bash
# バックアップファイルを作成
docker exec workplace-scheduler-postgres pg_dump -U postgres workplace_scheduler > backup-$(date +%Y%m%d-%H%M%S).sql

# 圧縮してバックアップ
docker exec workplace-scheduler-postgres pg_dump -U postgres workplace_scheduler | gzip > backup-$(date +%Y%m%d-%H%M%S).sql.gz
```

#### 自動バックアップスクリプト

```bash
#!/bin/bash
# backup.sh - 毎日自動でバックアップを取得

BACKUP_DIR="/path/to/backups"
DATE=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="$BACKUP_DIR/workplace-scheduler-$DATE.sql.gz"

# バックアップ実行
docker exec workplace-scheduler-postgres pg_dump -U postgres workplace_scheduler | gzip > "$BACKUP_FILE"

# 7日以上古いバックアップを削除
find "$BACKUP_DIR" -name "workplace-scheduler-*.sql.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_FILE"
```

cronで定期実行：

```bash
# crontabを編集
crontab -e

# 毎日午前3時にバックアップを実行
0 3 * * * /path/to/backup.sh >> /var/log/workplace-scheduler-backup.log 2>&1
```

### データベースのリストア

```bash
# 通常のSQLファイルからリストア
docker exec -i workplace-scheduler-postgres psql -U postgres workplace_scheduler < backup-20251230.sql

# 圧縮ファイルからリストア
gunzip -c backup-20251230.sql.gz | docker exec -i workplace-scheduler-postgres psql -U postgres workplace_scheduler

# リストア前にデータベースを再作成する場合
docker exec -it workplace-scheduler-postgres psql -U postgres -c "DROP DATABASE IF EXISTS workplace_scheduler;"
docker exec -it workplace-scheduler-postgres psql -U postgres -c "CREATE DATABASE workplace_scheduler;"
docker exec -i workplace-scheduler-postgres psql -U postgres workplace_scheduler < backup-20251230.sql
```

---

## トラブルシューティング

### バックエンドが起動しない

#### 1. コンテナのステータスを確認

```bash
docker-compose ps
docker logs workplace-scheduler-backend
```

#### 2. よくある原因と対処法

**原因：データベース接続エラー**
```bash
# PostgreSQLコンテナが起動しているか確認
docker-compose ps postgres

# PostgreSQLのヘルスチェック
docker exec workplace-scheduler-postgres pg_isready -U postgres

# データベース接続URLを確認
docker exec workplace-scheduler-backend env | grep DATABASE_URL
```

**原因：Prismaマイグレーションエラー**
```bash
# マイグレーション状態を確認
docker exec workplace-scheduler-backend npx prisma migrate status

# マイグレーションを再実行
docker exec workplace-scheduler-backend npx prisma migrate deploy

# Prisma Clientを再生成
docker exec workplace-scheduler-backend npx prisma generate
```

**原因：ポート競合**
```bash
# ポート3001が使用されているか確認
lsof -i :3001

# 使用中のプロセスを停止
kill -9 <PID>
```

#### 3. コンテナを完全に再起動

```bash
# コンテナを停止して削除
docker-compose down

# イメージを再ビルドして起動
docker-compose up --build -d

# ログを確認
docker-compose logs -f backend
```

### フロントエンドが起動しない

#### 1. 環境変数を確認

```bash
# NEXT_PUBLIC_API_URLが正しく設定されているか確認
docker exec workplace-scheduler-frontend env | grep NEXT_PUBLIC_API_URL
```

#### 2. バックエンド接続を確認

```bash
# バックエンドAPIにアクセスできるか確認
curl http://localhost:3001

# フロントエンドコンテナからバックエンドにアクセスできるか確認
docker exec workplace-scheduler-frontend wget -O- http://backend:3001
```

### データベースに接続できない

#### 1. PostgreSQLコンテナの状態確認

```bash
# コンテナが起動しているか確認
docker-compose ps postgres

# PostgreSQLのログを確認
docker-compose logs postgres

# ヘルスチェック
docker exec workplace-scheduler-postgres pg_isready -U postgres
```

#### 2. 接続情報の確認

```bash
# DATABASE_URL環境変数を確認
docker exec workplace-scheduler-backend env | grep DATABASE_URL

# データベースに直接接続してテスト
docker exec -it workplace-scheduler-postgres psql -U postgres -d workplace_scheduler -c "SELECT 1;"
```

### WebSocketが接続できない

#### 1. バックエンドのWebSocket設定を確認

```bash
# バックエンドログでWebSocket接続エラーを確認
docker logs workplace-scheduler-backend | grep -i websocket

# FRONTEND_URL環境変数を確認（CORS設定）
docker exec workplace-scheduler-backend env | grep FRONTEND_URL
```

#### 2. ネットワーク設定を確認

```bash
# Dockerネットワークを確認
docker network ls
docker network inspect workplace-scheduler_scheduler-network
```

### コンテナのメモリ不足

```bash
# コンテナのリソース使用状況を確認
docker stats

# メモリ制限を設定（docker-compose.yml）
services:
  backend:
    mem_limit: 512m
    memswap_limit: 1g
```

---

## パフォーマンス監視

### リソース使用状況の確認

```bash
# 全コンテナのリソース使用状況をリアルタイム表示
docker stats

# 特定のコンテナのみ表示
docker stats workplace-scheduler-backend workplace-scheduler-frontend workplace-scheduler-postgres
```

### データベースパフォーマンス

#### 実行中のクエリを確認

```bash
docker exec workplace-scheduler-postgres psql -U postgres -d workplace_scheduler -c "
SELECT pid, now() - pg_stat_activity.query_start AS duration, query, state
FROM pg_stat_activity
WHERE state != 'idle'
ORDER BY duration DESC;
"
```

#### データベースサイズを確認

```bash
docker exec workplace-scheduler-postgres psql -U postgres -d workplace_scheduler -c "
SELECT pg_size_pretty(pg_database_size('workplace_scheduler')) AS database_size;
"
```

#### テーブルサイズを確認

```bash
docker exec workplace-scheduler-postgres psql -U postgres -d workplace_scheduler -c "
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
"
```

### アプリケーションログレベルの変更

```bash
# docker-compose.ymlで環境変数を設定
services:
  backend:
    environment:
      - LOG_LEVEL=debug  # debug, info, warn, error
```

---

## セキュリティ

### 環境変数の管理

本番環境では必ず以下の環境変数を変更してください：

```bash
# .env ファイルを作成
POSTGRES_PASSWORD=強力なパスワード
JWT_SECRET=ランダムな64文字以上の文字列
DATABASE_URL=postgresql://postgres:強力なパスワード@postgres:5432/workplace_scheduler?schema=public
```

### JWT_SECRETの生成

```bash
# ランダムな64文字の文字列を生成
openssl rand -base64 64
```

### データベースパスワードの変更

```bash
# 1. コンテナを停止
docker-compose down

# 2. .envファイルでパスワードを変更
# POSTGRES_PASSWORD=新しいパスワード
# DATABASE_URL=postgresql://postgres:新しいパスワード@postgres:5432/workplace_scheduler?schema=public

# 3. ボリュームを削除（データが消えるので注意）
docker volume rm workplace-scheduler_postgres-data

# 4. 再起動
docker-compose up -d
```

### SSL/TLS証明書の設定

本番環境では必ずHTTPSを使用してください：

```bash
# Nginx などのリバースプロキシを使用
# Let's Encrypt を使用した証明書取得
sudo certbot --nginx -d yourdomain.com
```

### ファイアウォール設定

```bash
# 必要なポートのみ開放
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable

# Docker環境では内部ネットワークを使用し、外部からの直接アクセスを防ぐ
# PostgreSQLのポート5432は外部に公開しない
```

---

## アップデート手順

### アプリケーションのアップデート

#### 1. バックアップを取得

```bash
# データベースバックアップ
docker exec workplace-scheduler-postgres pg_dump -U postgres workplace_scheduler > backup-before-update-$(date +%Y%m%d).sql
```

#### 2. コードを更新

```bash
# Gitリポジトリから最新版を取得
git pull origin main

# または、zipファイルを展開して上書き
```

#### 3. 依存関係を更新

```bash
# バックエンド
cd backend
npm install

# フロントエンド
cd frontend
npm install
```

#### 4. データベースマイグレーション

```bash
# Docker環境でマイグレーションを実行
docker exec workplace-scheduler-backend npx prisma migrate deploy

# ローカル環境
cd backend
npx prisma migrate deploy
```

#### 5. アプリケーションを再起動

```bash
# Docker環境
docker-compose down
docker-compose up --build -d

# 起動を確認
docker-compose ps
docker-compose logs -f
```

#### 6. 動作確認

```bash
# バックエンドAPIの確認
curl http://localhost:3001

# フロントエンドの確認
curl http://localhost:3000

# WebSocket接続の確認
# ブラウザで http://localhost:3000 にアクセスし、リアルタイム同期が動作するか確認
```

### ロールバック手順

アップデートに問題がある場合：

```bash
# 1. アプリケーションを停止
docker-compose down

# 2. コードを前のバージョンに戻す
git checkout <previous_commit_hash>

# 3. データベースをリストア
docker exec -i workplace-scheduler-postgres psql -U postgres workplace_scheduler < backup-before-update-20251230.sql

# 4. アプリケーションを再起動
docker-compose up --build -d
```

---

## 定期メンテナンス

### 日次メンテナンス

- ログファイルのサイズ確認
- アプリケーションの動作確認
- エラーログのチェック

### 週次メンテナンス

- データベースバックアップの確認
- ディスク使用量の確認
- コンテナのリソース使用状況確認

### 月次メンテナンス

- データベースのVACUUM実行
- 古いログファイルの削除
- セキュリティアップデートの確認

```bash
# データベースのVACUUM
docker exec workplace-scheduler-postgres psql -U postgres -d workplace_scheduler -c "VACUUM ANALYZE;"

# 古いDockerイメージの削除
docker image prune -a

# 未使用のボリュームを削除（注意：データが消える可能性があります）
docker volume prune
```

---

## 連絡先とサポート

問題が解決しない場合は、以下を確認してください：

- [README.md](README.md) - プロジェクトの概要
- [Development.md](Development.md) - 開発履歴と技術詳細
- [README.backend.md](README.backend.md) - バックエンドAPI詳細
- [README.docker.md](README.docker.md) - Docker環境詳細

---

## 付録：便利なコマンド集

### コンテナ管理

```bash
# すべてのコンテナを表示
docker ps -a

# コンテナのシェルに入る
docker exec -it workplace-scheduler-backend sh
docker exec -it workplace-scheduler-frontend sh
docker exec -it workplace-scheduler-postgres bash

# コンテナの詳細情報を表示
docker inspect workplace-scheduler-backend

# コンテナを強制停止
docker kill workplace-scheduler-backend
```

### ネットワーク管理

```bash
# ネットワーク一覧
docker network ls

# ネットワークの詳細
docker network inspect workplace-scheduler_scheduler-network

# ネットワークからコンテナを切断
docker network disconnect workplace-scheduler_scheduler-network workplace-scheduler-backend
```

### ボリューム管理

```bash
# ボリューム一覧
docker volume ls

# ボリュームの詳細
docker volume inspect workplace-scheduler_postgres-data

# 未使用のボリュームを削除（注意：データが消えます）
docker volume prune
```

### ディスク使用量確認

```bash
# Dockerが使用しているディスク容量
docker system df

# 詳細表示
docker system df -v

# すべての未使用リソースを削除（注意）
docker system prune -a --volumes
```
