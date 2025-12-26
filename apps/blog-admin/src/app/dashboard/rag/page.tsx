'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@repo/ui';
import { Card } from '@repo/ui';
import { Textarea } from '@repo/ui';
import { Loader2, Send, Sparkles, FileText, Clock, TrendingUp } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { ragQuery, type RAGQueryInput } from '@/app/actions/rag';
import { toast } from 'sonner';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: Array<{
    id: string;
    title: string;
    slug: string;
    score: number;
  }>;
  timestamp: Date;
  queryTime?: number;
}

const querySchema = z.object({
  query: z.string().min(1, '질문을 입력해주세요'),
  temperature: z.number().min(0).max(2),
  limit: z.number().min(1).max(20),
});

type QueryFormValues = z.infer<typeof querySchema>;

export default function RAGQueryPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isPending, setIsPending] = useState(false);

  const form = useForm<QueryFormValues>({
    resolver: zodResolver(querySchema),
    defaultValues: {
      query: '',
      temperature: 0.7,
      limit: 5,
    },
  });

  const { watch, register, handleSubmit: handleRHFSumbit } = form;
  const temperature = watch('temperature');
  const limit = watch('limit');

  const onSubmit = async (values: QueryFormValues) => {
    if (isPending) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: values.query,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);

    // Reset query input only, preserve settings
    const queryInput = values.query;
    form.setValue('query', '');

    setIsPending(true);

    try {
      const result = await ragQuery({
        query: queryInput,
        temperature: values.temperature,
        limit: values.limit,
        includeSources: true,
      } as RAGQueryInput);

      if (result.success) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: result.data.answer,
          sources: result.data.sources.map(s => ({
            id: s.id,
            title: s.title,
            slug: s.slug,
            score: s.score,
          })),
          timestamp: new Date(),
          queryTime: result.data.queryTime,
        };

        setMessages(prev => [...prev, assistantMessage]);
      } else {
        toast.error(result.error);

        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content:
            result.error || '죄송합니다. 쿼리 처리 중 오류가 발생했습니다. 다시 시도해주세요.',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('RAG query error:', error);
      toast.error('죄송합니다. 쿼리 처리 중 오류가 발생했습니다. 다시 시도해주세요.');

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '죄송합니다. 쿼리 처리 중 오류가 발생했습니다. 다시 시도해주세요.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsPending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleRHFSumbit(onSubmit)();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">RAG Query</h1>
          <p className="text-muted-foreground mt-2">
            블로그 콘텐츠에 대한 AI 기반 검색 및 질문응답
          </p>
        </div>
      </div>

      {/* Settings */}
      <Card className="p-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Temperature:</label>
            <input
              type="range"
              min={0}
              max={2}
              step={0.1}
              {...register('temperature', { valueAsNumber: true })}
              onChange={e => form.setValue('temperature', parseFloat(e.target.value))}
              className="w-24"
            />
            <span className="text-sm text-muted-foreground w-8">{temperature}</span>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Results:</label>
            <select
              {...register('limit', { valueAsNumber: true })}
              onChange={e => form.setValue('limit', parseInt(e.target.value))}
              className="rounded border border-input bg-background px-2 py-1 text-sm"
            >
              <option value={3}>3</option>
              <option value={5}>5</option>
              <option value={10}>10</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Chat Messages */}
      <div className="space-y-4">
        {messages.map(message => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-3xl rounded-lg p-4 ${
                message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                {message.role === 'assistant' ? <Sparkles className="h-4 w-4" /> : null}
                <span className="text-sm font-medium">
                  {message.role === 'user' ? 'You' : 'AI'}
                </span>
                {message.queryTime && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {message.queryTime}ms
                  </span>
                )}
              </div>
              <div className={message.role === 'user' ? 'text-white' : 'text-foreground'}>
                {message.role === 'assistant' ? (
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                      ul: ({ children }) => (
                        <ul className="list-disc list-inside mb-2">{children}</ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="list-decimal list-inside mb-2">{children}</ol>
                      ),
                      li: ({ children }) => <li className="ml-2">{children}</li>,
                      code: ({ children, className }) => (
                        <code
                          className={`rounded px-1 py-0.5 text-sm ${
                            className ? 'bg-gray-800 text-white' : 'bg-gray-200 dark:bg-gray-700'
                          }`}
                        >
                          {children}
                        </code>
                      ),
                      pre: ({ children }) => (
                        <pre className="bg-gray-800 text-white rounded p-3 overflow-x-auto mb-2">
                          {children}
                        </pre>
                      ),
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                ) : (
                  <p className="whitespace-pre-wrap">{message.content}</p>
                )}
              </div>

              {/* Sources */}
              {message.sources && message.sources.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border/50">
                  <p className="text-xs font-medium mb-2 flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    Sources:
                  </p>
                  <div className="space-y-1">
                    {message.sources.map((source, idx) => (
                      <a
                        key={source.id}
                        href={`/blog/${source.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors p-2 rounded hover:bg-background/50"
                      >
                        <span className="flex items-center gap-2">
                          <span className="font-mono text-primary">{idx + 1}.</span>
                          <span>{source.title}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          {(source.score * 100).toFixed(0)}%
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {isPending && (
          <div className="flex justify-start">
            <div className="max-w-3xl rounded-lg bg-muted p-4">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Thinking...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleRHFSumbit(onSubmit)} className="sticky bottom-0">
        <Card className="p-4">
          <div className="flex gap-2">
            <Textarea
              {...register('query')}
              placeholder="질문을 입력하세요... (예: Next.js의 ISR은 어떻게 작동하나요?)"
              className="min-h-[100px] resize-none"
              onKeyDown={handleKeyDown}
              disabled={isPending}
            />
            <Button
              type="submit"
              size="icon"
              disabled={!form.watch('query').trim() || isPending}
              className="h-auto self-end"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Enter로 전송, Shift + Enter로 줄바꿈</p>
        </Card>
      </form>
    </div>
  );
}
