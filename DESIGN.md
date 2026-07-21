---
version: alpha
name: Story Route
description: A route-led reading system for moving through dense knowledge as a sequence of approachable fables.
colors:
  canvas: "#EDF3F4"
  surface: "#FAFCFC"
  text-strong: "#203038"
  text-reading: "#34494F"
  text-muted: "#63767B"
  primary: "#174B67"
  primary-hover: "#103C54"
  on-primary: "#FAFCFC"
  route-progress: "#4D756F"
  state-current: "#D76855"
  state-current-text: "#B84A3A"
  divider: "#CAD9DA"
  control-outline: "#789496"
  disabled: "#9EB6B7"
typography:
  display-book:
    fontFamily: "Georgia, STSong, Songti SC, Noto Serif SC, Source Han Serif SC, serif"
    fontSize: 70px
    fontWeight: 400
    lineHeight: 1.05
    letterSpacing: -0.045em
  headline-book:
    fontFamily: "Georgia, STSong, Songti SC, Noto Serif SC, Source Han Serif SC, serif"
    fontSize: 52px
    fontWeight: 400
    lineHeight: 1.18
    letterSpacing: -0.045em
  subhead-book:
    fontFamily: "Georgia, STSong, Songti SC, Noto Serif SC, Source Han Serif SC, serif"
    fontSize: 22px
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: 0.015em
  title-item:
    fontFamily: "PingFang SC, Hiragino Sans GB, Noto Sans SC, Microsoft YaHei, system-ui, sans-serif"
    fontSize: 17px
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: 0px
  title-chapter:
    fontFamily: "Georgia, STSong, Songti SC, Noto Serif SC, Source Han Serif SC, serif"
    fontSize: 17px
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: 0px
  title-section:
    fontFamily: "PingFang SC, Hiragino Sans GB, Noto Sans SC, Microsoft YaHei, system-ui, sans-serif"
    fontSize: 17px
    fontWeight: 700
    lineHeight: 1.35
    letterSpacing: 0.08em
  body-reading:
    fontFamily: "PingFang SC, Hiragino Sans GB, Noto Sans SC, Microsoft YaHei, system-ui, sans-serif"
    fontSize: 18px
    fontWeight: 400
    lineHeight: 2.05
    letterSpacing: 0.015em
  body-support:
    fontFamily: "PingFang SC, Hiragino Sans GB, Noto Sans SC, Microsoft YaHei, system-ui, sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.8
    letterSpacing: 0px
  label-control:
    fontFamily: "PingFang SC, Hiragino Sans GB, Noto Sans SC, Microsoft YaHei, system-ui, sans-serif"
    fontSize: 13px
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: 0.02em
  meta-route:
    fontFamily: "SFMono-Regular, Menlo, Consolas, monospace"
    fontSize: 10px
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: 0.12em
rounded:
  frame: 0px
  control: 3px
  node: 9999px
spacing:
  micro: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 40px
  route-gutter: 64px
components:
  page:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.text-strong}"
    typography: "{typography.body-support}"
  reading-surface:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-reading}"
    typography: "{typography.body-reading}"
    rounded: "{rounded.frame}"
  primary-action:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label-control}"
    rounded: "{rounded.control}"
    padding: "{spacing.md}"
    height: 42px
  primary-action-hover:
    backgroundColor: "{colors.primary-hover}"
    textColor: "{colors.on-primary}"
  utility-action:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary}"
    typography: "{typography.label-control}"
    rounded: "{rounded.control}"
    padding: "{spacing.sm}"
    height: 42px
  route-line:
    backgroundColor: "{colors.route-progress}"
    width: 1px
  route-node-current:
    backgroundColor: "{colors.state-current}"
    rounded: "{rounded.node}"
  progress-track:
    backgroundColor: "{colors.divider}"
    height: 2px
  progress-fill:
    backgroundColor: "{colors.route-progress}"
    height: 2px
  status-complete:
    textColor: "{colors.state-current-text}"
    typography: "{typography.label-control}"
  status-idle:
    textColor: "{colors.text-muted}"
    typography: "{typography.label-control}"
  control-boundary:
    backgroundColor: "{colors.control-outline}"
    height: 1px
  control-disabled:
    textColor: "{colors.disabled}"
    typography: "{typography.label-control}"
  book-display:
    textColor: "{colors.primary}"
    typography: "{typography.display-book}"
  book-headline:
    textColor: "{colors.primary}"
    typography: "{typography.headline-book}"
  story-subhead:
    textColor: "{colors.text-strong}"
    typography: "{typography.subhead-book}"
  shelf-title:
    textColor: "{colors.text-strong}"
    typography: "{typography.title-item}"
  chapter-title:
    textColor: "{colors.text-strong}"
    typography: "{typography.title-chapter}"
  section-title:
    textColor: "{colors.primary}"
    typography: "{typography.title-section}"
  route-meta:
    textColor: "{colors.text-muted}"
    typography: "{typography.meta-route}"
  reader-highlight:
    backgroundColor: "{colors.state-current}"
    height: 3px
---

# Story Route

## Overview

“故事航线”把一套知识书拆成一条可行走的路线：书是航线，章节是站点，阅读进度是已经走过的轨迹。视觉应当像一张冷静、清楚、可长时间停留的阅读地图，而不是金融仪表盘，也不是仿古书房。

本规范从已确认的 B 方向提取，视觉真值是同一组首页、目录和阅读页：

- `story-route.png`
- `story-route-directory.png`
- `story-route-reader.png`

这三页共同决定颜色、字体、路线节点、控件边界和页面密度。后续页面必须先复用这些 role；只有出现新的产品语义时，才能增加 token。

版本入口、桌面递归目录和移动端递归目录是同一段阅读旅程的三个状态，不是三套互相独立的页面风格。它们继续消费本文件已有的颜色、字体、边界与路线 role，不为新页面另造色板。

## Colors

颜色按产品职责命名，组件不直接消费 `fog / cloud / atlas / sea / coral` 等视觉昵称。

- **Canvas** `{colors.canvas}` 是页面外部、hover 和选中行的冷雾底色。
- **Surface** `{colors.surface}` 是站点框架、阅读纸面和控件底色。
- **Text strong** `{colors.text-strong}` 用于标题、书架书名和界面正文；长文单独使用更柔和但仍高对比的 **text reading** `{colors.text-reading}`。
- **Primary** `{colors.primary}` 只用于品牌、主要标题和每屏唯一的开始／继续阅读操作；hover 使用 `{colors.primary-hover}`，前景必须配 `{colors.on-primary}`。
- **Route progress** `{colors.route-progress}` 用于航线、进度条、阅读中状态和安静的阅读导航。
- **State current** `{colors.state-current}` 用于当前节点、焦点环、首字和高亮下划线。它不用于 10–13px 小字；小号文字使用可访问的 `{colors.state-current-text}`。
- **Divider** `{colors.divider}` 是被动分隔线；**control outline** `{colors.control-outline}` 是需要被识别为控件的边界；**disabled** `{colors.disabled}` 只用于禁用文本和未开放节点。

不得重新引入金色高亮。读者划重点采用透明背景加 3px 珊瑚色下划线，保留正文的纸面连续性。

当前确认稿只提供浅色视觉证据。深色模式可以保留功能，但任何深色配色在单独视觉验收前都属于推导值，不能声称由本规范确认。

## Typography

字体分成三条清楚的语义通道：

- **Book**：Georgia 与本地宋体栈，只用于书名、目录主标题和故事副标题。大标题使用 400 字重，不能回退成厚重黑体或 700 宋体。
- **UI**：苹方／冬青黑体／思源黑体／微软雅黑栈，用于正文、书架、按钮和说明。
- **Route meta**：SF Mono／Menlo／Consolas，用于卷号、章节编号、篇数、版本和路线坐标；它不是普通正文。

首页书名在桌面从 48px 流动到 70px；目录和阅读页 H1 从 37px 流动到 52px。机器 token 记录上限值，响应式缩放由组件实现。阅读正文为 18px / 2.05，移动端降为 17px，并把每行限制在约 66 个汉字宽度以内。

全站只使用 400、600、700 三种字重。书名的气质来自字族、字号和留白，不来自更粗的字重。

## Layout

桌面以 1360px 的单一 `surface` 框架放在 `canvas` 上，外部留 24–40px 安全区；手机改为满宽页面。内容通过一条连续路线组织，避免把每个信息块变成独立卡片。

- 首页：推荐书与五册书架共享一条纵向路线；推荐书仍保留在书架中。
- 版本入口：有多个阅读版本的书先进入版本选择，再进入对应的稳定目录 URL；未开放版本保留在路线中，但不能伪造可访问链接。
- 目录：书籍信息、当前版本与阅读进度同处 hero。桌面使用 320–380px 递归树加内容预览的双栏结构；树可以同时容纳“章 → 故事”和“章 → 节 → 故事”。
- 窄屏目录：860px 及以下只保留同一棵递归树，隐藏重复的右侧预览，不维护第二套目录数据或简化版层级。
- 阅读页：正文列最大约 66ch；路线轨位于正文左侧，阅读工具在桌面变为安静的横向／侧向控制，在手机回到底部可触达位置。
- 间距以 4px 微调、8/12/16/24/40px 为主；路线槽固定从约 64px 起算。

移动端不得出现横向滚动。header 中的 Download Skill 只在首页与目录页出现，阅读正文不出现。

## Elevation & Depth

这是一个平面系统。层级来自 `canvas` 与 `surface` 的色差、1px 分隔线、路线的连续性和排版尺度，不使用厚阴影、玻璃效果、渐变进度条或 3D 书封。

hover 仅改变底色或边界，不把行向上抬起。浮动“划重点”工具可以使用极轻的必要阴影来与正文分离，但不能变成视觉焦点。

## Shapes

主框架与列表保持直角；搜索、下载和阅读操作使用 3px 小圆角。只有路线节点、状态点和圆形图标使用 full radius。

不要混用 8–14px 卡片圆角或 999px 胶囊按钮。路线的圆形节点是状态语法，不是装饰图案。

## Components

- **Primary action**：atlas 实底、cloud 文字，首页或目录每屏只出现一个；hero 可用 56px 高度，紧凑场景用 42px。
- **Secondary / utility action**：透明或 surface 底、atlas 文字、可访问的 control outline；Download Skill、PDF、Word、搜索、主题切换都属于 utility。
- **Quiet action**：无外框、sea 文字，用于阅读工具栏和上一篇／下一篇；hover 可变为 current text。
- **Route rail**：1px sea 轨迹。当前节点用珊瑚环／实心点，已读路线用 sea，未读节点用 disabled；状态必须同时有标签或填充差异，不能只靠颜色。
- **Shelf row**：UI semibold 书名、mono 卷号、真实篇数、真实进度和状态。整行可点击并支持键盘。
- **Version row**：选中版本使用 canvas wash、sea track 和 current node；未选版本使用 muted 文本与 disabled track。它不是胶囊 tab。
- **Version gateway**：版本行使用原生 `radio` 语义和 roving tabindex；Arrow、Home、End 可切换。可用版本更新唯一主行动，未开放版本把主行动切为明确的禁用状态。
- **Recursive catalog**：使用原生 `details / summary` 表达任意深度；只自动展开当前阅读路径。桌面右栏展示当前分支的直接子节点，移动端则直接在同一树中展开。
- **Reader copy**：18px / 2.05，`text-reading`，66ch；标题为 book family，工具为 UI family，坐标为 mono family。
- **Reader highlight**：透明底加 current 色下划线。保存、清除、刷新恢复等真实交互必须保留。

## Do's and Don'ts

- Do 让 atlas、sea、coral 分别承担主行动、路线进度、当前状态，不能互换。
- Do 使用真实书名、篇数、版本、进度和上次阅读位置。
- Do 保证普通文字至少 4.5:1、控件边界至少 3:1 的对比度；小号珊瑚文字必须使用 `state-current-text`。
- Do 保留搜索、主题切换、版本记忆、上一篇／下一篇、下载和本地划重点。
- Do 让版本、目录树和故事 URL 各自稳定；增加新故事版本时，新建对应内容根与目录，不改写经典版深链接。
- Don't 隐藏当前推荐书的书架行；书架始终明确展示五册。
- Don't 使用金色高亮、渐变进度、厚阴影、3D 书、浮起卡片或大圆角胶囊。
- Don't 把路线节点画成无语义装饰；每个节点必须对应当前、已读、未读或完成状态。
- Don't 为创作中的版本填入假目录、假故事或可点击的空链接。
- Don't 把深色模式描述为已从 B 稿提取，除非它经过独立视觉确认。
