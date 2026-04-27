'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { FileUploader } from '@/components/file-uploader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Sparkles, 
  Loader2, 
  AlertCircle,
  Lightbulb,
  Trash2,
  Plus,
  ChevronRight,
  CheckCircle2,
  Edit3,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

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

const priorityConfig = {
  high: { label: '高优先级', color: 'bg-[#EF4444]', textColor: 'text-[#EF4444]' },
  medium: { label: '中优先级', color: 'bg-[#F59E0B]', textColor: 'text-[#F59E0B]' },
  low: { label: '低优先级', color: 'bg-[#10B981]', textColor: 'text-[#10B981]' },
};

const typeConfig = {
  add: { label: '新增', icon: Plus, color: 'text-[#10B981]', bgColor: 'bg-[#F0FDF4]' },
  modify: { label: '修改', icon: Edit3, color: 'text-[#3B82F6]', bgColor: 'bg-[#EFF6FF]' },
  remove: { label: '删除', icon: Trash2, color: 'text-[#EF4444]', bgColor: 'bg-[#FEF2F2]' },
  improve: { label: '优化', icon: Lightbulb, color: 'text-[#F59E0B]', bgColor: 'bg-[#FFFBEB]' },
};

export default function OptimizationPage() {
  const [inputMode, setInputMode] = useState<'file' | 'text'>('text');
  const [historyFiles, setHistoryFiles] = useState<File[]>([]);
  const [historyText, setHistoryText] = useState('');
  const [jdText, setJdText] = useState('');
  const [currentQuestions, setCurrentQuestions] = useState('');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [streamContent, setStreamContent] = useState('');
  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([]);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'add' | 'modify' | 'remove' | 'improve'>('all');
  const streamRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (streamRef.current) {
      streamRef.current.scrollTop = streamRef.current.scrollHeight;
    }
  }, [streamContent]);

  const handleFileSelect = useCallback((file: File | null) => {
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        if (file.type.startsWith('text/') || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
          setHistoryText(prev => prev + '\n\n--- 新文件内容 ---\n' + text);
        }
      };
      if (file.type.startsWith('text/') || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
        reader.readAsText(file);
      }
      setHistoryFiles(prev => [...prev, file]);
    }
  }, []);

  const handleOptimize = async () => {
    if (!historyText.trim() && historyFiles.length === 0) {
      setError('请上传历史面试记录或输入面试历史');
      return;
    }
    if (!jdText.trim()) {
      setError('请输入或粘贴岗位JD');
      return;
    }

    setIsOptimizing(true);
    setProgress('正在解析历史面试数据...');
    setStreamContent('');
    setError('');
    setSuggestions([]);

    try {
      const formData = new FormData();
      if (historyText) formData.append('historyText', historyText);
      if (jdText) formData.append('jdText', jdText);
      if (currentQuestions) formData.append('currentQuestions', currentQuestions);
      historyFiles.forEach(file => formData.append('historyFiles', file));

      const response = await fetch('/api/optimize-questions', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('优化请求失败');

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
                setSuggestions(data.suggestions || []);
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
      setError(err instanceof Error ? err.message : '优化过程中出错');
    } finally {
      setIsOptimizing(false);
    }
  };

  const filteredSuggestions = activeTab === 'all' 
    ? suggestions 
    : suggestions.filter(s => s.type === activeTab);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1E293B]">题库优化</h1>
        <p className="text-[#64748B] mt-1">基于历史面试数据分析，优化面试题库结构</p>
      </div>

      {/* Input Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="h-5 w-5 text-[#3B82F6]" />
                输入信息
              </CardTitle>
              <CardDescription>
                提供历史面试记录和岗位信息用于分析
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* JD Input */}
              <div>
                <label className="text-sm font-medium text-[#1E293B] mb-2 block">
                  岗位JD <span className="text-[#EF4444]">*</span>
                </label>
                <Textarea
                  placeholder="请粘贴岗位JD内容..."
                  className="min-h-[120px]"
                  value={jdText}
                  onChange={(e) => setJdText(e.target.value)}
                />
              </div>

              {/* Current Questions (Optional) */}
              <div>
                <label className="text-sm font-medium text-[#1E293B] mb-2 block">
                  现有面试题库（选填）
                </label>
                <Textarea
                  placeholder="如有关于现有面试题库的内容，可粘贴在此..."
                  className="min-h-[80px]"
                  value={currentQuestions}
                  onChange={(e) => setCurrentQuestions(e.target.value)}
                />
              </div>

              {/* History Input */}
              <Tabs value={inputMode} onValueChange={(v) => setInputMode(v as 'file' | 'text')}>
                <TabsList className="w-full">
                  <TabsTrigger value="text" className="flex-1">文本输入</TabsTrigger>
                  <TabsTrigger value="file" className="flex-1">文件上传</TabsTrigger>
                </TabsList>

                <TabsContent value="text" className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-[#1E293B] mb-2 block">
                      历史面试记录 <span className="text-[#EF4444]">*</span>
                    </label>
                    <Textarea
                      placeholder={`请粘贴历史面试记录，可以是：\n1. 面试对话记录\n2. 候选人反馈总结\n3. 面试评估报告\n\n多份记录用分隔线隔开...`}
                      className="min-h-[150px]"
                      value={historyText}
                      onChange={(e) => setHistoryText(e.target.value)}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="file" className="space-y-4">
                  <FileUploader
                    label="上传历史面试文件"
                    hint="支持多个文件，可多次上传"
                    onFileSelect={handleFileSelect}
                  />
                  {historyFiles.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-sm font-medium text-[#64748B]">
                        已上传文件：
                      </span>
                      {historyFiles.map((file, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm text-[#64748B]">
                          <CheckCircle2 className="h-4 w-4 text-[#10B981]" />
                          {file.name}
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              {error && (
                <div className="p-3 bg-[#FEF2F2] text-[#EF4444] text-sm rounded-lg flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}

              <Button
                onClick={handleOptimize}
                disabled={isOptimizing}
                className="w-full bg-[#1E3A5F] hover:bg-[#2d4a6f]"
              >
                {isOptimizing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    分析优化中...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    开始优化分析
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Streaming Output */}
          {(isOptimizing || streamContent) && suggestions.length === 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Loader2 className="h-4 w-4 animate-spin text-[#3B82F6]" />
                  智能分析中
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  ref={streamRef}
                  className="bg-[#F8FAFC] rounded-lg p-4 min-h-[300px] max-h-[400px] overflow-auto text-sm text-[#64748B] whitespace-pre-wrap"
                >
                  {streamContent || '正在分析历史面试数据，识别题库优化点...'}
                  {isOptimizing && <span className="animate-pulse">▊</span>}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Results */}
        <div className="space-y-6">
          {suggestions.length > 0 ? (
            <>
              {/* Summary */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Lightbulb className="h-5 w-5 text-[#F59E0B]" />
                      优化建议汇总
                    </CardTitle>
                    <Badge className="bg-[#3B82F6]">
                      {suggestions.length} 条建议
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div className="p-3 bg-[#F0FDF4] rounded-lg">
                      <div className="text-2xl font-bold text-[#10B981]">
                        {suggestions.filter(s => s.type === 'add').length}
                      </div>
                      <div className="text-xs text-[#64748B]">新增建议</div>
                    </div>
                    <div className="p-3 bg-[#EFF6FF] rounded-lg">
                      <div className="text-2xl font-bold text-[#3B82F6]">
                        {suggestions.filter(s => s.type === 'modify').length}
                      </div>
                      <div className="text-xs text-[#64748B]">修改建议</div>
                    </div>
                    <div className="p-3 bg-[#FEF2F2] rounded-lg">
                      <div className="text-2xl font-bold text-[#EF4444]">
                        {suggestions.filter(s => s.type === 'remove').length}
                      </div>
                      <div className="text-xs text-[#64748B]">删除建议</div>
                    </div>
                    <div className="p-3 bg-[#FFFBEB] rounded-lg">
                      <div className="text-2xl font-bold text-[#F59E0B]">
                        {suggestions.filter(s => s.type === 'improve').length}
                      </div>
                      <div className="text-xs text-[#64748B]">优化建议</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Filter Tabs */}
              <div className="flex gap-2 flex-wrap">
                {(['all', 'add', 'modify', 'remove', 'improve'] as const).map((tab) => (
                  <Button
                    key={tab}
                    variant={activeTab === tab ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      activeTab === tab && 'bg-[#1E3A5F] hover:bg-[#2d4a6f]'
                    )}
                  >
                    {tab === 'all' ? '全部' : typeConfig[tab].label}
                    {tab !== 'all' && (
                      <span className="ml-1 text-xs opacity-70">
                        ({suggestions.filter(s => s.type === tab).length})
                      </span>
                    )}
                  </Button>
                ))}
              </div>

              {/* Suggestions List */}
              <div className="space-y-4">
                {filteredSuggestions.map((suggestion, idx) => {
                  const TypeIcon = typeConfig[suggestion.type].icon;
                  return (
                    <Card key={idx} className={cn(
                      'border-l-4',
                      suggestion.type === 'add' && 'border-l-[#10B981]',
                      suggestion.type === 'modify' && 'border-l-[#3B82F6]',
                      suggestion.type === 'remove' && 'border-l-[#EF4444]',
                      suggestion.type === 'improve' && 'border-l-[#F59E0B]',
                    )}>
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-2">
                            <div className={cn(
                              'p-2 rounded-lg',
                              typeConfig[suggestion.type].bgColor
                            )}>
                              <TypeIcon className={cn(
                                'h-4 w-4',
                                typeConfig[suggestion.type].color
                              )} />
                            </div>
                            <div>
                              <CardTitle className="text-base">
                                {suggestion.title}
                              </CardTitle>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge className={typeConfig[suggestion.type].color + ' bg-opacity-10 text-opacity-100 ' + typeConfig[suggestion.type].color.replace('text-', 'bg-')}>
                                  {typeConfig[suggestion.type].label}
                                </Badge>
                                <Badge className={cn(
                                  priorityConfig[suggestion.priority].color,
                                  'text-white'
                                )}>
                                  {priorityConfig[suggestion.priority].label}
                                </Badge>
                                {suggestion.category && (
                                  <span className="text-xs text-[#64748B] capitalize">
                                    {suggestion.category === 'initial' ? '初试' : 
                                     suggestion.category === 'second' ? '复试' : '终面'}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-[#64748B] mb-3">
                          {suggestion.description}
                        </p>
                        
                        {suggestion.originalQuestion && (
                          <div className="bg-[#FEF2F2] rounded-lg p-3 mb-3">
                            <span className="text-xs font-medium text-[#EF4444] block mb-1">原题目</span>
                            <p className="text-sm text-[#64748B]">{suggestion.originalQuestion}</p>
                          </div>
                        )}
                        
                        {suggestion.newQuestion && (
                          <div className="bg-[#F0FDF4] rounded-lg p-3">
                            <span className="text-xs font-medium text-[#10B981] block mb-1">优化后</span>
                            <p className="text-sm text-[#64748B]">{suggestion.newQuestion}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          ) : (
            <Card className="h-full">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="w-20 h-20 rounded-full bg-[#F1F5F9] flex items-center justify-center mb-4">
                  <Lightbulb className="h-10 w-10 text-[#CBD5E1]" />
                </div>
                <p className="text-[#64748B] text-center">
                  优化建议将在此处显示
                </p>
                <p className="text-sm text-[#94A3B8] text-center mt-1">
                  请先输入历史面试记录和岗位信息
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
