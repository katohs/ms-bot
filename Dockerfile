# node projectを作成
FROM node:18-alpine

# 作業ディレクトリを指定
WORKDIR /app

# package.jsonとpackage-lock.jsonを/appにコピー
COPY package*.json ./

# npm installを実行
RUN npm install

# ファイルを/appにコピー
COPY . .

# ポート3000を開放
EXPOSE 3000

# コンテナ起動時に実行するコマンド
CMD [ "npm","start" ]
