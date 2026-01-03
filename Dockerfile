# --- 阶段 1: 构建 Vue 前端 ---
FROM docker.m.daocloud.io/node:20-alpine AS frontend-builder

WORKDIR /app

# 设置 npm 镜像源
RUN npm config set registry https://registry.npmmirror.com

# 复制前端文件
COPY web/ .
RUN npm ci

# 构建前端
RUN npm run build

# --- 阶段 2: 构建 Go 后端 ---
FROM docker.m.daocloud.io/golang:1.23-alpine AS backend-builder

WORKDIR /app

ENV GOPROXY=https://goproxy.cn,direct

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -v -o /NMP .

# --- 阶段 3: 最终运行镜像 ---
FROM docker.m.daocloud.io/alpine:latest

WORKDIR /app

RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories

RUN apk add --no-cache ca-certificates tzdata
RUN mkdir -p /music && chmod 777 /music

# 复制构建好的文件
COPY --from=frontend-builder /app/dist ./web/dist
COPY --from=backend-builder /NMP /NMP
# 复制 seed.json 文件到工作目录
COPY seed.json ./seed.json

EXPOSE 8080

CMD ["/NMP"]
