import { NextRequest } from 'next/server';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface Question {
  id: string;
  category: 'initial' | 'second' | 'final';
  dimension: 'professional' | 'general' | 'business' | 'culture';
  question: string;
  keyPoints: string[];
  excellentStandard: string;
}

function getFileDescription(file: File): string {
  const sizeKB = (file.size / 1024).toFixed(1);
  const fileType = file.type || 'unknown';
  const fileName = file.name;
  return `[文件信息: ${fileName}, 类型: ${fileType}, 大小: ${sizeKB}KB - 请参考表单中的文本输入内容]`;
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
        send({ type: 'progress', message: '正在解析岗位信息...' });
        
        const formData = await request.formData();
        const jdFile = formData.get('jdFile') as File | null;
        const jdText = formData.get('jdText') as string || '';
        const resumeText = formData.get('resumeText') as string || '';
        const candidateProfileStr = formData.get('candidateProfile') as string | null;

        let jdContent = jdText;

        if (jdFile) {
          jdContent = jdContent || getFileDescription(jdFile);
        }

        if (!jdContent.trim()) {
          send({ type: 'error', message: '请提供有效的岗位JD（上传文件或输入文本）' });
          controller.close();
          return;
        }

        send({ type: 'progress', message: '正在生成结构化面试题库...' });

        let candidateInfo = '';
        if (resumeText) {
          candidateInfo = `## 候选人背景：\n${resumeText}\n`;
        }
        if (candidateProfileStr) {
          try {
            const profile = JSON.parse(candidateProfileStr);
            candidateInfo += `\n候选人画像：综合评分${profile.overallScore || '未知'}，技能匹配度${profile.skillMatch?.score || '未知'}，经验匹配度${profile.experienceMatch?.score || '未知'}。\n`;
          } catch (e) {
            // Ignore parse error
          }
        }

        const questionPrompt = `你是一位资深的面试题库设计专家，请根据以下岗位JD和候选人信息，设计一套完整的结构化面试题库。

${candidateInfo}

## 岗位JD：
${jdContent}

## 要求：
请生成一套包含初试、复试、终面三个环节的结构化面试题库，每个环节涵盖以下维度：
- 专业能力：考察岗位所需的专业技能和知识
- 通用能力：考察沟通、逻辑、学习等通用素质
- 业务理解：考察对公司业务、行业的理解
- 文化适配：考察价值观、团队协作等文化匹配度

每个环节设计3-4道核心问题，确保：
1. 问题具有区分度，能有效筛选候选人
2. 每道题有明确的考察要点
3. 提供优秀答案的标准
4. 问题之间有逻辑递进关系

请以以下JSON数组格式输出：
[
  {
    "id": "q1",
    "category": "initial/second/final",
    "dimension": "professional/general/business/culture",
    "question": "面试问题",
    "keyPoints": ["考察要点1", "考察要点2"],
    "excellentStandard": "优秀答案标准描述"
  }
]

请生成至少12道问题（初试4-5道，复试4-5道，终面3-4道）。`;

        const messages = [
          { role: 'system' as const, content: '你是一位资深的面试题库设计专家，擅长设计结构化面试问题和评估标准。' },
          { role: 'user' as const, content: questionPrompt }
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

        send({ type: 'progress', message: '正在整理题库...' });

        // Parse questions from response
        try {
          const jsonMatch = fullResponse.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            const questions = JSON.parse(jsonMatch[0]) as Question[];
            send({ type: 'complete', questions });
          } else {
            send({ type: 'complete', questions: [] });
          }
        } catch (parseError) {
          console.error('Parse error:', parseError);
          send({ type: 'complete', questions: [] });
        }

      } catch (error) {
        console.error('Question generation error:', error);
        send({ type: 'error', message: error instanceof Error ? error.message : '生成过程出错' });
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
