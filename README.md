# Personal Link Portal

这是一个可定制的个人主页模板，核心目标是让你在一个页面快速访问大量常用链接。  
当前版本包含：

- 主页面快捷链接面板（分类、搜索、快捷键 1-9）
- 链接增删改（浏览器本地存储）
- 配置导入 / 导出（JSON）
- 个人信息子页占位（`profile.html`）

## 本地预览

直接在仓库目录运行：

```powershell
cd D:\code\WebPage
python -m http.server 8080
```

然后访问 `http://localhost:8080`。

## 自定义方式

1. 打开主页，点击“新增链接”录入你自己的网址。
2. 通过“编辑 / 删除”维护现有链接。
3. 用“导出配置”备份，或“导入配置”迁移到其他设备。
4. 需要长期固定内容时，可直接改 `app.js` 里的 `defaultConfig`。

## 部署方案 A：GitHub Pages（免费）

1. 把仓库推送到 GitHub。
2. 在仓库 `Settings -> Pages` 中：
3. `Source` 选择 `Deploy from a branch`。
4. `Branch` 选择你的主分支（如 `main`）和 `/root`。
5. 保存后等待 1-3 分钟，生成 `https://<你的账号>.github.io/<仓库名>/`。

## 部署方案 B：Vercel（推荐，配置简单）

1. 打开 [Vercel](https://vercel.com/) 并连接 GitHub 仓库。
2. 导入该项目，Framework Preset 选 `Other`（静态站）。
3. 不需要额外构建命令，直接部署。
4. 部署完成后会给你一个 `*.vercel.app` 域名，可绑定自定义域名。

## 下一步可扩展

- 给主页加“分组排序、拖拽排序”
- 增加“工作模式 / 生活模式”多套配置
- 把 `profile.html` 做成完整个人简历页或作品集页

## 学习笔记

- Cloudflare Access + GitHub Pages 私密访问实操：
  - `docs/cloudflare-access-github-pages-notes.md`
