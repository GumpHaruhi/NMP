# --- 阶段 1: 构建 Go 程序 ---
# 使用官方的 golang 镜像 (alpine 版本更小)
FROM golang:1.25-alpine AS builder

# 设置工作目录
WORKDIR /app

# 安装必要工具
RUN apk add --no-cache git

# 复制 go.mod 和 go.sum 进来，先下载依赖
ENV GOPROXY=https://goproxy.cn,direct
COPY go.mod go.sum ./
RUN go mod download

# 复制所有 Go 源代码
COPY . .

# 编译 Go 程序。
# CGO_ENABLED=0 创建一个纯静态 Go 二进制文件
# GOOS=linux 明确指定为 Linux (因为容器是 Linux)
RUN CGO_ENABLED=0 GOOS=linux go build -v -o /NMP .

# --- 阶段 2: 最终运行镜像 ---
# 使用最小的基础镜像
FROM alpine:latest

# 设置工作目录
WORKDIR /app

# 安装必要工具
RUN apk add --no-cache ca-certificates

# (重要) 把音乐目录创建出来，以便之后挂载
RUN mkdir /music

# 从 'builder' 阶段复制编译好的二进制文件
COPY --from=builder /NMP /NMP

# 复制前端文件
COPY web/ ./web

# 暴露端口
EXPOSE 8080

# 运行命令
CMD ["/NMP"]