---
doc_type: feature-ff-note
feature: ignore-package-md5
date: 2026-07-06
requirement:
tags: [git, ignore]
---

## 做了什么
把自动生成的 `frontend/package.json.md5` 改成仓库级忽略，不再由 Git 持续追踪。

## 改了哪些
- `.gitignore` - 把错误的忽略规则改成 `frontend/package.json.md5`
- `frontend/package.json.md5` - 从 Git 索引移除，保留本地文件

## 怎么验证的
用 `git check-ignore -v frontend/package.json.md5` 确认命中忽略规则。
再用 `git ls-files --error-unmatch frontend/package.json.md5` 确认它已不在 Git 追踪列表里。
