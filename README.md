# 寓言图书馆

用寓言故事讲解经典读物。

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

## 书架

| 封面 | 书名 | 寓言数 |
|------|------|--------|
| 证券投资基金 | 基金从业 · 科目二 | 464 |
| 股权投资基金 | 基金从业 · 科目三 | 337 |
| 有限与无限的游戏 | Finite and Infinite Games（James Carse, 1986） | 101 |

进入首页后，最近读过的那本书排在最前；点击封面会直接跳到上次阅读的那一节，并自动滚动到上次停留的位置。阅读进度保存在浏览器的 localStorage 里，关闭页面后下次打开仍能继续。

## 内容来源

`docs/fables/` 下的内容复制自两个原仓库：

- 基金从业：
  ```
  04-基金从业/02-科目二-证券投资基金/converted/fables/
  04-基金从业/03-科目三-私募股权/converted/fables/
  ```
- 有限与无限的游戏：
  ```
  100-finite-and-infinite-game/converted/fables/
  ```

原仓库继续保留完整的备考 / 学习资料，本仓库只负责把寓言故事以更好的阅读体验呈现出来。

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
- 修改 `docs/index.md` 调整首页封面卡片。
- 修改 `docs/stylesheets/extra.css` 添加自定义样式。
- 修改 `docs/javascripts/library.js` 调整首页排序 / 跳转行为。
- 修改 `docs/javascripts/reading-tracker.js` 调整阅读进度记录行为。
