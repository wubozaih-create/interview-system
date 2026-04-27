import { NextRequest } from 'next/server';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface OptimizationSuggestion {
  type: 'add' | 'modify' | 'remove' | 'improve';
  category?: 'initial' | 'second' | 'final';
  dimension?: 'professional' | 'general' | 'business' | 'culture';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  originalQuestion?: string;
  newQuestion?: string;
}

function extractTextFromFile(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.onerror = () => {
      resolve('');
    };
    
    if (file.type.startsWith('text/') || 
        file.name.endsWith('.txt') || 
        file.name.endsWith('.md') ||
        file.type === 'application/json') {
      reader.readAsText(file);
    } else {
      resolve(`[文件: ${file.name}, 类型: ${file.type}, 大小: ${(file.size / 1024).toFixed(1)}KB]`);
    }
  });
}

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();
  const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
  const config = new Config();
  const client = new LLMClient(config, customHeaders);

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n`));
      };

      try {
        send({ type: 'progress', message: '正在解析历史面试数据...' });
        
        const formData = await request.formData();
        const historyText = formData.get('historyText') as string || '';
        const jdText = formData.get('jdText') as string || '';
        const currentQuestions = formData.get('currentQuestions') as string || '';
        
        // Handle multiple files
        const historyFiles: string[] = [];
        const fileEntries = formData.getAll('historyFiles') as File[];
        for (const file of fileEntries) {
          const fileText = await extractTextFromFile(file);
          historyFiles.push(fileText);
        }

        const historyContent = historyText || historyFiles.join('\n\n');

        if (!historyContent.trim()) {
          send({ type: 'error', message: '请提供有效的历史面试记录' });
          controller.close();
          return;
        }

        if (!jdText.trim()) {
          send({ type: 'error', message: '请提供岗位JD' });
          controller.close();
          return;
        }

        send({ type: 'progress', message: '正在分析面试数据模式...' });

        let historyInfo = '';
        if (currentQuestions) {
          historyInfo = `## 当前面试题库：\n${currentQuestions}\n\n`;
        }

        const optimizationPrompt = `你是一位资深面试题库设计专家，请分析以下历史面试数据和岗位信息，提供面试题库的优化建议。

## 岗位JD：
${jdText}

${historyInfo}
## 历史面试记录：
${historyContent}

请基于历史面试数据进行分析，识别：
1. 哪些题目能有效区分优秀候选人和一般候选人
2. 哪些题目可能效果不佳或存在偏差
3. 哪些重要的考察维度被忽视
4. 哪些题目需要优化表述方式
5. 是否需要新增题目来完善题库

请以以下JSON数组格式输出优化建议（至少8条）：
[
  {
    "type": "add/modify/remove/improve",
    "category": "initial/second/final（适用环节）",
    "dimension": "professional/general/business/culture（适用维度）",
    "title": "建议标题",
    "description": "详细说明为什么要做这个优化",
    "priority": "high/medium/low",
    "originalQuestion": "原题目（如是修改或删除）",
    "newQuestion": "优化后的题目（如是新增或修改）"
  }
]

请确保建议具有实操性，能真正提升面试效果。`;

        const messages = [
          { role: 'system' as const, content: '你是一位资深面试题库设计专家，擅长通过数据分析优化面试题目。' },
          { role: 'user' as const, content: optimizationPrompt }
        ];

        let fullResponse = '';
        const streamGenerator = client.stream(messages, {
          model: 'doubao-seed-2-0-pro-260215',
          temperature: 0.7,
        });

        for await (const chunk of streamGenerator) {
          if (chunk.content) {
            fullResponse += chunk.content;
            send({ type: 'chunk', content: chunk.content });
          }
        }

        send({ type: 'progress', message: '正在整理优化建议...' });

        try {
          const jsonMatch = fullResponse.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            const suggestions = JSON.parse(jsonMatch[0]) as OptimizationSuggestion[];
            send({ type: 'complete', suggestions });
          } else {
            send({ type: 'complete', suggestions: [] });
          }
        } catch (parseError) {
          console.error('Parse error:', parseError);
          send({ type: 'complete', suggestions: [] });
        }

      } catch (error) {
        console.error('Optimization error:', error);
        send({ type: 'error', message: error instanceof Error ? error.message : '优化过程出错' });
      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
