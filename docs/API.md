# 缘遇 — API 接口文档

## 认证方式

除注册、登录、刷新 Token 接口外，其他接口均需在请求头携带 Token：

```
Authorization: Bearer <access_token>
```

## 通用响应格式

```json
{
  "code": 0,
  "message": "success",
  "data": {}
}
```

| code | 含义 |
|------|------|
| 0 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未登录 / Token 过期 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

---

## 认证接口

### POST /api/auth/register — 一键注册

昵称已存在时直接登录，避免重复创建账号。

**请求体：**
```json
{ "nickname": "张小明" }
```

**响应：**
```json
{
  "code": 0,
  "message": "注册成功",
  "data": {
    "access_token": "eyJhbG...",
    "refresh_token": "eyJhbG...",
    "expires_in": 900,
    "user": {
      "id": "user_001",
      "nickname": "张小明",
      "avatar_url": "https://...",
      "is_new": true
    }
  }
}
```

> `is_new: true` 时引导用户完善资料，`false` 时直接进入首页。

---

### POST /api/auth/login — 昵称登录

**请求体：**
```json
{ "nickname": "张小明" }
```

**响应：** 同注册接口，`is_new` 始终为 `false`。

---

### POST /api/auth/refresh — 刷新 Token

**请求体：**
```json
{ "refresh_token": "eyJhbG..." }
```

**响应：**
```json
{
  "code": 0,
  "data": {
    "access_token": "eyJhbG...",
    "refresh_token": "eyJhbG...",
    "expires_in": 900
  }
}
```

---

## 用户接口

### GET /api/users/me — 当前用户资料

**响应：**
```json
{
  "code": 0,
  "data": {
    "id": "user_001",
    "phone": "13800000001",
    "nickname": "林小北",
    "gender": 1,
    "birthday": "1998-05-20",
    "city": "深圳",
    "district": "南山区",
    "bio": "深圳互联网打工人...",
    "avatar_url": "https://...",
    "photos": ["url1", "url2"],
    "interests": ["跑步", "摄影", "旅行"],
    "is_verified": true,
    "vip_status": 3,
    "is_online": true,
    "created_at": "2026-01-15T..."
  }
}
```

### PUT /api/users/me — 更新资料

**请求体（可选字段）：**
```json
{
  "nickname": "新昵称",
  "gender": 2,
  "birthday": "1999-01-01",
  "city": "深圳",
  "district": "南山区",
  "bio": "个人简介",
  "avatar_url": "https://..."
}
```

### PUT /api/users/me/location — 更新位置

**请求体：**
```json
{ "latitude": 22.543, "longitude": 114.0579 }
```

### PUT /api/users/me/interests — 更新兴趣标签

**请求体：**
```json
{ "interests": ["跑步", "健身", "咖啡"] }
```

### GET /api/users/discover — 发现页推荐

**Query 参数：**
- `page` — 页码，默认 1
- `gender` — 性别筛选：1=男 2=女 3=不限，默认 2

**说明：** 返回与自己性别偏好匹配的用户，排除已滑过和无照片用户，按在线状态排序。

### GET /api/users/nearby — 附近的人

**Query 参数：**
- `page` — 页码，默认 1
- `category` — 分类筛选（可选）

**说明：** 返回 50km 范围内已开启位置的用户，按距离排序。

### GET /api/users/:id — 查看他人资料

---

## 匹配接口

### POST /api/matches/swipe — 滑动

**请求体：**
```json
{ "targetUserId": "user_002", "action": 2 }
```

`action` 取值：
- `1` — 不喜欢（跳过）
- `2` — 喜欢
- `3` — 超级喜欢

**响应（双向喜欢时）：**
```json
{
  "code": 0,
  "data": {
    "result": "matched",
    "match": { "id": "match_001", "createdAt": "..." }
  }
}
```

### GET /api/matches — 匹配列表

### DELETE /api/matches/:id — 取消匹配

### POST /api/matches/:id/block — 拉黑用户

---

## 聊天接口

### GET /api/conversations — 会话列表

按最后消息时间倒序返回。

### GET /api/conversations/:id/messages — 历史消息

**Query 参数：**
- `cursor` — 游标分页（消息 ID）
- `limit` — 每页数量，默认 20

### POST /api/conversations/:id/messages — 发送消息

**请求体：**
```json
{
  "type": 1,
  "content": "你好呀！",
  "media_url": ""
}
```

`type` 取值：1=文本 2=图片 3=语音 4=位置

### POST /api/conversations/:id/read — 标记已读

### POST /api/conversations/:id/messages/:msgId/recall — 撤回消息

> 发送超过 2 分钟不可撤回。

---

## 社群接口

### GET /api/communities — 浏览社群

**Query 参数：**
- `category` — 分类（运动/音乐/户外/美食等）
- `city` — 城市
- `page` — 页码

### POST /api/communities — 创建社群

### GET /api/communities/:id — 社群详情

### POST /api/communities/:id/join — 加入社群

### POST /api/communities/:id/leave — 退出社群

### GET /api/communities/:id/members — 成员列表

### GET /api/communities/:id/activities — 活动列表

### POST /api/communities/:id/activities — 发布活动

### GET /api/communities/activities/:id — 活动详情

### GET /api/communities/my/list — 我的社群

---

## 错误码汇总

| HTTP Status | code | 含义 |
|-------------|------|------|
| 400 | 400 | 参数错误 |
| 401 | 401 | Token 无效或过期 |
| 404 | 404 | 资源不存在 |
| 500 | 500 | 服务器错误 |
