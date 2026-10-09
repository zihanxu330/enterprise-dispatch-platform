# Jiajia Signature —— 连笔签名动画作品集

纯 HTML / CSS / SVG / 原生 JavaScript 实现的 "jiajia" 连笔签名手写动画系列。零依赖、无需构建，浏览器直接打开即可运行。

## 作品列表

| 文件 | 说明 |
| --- | --- |
| `jiajia_handwriting_reveal.html` | 手写揭示：签名笔顺逐笔书写动画（像钢笔一笔一画写出来） |
| `jiajia_v3.html` | 签名动画 V3：连笔签名的完整书写演绎 |
| `jiajia_loading_v2.html` | 加载门户 V2：签名书写与加载进度（0-100%）联动的加载页 |
| `jiajia_loading_v2_fixed.html` | 加载门户 V2 修复版：修复 "i" 点显示时机——最后一笔完成后才出现圆点 |

## 使用方式

直接用浏览器打开对应的 `.html` 文件即可，无需安装任何依赖。

## 技术要点

- 纯原生实现：HTML + CSS + SVG + JavaScript，无任何第三方库
- 签名笔画使用 SVG 路径（base64 内嵌）驱动逐笔揭示动画
- 通过 `stroke-dasharray` / `stroke-dashoffset` 实现笔画书写效果
- 加载门户版本中，签名书写进度与 loading 百分比实时联动
