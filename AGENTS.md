# 智能面试系统 - AGENTS.md

## 项目概述

智能面试系统是一个基于AI技术的专业面试管理平台，为HR和面试官提供端到端的简历分析、面试题库生成、面试评估与优化建议解决方案。

## 技术栈

- **框架**: Next.js 16 (App Router)
- **核心**: React 19
- **语言**: TypeScript 5
- **UI组件**: shadcn/ui (基于 Radix UI)
- **样式**: Tailwind CSS 4
- **AI集成**: coze-coding-dev-sdk (流式输出)

## 目录结构

```
src/
├── app/
│   ├── layout.tsx          # 根布局
│   ├── page.tsx           # 首页 - 简历分析 + 面试题库生成
│   ├── globals.css        # 全局样式
│   ├── questions/         # 面试题库管理页面
│   │   └── page.tsx
│   ├── evaluation/        # 面试评估页面
│   │   └── page.tsx
│   ├── optimization/      # 题库优化页面
│   │   └── page.tsx
│   └── api/              # API路由
│       ├── analyze/      # 简历分析API
│       │   └── route.ts
│       ├── generate-questions/  # 面试题库生成API
│       │   └── route.ts
│       ├── evaluate-interview/  # 面试评估API
│       │   └── route.ts
│       └── optimize-questions/  # 题库优化API
│           └── route.ts
├── components/
│   ├── navigation.tsx    # 导航栏组件
│   ├── file-uploader.tsx  # 文件上传组件
│   └── analysis-panel.tsx # 分析面板组件
└── lib/
    └── utils.ts          # 工具函数
```

## 核心功能

### 1. 简历分析 (首页 /)
- 支持JD和简历的文件上传或文本输入
- AI流式分析简历与JD的匹配度
- 输出综合评分、技能匹配度、经验匹配度
- 识别候选人优势和风险点
- 提供录用建议

### 2. 面试题库生成
- 基于JD和候选人画像生成结构化面试题
- 按初试、复试、终面环节分类
- 涵盖专业能力、通用能力、业务理解、文化适配四个维度
- 每道题包含考察要点和优秀答案标准

### 3. 面试评估 (/evaluation)
- 支持面试对话记录上传
- AI评估候选人各维度表现
- 输出雷达图评分、详细评价
- 风险提示和录用建议

### 4. 题库优化 (/optimization)
- 分析历史面试数据
- 提供新增、修改、删除、优化建议
- 按优先级排序

## 开发命令

```bash
# 安装依赖
pnpm install

# 开发环境
pnpm dev

# 构建生产版本
pnpm build

# 类型检查
pnpm ts-check

# 代码检查
pnpm lint
```

## 环境变量

系统自动从环境变量读取配置，无需手动设置。

## 注意事项

1. 所有AI相关功能使用流式输出，通过SSE协议实现
2. API路由统一使用 `coze-coding-dev-sdk` 的 LLMClient
3. 文件上传支持 PDF、Word、图片、文本格式
4. 最大文件限制: 10MB
