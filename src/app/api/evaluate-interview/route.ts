import { NextRequest } from 'next/server';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface EvaluationResult {
  scores: {
    professionalAbility: number;
    communication: number;
    logicalThinking: number;
    cultureFit: number;
    overall: number;
  };
  strengths: string[];
  weaknesses: string[];
  recommendation: 'strong_recommend' | 'recommend' | 'pending' | 'not_recommend';
  riskWarnings: string[];
  detailedFeedback: string;
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
        send({ type: 'progress', message: '正在解析面试对话记录...' });
        
        const formData = await request.formData();
        const conversationFile = formData.get('conversationFile') as File | null;
        const conversationText = formData.get('conversationText') as string || '';
        const candidateInfo = formData.get('candidateInfo') as string || '';

        let conversationContent = conversationText;

        if (conversationFile) {
          conversationContent = conversationContent || getFileDescription(conversationFile);
        }

        if (!conversationContent.trim()) {
          send({ type: 'error', message: '请提供有效的面试对话内容（上传文件或输入文本）' });
          controller.close();
          return;
        }

        send({ type: 'progress', message: '正在进行面试评估分析...' });

        const evaluationPrompt = `你是一位资深HR面试评估专家，请对以下面试对话记录进行专业评估。

${candidateInfo ? `## 候选人基本信息：\n${candidateInfo}\n\n` : ''}
## 面试对话记录：
${conversationContent}

请从以下维度进行评估：

1. **专业能力**：评估候选人在岗位所需专业技能方面的表现
2. **沟通表达**：评估候选人的语言组织、表达清晰度
3. **逻辑思维**：评估候选人回答问题的逻辑性和条理性
4. **文化适配**：评估候选人与公司文化的匹配度

请给出：
- 各维度评分（0-100）
- 综合评分（0-100）
- 候选人优势（3-5条）
- 待提升项（2-4条）
- 风险提示（1-3条，如有严重问题）
- 录用建议（强烈推荐/推荐/待定/不建议）
- 详细评价（综合分析）

请以以下JSON格式输出：
{
  "scores": {
    "professionalAbility": 85,
    "communication": 78,
    "logicalThinking": 82,
    "cultureFit": 75,
    "overall": 80
  },
  "strengths": ["优势1", "优势2", "优势3"],
  "weaknesses": ["待提升项1", "待提升项2"],
  "recommendation": "recommend",
  "riskWarnings": ["风险提示1"],
  "detailedFeedback": "详细评价文字..."
}`;

        const messages = [
          { role: 'system' as const, content: '你是一位资深HR面试评估专家，擅长通过对话内容评估候选人的综合能力。' },
          { role: 'user' as const, content: evaluationPrompt }
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

        send({ type: 'progress', message: '正在整理评估结果...' });

        try {
          const jsonMatch = fullResponse.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const result = JSON.parse(jsonMatch[0]) as EvaluationResult;
            send({ type: 'complete', result });
          } else {
            const result: EvaluationResult = {
              scores: {
                professionalAbility: 0,
                communication: 0,
                logicalThinking: 0,
                cultureFit: 0,
                overall: 0
              },
              strengths: [],
              weaknesses: [],
              recommendation: 'pending',
              riskWarnings: [],
              detailedFeedback: '评估结果解析失败'
            };
            send({ type: 'complete', result });
          }
        } catch (parseError) {
          const result: EvaluationResult = {
            scores: {
              professionalAbility: 0,
              communication: 0,
              logicalThinking: 0,
              cultureFit: 0,
              overall: 0
            },
            strengths: [],
            weaknesses: [],
            recommendation: 'pending',
            riskWarnings: [],
            detailedFeedback: '评估结果解析失败'
          };
          send({ type: 'complete', result });
        }

      } catch (error) {
        console.error('Evaluation error:', error);
        send({ type: 'error', message: error instanceof Error ? error.message : '评估过程出错' });
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
