import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { LightningIcon, MagnifyingGlassIcon, LinkIcon } from '@phosphor-icons/react'
import { authHeaders } from '@vibe/app-core'

export const Route = createFileRoute('/welcome')({
  component: WelcomePage,
})

type Step = 'welcome' | 'select-repo'

interface GithubRepo {
  id: number
  full_name: string
  html_url: string
  description: string | null
  updated_at: string
  private: boolean
}

function WelcomePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [step, setStep] = useState<Step>('welcome')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<GithubRepo | null>(null)

  const { data: repos, isLoading: loadingRepos } = useQuery<GithubRepo[]>({
    queryKey: ['github-repos'],
    queryFn: async () => {
      const res = await fetch('/api/projects/github/repos', { headers: authHeaders() })
      if (!res.ok) throw new Error('Failed to fetch repos')
      return res.json()
    },
    enabled: step === 'select-repo',
  })

  const bindMutation = useMutation({
    mutationFn: async (repo: GithubRepo) => {
      const [owner, repoName] = repo.full_name.split('/')

      // 检查是否已初始化 .team/
      const statusRes = await fetch(
        `/api/projects/github/repos/${owner}/${repoName}/init-status`,
        { headers: authHeaders() }
      )
      const { initialized } = await statusRes.json()

      if (!initialized) {
        await fetch(`/api/projects/github/repos/${owner}/${repoName}/init`, {
          method: 'POST',
          headers: authHeaders(),
        })
      }

      // 绑定项目
      await fetch('/api/projects', {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ repo_full_name: repo.full_name, repo_url: repo.html_url }),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      navigate({ to: '/' })
    },
  })

  const filtered = repos?.filter(r =>
    r.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (r.description ?? '').toLowerCase().includes(search.toLowerCase())
  ) ?? []

  if (step === 'welcome') {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'hsl(var(--_background))',
      }}>
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, maxWidth: 400 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: 'linear-gradient(135deg, var(--rb-accent) 0%, var(--rb-accent2) 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 24px var(--rb-glow)',
          }}>
            <LightningIcon size={24} weight="fill" color="#000" />
          </div>

          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'hsl(var(--text-high))', marginBottom: 8 }}>
              欢迎使用 Crew Kanban
            </div>
            <p style={{ color: 'hsl(var(--text-low))', fontSize: 14, lineHeight: 1.6 }}>
              连接你的第一个 GitHub 项目，开始协作开发
            </p>
          </div>

          <button
            onClick={() => setStep('select-repo')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '12px 24px',
              background: 'var(--rb-accent)', color: '#000',
              borderRadius: 10, fontWeight: 600, fontSize: 14,
              border: 'none', cursor: 'pointer', transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.opacity = '0.85')}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.opacity = '1')}
          >
            <LinkIcon size={16} weight="bold" />
            连接项目
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'hsl(var(--_background))', padding: 24,
    }}>
      <div style={{ width: '100%', maxWidth: 520, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 600, color: 'hsl(var(--text-high))', marginBottom: 4 }}>
            选择 GitHub Repo
          </div>
          <div style={{ fontSize: 13, color: 'hsl(var(--text-low))' }}>
            选择你想要管理的项目 repo
          </div>
        </div>

        {/* Search */}
        <div style={{ position: 'relative' }}>
          <MagnifyingGlassIcon
            size={16}
            style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--text-low))' }}
          />
          <input
            type="text"
            placeholder="搜索 repo..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
            style={{
              width: '100%', padding: '10px 12px 10px 36px',
              background: 'hsl(var(--_bg-secondary-default))',
              border: '1px solid hsl(var(--_border))',
              borderRadius: 8, color: 'hsl(var(--text-high))', fontSize: 14,
              outline: 'none', boxSizing: 'border-box',
            }}
            onFocus={e => (e.currentTarget.style.borderColor = 'var(--rb-accent)')}
            onBlur={e => (e.currentTarget.style.borderColor = 'hsl(var(--_border))')}
          />
        </div>

        {/* Repo list */}
        <div style={{ maxHeight: 360, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {loadingRepos ? (
            <div style={{ color: 'hsl(var(--text-low))', textAlign: 'center', padding: '32px 0', fontSize: 14 }}>
              加载中...
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ color: 'hsl(var(--text-low))', textAlign: 'center', padding: '32px 0', fontSize: 14 }}>
              没有找到匹配的 repo
            </div>
          ) : filtered.map(repo => (
            <button
              key={repo.id}
              onClick={() => setSelected(repo)}
              style={{
                width: '100%', textAlign: 'left', padding: '12px 14px',
                borderRadius: 8, border: `1px solid ${selected?.id === repo.id ? 'var(--rb-accent)' : 'hsl(var(--_border))'}`,
                background: selected?.id === repo.id ? 'color-mix(in srgb, var(--rb-accent) 10%, transparent)' : 'hsl(var(--_bg-secondary-default))',
                cursor: 'pointer', transition: 'all 0.1s',
              }}
            >
              <div style={{ fontWeight: 500, fontSize: 14, color: 'hsl(var(--text-high))' }}>
                {repo.full_name}
                {repo.private && (
                  <span style={{ marginLeft: 6, fontSize: 11, color: 'hsl(var(--text-low))', background: 'hsl(var(--_muted))', padding: '1px 6px', borderRadius: 4 }}>
                    private
                  </span>
                )}
              </div>
              {repo.description && (
                <div style={{ fontSize: 12, color: 'hsl(var(--text-low))', marginTop: 4 }}>
                  {repo.description}
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Bind button */}
        <button
          onClick={() => selected && bindMutation.mutate(selected)}
          disabled={!selected || bindMutation.isPending}
          style={{
            padding: '12px', borderRadius: 10,
            background: !selected || bindMutation.isPending ? 'hsl(var(--_muted))' : 'var(--rb-accent)',
            color: !selected || bindMutation.isPending ? 'hsl(var(--text-low))' : '#000',
            fontWeight: 600, fontSize: 14, border: 'none',
            cursor: !selected || bindMutation.isPending ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s',
          }}
        >
          {bindMutation.isPending ? '正在初始化...' : selected ? `绑定 ${selected.full_name}` : '请先选择一个 repo'}
        </button>

        {bindMutation.isError && (
          <div style={{ color: '#f87171', fontSize: 13, textAlign: 'center' }}>
            出错了，请重试
          </div>
        )}
      </div>
    </div>
  )
}
