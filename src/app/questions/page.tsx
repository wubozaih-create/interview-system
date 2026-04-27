'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Filter, 
  Download, 
  Copy, 
  Check,
  MessageSquare,
  Plus,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Sample questions data
const sampleQuestions = [
  // 初试 - 专业能力
  {
    id: 'q1',
    category: 'initial',
    dimension: 'professional',
    question: '请介绍一下您最近项目中负责的核心模块，以及遇到的最大技术挑战是什么？',
    keyPoints: ['项目经验真实性', '技术深度', '问题解决能力'],
    excellentStandard: '能够清晰描述项目背景、个人角色、具体贡献，并针对技术挑战给出合理的解决方案和反思总结。',
    scoringCriteria: {
      excellent: '描述清晰具体，技术深度足够，解决方案有创新性',
      good: '描述清楚，方案合理，有一定技术深度',
      fair: '描述模糊，方案常规，技术深度不足',
      poor: '无法描述项目或方案明显不合理'
    }
  },
  {
    id: 'q2',
    category: 'initial',
    dimension: 'professional',
    question: '在您的技术栈中，对于XXX技术（岗位要求的核心技能），您有哪些实践经验？请举例说明。',
    keyPoints: ['技能匹配度', '实践深度', '学习能力'],
    excellentStandard: '能够详细描述使用该技术的场景、遇到的问题及解决方案，体现深入理解。',
    scoringCriteria: {
      excellent: '实践经验丰富，能举出多个案例，理解深入',
      good: '有实践经验，能描述基本使用场景',
      fair: '了解基本概念，但缺乏实践经验',
      poor: '不了解该技术'
    }
  },
  // 初试 - 通用能力
  {
    id: 'q3',
    category: 'initial',
    dimension: 'general',
    question: '请描述一次您需要在紧迫的deadline下完成任务的经历，您是如何应对的？',
    keyPoints: ['时间管理', '压力应对', '优先级判断'],
    excellentStandard: '能够描述具体情境，说明如何分析任务、制定计划、调整优先级，并最终达成目标。',
    scoringCriteria: {
      excellent: '案例具体，方法科学，结果良好',
      good: '有应对方法，结果尚可',
      fair: '方法常规，缺乏系统性',
      poor: '无法描述或结果较差'
    }
  },
  {
    id: 'q4',
    category: 'initial',
    dimension: 'general',
    question: '当您与团队成员在技术方案上有分歧时，您通常如何处理？',
    keyPoints: ['沟通能力', '协作意识', '冲突处理'],
    excellentStandard: '能够平衡表达自己观点和尊重他人意见，提出建设性讨论，推动团队达成共识。',
    scoringCriteria: {
      excellent: '方法成熟，能推动共识，考虑周全',
      good: '方法合理，能有效沟通',
      fair: '方法常规，缺乏技巧',
      poor: '固执己见或回避冲突'
    }
  },
  // 复试 - 业务理解
  {
    id: 'q5',
    category: 'second',
    dimension: 'business',
    question: '您认为我们公司所在的行业目前面临的最大挑战是什么？您觉得应该如何应对？',
    keyPoints: ['行业理解', '商业思维', '前瞻性'],
    excellentStandard: '对行业有深入了解，能分析挑战背后的原因，并提出有见地的见解或解决方案。',
    scoringCriteria: {
      excellent: '分析深入，见解独到，有战略思维',
      good: '理解基本正确，有一定见解',
      fair: '了解表面信息，缺乏深度',
      poor: '不了解行业或分析偏离'
    }
  },
  {
    id: 'q6',
    category: 'second',
    dimension: 'business',
    question: '如果您加入我们团队，您认为首先应该做什么？为什么？',
    keyPoints: ['融入能力', '优先级判断', '价值创造'],
    excellentStandard: '能够先了解团队、熟悉业务，再快速产出价值，体现务实和战略性思维。',
    scoringCriteria: {
      excellent: '思路清晰，先调研再行动，价值导向',
      good: '有一定思路，考虑较全面',
      fair: '思路常规，缺乏优先级思考',
      poor: '急于求成或方向偏离'
    }
  },
  // 复试 - 专业能力
  {
    id: 'q7',
    category: 'second',
    dimension: 'professional',
    question: '请分享一个您主导的技术改进或优化案例，改进前后的效果如何？',
    keyPoints: ['技术视野', '改进能力', '数据思维'],
    excellentStandard: '能够量化改进效果，说明改进的背景、方法、过程和结果，体现数据驱动思维。',
    scoringCriteria: {
      excellent: '效果显著，方法科学，有数据支撑',
      good: '有改进，效果可衡量',
      fair: '有改进但效果不明显',
      poor: '无法描述或改进无效'
    }
  },
  {
    id: 'q8',
    category: 'second',
    dimension: 'general',
    question: '您通常如何保持技术学习？请分享最近学习的一项新技术或新方法。',
    keyPoints: ['学习能力', '自驱力', '知识管理'],
    excellentStandard: '有系统的学习方法，能将学习成果应用到工作中，并持续迭代。',
    scoringCriteria: {
      excellent: '方法科学，有学习成果产出',
      good: '有学习方法，持续学习',
      fair: '偶尔学习，缺乏系统性',
      poor: '不主动学习'
    }
  },
  // 终面 - 文化适配
  {
    id: 'q9',
    category: 'final',
    dimension: 'culture',
    question: '您期望在什么样的团队文化中工作？您对团队协作有什么看法？',
    keyPoints: ['文化匹配', '协作意识', '自我认知'],
    excellentStandard: '期望合理，能融入团队，理解协作的重要性，有共赢思维。',
    scoringCriteria: {
      excellent: '期望合理，协作意识强，有共赢思维',
      good: '期望合理，有协作意识',
      fair: '期望较高但可调整',
      poor: '期望不合理或缺乏协作意识'
    }
  },
  {
    id: 'q10',
    category: 'final',
    dimension: 'culture',
    question: '请描述一次您帮助团队成员克服困难或提升能力的经历。',
    keyPoints: ['领导力', '乐于助人', '导师意识'],
    excellentStandard: '主动帮助他人，分享经验和知识，促进团队整体成长。',
    scoringCriteria: {
      excellent: '主动帮助，方法有效，成果显著',
      good: '有帮助行为，有一定效果',
      fair: '有分享但不主动',
      poor: '不帮助或分享无效'
    }
  },
  // 终面 - 业务理解
  {
    id: 'q11',
    category: 'final',
    dimension: 'business',
    question: '您如何看待这个岗位在未来1-2年的发展路径？您对自己有什么期待？',
    keyPoints: ['职业规划', '成长潜力', '目标清晰度'],
    excellentStandard: '有清晰的职业规划，与公司发展契合，有野心但务实。',
    scoringCriteria: {
      excellent: '规划清晰，与公司契合，有成长潜力',
      good: '有规划，基本契合',
      fair: '有想法但模糊',
      poor: '没有规划或偏离'
    }
  },
  {
    id: 'q12',
    category: 'final',
    dimension: 'culture',
    question: '如果加入后实际工作与您的预期有差距，您会如何应对？',
    keyPoints: ['适应能力', '沟通能力', '期望管理'],
    excellentStandard: '能积极沟通，调整预期或主动改善，体现成熟的心态。',
    scoringCriteria: {
      excellent: '方法成熟，主动沟通，积极改善',
      good: '能调整心态，有效沟通',
      fair: '会沟通但方法常规',
      poor: '抱怨或消极应对'
    }
  }
];

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

export default function QuestionsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterDimension, setFilterDimension] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredQuestions = sampleQuestions.filter(q => {
    const matchesSearch = q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          q.keyPoints.some(p => p.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = filterCategory === 'all' || q.category === filterCategory;
    const matchesDimension = filterDimension === 'all' || q.dimension === filterDimension;
    return matchesSearch && matchesCategory && matchesDimension;
  });

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getQuestionStats = () => {
    const initial = sampleQuestions.filter(q => q.category === 'initial').length;
    const second = sampleQuestions.filter(q => q.category === 'second').length;
    const final = sampleQuestions.filter(q => q.category === 'final').length;
    return { initial, second, final, total: sampleQuestions.length };
  };

  const stats = getQuestionStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">面试题库</h1>
          <p className="text-[#64748B] mt-1">结构化面试题库，支持按环节和能力维度筛选</p>
        </div>
        <Button className="gap-2 bg-[#1E3A5F] hover:bg-[#2d4a6f]">
          <Plus className="h-4 w-4" />
          添加题目
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-[#3B82F6]">{stats.initial}</div>
            <p className="text-sm text-[#64748B]">初试题目</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-[#8B5CF6]">{stats.second}</div>
            <p className="text-sm text-[#64748B]">复试题目</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-[#EC4899]">{stats.final}</div>
            <p className="text-sm text-[#64748B]">终面题目</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-[#1E293B]">{stats.total}</div>
            <p className="text-sm text-[#64748B]">总题目数</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748B]" />
              <Input
                placeholder="搜索题目或考察要点..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-2 border rounded-lg text-sm bg-white"
              >
                <option value="all">全部环节</option>
                <option value="initial">初试</option>
                <option value="second">复试</option>
                <option value="final">终面</option>
              </select>
              <select
                value={filterDimension}
                onChange={(e) => setFilterDimension(e.target.value)}
                className="px-3 py-2 border rounded-lg text-sm bg-white"
              >
                <option value="all">全部维度</option>
                <option value="professional">专业能力</option>
                <option value="general">通用能力</option>
                <option value="business">业务理解</option>
                <option value="culture">文化适配</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Questions List */}
      <div className="space-y-4">
        {filteredQuestions.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 text-[#CBD5E1] mx-auto mb-4" />
                <p className="text-[#64748B]">未找到匹配的面试题目</p>
                <p className="text-sm text-[#94A3B8] mt-1">尝试调整筛选条件</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredQuestions.map((q) => (
            <Card key={q.id} className={cn(
              'transition-all duration-200',
              expandedId === q.id && 'ring-2 ring-[#3B82F6]'
            )}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={categoryLabels[q.category]?.color}>
                      {categoryLabels[q.category]?.label}
                    </Badge>
                    <Badge className={dimensionLabels[q.dimension]?.color}>
                      {dimensionLabels[q.dimension]?.label}
                    </Badge>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleCopy(q.question, q.id)}
                      className="text-[#64748B]"
                    >
                      {copiedId === q.id ? (
                        <Check className="h-4 w-4 text-[#10B981]" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleExpand(q.id)}
                      className="text-[#64748B]"
                    >
                      {expandedId === q.id ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <CardTitle className="text-base font-medium text-[#1E293B] mt-2">
                  {q.question}
                </CardTitle>
              </CardHeader>
              
              {expandedId === q.id && (
                <CardContent className="space-y-4">
                  <div>
                    <span className="text-sm font-medium text-[#64748B] block mb-2">考察要点</span>
                    <div className="flex flex-wrap gap-2">
                      {q.keyPoints.map((point, i) => (
                        <span key={i} className="text-sm bg-[#F1F5F9] text-[#64748B] px-3 py-1 rounded-full">
                          {point}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="bg-[#F8FAFC] rounded-lg p-4">
                    <span className="text-sm font-medium text-[#64748B] block mb-2">优秀答案标准</span>
                    <p className="text-sm text-[#1E293B]">{q.excellentStandard}</p>
                  </div>
                  
                  {q.scoringCriteria && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="bg-[#F0FDF4] rounded-lg p-3">
                        <span className="text-xs font-medium text-[#10B981] block mb-1">优秀</span>
                        <p className="text-xs text-[#64748B]">{q.scoringCriteria.excellent}</p>
                      </div>
                      <div className="bg-[#EFF6FF] rounded-lg p-3">
                        <span className="text-xs font-medium text-[#3B82F6] block mb-1">良好</span>
                        <p className="text-xs text-[#64748B]">{q.scoringCriteria.good}</p>
                      </div>
                      <div className="bg-[#FEF3C7] rounded-lg p-3">
                        <span className="text-xs font-medium text-[#F59E0B] block mb-1">一般</span>
                        <p className="text-xs text-[#64748B]">{q.scoringCriteria.fair}</p>
                      </div>
                      <div className="bg-[#FEF2F2] rounded-lg p-3">
                        <span className="text-xs font-medium text-[#EF4444] block mb-1">较差</span>
                        <p className="text-xs text-[#64748B]">{q.scoringCriteria.poor}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
