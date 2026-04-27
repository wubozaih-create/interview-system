# 简历分析智能体系统 - 项目规范

## 1. 概念与愿景

一个专业的AI驱动面试管理系统，为HR和面试官提供端到端的简历分析、面试题库生成、面试评估与优化建议解决方案。系统以深蓝色为主色调，传递专业、信任与智能的品牌调性，让面试流程更加标准化、数据化、高效化。

## 2. 设计语言

### 色彩系统
- **主色 (Primary)**: #1E3A5F - 深海蓝，传达专业与信任
- **次要色 (Secondary)**: #3B82F6 - 天蓝色，用于交互元素
- **强调色 (Accent)**: #10B981 - 翠绿色，用于成功状态与关键指标
- **警告色 (Warning)**: #F59E0B - 琥珀色，用于风险提示
- **危险色 (Danger)**: #EF4444 - 红色，用于不合格标记
- **背景色 (Background)**: #F8FAFC - 浅灰蓝，极浅背景
- **卡片背景**: #FFFFFF - 纯白卡片
- **文字色**: #1E293B - 深灰文字，#64748B - 次要文字

### 字体系统
- **标题字体**: "Noto Sans SC", "PingFang SC", sans-serif
- **正文字体**: "Noto Sans SC", "PingFang SC", sans-serif
- **等宽字体**: "JetBrains Mono", monospace (用于代码/数据展示)

### 空间系统
- 基础单位: 4px
- 间距序列: 4, 8, 12, 16, 24, 32, 48, 64px
- 卡片圆角: 12px
- 按钮圆角: 8px

### 动效设计
- 页面过渡: fade-in 300ms ease-out
- 卡片悬停: translateY(-2px) + shadow 增强
- 按钮交互: scale(0.98) on press
- 流式输出: typewriter 效果，字符间隔 20ms
- 加载状态: 骨架屏 + shimmer 动画

### 图标库
Lucide React - 线性风格，2px 描边

## 3. 布局与结构

### 页面架构
```
┌─────────────────────────────────────────────────────────────┐
│  Header: Logo + 系统名称 + 导航栏                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Main Content Area                                          │
│  - 首页: 文件上传区 + 分析结果展示                          │
│  - 面试题库: 结构化题库列表 + 详情                          │
│  - 面试评估: 上传对话 + 分析报告                             │
│  - 题库优化: 优化建议输出                                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 导航结构
1. **首页/分析** - JD + 简历上传 → 分析结果
2. **面试题库** - 结构化面试题列表
3. **面试评估** - 对话记录上传 → 评估报告
4. **题库优化** - 基于历史面试的优化建议

### 响应式策略
- Desktop (>1024px): 完整侧边导航 + 宽内容区
- Tablet (768-1024px): 收起侧边栏 + 汉堡菜单
- Mobile (<768px): 底部Tab导航 + 全屏内容

## 4. 功能与交互

### 4.1 JD与简历上传模块
**上传入口:**
- 支持文件类型: .pdf, .doc, .docx, .jpg, .png, .jpeg, .txt, .md
- 支持拖拽上传与点击选择
- 支持粘贴文本内容
- 最大文件限制: 10MB

**交互流程:**
1. 选择上传模式(文件/文本)
2. 上传JD文件或粘贴文本
3. 上传简历文件
4. 点击"开始分析"按钮
5. 展示流式分析进度
6. 展示分析结果卡片

**状态定义:**
- 空状态: 引导用户上传文件
- 上传中: 进度条 + 文件名显示
- 上传成功: 文件预览 + 删除按钮
- 分析中: 流式输出动画
- 分析完成: 结果卡片展示

### 4.2 简历分析功能
**分析维度:**
- 基础信息提取 (姓名、学历、工作年限等)
- 技能匹配度分析
- 经验相关性评估
- 与JD的契合度评分 (0-100)
- 关键优势提炼
- 潜在风险点识别

**输出格式:**
```json
{
  "basicInfo": { ... },
  "skillMatch": { score: 85, details: [...] },
  "experienceMatch": { score: 78, details: [...] },
  "overallScore": 82,
  "strengths": [...],
  "risks": [...],
  "recommendation": "..."
}
```

### 4.3 结构化面试题库
**题库结构:**
- 按面试环节分类: 初试 → 复试 → 终面
- 按能力维度: 专业能力 / 通用能力 / 业务理解 / 文化适配
- 每道题包含: 题目、考察点、优秀答案标准、评分标准

**交互功能:**
- 题库列表展示
- 按岗位筛选
- 按环节筛选
- 导出题库(PDF/Word)
- 新增自定义题目

### 4.4 面试对话评估
**输入:**
- 支持PDF/图片/文本格式的面试对话记录
- 支持多轮对话上传

**分析维度:**
- 回答完整性评估
- 专业能力考察结果
- 沟通表达能力
- 逻辑思维评估
- 文化适配度
- 候选人优劣势总结

**输出报告:**
- 各项能力得分雷达图
- 详细评价文字
- 录用建议 (强烈推荐/推荐/待定/不建议)
- 风险提示
- 与初试/简历的对比分析

### 4.5 题库优化建议
**输入:**
- 历次面试对话记录
- 候选人反馈
- 岗位JD

**输出:**
- 现有题库的问题诊断
- 新增题目建议
- 删除/修改题目建议
- 整体优化方向

## 5. 组件清单

### Navigation 导航栏
- 默认: 浅色背景，文字无高亮
- 悬停: 文字颜色变深 + 背景微亮
- 激活: 主色背景，白色文字，左侧边框指示
- 移动端: 汉堡菜单展开侧边抽屉

### FileUploader 文件上传器
- 默认: 虚线边框，灰色图标与文字
- 悬停: 边框变主色，图标变蓝
- 拖拽中: 蓝色背景填充，图标放大
- 上传成功: 显示文件信息卡片
- 错误: 红色边框，错误提示文字

### Button 按钮
- Primary: 主色背景，白色文字
- Secondary: 白色背景，主色边框与文字
- Disabled: 灰色背景，不可点击
- 加载中: 旋转图标 + 禁用交互

### Card 卡片
- 默认: 白色背景，轻微阴影
- 悬停: 阴影增强，轻微上移
- 可点击卡片: 光标指针

### AnalysisResult 分析结果卡片
- 分数展示: 大号数字 + 颜色编码
- 标签: 小圆角pill样式
- 展开/收起: 点击展开详情

### StreamingOutput 流式输出组件
- 打字机效果显示AI输出
- 支持中断
- 输出完成后可复制

### Tabs 标签页
- 下划线指示器
- 悬停: 下划线预览
- 激活: 粗下划线 + 文字加粗

### Alert 提示框
- Success: 绿色背景与图标
- Warning: 黄色背景与图标
- Error: 红色背景与图标
- Info: 蓝色背景与图标

## 6. 技术方案

### 框架与架构
- **前端框架**: Next.js 16 (App Router)
- **UI组件**: shadcn/ui + Tailwind CSS
- **状态管理**: React Context + useReducer
- **文件处理**: PDF.js (PDF解析), pdf-parse
- **AI集成**: coze-coding-dev-sdk (流式输出)

### API 设计

#### POST /api/analyze
简历分析接口
```typescript
// Request
{
  jdText: string;       // JD文本内容
  resumeFile?: File;    // 简历文件
  resumeText?: string;  // 或简历文本
}

// Response (流式SSE)
data: { type: "progress", message: string }
data: { type: "chunk", content: string }
data: { type: "complete", result: AnalysisResult }
data: { type: "error", message: string }
```

#### POST /api/generate-questions
生成面试题库
```typescript
// Request
{
  jdText: string;
  candidateProfile?: string;  // 可选候选人画像
}

// Response (流式)
data: { type: "chunk", content: string }
data: { type: "complete", questions: Question[] }
```

#### POST /api/evaluate-interview
面试评估
```typescript
// Request
{
  conversationFile?: File;
  conversationText?: string;
  questions: Question[];      // 使用的面试题
  candidateProfile?: string;  // 候选人基本信息
}

// Response (流式)
data: { type: "chunk", content: string }
data: { type: "complete", evaluation: EvaluationReport }
```

#### POST /api/optimize-questions
题库优化
```typescript
// Request
{
  currentQuestions: Question[];
  interviewRecords: string[];  // 历史面试记录
  jdText: string;
}

// Response (流式)
data: { type: "chunk", content: string }
data: { type: "complete", suggestions: OptimizationSuggestion[] }
```

### 数据模型

```typescript
interface JD {
  id: string;
  text: string;
  extracted: {
    title: string;
    requirements: string[];
    responsibilities: string[];
    skills: string[];
  };
}

interface Resume {
  id: string;
  fileName: string;
  text: string;
  parsed: {
    name: string;
    education: string;
    experience: WorkExperience[];
    skills: string[];
  };
}

interface Question {
  id: string;
  category: "initial" | "second" | "final";
  dimension: "professional" | "general" | "business" | "culture";
  question: string;
  keyPoints: string[];
  excellentStandard: string;
  scoringCriteria: {
    excellent: string;
    good: string;
    fair: string;
    poor: string;
  };
}

interface EvaluationReport {
  scores: {
    professionalAbility: number;
    communication: number;
    logicalThinking: number;
    cultureFit: number;
    overall: number;
  };
  strengths: string[];
  weaknesses: string[];
  recommendation: "strong_recommend" | "recommend" | "pending" | "not_recommend";
  riskWarnings: string[];
  detailedFeedback: string;
}
```

### 文件存储
- 开发环境: 本地 /public/uploads 目录
- 生产环境: 临时文件存 /tmp 目录

## 7. 页面清单

1. **/** - 首页/分析页面
   - JD上传区
   - 简历上传区
   - 分析结果展示
   - 生成的面试题库预览

2. **/questions** - 面试题库页面
   - 题库列表
   - 筛选/搜索
   - 题库详情

3. **/evaluation** - 面试评估页面
   - 对话上传区
   - 历史评估记录
   - 评估报告展示

4. **/optimization** - 题库优化页面
   - 历史面试输入
   - 优化建议展示
