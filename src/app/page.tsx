'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { FileUploader } from '@/components/file-uploader';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  ArrowRight,
  User,
  Briefcase,
  FileText,
  MessageSquare,
  Download,
  Copy,
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Question {
  id: string;
  category: 'initial' | 'second' | 'final';
  dimension: 'professional' | 'general' | 'business' | 'culture';
  question: string;
  keyPoints: string[];
  excellentStandard: string;
  scoringCriteria?: {
    excellent: string;
    good: string;
    fair: string;
    poor: string;
  };
}

interface AnalysisResult {
  basicInfo?: {
    name?: string;
    education?: string;
    experience?: string;
    currentPosition?: string;
  };
  skillMatch?: { score: number; details: string[] };
  experienceMatch?: { score: number; details: string[] };
  overallScore?: number;
  strengths?: string[];
  risks?: string[];
  recommendation?: string;
}

export default function HomePage() {
  // State management
  const [jdFile, setJdFile] = useState<File | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [jdText, setJdText] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [inputMode, setInputMode] = useState<'file' | 'text'>('text');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [progress, setProgress] = useState('');
  const [streamContent, setStreamContent] = useState('');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [generatedQuestions, setGeneratedQuestions] = useState<Question[]>([]);
  const [questionStream, setQuestionStream] = useState('');
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  const streamRef = useRef<HTMLDivElement>(null);
  const questionStreamRef = useRef<HTMLDivElement>(null);

  // Auto-scroll effect
  useEffect(() => {
    if (streamRef.current) {
      streamRef.current.scrollTop = streamRef.current.scrollHeight;
    }
  }, [streamContent]);

  useEffect(() => {
    if (questionStreamRef.current) {
      questionStreamRef.current.scrollTop = questionStreamRef.current.scrollHeight;
    }
  }, [questionStream]);

  // Copy to clipboard
  const copyToClipboard = useCallback((text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  // Handle JD file selection
  const handleJdFileSelect = useCallback((file: File | null) => {
    setJdFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        if (file.type.startsWith('text/') || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
          setJdText(text);
        }
      };
      if (file.type.startsWith('text/') || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
        reader.readAsText(file);
      }
    }
  }, []);

  // Handle Resume file selection
  const handleResumeFileSelect = useCallback((file: File | null) => {
    setResumeFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        if (file.type.startsWith('text/') || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
          setResumeText(text);
        }
      };
      if (file.type.startsWith('text/') || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
        reader.readAsText(file);
      }
    }
  }, []);

  // Analyze Resume
  const handleAnalyze = async () => {
    if (!jdText.trim() && !jdFile) {
      setError('请先上传岗位JD或输入JD文本');
      return;
    }
    if (!resumeText.trim() && !resumeFile) {
      setError('请先上传简历或输入简历文本');
      return;
    }

    setIsAnalyzing(true);
    setProgress('正在解析文件...');
    setStreamContent('');
    setError('');
    setAnalysisResult(null);
    setGeneratedQuestions([]);
    setQuestionStream('');

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
              } else if (data.type === 'error') {
                setError(data.message);
              }
            } catch (e) {
              // Ignore parse errors
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

  // Generate Questions
  const handleGenerateQuestions = async () => {
    const jdContent = jdText || (jdFile ? '[已上传文件]' : '');
    if (!jdContent.trim() && !jdFile) {
      setError('请先提供岗位JD');
      return;
    }

    setIsGeneratingQuestions(true);
    setQuestionStream('');
    setError('');

    try {
      const formData = new FormData();
      if (jdFile) formData.append('jdFile', jdFile);
      if (jdText) formData.append('jdText', jdText);
      if (resumeText) formData.append('resumeText', resumeText);
      if (analysisResult) formData.append('candidateProfile', JSON.stringify(analysisResult));

      const response = await fetch('/api/generate-questions', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('生成请求失败');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('无法读取响应流');

      const decoder = new TextDecoder();
      let buffer = '';
      let fullContent = '';

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
              if (data.type === 'chunk') {
                fullContent += data.content;
                setQuestionStream(fullContent);
              } else if (data.type === 'complete') {
                setGeneratedQuestions(data.questions || []);
              } else if (data.type === 'error') {
                setError(data.message);
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成过程中出错');
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  // Get score color
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

  // Category labels
  const categoryLabels: Record<string, { label: string; color: string }> = {
    initial: { label: '初试', color: 'bg-[#3B82F6]' },
    second: { label: '复试', color: 'bg-[#8B5CF6]' },
    final: { label: '终面', color: 'bg-[#EC4899]' },
  };

  const dimensionLabels: Record<string, { label: string; color: string }> = {
    professional: { label: '专业能力', color: 'bg-[#10B981]' },
    general: { label: '通用能力', color: 'bg-[#3B82F6]' },
    business: { label: '业务理解', color: 'bg-[#F59E0B]' },
    culture: { label: '文化适配', color: 'bg-[#8B5CF6]' },
  };

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1E3A5F] to-[#2d4a6f] p-8 text-white">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-3">智能面试分析系统</h1>
          <p className="text-white/80 max-w-2xl">
            基于AI技术的专业面试管理系统，一站式完成简历分析、面试题库生成、面试评估与优化建议
          </p>
        </div>
        <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute right-20 bottom-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2" />
      </div>

      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#3B82F6]" />
            输入信息
          </CardTitle>
          <CardDescription>
            上传或输入岗位JD和候选人简历
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs value={inputMode} onValueChange={(v) => setInputMode(v as 'file' | 'text')}>
            <TabsList>
              <TabsTrigger value="text">文本输入</TabsTrigger>
              <TabsTrigger value="file">文件上传</TabsTrigger>
            </TabsList>

            <TabsContent value="text" className="space-y-4">
              <div>
                <label className="text-sm font-medium text-[#1E293B] mb-2 block">
                  岗位JD <span className="text-[#EF4444]">*</span>
                </label>
                <Textarea
                  placeholder="请粘贴岗位描述（Job Description）内容，包括岗位职责、任职要求等..."
                  className="min-h-[150px]"
                  value={jdText}
                  onChange={(e) => setJdText(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-[#1E293B] mb-2 block">
                  简历内容 <span className="text-[#EF4444]">*</span>
                </label>
                <Textarea
                  placeholder="请粘贴候选人简历内容..."
                  className="min-h-[150px]"
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                />
              </div>
            </TabsContent>

            <TabsContent value="file" className="space-y-4">
              <div>
                <label className="text-sm font-medium text-[#1E293B] mb-2 block">
                  岗位JD文件
                </label>
                <FileUploader
                  label="上传岗位JD"
                  hint="支持 PDF、Word、图片、文本格式，最大10MB"
                  selectedFile={jdFile}
                  onFileSelect={handleJdFileSelect}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-[#1E293B] mb-2 block">
                  简历文件
                </label>
                <FileUploader
                  label="上传简历"
                  hint="支持 PDF、Word、图片、文本格式，最大10MB"
                  selectedFile={resumeFile}
                  onFileSelect={handleResumeFileSelect}
                />
              </div>
            </TabsContent>
          </Tabs>

          {error && (
            <div className="p-3 bg-[#FEF2F2] text-[#EF4444] text-sm rounded-lg flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing || isGeneratingQuestions}
              className="flex-1 bg-[#1E3A5F] hover:bg-[#2d4a6f]"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  分析中...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  分析简历
                </>
              )}
            </Button>
            <Button
              onClick={handleGenerateQuestions}
              disabled={isAnalyzing || isGeneratingQuestions}
              className="flex-1 bg-[#3B82F6] hover:bg-[#2563EB]"
            >
              {isGeneratingQuestions ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  生成中...
                </>
              ) : (
                <>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  生成面试题库
                </>
              )}
            </Button>
          </div>

          {(isAnalyzing || isGeneratingQuestions) && progress && (
            <div className="text-sm text-[#64748B] text-center animate-pulse">
              {progress}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analysis Stream Output */}
      {(isAnalyzing || streamContent) && !analysisResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Loader2 className="h-4 w-4 animate-spin text-[#3B82F6]" />
              分析进度
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              ref={streamRef}
              className="bg-[#F8FAFC] rounded-lg p-4 min-h-[200px] max-h-[300px] overflow-auto text-sm text-[#64748B] whitespace-pre-wrap font-mono"
            >
              {streamContent || '等待分析开始...'}
              {isAnalyzing && <span className="animate-pulse">▊</span>}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Question Stream Output */}
      {(isGeneratingQuestions || questionStream) && generatedQuestions.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Loader2 className="h-4 w-4 animate-spin text-[#3B82F6]" />
              面试题库生成中
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              ref={questionStreamRef}
              className="bg-[#F8FAFC] rounded-lg p-4 min-h-[200px] max-h-[400px] overflow-auto text-sm text-[#64748B] whitespace-pre-wrap"
            >
              {questionStream || '等待生成开始...'}
              {isGeneratingQuestions && <span className="animate-pulse">▊</span>}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analysis Result */}
      {analysisResult && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-[#3B82F6]" />
                简历分析结果
              </CardTitle>
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="h-4 w-4" />
                导出
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Overall Score */}
            {analysisResult.overallScore !== undefined && (
              <div className="flex items-center justify-center py-4">
                <div className="text-center">
                  <div className="relative inline-flex items-center justify-center">
                    <svg className="w-36 h-36 transform -rotate-90">
                      <circle
                        cx="72"
                        cy="72"
                        r="64"
                        stroke="#E2E8F0"
                        strokeWidth="8"
                        fill="none"
                      />
                      <circle
                        cx="72"
                        cy="72"
                        r="64"
                        stroke={analysisResult.overallScore >= 80 ? '#10B981' : analysisResult.overallScore >= 60 ? '#F59E0B' : '#EF4444'}
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray={`${(analysisResult.overallScore / 100) * 402} 402`}
                        strokeLinecap="round"
                        className="transition-all duration-1000"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className={cn(
                        'text-5xl font-bold',
                        getScoreColor(analysisResult.overallScore)
                      )}>
                        {analysisResult.overallScore}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-[#64748B] mt-2">综合匹配度</p>
                </div>
              </div>
            )}

            {/* Basic Info */}
            {analysisResult.basicInfo && (
              <div className="bg-[#F8FAFC] rounded-xl p-4">
                <h3 className="text-sm font-semibold text-[#1E293B] mb-3 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  候选人基本信息
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  {analysisResult.basicInfo.name && (
                    <div className="bg-white rounded-lg p-3">
                      <span className="text-[#64748B] block text-xs">姓名</span>
                      <span className="text-[#1E293B] font-medium">{analysisResult.basicInfo.name}</span>
                    </div>
                  )}
                  {analysisResult.basicInfo.education && (
                    <div className="bg-white rounded-lg p-3">
                      <span className="text-[#64748B] block text-xs">学历</span>
                      <span className="text-[#1E293B] font-medium">{analysisResult.basicInfo.education}</span>
                    </div>
                  )}
                  {analysisResult.basicInfo.experience && (
                    <div className="bg-white rounded-lg p-3">
                      <span className="text-[#64748B] block text-xs">工作年限</span>
                      <span className="text-[#1E293B] font-medium">{analysisResult.basicInfo.experience}</span>
                    </div>
                  )}
                  {analysisResult.basicInfo.currentPosition && (
                    <div className="bg-white rounded-lg p-3">
                      <span className="text-[#64748B] block text-xs">现职位</span>
                      <span className="text-[#1E293B] font-medium">{analysisResult.basicInfo.currentPosition}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Match Scores */}
            <div className="grid grid-cols-2 gap-4">
              {analysisResult.skillMatch && (
                <div className="bg-white border rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-[#1E293B]">技能匹配度</span>
                    <span className={cn('text-2xl font-bold', getScoreColor(analysisResult.skillMatch.score))}>
                      {analysisResult.skillMatch.score}
                    </span>
                  </div>
                  <div className="w-full bg-[#E2E8F0] rounded-full h-2">
                    <div
                      className={cn('h-2 rounded-full transition-all duration-1000', getScoreBg(analysisResult.skillMatch.score))}
                      style={{ width: `${analysisResult.skillMatch.score}%` }}
                    />
                  </div>
                </div>
              )}
              {analysisResult.experienceMatch && (
                <div className="bg-white border rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-[#1E293B]">经验匹配度</span>
                    <span className={cn('text-2xl font-bold', getScoreColor(analysisResult.experienceMatch.score))}>
                      {analysisResult.experienceMatch.score}
                    </span>
                  </div>
                  <div className="w-full bg-[#E2E8F0] rounded-full h-2">
                    <div
                      className={cn('h-2 rounded-full transition-all duration-1000', getScoreBg(analysisResult.experienceMatch.score))}
                      style={{ width: `${analysisResult.experienceMatch.score}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Strengths */}
            {analysisResult.strengths && analysisResult.strengths.length > 0 && (
              <div className="bg-[#F0FDF4] border border-[#10B981]/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="h-5 w-5 text-[#10B981]" />
                  <h3 className="text-sm font-semibold text-[#1E293B]">候选人优势</h3>
                </div>
                <ul className="space-y-2">
                  {analysisResult.strengths.map((strength, idx) => (
                    <li key={idx} className="text-sm text-[#64748B] flex items-start gap-2">
                      <span className="text-[#10B981] mt-1">•</span>
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Risks */}
            {analysisResult.risks && analysisResult.risks.length > 0 && (
              <div className="bg-[#FEF2F2] border border-[#EF4444]/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="h-5 w-5 text-[#EF4444]" />
                  <h3 className="text-sm font-semibold text-[#1E293B]">需关注风险点</h3>
                </div>
                <ul className="space-y-2">
                  {analysisResult.risks.map((risk, idx) => (
                    <li key={idx} className="text-sm text-[#64748B] flex items-start gap-2">
                      <span className="text-[#EF4444] mt-1">•</span>
                      {risk}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendation */}
            {analysisResult.recommendation && (
              <div className="bg-[#EFF6FF] border border-[#3B82F6]/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-5 w-5 text-[#3B82F6]" />
                  <h3 className="text-sm font-semibold text-[#1E293B]">录用建议</h3>
                </div>
                <p className="text-sm text-[#64748B]">{analysisResult.recommendation}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Generated Questions */}
      {generatedQuestions.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-[#3B82F6]" />
                结构化面试题库
              </CardTitle>
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="h-4 w-4" />
                导出全部
              </Button>
            </div>
            <CardDescription>
              基于JD和候选人画像生成的结构化面试题库
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {generatedQuestions.map((q, idx) => (
              <div key={q.id || idx} className="border rounded-xl p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={categoryLabels[q.category]?.color || 'bg-gray-500'}>
                      {categoryLabels[q.category]?.label || q.category}
                    </Badge>
                    <Badge className={dimensionLabels[q.dimension]?.color || 'bg-gray-500'}>
                      {dimensionLabels[q.dimension]?.label || q.dimension}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(q.question, q.id || String(idx))}
                    className="text-[#64748B]"
                  >
                    {copiedId === (q.id || String(idx)) ? (
                      <Check className="h-4 w-4 text-[#10B981]" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-[#1E293B] font-medium mb-3">{q.question}</p>
                {q.keyPoints && q.keyPoints.length > 0 && (
                  <div className="mb-3">
                    <span className="text-xs font-medium text-[#64748B] block mb-1">考察要点</span>
                    <div className="flex flex-wrap gap-1">
                      {q.keyPoints.map((point, i) => (
                        <span key={i} className="text-xs bg-[#F1F5F9] text-[#64748B] px-2 py-1 rounded">
                          {point}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="bg-[#F8FAFC] rounded-lg p-3">
                  <span className="text-xs font-medium text-[#64748B] block mb-1">优秀答案标准</span>
                  <p className="text-sm text-[#64748B]">{q.excellentStandard}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
