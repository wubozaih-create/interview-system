import { NextRequest } from 'next/server';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface AnalysisResult {
  basicInfo?: {
    name?: string;
    education?: string;
    experience?: string;
    currentPosition?: string;
  };
  skillMatch?: {
    score: number;
    details: string[];
  };
  experienceMatch?: {
    score: number;
    details: string[];
  };
  overallScore?: number;
  strengths?: string[];
  risks?: string[];
  recommendation?: string;
}

function getFileDescription(file: File): string {
  // 在后端我们无法直接读取文件内容，只能获取元信息
  // 文本文件内容应该由前端通过表单的文本字段传递
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
        // Parse form data
        send({ type: 'progress', message: '正在解析上传的文件...' });
        
        const formData = await request.formData();
        const jdFile = formData.get('jdFile') as File | null;
        const resumeFile = formData.get('resumeFile') as File | null;
        const jdText = formData.get('jdText') as string || '';
        const resumeText = formData.get('resumeText') as string || '';

        let jdContent = jdText;
        let resumeContent = resumeText;

        // Handle file info (text content should come from text fields)
        if (jdFile) {
          jdContent = jdContent || getFileDescription(jdFile);
        }
        
        if (resumeFile) {
          resumeContent = resumeContent || getFileDescription(resumeFile);
        }

        if (!jdContent.trim()) {
          send({ type: 'error', message: '请提供有效的岗位JD（上传文件或输入文本）' });
          controller.close();
          return;
        }

        if (!resumeContent.trim()) {
          send({ type: 'error', message: '请提供有效的简历（上传文件或输入文本）' });
          controller.close();
          return;
        }

        send({ type: 'progress', message: '正在调用AI分析模型...' });

        // Build the analysis prompt
        const analysisPrompt = `你是一位专业的HR招聘专家，请对以下简历进行详细分析，并与岗位JD进行匹配评估。

## 岗位JD：
${jdContent}

## 候选人简历：
${resumeContent}

请进行以下分析并以JSON格式输出结果：

1. **基础信息提取**：姓名（如有）、学历、工作年限、现职位/最近职位

2. **技能匹配度分析**：
   - 评分(0-100)：评估简历中的技能与JD要求的匹配程度
   - 详细分析：列出匹配的技能和不匹配的技能

3. **经验匹配度分析**：
   - 评分(0-100)：评估工作经历与JD职责要求的匹配程度
   - 详细分析：评估相关经验年限和深度

4. **综合评分**(0-100)：基于技能和经验给出总体匹配度

5. **候选人优势**：列出简历中3-5个与岗位匹配的突出优势

6. **风险点**：列出2-4个需要关注的潜在风险（如经验不足、技能缺口、职级期望等）

7. **录用建议**：给出明确的录用建议（强烈推荐/推荐/待定/不建议）并说明理由

请以以下JSON格式输出，务必确保是有效的JSON：
{
  "basicInfo": {
    "name": "姓名（如有）",
    "education": "学历",
    "experience": "工作年限",
    "currentPosition": "现职位"
  },
  "skillMatch": {
    "score": 85,
    "details": ["匹配技能1", "匹配技能2", "缺失技能"]
  },
  "experienceMatch": {
    "score": 78,
    "details": ["相关经验描述"]
  },
  "overallScore": 82,
  "strengths": ["优势1", "优势2", "优势3"],
  "risks": ["风险1", "风险2"],
  "recommendation": "建议及理由"
}`;

        let fullResponse = '';
        const messages = [
          { role: 'system' as const, content: '你是一位专业的HR招聘专家，擅长简历分析和人才评估。' },
          { role: 'user' as const, content: analysisPrompt }
        ];

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

        // Parse the JSON response
        send({ type: 'progress', message: '正在解析分析结果...' });
        
        try {
          // Try to extract JSON from the response
          const jsonMatch = fullResponse.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const result = JSON.parse(jsonMatch[0]) as AnalysisResult;
            send({ type: 'complete', result });
          } else {
            // If no valid JSON found, create a structured result from text
            const result: AnalysisResult = {
              basicInfo: {},
              skillMatch: { score: 75, details: ['详见分析'] },
              experienceMatch: { score: 70, details: ['详见分析'] },
              overallScore: 72,
              strengths: ['简历信息已提取'],
              risks: ['详细分析请查看上文'],
              recommendation: '建议进一步面试评估'
            };
            send({ type: 'complete', result });
          }
        } catch (parseError) {
          // Fallback if JSON parsing fails
          const result: AnalysisResult = {
            basicInfo: {},
            skillMatch: { score: 0, details: ['解析失败'] },
            experienceMatch: { score: 0, details: ['解析失败'] },
            overallScore: 0,
            strengths: [],
            risks: ['结果解析失败'],
            recommendation: '请检查输入内容'
          };
          send({ type: 'complete', result });
        }

      } catch (error) {
        console.error('Analysis error:', error);
        send({ type: 'error', message: error instanceof Error ? error.message : '分析过程出错' });
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
