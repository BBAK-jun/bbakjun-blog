'use client'

import { useState, useEffect } from 'react'
import { client } from '@/lib/rpc'
import type { AppType } from 'blog-admin/rpc'
import { Button } from '@repo/ui'
import { Search, Database, BarChart3, Clock } from 'lucide-react'

interface RAGStats {
  documents: {
    total: number
    indexed: number
    categories: Record<string, number>
  }
  usage: {
    totalQueries: number
    avgQueryTime: number
  }
  system: {
    status: string
    uptime: string
  }
}

interface IngestionJob {
  jobId: string
  status: 'running' | 'completed' | 'failed'
  progress: {
    total: number
    processed: number
    failed: number
    percentage: number
  }
  startedAt: string
  completedAt?: string
  error?: string
}

export default function RAGManagement() {
  const [stats, setStats] = useState<RAGStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [ingesting, setIngesting] = useState(false)
  const [currentJob, setCurrentJob] = useState<IngestionJob | null>(null)

  // Load initial stats
  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const response = await client.api.v1.rpc.getRAGStats.$get()
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to load RAG stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const startIngestion = async (force: boolean = false) => {
    setIngesting(true)
    try {
      const response = await client.api.v1.rpc.ingestDocuments.$post({
        json: { force, batchSize: 20 }
      })
      if (response.ok) {
        const job = await response.json()
        setCurrentJob(job)
        pollJobStatus(job.jobId)
      }
    } catch (error) {
      console.error('Failed to start ingestion:', error)
      alert('인제스션을 시작하는데 실패했습니다')
    } finally {
      setIngesting(false)
    }
  }

  const pollJobStatus = async (jobId: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await client.api.v1.rpc.getIngestionStatus.$get({
          query: { jobId }
        })
        if (response.ok) {
          const job = await response.json()
          setCurrentJob(job)

          if (job.status === 'completed' || job.status === 'failed') {
            clearInterval(interval)
            loadStats() // Reload stats when done
          }
        }
      } catch (error) {
        console.error('Failed to check job status:', error)
      }
    }, 2000)

    // Cleanup after 5 minutes
    setTimeout(() => clearInterval(interval), 300000)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">RAG 관리</h1>
        <p className="text-muted-foreground mt-2">
          블로그 콘텐츠 검색 및 AI 질문 답변 시스템을 관리합니다
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          icon={Database}
          title="총 문서"
          value={stats?.documents.indexed || 0}
          subtitle={`${stats?.documents.total || 0}개 중`}
        />
        <StatCard
          icon={Search}
          title="총 질의"
          value={stats?.usage.totalQueries || 0}
          subtitle="누적 질문 수"
        />
        <StatCard
          icon={Clock}
          title="평균 응답시간"
          value={`${stats?.usage.avgQueryTime || 0}ms`}
          subtitle="RAG 쿼리 평균"
        />
        <StatCard
          icon={BarChart3}
          title="시스템 상태"
          value={stats?.system.status || 'Unknown'}
          subtitle={stats?.system.uptime || ''}
        />
      </div>

      {/* Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border">
        <h2 className="text-xl font-semibold mb-4">문서 인덱싱</h2>
        <p className="text-muted-foreground mb-4">
          블로그 포스트들을 RAG 시스템에 인덱싱하여 검색 가능하게 만듭니다
        </p>
        <div className="flex gap-3">
          <Button
            onClick={() => startIngestion(false)}
            disabled={ingesting}
          >
            {ingesting ? '인덱싱 중...' : '변경된 문서만 인덱싱'}
          </Button>
          <Button
            variant="outline"
            onClick={() => startIngestion(true)}
            disabled={ingesting}
          >
            전체 재인덱싱
          </Button>
        </div>

        {/* Job Progress */}
        {currentJob && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                인덱싱 진행률 ({currentJob.progress.percentage}%)
              </span>
              <span className="text-sm text-muted-foreground">
                {currentJob.progress.processed} / {currentJob.progress.total}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${currentJob.progress.percentage}%` }}
              ></div>
            </div>
            {currentJob.error && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                오류: {currentJob.error}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Category Distribution */}
      {stats?.documents.categories && Object.keys(stats.documents.categories).length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border">
          <h2 className="text-xl font-semibold mb-4">카테고리별 문서 수</h2>
          <div className="space-y-2">
            {Object.entries(stats.documents.categories).map(([category, count]) => (
              <div key={category} className="flex justify-between">
                <span className="text-sm font-medium">{category}</span>
                <span className="text-sm text-muted-foreground">{count}개</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({
  icon: Icon,
  title,
  value,
  subtitle
}: {
  icon: any
  title: string
  value: string | number
  subtitle?: string
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
    </div>
  )
}