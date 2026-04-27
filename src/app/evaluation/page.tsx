'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { FileUploader } from '@/components/file-uploader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MessageSquare, 
  Loader2, 
  Sparkles, 
  AlertCircle,
  CheckCircle2,
  XCircle,
  Download,
  TrendingUp,
  TrendingDown,
  User,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';

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

const recommendationConfig = {
  strong_recommend: { label: '强烈推荐', color: 'bg-[#10B981]', icon: CheckCircle2 },
  recommend: { label: '推荐', color: 'bg-[#3B82F6]', icon: CheckCircle2 },
  pending: { label: '待定', color: 'bg-[#F59E0B]', icon: AlertCircle },
  not_recommend: { label: '不建议', color: 'bg-[#EF4444]', icon: XCircle },
};

export default function EvaluationPage() {
  const [inputMode, setInputMode] = useState<'file' | 'text'>('text');
  const [conversationFile, setConversationFile] = useState<File | null>(null);
  const [conversationText, setConversationText] = useState('');
  const [candidateInfo, setCandidateInfo] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [streamContent, setStreamContent] = useState('');
  const [evaluationResult, setEvaluationResult] = useState<EvaluationResult | null>(null);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');
  const streamRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (streamRef.current) {
      streamRef.current.scrollTop = streamRef.current.scrollHeight;
    }
  }, [streamContent]);

  const handleFileSelect = useCallback((file: File | null) => {
    setConversationFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        if (file.type.startsWith('text/') || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
          setConversationText(text);
        }
      };
      if (file.type.startsWith('text/') || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
        reader.readAsText(file);
      }
    }
  }, []);

  const handleEvaluate = async () => {
    if (!conversationText.trim() && !conversationFile) {
      setError('请上传面试对话记录或输入对话文本');
      return;
    }

    setIsEvaluating(true);
    setProgress('正在解析面试对话...');
    setStreamContent('');
    setError('');
    setEvaluationResult(null);

    try {
      const formData = new FormData();
      if (conversationFile) formData.append('conversationFile', conversationFile);
      if (conversationText) formData.append('conversationText', conversationText);
      if (candidateInfo) formData.append('candidateInfo', candidateInfo);

      const response = await fetch('/api/evaluate-interview', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('评估请求失败');

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
                setEvaluationResult(data.result);
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
      setError(err instanceof Error ? err.message : '评估过程中出错');
    } finally {
      setIsEvaluating(false);
    }
  };

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
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1E293B]">面试评估</h1>
        <p className="text-[#64748B] mt-1">上传面试对话记录，获取AI评估报告</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5 text-[#3B82F6]" />
                面试对话输入
              </CardTitle>
              <CardDescription>
                上传面试记录文件或直接粘贴对话内容
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs value={inputMode} onValueChange={(v) => setInputMode(v as 'file' | 'text')}>
                <TabsList className="w-full">
                  <TabsTrigger value="text" className="flex-1">文本输入</TabsTrigger>
                  <TabsTrigger value="file" className="flex-1">文件上传</TabsTrigger>
                </TabsList>

                <TabsContent value="text" className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-[#1E293B] mb-2 block">
                      面试对话内容 <span className="text-[#EF4444]">*</span>
                    </label>
                    <Textarea
                      placeholder={`请粘贴面试对话内容，格式示例：\n\n面试官：请介绍一下您最近的项目经验。\n候选人：...（回答内容）\n\n面试官：...`}
                      className="min-h-[200px]"
                      value={conversationText}
                      onChange={(e) => setConversationText(e.target.value)}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="file" className="space-y-4">
                  <FileUploader
                    label="上传面试对话记录"
                    hint="支持 PDF、Word、图片、文本格式，最大10MB"
                    selectedFile={conversationFile}
                    onFileSelect={handleFileSelect}
                  />
                </TabsContent>
              </Tabs>

              <div>
                <label className="text-sm font-medium text-[#1E293B] mb-2 block">
                  候选人基本信息（选填）
                </label>
                <Textarea
                  placeholder="可输入候选人姓名、应聘岗位、简历要点等信息，帮助评估更准确..."
                  className="min-h-[80px]"
                  value={candidateInfo}
                  onChange={(e) => setCandidateInfo(e.target.value)}
                />
              </div>

              {error && (
                <div className="p-3 bg-[#FEF2F2] text-[#EF4444] text-sm rounded-lg flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}

              <Button
                onClick={handleEvaluate}
                disabled={isEvaluating}
                className="w-full bg-[#1E3A5F] hover:bg-[#2d4a6f]"
              >
                {isEvaluating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    评估中...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    开始评估
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Streaming Output */}
          {(isEvaluating || streamContent) && !evaluationResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Loader2 className="h-4 w-4 animate-spin text-[#3B82F6]" />
                  评估分析中
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  ref={streamRef}
                  className="bg-[#F8FAFC] rounded-lg p-4 min-h-[300px] max-h-[400px] overflow-auto text-sm text-[#64748B] whitespace-pre-wrap"
                >
                  {streamContent || '等待评估开始...'}
                  {isEvaluating && <span className="animate-pulse">▊</span>}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Result Section */}
        <div className="space-y-6">
          {evaluationResult ? (
            <>
              {/* Overall Score */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-[#3B82F6]" />
                      综合评估
                    </CardTitle>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Download className="h-4 w-4" />
                      导出报告
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Overall Score Circle */}
                  <div className="flex items-center justify-center py-4">
                    <div className="text-center">
                      <div className="relative inline-flex items-center justify-center">
                        <svg className="w-40 h-40 transform -rotate-90">
                          <circle
                            cx="80"
                            cy="80"
                            r="72"
                            stroke="#E2E8F0"
                            strokeWidth="10"
                            fill="none"
                          />
                          <circle
                            cx="80"
                            cy="80"
                            r="72"
                            stroke={evaluationResult.scores.overall >= 80 ? '#10B981' : evaluationResult.scores.overall >= 60 ? '#F59E0B' : '#EF4444'}
                            strokeWidth="10"
                            fill="none"
                            strokeDasharray={`${(evaluationResult.scores.overall / 100) * 452} 452`}
                            strokeLinecap="round"
                            className="transition-all duration-1000"
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className={cn(
                            'text-5xl font-bold',
                            getScoreColor(evaluationResult.scores.overall)
                          )}>
                            {evaluationResult.scores.overall}
                          </span>
                          <span className="text-sm text-[#64748B]">综合评分</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recommendation Badge */}
                  <div className="flex justify-center">
                    <Badge className={cn(
                      'px-4 py-2 text-base',
                      recommendationConfig[evaluationResult.recommendation].color
                    )}>
                      {(() => {
                        const Icon = recommendationConfig[evaluationResult.recommendation].icon;
                        return <Icon className="h-4 w-4 mr-2 inline" />;
                      })()}
                      {recommendationConfig[evaluationResult.recommendation].label}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Dimension Scores */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">能力维度评分</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { key: 'professionalAbility', label: '专业能力' },
                    { key: 'communication', label: '沟通表达' },
                    { key: 'logicalThinking', label: '逻辑思维' },
                    { key: 'cultureFit', label: '文化适配' },
                  ].map((item) => {
                    const score = evaluationResult.scores[item.key as keyof typeof evaluationResult.scores];
                    return (
                      <div key={item.key}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-[#1E293B]">{item.label}</span>
                          <span className={cn('text-lg font-bold', getScoreColor(score))}>
                            {score}
                          </span>
                        </div>
                        <div className="w-full bg-[#E2E8F0] rounded-full h-2">
                          <div
                            className={cn('h-2 rounded-full transition-all duration-700', getScoreBg(score))}
                            style={{ width: `${score}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Strengths */}
              {evaluationResult.strengths.length > 0 && (
                <Card className="border-[#10B981]/30 bg-[#F0FDF4]">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base text-[#10B981]">
                      <TrendingUp className="h-5 w-5" />
                      候选人优势
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {evaluationResult.strengths.map((strength, idx) => (
                        <li key={idx} className="text-sm text-[#64748B] flex items-start gap-2">
                          <span className="text-[#10B981] mt-1">•</span>
                          {strength}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Weaknesses */}
              {evaluationResult.weaknesses.length > 0 && (
                <Card className="border-[#F59E0B]/30 bg-[#FFFBEB]">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base text-[#F59E0B]">
                      <TrendingDown className="h-5 w-5" />
                      待提升项
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {evaluationResult.weaknesses.map((weakness, idx) => (
                        <li key={idx} className="text-sm text-[#64748B] flex items-start gap-2">
                          <span className="text-[#F59E0B] mt-1">•</span>
                          {weakness}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Risk Warnings */}
              {evaluationResult.riskWarnings.length > 0 && (
                <Card className="border-[#EF4444]/30 bg-[#FEF2F2]">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base text-[#EF4444]">
                      <AlertCircle className="h-5 w-5" />
                      风险提示
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {evaluationResult.riskWarnings.map((risk, idx) => (
                        <li key={idx} className="text-sm text-[#64748B] flex items-start gap-2">
                          <span className="text-[#EF4444] mt-1">•</span>
                          {risk}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Detailed Feedback */}
              {evaluationResult.detailedFeedback && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <MessageSquare className="h-5 w-5 text-[#3B82F6]" />
                      详细评价
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-[#64748B] whitespace-pre-wrap">
                      {evaluationResult.detailedFeedback}
                    </p>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card className="h-full">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="w-20 h-20 rounded-full bg-[#F1F5F9] flex items-center justify-center mb-4">
                  <MessageSquare className="h-10 w-10 text-[#CBD5E1]" />
                </div>
                <p className="text-[#64748B] text-center">
                  评估报告将在此处显示
                </p>
                <p className="text-sm text-[#94A3B8] text-center mt-1">
                  请先上传面试对话记录并开始评估
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
