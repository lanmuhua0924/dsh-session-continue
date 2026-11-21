/**
 * dsh-session-continue —— 浏览器半端：设置里的一页「换窗接续」
 *
 * 约定（照 dsh-dream）：
 *   window.__ModuleLoader__.load({ id: '<包名>', factory: (require) => ({ inject, apply }) })
 *   进「设置」= slots.register 到 'settings.section'，label 就是左边导航那一项。
 *
 * 包含同一页里的三块功能（不新开页）：
 *   1. 接续轮数（2–40，常驻显形当前值，0 语义明示 + 设成 10）
 *   2. 按工作区选择接续旧窗（过滤已归档旧窗，按名称/sessionId 筛选）
 *   3. 上一窗摘要（按工作区隔离）：「生成上一窗摘要」「看摘要」两个按钮 + 实时进度 + 原地展开阅读
 */
window.__ModuleLoader__.load({
  id: 'dsh-session-continue',
  factory: (require) => {
    const React = require('react')
    const h = React.createElement
    const API = '/api/session-continue'
    const MIN_ROUNDS = 2
    const MAX_ROUNDS = 40
    const DEFAULT_ROUNDS = 10

    const S = {
      wrap: { padding: '18px 22px', fontSize: 13, lineHeight: 1.7, color: 'inherit', maxWidth: 780 },
      h1: { fontSize: 16, fontWeight: 600, margin: '0 0 4px' },
      h2: { fontSize: 14, fontWeight: 600, margin: 0 },
      note: { opacity: 0.68, fontSize: 12, margin: '0 0 16px' },
      card: { border: '1px solid rgba(128,140,170,0.28)', borderRadius: 10, padding: '14px 16px', marginBottom: 14 },
      cardHead: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 10 },
      nowBox: {
        display: 'flex',
        alignItems: 'baseline',
        flexWrap: 'wrap',
        gap: 10,
        padding: '10px 12px',
        borderRadius: 8,
        background: 'rgba(120,140,180,0.10)',
        border: '1px solid rgba(128,140,170,0.24)',
        marginBottom: 14,
      },
      nowLabel: { fontSize: 12.5, opacity: 0.78, flex: '0 0 auto' },
      nowValue: { fontSize: 22, fontWeight: 700, fontVariantNumeric: 'tabular-nums', letterSpacing: '0.01em' },
      nowZero: { fontSize: 12, opacity: 0.85 },
      row: { display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10, margin: '8px 0' },
      label: { width: 88, opacity: 0.85, flex: '0 0 auto' },
      range: { flex: '1 1 180px', minWidth: 140, maxWidth: 280, cursor: 'pointer' },
      input: {
        background: 'rgba(120,140,180,0.08)',
        border: '1px solid rgba(128,140,170,0.32)',
        borderRadius: 6,
        color: 'inherit',
        font: 'inherit',
        fontVariantNumeric: 'tabular-nums',
        padding: '3px 8px',
        height: 28,
        width: 72,
      },
      search: {
        flex: '1 1 220px',
        minWidth: 160,
        background: 'rgba(120,140,180,0.08)',
        border: '1px solid rgba(128,140,170,0.32)',
        borderRadius: 6,
        color: 'inherit',
        font: 'inherit',
        fontSize: 12.5,
        padding: '4px 10px',
        height: 30,
        boxSizing: 'border-box',
      },
      btn: {
        background: 'rgba(120,150,220,0.16)',
        border: '1px solid rgba(128,150,220,0.38)',
        borderRadius: 6,
        color: 'inherit',
        font: 'inherit',
        padding: '3px 12px',
        height: 28,
        cursor: 'pointer',
        flex: '0 0 auto',
      },
      btnPrimary: {
        background: 'rgba(120,150,220,0.28)',
        border: '1px solid rgba(150,180,240,0.62)',
        fontWeight: 600,
      },
      tabs: { display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
      tab: {
        background: 'rgba(120,140,180,0.08)',
        border: '1px solid rgba(128,140,170,0.28)',
        borderRadius: 999,
        color: 'inherit',
        font: 'inherit',
        fontSize: 12,
        padding: '3px 12px',
        cursor: 'pointer',
        opacity: 0.78,
      },
      tabOn: {
        background: 'rgba(120,150,220,0.28)',
        borderColor: 'rgba(150,180,240,0.72)',
        opacity: 1,
        fontWeight: 600,
      },
      selBox: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 8,
        padding: '9px 12px',
        borderRadius: 8,
        background: 'rgba(120,140,180,0.10)',
        border: '1px solid rgba(128,140,170,0.24)',
        marginBottom: 10,
      },
      selWarn: {
        borderColor: 'rgba(230,170,80,0.55)',
        background: 'rgba(230,170,80,0.10)',
      },
      jobBox: {
        padding: '9px 12px',
        borderRadius: 8,
        background: 'rgba(120,140,180,0.10)',
        border: '1px solid rgba(128,140,170,0.28)',
        marginTop: 8,
        marginBottom: 10,
        fontSize: 12.5,
      },
      jobDone: {
        borderColor: 'rgba(110,200,140,0.55)',
        background: 'rgba(110,200,140,0.10)',
      },
      jobErr: {
        borderColor: 'rgba(230,110,110,0.55)',
        background: 'rgba(230,110,110,0.10)',
      },
      list: {
        maxHeight: 280,
        overflowY: 'auto',
        border: '1px solid rgba(128,140,170,0.22)',
        borderRadius: 8,
      },
      item: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
        padding: '8px 11px',
        borderBottom: '1px solid rgba(128,140,170,0.16)',
        cursor: 'pointer',
      },
      itemSelected: {
        background: 'rgba(120,150,220,0.18)',
      },
      itemMain: { flex: '1 1 auto', minWidth: 0 },
      itemTitleRow: { display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
      itemTitle: { fontSize: 13, fontWeight: 500, wordBreak: 'break-word' },
      itemId: {
        fontSize: 11.5,
        opacity: 0.65,
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
        wordBreak: 'break-all',
      },
      itemRight: { display: 'flex', alignItems: 'center', gap: 8, flex: '0 0 auto' },
      badge: {
        fontSize: 11,
        padding: '1px 7px',
        borderRadius: 999,
        border: '1px solid rgba(128,150,220,0.42)',
        background: 'rgba(120,150,220,0.16)',
        whiteSpace: 'nowrap',
      },
      badgeOn: {
        borderColor: 'rgba(150,190,255,0.8)',
        background: 'rgba(120,160,235,0.34)',
        fontWeight: 600,
      },
      badgeLive: {
        borderColor: 'rgba(110,200,140,0.55)',
        background: 'rgba(110,200,140,0.14)',
      },
      badgeArchived: {
        borderColor: 'rgba(180,170,150,0.45)',
        background: 'rgba(160,150,130,0.16)',
        opacity: 0.85,
      },
      chkLabel: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 12,
        opacity: 0.82,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
      },
      pre: {
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        maxHeight: 420,
        overflowY: 'auto',
        background: 'rgba(120,140,180,0.08)',
        border: '1px solid rgba(128,140,170,0.28)',
        borderRadius: 8,
        padding: '12px 14px',
        fontSize: 12.5,
        lineHeight: 1.75,
        margin: '8px 0 4px',
        fontFamily: 'inherit',
      },
      time: { fontSize: 11.5, opacity: 0.62, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' },
      tip: { fontSize: 12, opacity: 0.7, marginTop: 6 },
      path: {
        fontSize: 11.5,
        opacity: 0.58,
        marginTop: 8,
        wordBreak: 'break-all',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
      },
    }

    function parseRounds(text) {
      const s = String(text ?? '').trim()
      if (s === '') return null
      const n = Number(s)
      if (!Number.isInteger(n)) return null
      return n
    }

    function formatTime(ms) {
      if (!Number.isFinite(ms) || ms <= 0) return ''
      try {
        return new Date(ms).toLocaleString('zh-CN', {
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })
      } catch {
        return ''
      }
    }

    function Panel() {
      const [cfg, setCfg] = React.useState(null)
      const [configPath, setConfigPath] = React.useState('')
      const [draft, setDraft] = React.useState('')
      const [msg, setMsg] = React.useState('')
      const [busy, setBusy] = React.useState(false)

      const [workspaces, setWorkspaces] = React.useState([])
      const [archivedCount, setArchivedCount] = React.useState(0)
      const [activeWsKey, setActiveWsKey] = React.useState('')
      const [query, setQuery] = React.useState('')
      const [hideArchived, setHideArchived] = React.useState(false)
      const [showOtherPickWs, setShowOtherPickWs] = React.useState(false)
      const [showOtherSumWs, setShowOtherSumWs] = React.useState(false)
      const [sesLoading, setSesLoading] = React.useState(false)
      const [sesMsg, setSesMsg] = React.useState('')

      // 窗摘要状态（按工作区隔离）
      const [summaryWsKey, setSummaryWsKey] = React.useState('')
      const [summaryOpen, setSummaryOpen] = React.useState(false)
      const [summaries, setSummaries] = React.useState([])
      const [summaryDir, setSummaryDir] = React.useState('')
      const [sumLoading, setSumLoading] = React.useState(false)
      const [openSumName, setOpenSumName] = React.useState('')
      const [openSumText, setOpenSumText] = React.useState('')
      const [sumJob, setSumJob] = React.useState(null)
      const [sumErr, setSumErr] = React.useState('')

      const loadConfig = React.useCallback(() => {
        fetch(API, { cache: 'no-store', headers: { 'cache-control': 'no-cache' } })
          .then((r) => r.json())
          .then((d) => {
            if (!d?.ok) throw new Error(d?.error || '读不到配置')
            setCfg(d.config)
            setConfigPath(typeof d.configPath === 'string' ? d.configPath : '')
            setDraft(String(d.config?.lastRounds ?? ''))
          })
          .catch((e) => setMsg(`读不到配置：${e.message ?? e}`))
      }, [])

      const loadSessions = React.useCallback(() => {
        setSesLoading(true)
        fetch(`${API}/sessions`, { cache: 'no-store', headers: { 'cache-control': 'no-cache' } })
          .then((r) => r.json())
          .then((d) => {
            if (!d?.ok) throw new Error(d?.error || '读不到会话列表')
            const list = Array.isArray(d.workspaces) ? d.workspaces : []
            setWorkspaces(list)
            setArchivedCount(Number(d.archivedCount ?? d.archivedFilteredCount ?? 0))
            setSesMsg('')
            const firstPrimary = list.find((w) => w.registered === true) || list[0]
            setActiveWsKey((prev) => {
              if (prev !== '' && list.some((w) => w.key === prev)) return prev
              return firstPrimary?.key ?? ''
            })
            setSummaryWsKey((prev) => {
              if (prev !== '' && list.some((w) => w.key === prev)) return prev
              return firstPrimary?.key ?? ''
            })
          })
          .catch((e) => setSesMsg(`读不到会话列表：${e.message ?? e}`))
          .finally(() => setSesLoading(false))
      }, [])

      const loadSummaries = React.useCallback((cwd) => {
        if (!cwd) return
        setSumLoading(true)
        fetch(`${API}/summaries?cwd=${encodeURIComponent(cwd)}`, {
          cache: 'no-store',
          headers: { 'cache-control': 'no-cache' },
        })
          .then((r) => r.json())
          .then((d) => {
            if (!d?.ok) throw new Error(d?.error || '读不到摘要列表')
            setSummaries(Array.isArray(d.items) ? d.items : [])
            setSummaryDir(typeof d.dir === 'string' ? d.dir : '')
            setSumErr('')
          })
          .catch((e) => setSumErr(`读不到摘要列表：${e.message ?? e}`))
          .finally(() => setSumLoading(false))
      }, [])

      const openSummary = React.useCallback(async (cwd, name, forceOpen = false) => {
        if (!cwd || !name) return
        if (!forceOpen && openSumName === name) {
          setOpenSumName('')
          setOpenSumText('')
          return
        }
        setSummaryOpen(true)
        setOpenSumName(name)
        setOpenSumText('读取中…')
        try {
          const res = await fetch(
            `${API}/summaries/read?cwd=${encodeURIComponent(cwd)}&name=${encodeURIComponent(name)}`,
            { cache: 'no-store' },
          )
          const d = await res.json()
          setOpenSumText(d?.ok ? String(d.text ?? '') : `读不到：${d?.error ?? ''}`)
        } catch (e) {
          setOpenSumText(`读不到：${e.message ?? e}`)
        }
      }, [openSumName])

      React.useEffect(() => {
        loadConfig()
        loadSessions()
      }, [loadConfig, loadSessions])

      const hasRegisteredWs = workspaces.some((w) => w.registered === true)
      const primaryWorkspaces = hasRegisteredWs ? workspaces.filter((w) => w.registered === true) : workspaces
      const otherWorkspaces = hasRegisteredWs ? workspaces.filter((w) => w.registered !== true) : []
      const otherSessionTotal = otherWorkspaces.reduce((acc, w) => acc + (Array.isArray(w.sessions) ? w.sessions.length : 0), 0)

      const activeWs = workspaces.find((w) => w.key === activeWsKey) || primaryWorkspaces[0] || workspaces[0] || null
      const summaryWs = workspaces.find((w) => w.key === summaryWsKey) || activeWs || null

      // 切换摘要工作区时，同步刷该工作区的摘要列表与最新任务状态
      React.useEffect(() => {
        if (!summaryWs?.cwd) return
        setOpenSumName('')
        setOpenSumText('')
        loadSummaries(summaryWs.cwd)
        fetch(`${API}/summary/status?cwd=${encodeURIComponent(summaryWs.cwd)}`, { cache: 'no-store' })
          .then((r) => r.json())
          .then((d) => {
            if (d?.ok) setSumJob(d.job ?? null)
          })
          .catch(() => {})
      }, [summaryWs?.cwd, loadSummaries])

      // 若当前有运行中的摘要生成任务，每秒轮询进度直到完成或失败
      React.useEffect(() => {
        if (!sumJob || sumJob.status !== 'running' || !sumJob.jobId) return undefined
        let alive = true
        const timer = setInterval(() => {
          fetch(`${API}/summary/status?jobId=${encodeURIComponent(sumJob.jobId)}`, { cache: 'no-store' })
            .then((r) => r.json())
            .then((d) => {
              if (!alive || !d?.ok || !d.job) return
              setSumJob(d.job)
              if (d.job.status === 'done') {
                loadSummaries(d.job.cwd)
                openSummary(d.job.cwd, d.job.fileName, true)
              }
            })
            .catch(() => {})
        }, 1000)
        return () => {
          alive = false
          clearInterval(timer)
        }
      }, [sumJob?.jobId, sumJob?.status, loadSummaries, openSummary])

      const saveRounds = async (value, label) => {
        if (!Number.isInteger(value) || value < MIN_ROUNDS || value > MAX_ROUNDS) {
          setMsg(`接续轮数须是 ${MIN_ROUNDS}–${MAX_ROUNDS} 之间的整数（如果想设成默认值，点「设成 ${DEFAULT_ROUNDS}」即可）`)
          return
        }
        setBusy(true)
        setMsg('')
        try {
          const res = await fetch(API, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ lastRounds: value }),
          })
          const d = await res.json()
          if (!d?.ok) throw new Error(d?.error || `HTTP ${res.status}`)
          setCfg(d.config)
          if (typeof d.configPath === 'string') setConfigPath(d.configPath)
          setDraft(String(d.config.lastRounds))
          setMsg(`已保存：${label} → ${d.config.lastRounds} 轮`)
        } catch (e) {
          setMsg(`没存上：${e.message ?? e}`)
        } finally {
          setBusy(false)
        }
      }

      const saveSelectedSession = async (ws, sessionId, sessionTitle) => {
        if (!ws || !ws.cwd) return
        setBusy(true)
        setSesMsg('')
        try {
          const res = await fetch(API, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ selectedSession: { cwd: ws.cwd, sessionId } }),
          })
          const d = await res.json()
          if (!d?.ok) throw new Error(d?.error || `HTTP ${res.status}`)
          setCfg(d.config)
          setWorkspaces((prev) =>
            prev.map((w) =>
              w.key === ws.key
                ? {
                    ...w,
                    selectedSessionId: sessionId || '',
                    selectedSessionMissing: false,
                    selectedSessionArchived: false,
                  }
                : w,
            ),
          )
          setSesMsg(
            sessionId
              ? `已选定「${ws.label}」接续旧窗：${sessionTitle || sessionId}（${sessionId}）`
              : `已恢复「${ws.label}」自动选窗（按最新已结束真窗）`,
          )
        } catch (e) {
          setSesMsg(`没存上：${e.message ?? e}`)
        } finally {
          setBusy(false)
        }
      }

      const triggerGenerateSummary = async (ws) => {
        if (!ws || !ws.cwd) return
        setSumErr('')
        try {
          const targetSid =
            (ws.selectedSessionId !== '' && ws.sessions.some((s) => s.id === ws.selectedSessionId)
              ? ws.selectedSessionId
              : (ws.sessions.find((s) => !s.archived) || ws.sessions[0])?.id) || ''
          const res = await fetch(`${API}/summary/generate`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ cwd: ws.cwd, sessionId: targetSid }),
          })
          const d = await res.json()
          if (!d?.ok) throw new Error(d?.error || `HTTP ${res.status}`)
          setSumJob(d.job)
        } catch (e) {
          setSumErr(`启动生成失败：${e.message ?? e}`)
        }
      }

      if (cfg === null) {
        return h('div', { style: S.wrap }, h('div', { style: S.note }, msg || '读取中…'))
      }

      const currentRounds = Number(cfg.lastRounds)
      const parsedDraft = parseRounds(draft)
      const draftValid = parsedDraft !== null && parsedDraft >= MIN_ROUNDS && parsedDraft <= MAX_ROUNDS
      const sliderValue = draftValid ? parsedDraft : MIN_ROUNDS

      const q = String(query ?? '').trim().toLowerCase()
      const filteredSessions = activeWs
        ? activeWs.sessions.filter((s) => {
            if (hideArchived && s.archived) return false
            if (q === '') return true
            return String(s.title ?? '').toLowerCase().includes(q) || String(s.id ?? '').toLowerCase().includes(q)
          })
        : []
      const selectedMeta =
        activeWs && activeWs.selectedSessionId
          ? activeWs.sessions.find((s) => s.id === activeWs.selectedSessionId) || null
          : null

      const summaryTarget =
        summaryWs
          ? (summaryWs.selectedSessionId !== '' && summaryWs.sessions.find((s) => s.id === summaryWs.selectedSessionId)) ||
            summaryWs.sessions.find((s) => !s.archived) ||
            summaryWs.sessions[0] ||
            null
          : null
      const jobRunning = sumJob !== null && sumJob.status === 'running'

      return h(
        'div',
        { style: S.wrap },
        h('div', { style: S.h1 }, '换窗接续'),
        h('div', { style: S.note }, '换窗不是换人，新窗醒来接上上一窗的脉络和最后几轮对话。改完写回同一份 config.json，立刻生效、重启仍在。'),

        // 卡片 1：接续轮数
        h(
          'div',
          { style: S.card },
          h(
            'div',
            { style: S.nowBox },
            h('span', { style: S.nowLabel }, '当前接续轮数'),
            h('span', { style: S.nowValue }, `${Number.isFinite(currentRounds) ? currentRounds : 0} 轮`),
            currentRounds === 0
              ? h('span', { style: S.nowZero }, '（0 = 不注入上一窗最后对话）')
              : h('span', { style: S.nowZero }, '（新窗开头带入上一窗最后这些轮）'),
          ),

          h(
            'div',
            { style: S.row },
            h('span', { style: S.label }, '接续轮数'),
            h('input', {
              style: { ...S.range, opacity: draftValid ? 1 : 0.45 },
              type: 'range',
              min: MIN_ROUNDS,
              max: MAX_ROUNDS,
              step: 1,
              value: sliderValue,
              disabled: busy,
              onChange: (e) => setDraft(e.target.value),
            }),
            h('input', {
              style: S.input,
              type: 'number',
              min: MIN_ROUNDS,
              max: MAX_ROUNDS,
              step: 1,
              value: draft,
              disabled: busy,
              onChange: (e) => setDraft(e.target.value),
              onKeyDown: (e) => {
                if (e.key === 'Enter' && !busy) {
                  saveRounds(parseRounds(draft), '接续轮数')
                }
              },
            }),
            h('span', { style: { fontSize: 12, opacity: 0.7 } }, '轮'),
            h(
              'button',
              {
                type: 'button',
                style: { ...S.btn, ...S.btnPrimary, opacity: busy || !draftValid ? 0.5 : 1 },
                disabled: busy || !draftValid,
                onClick: () => saveRounds(parsedDraft, '接续轮数'),
              },
              '保存',
            ),
            h(
              'button',
              {
                type: 'button',
                style: { ...S.btn, opacity: busy ? 0.5 : 1 },
                disabled: busy,
                onClick: () => saveRounds(DEFAULT_ROUNDS, `设成 ${DEFAULT_ROUNDS}`),
              },
              `设成 ${DEFAULT_ROUNDS}`,
            ),
          ),

          h(
            'div',
            { style: S.tip },
            `说明：0 = 不注入上一窗最后对话；可调范围 ${MIN_ROUNDS}–${MAX_ROUNDS} 轮，默认 ${DEFAULT_ROUNDS} 轮。盘上原有 0 不会自动改动，想开启请填数保存或直接点「设成 ${DEFAULT_ROUNDS}」。`,
          ),
          configPath !== '' ? h('div', { style: S.path }, `配置文件：${configPath}`) : null,
          msg !== '' ? h('div', { style: { ...S.tip, opacity: 0.9 } }, busy ? '保存中…' : msg) : null,
        ),

        // 卡片 2：按工作区选择接续旧窗
        h(
          'div',
          { style: S.card },
          h(
            'div',
            { style: S.cardHead },
            h('div', { style: S.h2 }, '按工作区选择接续旧窗'),
            h(
              'button',
              { type: 'button', style: S.btn, disabled: busy || sesLoading, onClick: loadSessions },
              sesLoading ? '刷新中…' : '刷新列表',
            ),
          ),
          h(
            'div',
            { style: { ...S.tip, marginTop: 0, marginBottom: 10 } },
            `选定后一直按你选的这一窗接续（支持选已归档旧窗），直到下次换窗时改选或点「恢复自动」。共发现 ${archivedCount} 个已归档真窗，已自动排除子代理会话。`,
          ),

          workspaces.length === 0
            ? h('div', { style: S.tip }, sesLoading ? '读取会话列表中…' : '暂未发现可选真窗')
            : h(
                'div',
                null,
                h(
                  'div',
                  { style: S.tabs },
                  ...primaryWorkspaces.map((w) => {
                    const isActive = activeWs !== null && activeWs.key === w.key
                    const pinnedMark = w.selectedSessionId ? ' · 已指定' : ''
                    return h(
                      'button',
                      {
                        key: w.key,
                        type: 'button',
                        title: w.cwd,
                        style: { ...S.tab, ...(isActive ? S.tabOn : null) },
                        onClick: () => {
                          setActiveWsKey(w.key)
                          setSummaryWsKey(w.key)
                          setQuery('')
                        },
                      },
                      `${w.label}（${w.sessions.length}）${pinnedMark}`,
                    )
                  }),
                  otherWorkspaces.length > 0
                    ? h(
                        'button',
                        {
                          key: '__other_ws_toggle__',
                          type: 'button',
                          style: { ...S.tab, opacity: showOtherPickWs ? 0.95 : 0.62, borderStyle: 'dashed' },
                          onClick: () => setShowOtherPickWs((v) => !v),
                        },
                        `其他会话（${otherSessionTotal}）${showOtherPickWs ? ' ▾' : ' ▸'}`,
                      )
                    : null,
                ),
                showOtherPickWs && otherWorkspaces.length > 0
                  ? h(
                      'div',
                      { style: { ...S.tabs, marginTop: -2, paddingLeft: 2, opacity: 0.88 } },
                      ...otherWorkspaces.map((w) => {
                        const isActive = activeWs !== null && activeWs.key === w.key
                        const pinnedMark = w.selectedSessionId ? ' · 已指定' : ''
                        return h(
                          'button',
                          {
                            key: w.key,
                            type: 'button',
                            title: w.cwd,
                            style: { ...S.tab, fontSize: 11.5, ...(isActive ? S.tabOn : null) },
                            onClick: () => {
                              setActiveWsKey(w.key)
                              setSummaryWsKey(w.key)
                              setQuery('')
                            },
                          },
                          `${w.label}（${w.sessions.length}）${pinnedMark}`,
                        )
                      }),
                    )
                  : null,

                activeWs !== null
                  ? h(
                      'div',
                      null,
                      h('div', { style: { ...S.path, marginTop: 0, marginBottom: 8 } }, `工作区：${activeWs.cwd}`),

                      h(
                        'div',
                        {
                          style: {
                            ...S.selBox,
                            ...(activeWs.selectedSessionMissing ? S.selWarn : null),
                          },
                        },
                        h(
                          'div',
                          { style: { flex: '1 1 260px', minWidth: 0 } },
                          h('div', { style: S.nowLabel }, '当前接续旧窗'),
                          activeWs.selectedSessionId === ''
                            ? h('div', { style: { fontWeight: 600 } }, '自动（按最新已结束真窗）')
                            : h(
                                'div',
                                null,
                                h(
                                  'div',
                                  { style: { ...S.itemTitleRow, fontWeight: 600, wordBreak: 'break-word' } },
                                  h(
                                    'span',
                                    null,
                                    selectedMeta
                                      ? selectedMeta.title
                                      : '已选旧窗目录已不存在（建议重选或恢复自动）',
                                  ),
                                  selectedMeta?.archived
                                    ? h('span', { style: { ...S.badge, ...S.badgeArchived } }, '已归档')
                                    : null,
                                ),
                                h('div', { style: S.itemId }, activeWs.selectedSessionId),
                              ),
                        ),
                        activeWs.selectedSessionId !== ''
                          ? h(
                              'button',
                              {
                                type: 'button',
                                style: S.btn,
                                disabled: busy,
                                onClick: () => saveSelectedSession(activeWs, '', ''),
                              },
                              '恢复自动',
                            )
                          : null,
                      ),

                      h(
                        'div',
                        { style: { ...S.row, marginBottom: 8 } },
                        h('input', {
                          style: S.search,
                          type: 'text',
                          value: query,
                          placeholder: '按会话名称或 sessionId 筛选…',
                          onChange: (e) => setQuery(e.target.value),
                        }),
                        h(
                          'label',
                          { style: S.chkLabel },
                          h('input', {
                            type: 'checkbox',
                            checked: hideArchived,
                            onChange: (e) => setHideArchived(e.target.checked),
                          }),
                          '隐藏已归档',
                        ),
                        query !== ''
                          ? h(
                              'button',
                              { type: 'button', style: S.btn, onClick: () => setQuery('') },
                              '清空',
                            )
                          : null,
                      ),

                      filteredSessions.length === 0
                        ? h(
                            'div',
                            { style: S.tip },
                            activeWs.sessions.length === 0
                              ? '该工作区下没有可选真窗'
                              : '没有匹配当前筛选条件的会话',
                          )
                        : h(
                            'div',
                            { style: S.list },
                            ...filteredSessions.map((s, idx) => {
                              const isSel = activeWs.selectedSessionId === s.id
                              return h(
                                'div',
                                {
                                  key: s.id,
                                  style: {
                                    ...S.item,
                                    ...(isSel ? S.itemSelected : null),
                                    borderBottom:
                                      idx === filteredSessions.length - 1 ? 'none' : S.item.borderBottom,
                                  },
                                  onClick: () => {
                                    if (!busy && !isSel) saveSelectedSession(activeWs, s.id, s.title)
                                  },
                                },
                                h(
                                  'div',
                                  { style: S.itemMain },
                                  h(
                                    'div',
                                    { style: S.itemTitleRow },
                                    h('span', { style: S.itemTitle }, s.title),
                                    s.isLive ? h('span', { style: { ...S.badge, ...S.badgeLive } }, '运行中') : null,
                                    s.archived ? h('span', { style: { ...S.badge, ...S.badgeArchived } }, '已归档') : null,
                                  ),
                                  h('div', { style: S.itemId }, s.id),
                                ),
                                h(
                                  'div',
                                  { style: S.itemRight },
                                  h('span', { style: S.time }, formatTime(s.mtime)),
                                  isSel
                                    ? h('span', { style: { ...S.badge, ...S.badgeOn } }, '已选')
                                    : h(
                                        'button',
                                        {
                                          type: 'button',
                                          style: S.btn,
                                          disabled: busy,
                                          onClick: (e) => {
                                            e.stopPropagation()
                                            saveSelectedSession(activeWs, s.id, s.title)
                                          },
                                        },
                                        '选这窗',
                                      ),
                                ),
                              )
                            }),
                          ),
                    )
                  : null,
              ),

          sesMsg !== '' ? h('div', { style: { ...S.tip, opacity: 0.9 } }, busy ? '保存中…' : sesMsg) : null,
        ),

        // 卡片 3：上一窗摘要（按工作区隔离：生成上一窗摘要 + 看摘要）
        h(
          'div',
          { style: S.card },
          h(
            'div',
            { style: S.cardHead },
            h('div', { style: S.h2 }, '上一窗摘要（按工作区）'),
            summaryWs
              ? h(
                  'button',
                  {
                    type: 'button',
                    style: S.btn,
                    disabled: sumLoading,
                    onClick: () => loadSummaries(summaryWs.cwd),
                  },
                  sumLoading ? '刷新中…' : '刷新摘要',
                )
              : null,
          ),
          h(
            'div',
            { style: { ...S.tip, marginTop: 0, marginBottom: 10 } },
            '换窗前点「生成上一窗摘要」，走宿主无状态模型流（不建会话、不留目录），按工作区各自落盘到 灵枢\\交接\\窗摘要\\；新窗启动自动带上，找不到摘要页也不报错。',
          ),

          primaryWorkspaces.length > 0
            ? h(
                'div',
                { style: S.tabs },
                ...primaryWorkspaces.map((w) => {
                  const isActive = summaryWs !== null && summaryWs.key === w.key
                  return h(
                    'button',
                    {
                      key: `sum-${w.key}`,
                      type: 'button',
                      title: w.cwd,
                      style: { ...S.tab, ...(isActive ? S.tabOn : null) },
                      onClick: () => setSummaryWsKey(w.key),
                    },
                    w.label,
                  )
                }),
                otherWorkspaces.length > 0
                  ? h(
                      'button',
                      {
                        key: '__sum_other_ws_toggle__',
                        type: 'button',
                        style: { ...S.tab, opacity: showOtherSumWs ? 0.95 : 0.62, borderStyle: 'dashed' },
                        onClick: () => setShowOtherSumWs((v) => !v),
                      },
                      `其他会话（${otherSessionTotal}）${showOtherSumWs ? ' ▾' : ' ▸'}`,
                    )
                  : null,
              )
            : null,
          showOtherSumWs && otherWorkspaces.length > 0
            ? h(
                'div',
                { style: { ...S.tabs, marginTop: -2, paddingLeft: 2, opacity: 0.88 } },
                ...otherWorkspaces.map((w) => {
                  const isActive = summaryWs !== null && summaryWs.key === w.key
                  return h(
                    'button',
                    {
                      key: `sum-${w.key}`,
                      type: 'button',
                      title: w.cwd,
                      style: { ...S.tab, fontSize: 11.5, ...(isActive ? S.tabOn : null) },
                      onClick: () => setSummaryWsKey(w.key),
                    },
                    w.label,
                  )
                }),
              )
            : null,

          summaryWs === null
            ? h('div', { style: S.tip }, '先等工作区列表加载完')
            : h(
                'div',
                null,
                h(
                  'div',
                  { style: S.selBox },
                  h(
                    'div',
                    { style: { flex: '1 1 240px', minWidth: 0 } },
                    h('div', { style: S.nowLabel }, `目标窗（${summaryWs.label}）`),
                    summaryTarget !== null
                      ? h(
                          'div',
                          null,
                          h('div', { style: { fontWeight: 600, wordBreak: 'break-word' } }, summaryTarget.title),
                          h('div', { style: S.itemId }, summaryTarget.id),
                        )
                      : h('div', { style: S.tip }, '该工作区没有未归档真窗'),
                  ),
                  h(
                    'div',
                    { style: { display: 'flex', gap: 8, flexWrap: 'wrap' } },
                    h(
                      'button',
                      {
                        type: 'button',
                        style: {
                          ...S.btn,
                          ...S.btnPrimary,
                          opacity: jobRunning || summaryTarget === null ? 0.55 : 1,
                        },
                        disabled: jobRunning || summaryTarget === null,
                        onClick: () => triggerGenerateSummary(summaryWs),
                      },
                      jobRunning ? '生成中…' : '生成上一窗摘要',
                    ),
                    h(
                      'button',
                      {
                        type: 'button',
                        style: S.btn,
                        onClick: () => {
                          const next = !summaryOpen
                          setSummaryOpen(next)
                          if (next) loadSummaries(summaryWs.cwd)
                        },
                      },
                      summaryOpen ? `收起摘要（${summaries.length}）` : `看摘要（${summaries.length}）`,
                    ),
                  ),
                ),

                // 生成进度 / 结果反馈
                sumJob !== null && sumJob.cwd === summaryWs.cwd
                  ? h(
                      'div',
                      {
                        style: {
                          ...S.jobBox,
                          ...(sumJob.status === 'done'
                            ? S.jobDone
                            : sumJob.status === 'error'
                              ? S.jobErr
                              : null),
                        },
                      },
                      sumJob.status === 'running'
                        ? h(
                            'div',
                            null,
                            `正在生成：${sumJob.sessionTitle || sumJob.sessionId}（已耗时 ${Math.max(1, Math.round((sumJob.elapsedMs || 0) / 1000))} 秒${
                              sumJob.receivedChars > 0
                                ? `，已落笔 ${sumJob.receivedChars} 字`
                                : sumJob.thinkingChars > 0
                                  ? `，正在梳理脉络（已思考 ${sumJob.thinkingChars} 字）`
                                  : ''
                            }）`,
                          )
                        : sumJob.status === 'done'
                          ? h(
                              'div',
                              { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 } },
                              h(
                                'span',
                                null,
                                `生成完成：${sumJob.fileName}（${sumJob.chars} 字，耗时 ${(sumJob.elapsedMs / 1000).toFixed(1)} 秒）`,
                              ),
                              h(
                                'button',
                                {
                                  type: 'button',
                                  style: S.btn,
                                  onClick: () => openSummary(sumJob.cwd, sumJob.fileName, true),
                                },
                                '打开这一页',
                              ),
                            )
                          : h('div', null, `生成失败：${sumJob.error || '未知错误'}`),
                    )
                  : null,

                sumErr !== '' ? h('div', { style: { ...S.jobBox, ...S.jobErr } }, sumErr) : null,

                // 看摘要列表与原地正文展开
                summaryOpen
                  ? h(
                      'div',
                      { style: { marginTop: 8 } },
                      summaryDir !== ''
                        ? h('div', { style: { ...S.path, marginTop: 0, marginBottom: 8 } }, `摘要目录：${summaryDir}`)
                        : null,
                      summaries.length === 0
                        ? h('div', { style: S.tip }, sumLoading ? '读取中…' : '这个工作区还没有窗摘要页')
                        : h(
                            'div',
                            { style: S.list },
                            ...summaries.map((item, idx) => {
                              const isOpen = openSumName === item.name
                              return h(
                                'div',
                                {
                                  key: item.name,
                                  style: {
                                    borderBottom:
                                      idx === summaries.length - 1 ? 'none' : S.item.borderBottom,
                                  },
                                },
                                h(
                                  'div',
                                  {
                                    style: {
                                      ...S.item,
                                      borderBottom: 'none',
                                      ...(isOpen ? S.itemSelected : null),
                                    },
                                    onClick: () => openSummary(summaryWs.cwd, item.name, false),
                                  },
                                  h(
                                    'div',
                                    { style: S.itemMain },
                                    h('div', { style: S.itemTitle }, item.name),
                                    h('div', { style: S.itemId }, item.sessionId),
                                  ),
                                  h(
                                    'div',
                                    { style: S.itemRight },
                                    h('span', { style: S.time }, formatTime(item.mtime)),
                                    h('span', { style: S.badge }, isOpen ? '收起' : '打开'),
                                  ),
                                ),
                                isOpen
                                  ? h(
                                      'div',
                                      { style: { padding: '0 11px 11px' } },
                                      h('pre', { style: S.pre }, openSumText),
                                    )
                                  : null,
                              )
                            }),
                          ),
                    )
                  : null,
              ),
        ),

        h(
          'div',
          { style: S.row },
          h(
            'button',
            {
              type: 'button',
              style: S.btn,
              disabled: busy,
              onClick: () => {
                loadConfig()
                loadSessions()
                if (summaryWs?.cwd) loadSummaries(summaryWs.cwd)
              },
            },
            '重新读取',
          ),
        ),
      )
    }

    return {
      inject: ['slots'],
      apply(ctx) {
        const slots = (typeof ctx.get === 'function' ? ctx.get('slots') : undefined) || ctx.slots
        if (!slots) return
        slots.inject('settings.section', () =>
          slots.register(
            { name: 'settings.section', id: 'session-continue', order: 47, label: '换窗接续' },
            () => h(Panel),
          ),
        )
      },
    }
  },
})
