# GitHub Pages + Cloudflare Access 学习笔记（注解版）

更新时间：2026-03-12  
适用对象：第一次做“个人主页 + 登录后可见”的同学

---

## 0. 先说结论（你现在的状态）

你当前已经实现了这条链路：

1. 页面代码部署在 GitHub Pages。  
2. 自定义域名 `home.ljhiokc.top` 走 Cloudflare。  
3. Cloudflare Access 在入口做登录校验。  
4. 未授权账号会被拦截，授权账号才能进。

这就是“网站访问受保护”。  
注意：仓库是 `public` 时，源码仍然可在 GitHub 仓库页面查看。

---

## 1. 你需要理解的 8 个关键词（注解）

1. `GitHub Pages`：托管静态网页的服务。  
注解：可以免费部署 HTML/CSS/JS，不需要服务器。

2. `Custom Domain`（自定义域名）：让网站用你自己的域名访问。  
注解：比如 `home.ljhiokc.top`，而不是 `xxx.github.io`。

3. `DNS`：把域名解析到目标地址。  
注解：域名像通讯录名字，DNS 像电话簿。

4. `NS`（Nameserver）：谁来管理你域名的 DNS。  
注解：把 NS 改到 Cloudflare 后，DNS 控制权就交给 Cloudflare。

5. `CNAME`：别名记录。  
注解：`home.ljhiokc.top -> ljh112.github.io` 就是 CNAME。

6. `Proxied`（橙云）：流量经过 Cloudflare 代理。  
注解：Access 需要这一层，才能先拦截再放行。

7. `Cloudflare Zero Trust`：Cloudflare 的访问控制平台。  
注解：Access 就在这里配置。

8. `IdP`（Identity Provider，身份提供商）：登录身份来源。  
注解：这里你用的是 GitHub 账号作为登录身份。

---

## 2. 架构图（你这次方案）

`浏览器 -> home.ljhiokc.top -> Cloudflare Access 登录页 -> 通过后 -> GitHub Pages 内容`

注解：  
- 访问必须先经过 Cloudflare（所以 NS 和 Proxied 很关键）。  
- Access 规则匹配通过，才会放行。

---

## 3. 全流程步骤（每一步都带“为什么”）

## Step A：把项目部署到 GitHub Pages

操作：

1. 推送代码到 GitHub 仓库。  
2. 仓库 `Settings -> Pages`，`Source` 选 `GitHub Actions`。  
3. 到 `Actions` 看 `Deploy GitHub Pages` 是否绿色成功。

为什么：

1. 先确保网站本体可访问，后续才能接域名和鉴权。

如何验证：

1. 打开 `https://ljh112.github.io/WebPage/` 能看到页面。

常见坑：

1. 第一次 workflow 失败。  
处理：手动 `Run workflow` 再跑一次。

---

## Step B：把域名接入 Cloudflare

操作：

1. Cloudflare `Add site` 输入 `ljhiokc.top`，选 Free。  
2. Cloudflare 给你两条 NS。  
3. 去腾讯云域名控制台，把 NS 改成 Cloudflare 这两条。  
4. 回 Cloudflare 等状态 `Active`。

为什么：

1. 只有 NS 改到 Cloudflare，Cloudflare 才能真正接管 DNS 和访问控制。

如何验证：

1. Cloudflare 域名总览页出现“受 Cloudflare 保护”或 `Active`。

常见坑：

1. 还在 `Pending`。  
处理：继续等传播；复查 NS 是否填错。

---

## Step C：配置 `home` 子域名到 GitHub Pages

操作：

1. Cloudflare DNS 新增：
- `Type`: `CNAME`
- `Name`: `home`
- `Target`: `ljh112.github.io`
- `Proxy`: `Proxied`（橙云）
- `TTL`: `Auto`

2. GitHub 仓库 `Settings -> Pages -> Custom domain` 填：
- `home.ljhiokc.top`

为什么：

1. `home` 是你准备给外部访问的入口。  
2. GitHub 需要知道这个域名属于当前仓库。

如何验证：

1. GitHub Pages 页出现 `DNS check successful`。  
2. `Visit site` 能打开 `https://home.ljhiokc.top/`。

常见坑：

1. CNAME 目标写错用户名（你就遇到过）。  
处理：目标必须是 `<你的 GitHub 用户名>.github.io`。

2. `Enforce HTTPS` 一开始是灰色。  
处理：等证书签发，通常几分钟到数小时。

---

## Step D：开通 Zero Trust + Access

操作：

1. 进入 Cloudflare `Zero Trust`。  
2. Free 计划也可能要求账单信息，按真实信息填写并完成开通。

为什么：

1. Access 功能在 Zero Trust 控制台里，不在普通 DNS 面板里。

常见坑：

1. 提交后看似“卡住”。  
处理：通常是账单信息校验失败，检查国家/地址/邮编是否真实匹配。

---

## Step E：配置 GitHub 登录（IdP）

操作：

1. 在 Cloudflare 里添加 `GitHub` 身份提供商。  
2. 到 GitHub `Settings -> Developer settings -> OAuth Apps -> New OAuth App` 创建应用。  
3. 关键字段：
- `Homepage URL`: `https://<team>.cloudflareaccess.com`
- `Authorization callback URL`: `https://<team>.cloudflareaccess.com/cdn-cgi/access/callback`

4. 把 GitHub 的 `Client ID`、`Client Secret` 粘回 Cloudflare。

为什么：

1. Cloudflare 需要通过 OAuth 和 GitHub 对接，才能把“GitHub 登录身份”带回 Access 策略引擎。

如何验证：

1. IdP 列表能看到可用的 GitHub 提供商。

常见坑：

1. callback URL 拼错。  
处理：严格按团队域名拼，别手改路径。

2. GitHub IdP 出现多个重复项。  
处理：保留 1 个，删除/禁用其余，避免登录方式混乱。

---

## Step F：创建受保护应用（Self-hosted）

操作：

1. `访问控制 -> 应用程序 -> Add application -> Self-hosted`。  
2. 主机名填：`home.ljhiokc.top`。  
3. 添加策略：
- `Action`: `Allow`
- `Include`: `Emails`
- 值：你的邮箱（建议加入 GitHub 实际返回邮箱）

4. 登录方法：
- 关闭“接受所有可用的标识提供程序”
- 只勾选 `GitHub`
- 不勾 `One-time PIN`

为什么：

1. 这是“谁能进”的核心规则。  
2. 不关闭“接受所有 IdP”时，可能被其他登录方式绕进来。

如何验证：

1. 无痕访问 `https://home.ljhiokc.top`：先看到 Access 登录页。  
2. 授权账号可进，其他账号被拒绝。

---

## 4. 你遇到过的典型报错（带原因）

## 报错 1：`That account does not have access`

原因：

1. 策略里填的邮箱和 GitHub 回传邮箱不一致。

怎么查：

1. GitHub `Settings -> Emails` 看主邮箱。  
2. 若开启邮箱隐私，可能是 `xxx@users.noreply.github.com`。

怎么修：

1. 在策略 `Include -> Emails` 中加入实际回传邮箱。  
2. 保存后用无痕重新登录测试。

---

## 报错 2：GitHub Pages workflow 红叉

原因：

1. Source 未选 GitHub Actions，或首次部署环境未准备好。

怎么修：

1. 确认 `Settings -> Pages -> Source = GitHub Actions`。  
2. 手动重跑 workflow。

---

## 报错 3：Cloudflare 一直 Pending

原因：

1. NS 还没传播完成。  
2. 注册商里 NS 没改对。

怎么修：

1. 回注册商复查 NS。  
2. 等待传播完成。

---

## 5. “成功”到底怎么判断

满足以下 4 条就算全链路成功：

1. `https://home.ljhiokc.top` 访问先出现 Access 登录页。  
2. 你的 GitHub 账号登录后可进入主页。  
3. 其他账号提示无权限。  
4. GitHub Pages 显示自定义域名生效。

---

## 6. 运营与安全建议（强烈建议）

1. 截图时遮挡卡号、CVV、Client Secret、Token。  
2. 若凭据泄露，立刻重置（OAuth secret、银行卡等）。  
3. 每次改策略后用无痕窗口复测。  
4. 为自己保留“兜底账号”邮箱，避免把自己锁在门外。

---

## 7. 关于“仓库能不能改 private”

核心结论：

1. 你当前方案是“网站访问受保护”，不是“源码受保护”。  
2. GitHub Free 下把仓库改 private，Pages 往往会受影响（可能下线）。  
3. 若你要“源码也私密”，选这两条之一：
- 升级到支持私有 Pages 的方案；
- 或迁移到支持私有仓库部署的平台（再接 Access）。

---

## 8. 快速复盘清单（下次照着做）

1. GitHub Pages 先跑通。  
2. 域名 NS 切 Cloudflare 并等 Active。  
3. CNAME `home -> <github-user>.github.io`，橙云。  
4. GitHub Pages 绑定 `home.<domain>`。  
5. Zero Trust 开通。  
6. GitHub IdP + OAuth App 配好。  
7. Self-hosted 应用 + Allow 邮箱策略。  
8. 仅保留 GitHub 登录方式。  
9. 无痕验证通过。

---

## 9. 本次实操中的关键值（便于你查）

1. GitHub 用户名：`ljh112`  
2. 仓库：`WebPage`  
3. GitHub Pages：`https://ljh112.github.io/WebPage/`  
4. 域名：`ljhiokc.top`  
5. 受保护入口：`https://home.ljhiokc.top/`  
6. Zero Trust 团队域：`ljhiokc112.cloudflareaccess.com`
