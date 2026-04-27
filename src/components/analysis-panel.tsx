'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileUploader } from '@/components/file-uploader';
import { 
  Sparkles, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Download
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface StreamResultProps {
  result: {
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
  };
}

export function StreamResult({ result }: StreamResultProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-[#10B981]';
    if (score >= 60) return 'text-[#F59E0B]';
    return 'text-[#EF4444]';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-[#10B981]';
    if (score >= 60) return 'bg-[#F59E0B]';
    return 'bg-[#EF4444]';
  };

  return (
    <div className="space-y-6">
      {/* 总体评分 */}
      {result.overallScore !== undefined && (
        <div className="flex items-center justify-center">
          <div className="text-center">
            <div className="relative inline-flex items-center justify-center">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="#E2E8F0"
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke={result.overallScore >= 80 ? '#10B981' : result.overallScore >= 60 ? '#F59E0B' : '#EF4444'}
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${(result.overallScore / 100) * 352} 352`}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={cn(
                  'text-4xl font-bold',
                  getScoreColor(result.overallScore)
                )}>
                  {result.overallScore}
                </span>
              </div>
            </div>
            <p className="text-sm text-[#64748B] mt-2">综合匹配度</p>
          </div>
        </div>
      )}

      {/* 基础信息 */}
      {result.basicInfo && (
        <div className="bg-[#F8FAFC] rounded-xl p-4">
          <h3 className="text-sm font-semibold text-[#1E293B] mb-3">候选人基本信息</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {result.basicInfo.name && (
              <div>
                <span className="text-[#64748B]">姓名：</span>
                <span className="text-[#1E293B]">{result.basicInfo.name}</span>
              </div>
            )}
            {result.basicInfo.education && (
              <div>
                <span className="text-[#64748B]">学历：</span>
                <span className="text-[#1E293B]">{result.basicInfo.education}</span>
              </div>
            )}
            {result.basicInfo.experience && (
              <div>
                <span className="text-[#64748B]">工作年限：</span>
                <span className="text-[#1E293B]">{result.basicInfo.experience}</span>
              </div>
            )}
            {result.basicInfo.currentPosition && (
              <div>
                <span className="text-[#64748B]">现职位：</span>
                <span className="text-[#1E293B]">{result.basicInfo.currentPosition}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 匹配度分析 */}
      <div className="grid grid-cols-2 gap-4">
        {result.skillMatch && (
          <div className="bg-white border rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-[#1E293B]">技能匹配度</span>
              <span className={cn('text-2xl font-bold', getScoreColor(result.skillMatch.score))}>
                {result.skillMatch.score}
              </span>
            </div>
            <div className="w-full bg-[#E2E8F0] rounded-full h-2">
              <div
                className={cn('h-2 rounded-full transition-all duration-1000', getScoreBg(result.skillMatch.score))}
                style={{ width: `${result.skillMatch.score}%` }}
              />
            </div>
          </div>
        )}
        {result.experienceMatch && (
          <div className="bg-white border rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-[#1E293B]">经验匹配度</span>
              <span className={cn('text-2xl font-bold', getScoreColor(result.experienceMatch.score))}>
                {result.experienceMatch.score}
              </span>
            </div>
            <div className="w-full bg-[#E2E8F0] rounded-full h-2">
              <div
                className={cn('h-2 rounded-full transition-all duration-1000', getScoreBg(result.experienceMatch.score))}
                style={{ width: `${result.experienceMatch.score}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* 优势 */}
      {result.strengths && result.strengths.length > 0 && (
        <div className="bg-[#F0FDF4] border border-[#10B981]/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="h-5 w-5 text-[#10B981]" />
            <h3 className="text-sm font-semibold text-[#1E293B]">候选人优势</h3>
          </div>
          <ul className="space-y-2">
            {result.strengths.map((strength, idx) => (
              <li key={idx} className="text-sm text-[#64748B] flex items-start gap-2">
                <span className="text-[#10B981] mt-1">•</span>
                {strength}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 风险点 */}
      {result.risks && result.risks.length > 0 && (
        <div className="bg-[#FEF2F2] border border-[#EF4444]/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="h-5 w-5 text-[#EF4444]" />
            <h3 className="text-sm font-semibold text-[#1E293B]">需关注风险点</h3>
          </div>
          <ul className="space-y-2">
            {result.risks.map((risk, idx) => (
              <li key={idx} className="text-sm text-[#64748B] flex items-start gap-2">
                <span className="text-[#EF4444] mt-1">•</span>
                {risk}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 建议 */}
      {result.recommendation && (
        <div className="bg-[#EFF6FF] border border-[#3B82F6]/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-5 w-5 text-[#3B82F6]" />
            <h3 className="text-sm font-semibold text-[#1E293B]">录用建议</h3>
          </div>
          <p className="text-sm text-[#64748B]">{result.recommendation}</p>
        </div>
      )}
    </div>
  );
}

interface AnalysisPanelProps {
  jdFile: File | null;
  resumeFile: File | null;
  jdText: string;
  resumeText: string;
  onAnalysisComplete: (result: any) => void;
}

export function AnalysisPanel({
  jdFile,
  resumeFile,
  jdText,
  resumeText,
  onAnalysisComplete,
}: AnalysisPanelProps) {
  const [activeTab, setActiveTab] = useState<'file' | 'text'>('file');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState('');
  const [streamContent, setStreamContent] = useState('');
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [error, setError] = useState('');
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [streamContent]);

  const handleAnalyze = async () => {
    if (!jdFile && !jdText.trim()) {
      setError('请先上传岗位JD或输入JD文本');
      return;
    }
    if (!resumeFile && !resumeText.trim()) {
      setError('请先上传简历或输入简历文本');
      return;
    }

    setIsAnalyzing(true);
    setProgress('正在解析文件...');
    setStreamContent('');
    setError('');
    setAnalysisResult(null);

    try {
      const formData = new FormData();
      
      if (jdFile) formData.append('jdFile', jdFile);
      if (resumeFile) formData.append('resumeFile', resumeFile);
      if (jdText) formData.append('jdText', jdText);
      if (resumeText) formData.append('resumeText', resumeText);

      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('分析请求失败');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('无法读取响应流');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'progress') {
                setProgress(data.message);
              } else if (data.type === 'chunk') {
                setStreamContent(prev => prev + data.content);
              } else if (data.type === 'complete') {
                setAnalysisResult(data.result);
                onAnalysisComplete(data.result);
              } else if (data.type === 'error') {
                setError(data.message);
              }
            } catch (e) {
              // Ignore parse errors for incomplete JSON
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '分析过程中出错');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 输入区域 */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-lg font-semibold text-[#1E293B] mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-[#3B82F6]" />
          简历分析
        </h2>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'file' | 'text')}>
          <TabsList className="mb-4">
            <TabsTrigger value="file">文件上传</TabsTrigger>
            <TabsTrigger value="text">文本输入</TabsTrigger>
          </TabsList>

          <TabsContent value="file" className="space-y-4">
            <div>
              <label className="text-sm font-medium text-[#1E293B] mb-2 block">
                岗位JD
              </label>
              <FileUploader
                label="上传岗位JD"
                hint="支持 PDF、Word、图片、文本格式，最大10MB"
                selectedFile={jdFile}
                onFileSelect={() => {}}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-[#1E293B] mb-2 block">
                简历
              </label>
              <FileUploader
                label="上传简历"
                hint="支持 PDF、Word、图片、文本格式，最大10MB"
                selectedFile={resumeFile}
                onFileSelect={() => {}}
              />
            </div>
          </TabsContent>

          <TabsContent value="text" className="space-y-4">
            <div>
              <label className="text-sm font-medium text-[#1E293B] mb-2 block">
                岗位JD文本
              </label>
              <Textarea
                placeholder="请粘贴岗位JD内容..."
                className="min-h-[150px]"
                value={jdText}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-[#1E293B] mb-2 block">
                简历文本
              </label>
              <Textarea
                placeholder="请粘贴简历内容..."
                className="min-h-[150px]"
                value={resumeText}
              />
            </div>
          </TabsContent>
        </Tabs>

        {error && (
          <div className="mt-4 p-3 bg-[#FEF2F2] text-[#EF4444] text-sm rounded-lg flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        <Button
          onClick={handleAnalyze}
          disabled={isAnalyzing}
          className="w-full mt-4 bg-[#1E3A5F] hover:bg-[#2d4a6f]"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              分析中...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              开始分析
            </>
          )}
        </Button>

        {isAnalyzing && progress && (
          <div className="mt-4 text-sm text-[#64748B] text-center">
            {progress}
          </div>
        )}
      </div>

      {/* 流式输出 */}
      {(isAnalyzing || streamContent) && !analysisResult && (
        <div className="bg-white rounded-xl border p-6">
          <h3 className="text-sm font-medium text-[#1E293B] mb-3">分析进度</h3>
          <div
            ref={contentRef}
            className="bg-[#F8FAFC] rounded-lg p-4 min-h-[200px] max-h-[400px] overflow-auto text-sm text-[#64748B] whitespace-pre-wrap font-mono"
          >
            {streamContent || '等待分析开始...'}
            {isAnalyzing && <span className="animate-pulse">▊</span>}
          </div>
        </div>
      )}

      {/* 分析结果 */}
      {analysisResult && (
        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[#1E293B]">分析结果</h3>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              导出报告
            </Button>
          </div>
          <StreamResult result={analysisResult} />
        </div>
      )}
    </div>
  );
}
