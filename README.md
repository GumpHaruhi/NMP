# NMP-Nju_Music_Player

南京大学人机交互系统-原型开发-音乐播放器

## 项目结构

**文件结构**：

```
NMP
├── Dockerfile          // docker配置
├── README.md           // 项目说明
├── core                // 后端核心文件
├── docker-compose.yml  // docker服务治理
├── web                 // 前端核心文件
├── music               // 音频、图片、歌词等资源文件
├── main.go             // 程序入口
└── ...
```

> 注意，考虑到音频文件过大，将不通过git进行同步管理（git已将music文件目录屏蔽）。我们手动同步 music 文件夹

## 部署&运行

当前出于单机部署阶段。为了不同平台、系统可迁移性，本项目封装在docker中。请先确保计算机上可以正常使用docker

在终端中键入命令：

- **构建并启动服务**: docker compose up --build

项目中使用磁盘数据库做持久化。如果有对数据库信息的改动，直接构建不会触发数据库的更新，需手动销毁卷宗：

- **销毁数据库卷宗**: docker compose down --volumes

注意此操作有风险，后期会做数据库冷热更新的分离。

- 本地部署默认使用端口8080：`localhost:8080`

**如何设置音频资源？**

1. 下载.mp3格式音频文件，.jpg格式海报，.lrc格式歌词文件（格式后期可以支持多模态）（分享个[网站](https://www.gequbao.com/)），放在 /music 文件夹中
2. 修改 /music/seed.json ，在插入语句中编写相关文件信息，歌曲、歌单信息都支持。**具体格式请模仿已有的内容！**
3. 执行 `docker compose down --volumes` 清理卷宗，然后重新构建


## API文档

见 API.md