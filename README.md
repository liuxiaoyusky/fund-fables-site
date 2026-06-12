# 基金从业 · 科目二寓言故事站点

用寓言故事讲解《证券投资基金基础知识》中的概念。

## 在线访问

自定义域名：

```
https://fables.skyliu.tech
```

GitHub Pages 默认地址：

```
https://liuxiaoyusky.github.io/fund-fables-site
```

## 本地预览

```bash
pip install -r requirements.txt
mkdocs serve
```

然后打开 http://127.0.0.1:8000 。

## 内容来源

`docs/fables/` 下的内容复制自原备考仓库：

```
04-基金从业/02-科目二-证券投资基金/converted/fables/
```

原仓库继续保留完整的备考资料，本仓库只负责把寓言故事以更好的阅读体验呈现出来。

## 部署

仓库已配置 GitHub Actions（`.github/workflows/pages.yml`）。

1. 在 GitHub 新建仓库 `fund-fables-site`。
2. 把本目录推送到该仓库的 `main` 分支。
3. 进入仓库 `Settings → Pages`，确保 Source 为 "GitHub Actions"。
4. 在 **Custom domain** 填入 `fables.skyliu.tech` 并保存。
5. 在域名 DNS 中添加 CNAME 记录：`fables` → `liuxiaoyusky.github.io`。
6. 等待 GitHub 验证 DNS 并启用 HTTPS（通常几分钟到几小时）。
7. 每次推送到 `main` 都会自动构建并部署。

## 自定义

- 修改 `mkdocs.yml` 调整站点名称、主题颜色、功能开关。
- 修改 `docs/index.md` 调整首页内容。
- 修改 `docs/stylesheets/extra.css` 添加自定义样式。
