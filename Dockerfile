# --- 阶段 1: 构建 Go 程序 ---
# 使用官方的 golang 镜像 (alpine 版本更小)
FROM docker.m.daocloud.io/golang:1.23-alpine AS builder

# 设置工作目录
WORKDIR /app

# 安装必要工具
RUN apk add --no-cache git

# 复制 go.mod 和 go.sum 进来，先下载依赖（不包含源码）
ENV GOPROXY=https://goproxy.cn,direct
COPY go.mod go.sum ./
RUN go mod download

# 复制所有 Go 源代码
COPY . .

RUN go mod tidy && go mod download

# 编译 Go 程序
# GOOS=linux 明确指定为 Linux (因为容器是 Linux)
RUN CGO_ENABLED=0 GOOS=linux go build -v -o /NMP .

# --- 阶段 2: 最终运行镜像 ---
FROM alpine:latest

# 设置工作目录
WORKDIR /app

# 安装必要工具
RUN apk add --no-cache ca-certificates

RUN mkdir /music && chmod 777 /music

# 从 'builder' 阶段复制编译好的二进制文件
COPY --from=builder /NMP /NMP

# 复制前端文件
COPY web/ ./web

# 暴露端口
EXPOSE 8080

# 运行命令
CMD ["/NMP"]