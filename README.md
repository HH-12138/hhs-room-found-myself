# HH's ROOM: Found Myself

一个关于真实、观察、迭代的个人网站。现在带有后端，数据会保存到服务器数据库，而不只是浏览器本地。

## 内容结构

- 身体观察室：文字记录身体观察和运动反馈。
- 人与人的连接：匿名案例文章和关系分析。
- 生活采样：短句记录、月度总结和灵感收集。
- Vibe Coding 日志：项目列表和产品练习记录。
- 成长轨迹：重大事件和年份时间线。

## 本地运行

1. 安装依赖：

```bash
npm install
```

2. 复制环境变量：

```bash
cp .env.example .env
```

3. 编辑 `.env`，设置你的个人密码：

```env
ADMIN_PASSWORD=your-personal-password
SESSION_SECRET=replace-with-a-long-random-string
```

4. 启动网站：

```bash
npm run dev
```

5. 打开 [http://localhost:3000](http://localhost:3000)

## 如何使用

- 任何人都可以浏览网站内容。
- 点击右上角 **登录**，输入你在 `.env` 里设置的密码后，才能保存、删除记录。
- 五个模块和「最近在研究什么」都支持添加文字记录。
- 数据保存在 `data/site.db`（SQLite）。

## 同步到免费公开页

公开展示地址：

```text
https://hh-12138.github.io/hhs-room-found-myself/
```

免费 GitHub Pages 是静态展示版，不能直接在线编辑。推荐流程：

1. 本地启动并登录编辑：

```bash
npm start
```

打开 [http://localhost:3000](http://localhost:3000) 修改内容。

2. 修改完成后，同步给别人看的公开页：

```bash
npm run sync:pages
```

这个命令会把本地数据库里的记录导出到 `public/site-data-static.json`，把上传图片复制到 `public/uploads/`，然后推送到 GitHub Pages。GitHub Actions 跑完后，别人刷新公开链接即可看到更新。

## 部署建议

这是一个 Node.js 网站，不再适合纯 GitHub Pages。推荐用个人账号部署到：

- [Render](https://render.com/)
- [Railway](https://railway.app/)
- [Fly.io](https://fly.io/)

部署时需要设置环境变量：

- `ADMIN_PASSWORD`
- `SESSION_SECRET`
- `PORT`（平台通常会自动提供）

正式域名计划使用：`https://hhs-room.com/`

## 技术栈

- 前端：HTML / CSS / JavaScript
- 后端：Node.js + Express
- 数据库：SQLite
- 登录：Session + 个人密码

不使用公司资源，适合作为个人项目独立部署。
