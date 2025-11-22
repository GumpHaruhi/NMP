# 音乐后端 API 文档

## 基础信息

| 项目    | 说明                                                                                              |
| ----- | ----------------------------------------------------------------------------------------------- |
| 基础路径  | 所有 API 路径均以 `/api` 为前缀                                                                          |
| 返回格式  | 统一 JSON 格式（文件流接口除外）                                                                             |
| 响应结构  | 成功：`{"code":200,"message":"提示信息","data":业务数据}`失败：`{"code":错误码,"message":"错误提示","error":"错误详情"}` |
| 状态码规范 | 200：成功400：参数错误404：资源不存在500：服务器内部错误                                                              |


## 核心数据结构定义

### 1. Label（标签枚举）

| 枚举值    | 说明     |
| --------- | -------- |
| Pop       | 流行音乐 |
| Rock      | 摇滚音乐 |
| Jazz      | 爵士音乐 |
| Classical | 古典音乐 |
| HipHop    | 嘻哈音乐 |

### 2. Music（音乐）

| 字段名    | 类型     | 说明                    | JSON 映射 | 数据库字段               |
| --------- | -------- | ----------------------- | --------- | ------------------------ |
| Id        | int64    | 歌曲唯一 ID（自增主键） | id        | id                       |
| Title     | string   | 歌曲标题（非空）        | title     | title                    |
| Singer    | string   | 歌手名称（非空）        | singer    | singer                   |
| Labels    | string[] | 歌曲标签（支持多个）    | labels    | labels（text [] 类型）   |
| DeLabels  | string[] | 扩展标签                | delabels  | delabels（text [] 类型） |
| AudioURL  | string   | 音频文件路径（非空）    | audioUrl  | audio_path               |
| CoverURL  | string   | 封面图片路径            | coverUrl  | cover_path               |
| LyricsURL | string   | 歌词文件路径            | lyricsUrl | lyrics_path              |

### 3. Playlist（歌单）

| 字段名      | 类型           | 说明                           | JSON 映射   | 数据库字段                      |
| ----------- | -------------- | ------------------------------ | ----------- | ------------------------------- |
| ID          | int64          | 歌单唯一 ID（自增主键）        | id          | id                              |
| Name        | string         | 歌单名称（非空）               | name        | name                            |
| Description | string         | 歌单描述                       | description | description                     |
| CreatedAt   | time.Time      | 创建时间（自动生成）           | createdAt   | created_at                      |
| Items       | []PlaylistItem | 歌单包含的歌曲列表（关联查询） | items       | -（通过 playlist_music 表关联） |

### 4. PlaylistItem（歌单 - 音乐关联表）

| 字段名     | 类型  | 说明                     | JSON 映射   | 数据库字段         |
| ---------- | ----- | ------------------------ | ----------- | ------------------ |
| ID         | int64 | 关联记录 ID（自增主键）  | -（不返回） | id                 |
| PlaylistID | int64 | 歌单 ID（外键）          | -（不返回） | playlist_id        |
| MusicID    | int64 | 歌曲 ID（外键）          | musicId     | music_id           |
| TrackOrder | int   | 歌曲在歌单中的排序       | trackOrder  | track_order        |
| Music      | Music | 关联的歌曲详情（预加载） | music       | -（关联 music 表） |


## API 详细列表

### 索引

1. 健康检查
2. 用户登录
3. 查询所有音乐
4. 查询所有歌单
5. 查询某一歌单详细信息
6. 向某一歌单添加某一歌曲
7. 从歌单移除某一歌曲
8. 新建一个空白歌单
9. 删除一个歌单
10. 根据标签检索音乐
11. 播放某一音乐
12. 获取歌曲的歌词
13. 获取歌曲的海报
14. 歌曲反馈：喜欢
15. 歌曲反馈：不喜欢
16. 歌曲反馈：收藏
17. 歌曲反馈：取消收藏
18. 搜索功能：模糊搜索歌曲

### 1. 健康检查

* **作用**：验证服务是否正常运行

* **请求类型**：GET

* **请求路径**：`/api/ping`

* **请求参数**：无

* **返回结果**：


  * 成功（200）：`"pong"`（字符串）

### 2. 用户登录



* **作用**：用户登录并获取初始数据（含用户信息及关联歌单）

* **请求类型**：GET

* **请求路径**：`/api/user/login`

* **请求参数**：无

* **返回结果**：


  * 成功（200）：



```
{

 "code": 200,

 "message": "登录成功",

 "data": {

   "userId": 1,

   "username": "testuser",

   "playlists": [

     {

       "id": 1,

       "name": "我的最爱",

       "description": "收藏的经典歌曲",

       "createdAt": "2023-01-01T00:00:00Z",

       "items": [

         {

           "musicId": 101,

           "trackOrder": 1,

           "music": {

             "id": 101,

             "title": "晴天",

             "singer": "周杰伦",

             "labels": ["Pop"],

             "delabels": [],

             "audioUrl": "/static/audio/101.mp3",

             "coverUrl": "/static/cover/101.jpg",

             "lyricsUrl": "/static/lyrics/101.lrc"

           }

         }

       ]

     }

   ]

 }

}
```



* 失败（500）：



```
{

 "code": 500,

 "message": "登录失败",

 "error": "数据库连接超时",

 "data": null

}
```

### 3. 查询所有音乐



* **作用**：获取系统中全部音乐列表（含完整歌曲信息）

* **请求类型**：GET

* **请求路径**：`/api/check/music`

* **请求参数**：无

* **返回结果**：


  * 成功（200）：



```
{

 "code": 200,

 "message": "查询成功",

 "data": {

   "total": 2,

   "list": [

     {

       "id": 101,

       "title": "晴天",

       "singer": "周杰伦",

       "labels": ["Pop"],

       "delabels": [],

       "audioUrl": "/static/audio/101.mp3",

       "coverUrl": "/static/cover/101.jpg",

       "lyricsUrl": "/static/lyrics/101.lrc"

     },

     {

       "id": 102,

       "title": "Hotel California",

       "singer": "Eagles",

       "labels": ["Rock"],

       "delabels": [],

       "audioUrl": "/static/audio/102.mp3",

       "coverUrl": "/static/cover/102.jpg",

       "lyricsUrl": "/static/lyrics/102.lrc"

     }

   ]

 }

}
```



* 失败（500）：



```
{

 "code": 500,

 "message": "查询音乐数据失败",

 "error": "查询语句执行错误",

 "data": null

}
```

### 4. 查询所有歌单



* **作用**：获取系统中全部歌单列表（含歌单详情及关联歌曲）

* **请求类型**：GET

* **请求路径**：`/api/check/playlist`

* **请求参数**：无

* **返回结果**：


  * 成功（200）：



```
{

 "code": 200,

 "message": "查询成功",

 "data": {

   "total": 2,

   "list": [

     {

       "id": 1,

       "name": "我的最爱",

       "description": "收藏的经典歌曲",

       "createdAt": "2023-01-01T00:00:00Z",

       "items": [

         {

           "musicId": 101,

           "trackOrder": 1,

           "music": {

             "id": 101,

             "title": "晴天",

             "singer": "周杰伦",

             "labels": ["Pop"],

             "delabels": [],

             "audioUrl": "/static/audio/101.mp3",

             "coverUrl": "/static/cover/101.jpg",

             "lyricsUrl": "/static/lyrics/101.lrc"

           }

         }

       ]

     },

     {

       "id": 2,

       "name": "摇滚精选",

       "description": "震撼人心的摇滚歌曲",

       "createdAt": "2023-02-15T14:30:00Z",

       "items": [

         {

           "musicId": 102,

           "trackOrder": 1,

           "music": {

             "id": 102,

             "title": "Hotel California",

             "singer": "Eagles",

             "labels": ["Rock"],

             "delabels": [],

             "audioUrl": "/static/audio/102.mp3",

             "coverUrl": "/static/cover/102.jpg",

             "lyricsUrl": "/static/lyrics/102.lrc"

           }

         }

       ]

     }

   ]

 }

}
```



* 失败（500）：



```
{

 "code": 500,

 "message": "查询歌单数据失败",

 "error": "关联表查询异常",

 "data": null

}
```

### 5. 查询歌单详细信息



* **作用**：根据歌单 ID 获取歌单完整信息（含歌曲列表及排序）

* **请求类型**：GET

* **请求路径**：`/api/playlist/detail/:id`

* **请求参数**：



| 参数名 | 位置   | 类型    | 是否必填 | 说明           |
| --- | ---- | ----- | ---- | ------------ |
| id  | 路径参数 | int64 | 是    | 歌单 ID（如 1、2） |



* **返回结果**：


  * 成功（200）：



```
{

 "code": 200,

 "message": "查询成功",

 "data": {

   "id": 1,

   "name": "我的最爱",

   "description": "收藏的经典歌曲",

   "createdAt": "2023-01-01T00:00:00Z",

   "items": [

     {

       "musicId": 101,

       "trackOrder": 1,

       "music": {

         "id": 101,

         "title": "晴天",

         "singer": "周杰伦",

         "labels": ["Pop"],

         "delabels": [],

         "audioUrl": "/static/audio/101.mp3",

         "coverUrl": "/static/cover/101.jpg",

         "lyricsUrl": "/static/lyrics/101.lrc"

       }

     }

   ]

 }

}
```



* 失败（400）：



```
{

 "code": 400,

 "message": "无效的歌单 ID",

 "error": "ID 必须为整数",

 "data": null

}
```



* 失败（500）：



```
{

 "code": 500,

 "message": "查询歌单详情失败",

 "error": "歌单不存在",

 "data": null

}
```

### 6. 向歌单添加歌曲



* **作用**：将指定歌曲添加到目标歌单（自动维护排序）

* **请求类型**：POST

* **请求路径**：`/api/playlist/addsong`

* **请求参数**（JSON 格式）：



```
{

 "playlistId": 1,  // 歌单 ID（int64，必填）

 "musicId": 102    // 歌曲 ID（int64，必填）

}
```



* **返回结果**：


  * 成功（200）：



```
{

 "code": 200,

 "message": "添加成功",

 "data": null

}
```



* 失败（400）：



```
{

 "code": 400,

 "message": "参数错误",

 "error": "playlistId 和 musicId 不能为空",

 "data": null

}
```



* 失败（500）：



```
{

 "code": 500,

 "message": "添加歌曲失败",

 "error": "歌曲已存在于歌单",

 "data": null

}
```

### 7. 从歌单移除歌曲



* **作用**：从指定歌单中删除目标歌曲

* **请求类型**：POST

* **请求路径**：`/api/playlist/removesong`

* **请求参数**（JSON 格式）：



```
{

 "playlistId": 1,  // 歌单 ID（int64，必填）

 "musicId": 102    // 歌曲 ID（int64，必填）

}
```



* **返回结果**：


  * 成功（200）：



```
{

 "code": 200,

 "message": "移除成功",

 "data": null

}
```



* 失败（400）：



```
{

 "code": 400,

 "message": "参数错误",

 "error": "playlistId 和 musicId 必须为整数",

 "data": null

}
```



* 失败（500）：



```
{

 "code": 500,

 "message": "移除歌曲失败",

 "error": "歌曲不存在于歌单",

 "data": null

}
```

### 8. 新建空白歌单



* **作用**：创建一个新的空白歌单（可指定名称和描述）

* **请求类型**：POST

* **请求路径**：`/api/playlist/create`

* **请求参数**（JSON 格式）：



```
{

 "name": "新歌单",                // 歌单名称（string，必填，长度≤255）

 "description": "这是我的新歌单"  // 歌单描述（string，可选）

}
```



* **返回结果**：


  * 成功（200）：



```
{

 "code": 200,

 "message": "创建成功",

 "data": {

   "id": 3,

   "name": "新歌单",

   "description": "这是我的新歌单",

   "createdAt": "2023-06-01T10:00:00Z",

   "items": []

 }

}
```



* 失败（400）：



```
{

 "code": 400,

 "message": "创建失败",

 "error": "歌单名称不能为空",

 "data": null

}
```



* 失败（500）：



```
{

 "code": 500,

 "message": "创建歌单失败",

 "error": "数据库插入异常",

 "data": null

}
```

### 9. 删除歌单



* **作用**：删除指定歌单（关联歌曲会自动解除绑定，不删除歌曲本身）

* **请求类型**：POST

* **请求路径**：`/api/playlist/delete`

* **请求参数**（JSON 格式）：



```
{

 "playlistId": 3  // 歌单 ID（int64，必填）

}
```



* **返回结果**：


  * 成功（200）：



```
{

 "code": 200,

 "message": "删除成功",

 "data": null

}
```



* 失败（400）：



```
{

 "code": 400,

 "message": "参数错误",

 "error": "playlistId 必须为有效整数",

 "data": null

}
```



* 失败（500）：



```
{

 "code": 500,

 "message": "删除歌单失败",

 "error": "歌单不存在或已被删除",

 "data": null

}
```

### 10. 根据标签检索音乐



* **作用**：根据指定标签筛选符合条件的歌曲（支持多标签匹配）

* **请求类型**：POST

* **请求路径**：`/api/music/search/labels`

* **请求参数**（JSON 格式）：

```
{
 "labels": ["Pop", "Rock"]  // 标签列表（string[]，必填，可选值：Pop/Rock/Jazz/Classical/HipHop）
 "limit": 10  // 限制检索的歌曲数量，可选填，默认为20
}
```

* **返回结果**：

  * 成功（200）：

```
{

 "code": 200,

 "message": "检索成功",

 "data": [

   {

     "id": 101,

     "title": "晴天",

     "singer": "周杰伦",

     "labels": ["Pop"],

     "delabels": [],

     "audioUrl": "/static/audio/101.mp3",

     "coverUrl": "/static/cover/101.jpg",

     "lyricsUrl": "/static/lyrics/101.lrc"

   },

   {

     "id": 102,

     "title": "Hotel California",

     "singer": "Eagles",

     "labels": ["Rock"],

     "delabels": [],

     "audioUrl": "/static/audio/102.mp3",

     "coverUrl": "/static/cover/102.jpg",

     "lyricsUrl": "/static/lyrics/102.lrc"

   }

 ]

}
```



* 失败（400）：



```
{

 "code": 400,

 "message": "参数错误",

 "error": "labels 不能为空且必须是有效标签",

 "data": null

}
```

* 失败（500）：

```
{

 "code": 500,

 "message": "检索失败",

 "error": "标签查询语句执行错误",

 "data": null

}
```

### 11. 播放音乐



* **作用**：获取指定歌曲的音频文件流（支持直接播放）

* **请求类型**：GET

* **请求路径**：`/api/music/play/:id`

* **请求参数**：



| 参数名 | 位置   | 类型    | 是否必填 | 说明               |
| --- | ---- | ----- | ---- | ---------------- |
| id  | 路径参数 | int64 | 是    | 歌曲 ID（如 101、102） |



* **返回结果**：


  * 成功（200）：音频文件流（MIME 类型：audio/mpeg）

  * 失败（400）：



```
{

 "code": 400,

 "message": "无效的歌曲 ID",

 "error": "ID 必须为整数",

 "data": null

}
```



* 失败（404）：



```
{

 "code": 404,

 "message": "歌曲不存在",

 "error": "未找到 ID 为 103 的歌曲",

 "data": null

}
```



* 失败（500）：



```
{

 "code": 500,

 "message": "播放失败",

 "error": "音频文件读取错误",

 "data": null

}
```

### 12. 获取歌词



* **作用**：获取指定歌曲的歌词文件内容（文本格式）

* **请求类型**：GET

* **请求路径**：`/api/music/lyrics/:id`

* **请求参数**：



| 参数名 | 位置   | 类型    | 是否必填 | 说明               |
| --- | ---- | ----- | ---- | ---------------- |
| id  | 路径参数 | int64 | 是    | 歌曲 ID（如 101、102） |



* **返回结果**：


  * 成功（200）：歌词文本内容（MIME 类型：text/plain）



```
[00:00.00] 晴天 - 周杰伦

[00:05.00] 作词：周杰伦

[00:10.00] 作曲：周杰伦
```



* 失败（400）：



```
{

 "code": 400,

 "message": "无效的歌曲 ID",

 "error": "ID 格式错误",

 "data": null

}
```



* 失败（404）：



```
{

 "code": 404,

 "message": "歌词不存在",

 "error": "未找到该歌曲的歌词文件",

 "data": null

}
```

### 13. 获取歌曲海报

* **作用**：获取指定歌曲的封面图片（支持直接渲染）

* **请求类型**：GET

* **请求路径**：`/api/music/cover/:id`

* **请求参数**：

| 参数名 | 位置   | 类型    | 是否必填 | 说明               |
| --- | ---- | ----- | ---- | ---------------- |
| id  | 路径参数 | int64 | 是    | 歌曲 ID（如 101、102） |

* **返回结果**：

  * 成功（200）：图片文件流（MIME 类型：image/jpeg）

  * 失败（400）：

```
{

 "code": 400,

 "message": "无效的歌曲 ID",

 "error": "ID 必须为整数",

 "data": null

}
```

* 失败（404）：

```
{

 "code": 404,

 "message": "封面不存在",

 "error": "未找到该歌曲的封面图片",

 "data": null

}
```

### 14. 歌曲反馈：喜欢

* **作用**：记录用户对指定歌曲的 “喜欢” 反馈

* **请求类型**：GET

* **请求路径**：`/api/music/like/:id`

* **请求参数**：

| 参数名 | 位置   | 类型    | 是否必填 | 说明               |
| --- | ---- | ----- | ---- | ---------------- |
| id  | 路径参数 | int64 | 是    | 歌曲 ID（如 101、102） |

* **返回结果**：


  * 成功（200）：`"Like"`（字符串）

  * 失败（400）：

```
{

 "code": 400,

 "message": "无效的歌曲 ID",

 "error": "ID 格式错误",

 "data": null

}
```

### 15. 歌曲反馈：不喜欢

* **作用**：记录用户对指定歌曲的 “不喜欢” 反馈

* **请求类型**：GET

* **请求路径**：`/api/music/dislike/:id`

* **请求参数**：

| 参数名 | 位置   | 类型    | 是否必填 | 说明               |
| --- | ---- | ----- | ---- | ---------------- |
| id  | 路径参数 | int64 | 是    | 歌曲 ID（如 101、102） |

* **返回结果**：
  
  * 成功（200）：`"Dislike"`（字符串）

  * 失败（400）：

```
{

 "code": 400,

 "message": "无效的歌曲 ID",

 "error": "ID 格式错误",

 "data": null

}
```

### 16. 歌曲反馈：收藏

* **作用**：将指定歌曲添加到用户的 “收藏歌单”

* **请求类型**：GET

* **请求路径**：`/api/music/star/:id`

* **请求参数**：

| 参数名 | 位置   | 类型    | 是否必填 | 说明               |
| --- | ---- | ----- | ---- | ---------------- |
| id  | 路径参数 | int64 | 是    | 歌曲 ID（如 101、102） |

* **返回结果**：

  * 成功（200）：`"Star!"`（字符串）

  * 失败（400）：

```
{

 "code": 400,

 "message": "无效的歌曲 ID",

 "error": "ID 格式错误",

 "data": null

}
```

* 失败（500）：

```
{
 "code": 500,
 "message": "收藏失败",
 "error": "添加到收藏歌单异常",
 "data": null
}
```

### 17. 歌曲反馈：取消收藏

* **作用**：取消收藏歌曲

* **请求类型**：GET

* **请求路径**：`/api/music/unstar/:id`
* **请求参数**：同上


### 18. 搜索框：模糊搜索歌曲

* **作用**：用于音乐搜索框，可以模糊搜索歌曲和歌手

* **请求类型**：GET

* **请求路径**：`/api/music/search/text/:txt`

* **请求参数**：

| 参数名 | 位置     | 类型  | 是否必填 | 说明                   |
| ------ | -------- | ----- | -------- | ------------------ |
| txt    | 路径参数 | string | 是      | 一段文本（比如“你”） |

* **返回结果**：
  
  * 成功（200）：

```
{
    "code": 200,
    "data": [   // 若干歌曲的列表
        {
            "id": 4,
            "title": "不是因为寂寞才想你",
            "singer": "T.R.Y.",
            "labels": [
                "HipHop"
            ],
            "delabels": null,
            "audioUrl": "TRY.mp3",
            "coverUrl": "temp.jpg",
            "lyricsUrl": "TRY.lrc"
        }
    ],
    "message": "搜索成功",
    "total": 1    // 总共检索到的歌曲数量
}
```

  * 失败（500）：

```
{
 "code": 500,
 "message": "模糊搜索音乐失败",
 "error": "",
}
```


> （注：文档部分内容可能由 AI 生成）