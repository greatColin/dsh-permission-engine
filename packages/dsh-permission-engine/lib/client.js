export const name = 'permission-engine'

export const inject = ['slots', 'locale']

const NS = 'settings.permission-engine'

function ChainRow({ chain, t, onToggle, onMoveUp, onMoveDown, onRemove, onSelfTest }) {
  const flat = chain.links

  return flat.map((link) =>
    React.createElement(
      'div',
      {
        key: link.id,
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '10px 12px',
          border: '1px solid #e5e7eb',
          borderRadius: 8,
          marginBottom: 8,
          background: link.enabled ? '#fff' : '#f9fafb',
        },
      },
      React.createElement(
        'div',
        { style: { flex: 1, minWidth: 0 } },
        React.createElement(
          'div',
          { style: { fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } },
          link.name || link.id,
        ),
        link.description &&
          React.createElement(
            'div',
            { style: { fontSize: 12, color: '#6b7280', marginTop: 2 } },
            link.description,
          ),
        React.createElement(
          'div',
          { style: { fontSize: 11, color: '#9ca3af', marginTop: 4 } },
          `ID: ${link.id} · ${t('order')} ${link.order}`,
        ),
      ),
      React.createElement(
        'button',
        { onClick: () => onMoveUp(link.id), disabled: link.id === flat[0]?.id, style: { padding: '4px 8px' } },
        '↑',
      ),
      React.createElement(
        'button',
        { onClick: () => onMoveDown(link.id), disabled: link.id === flat[flat.length - 1]?.id, style: { padding: '4px 8px' } },
        '↓',
      ),
      React.createElement(
        'label',
        { style: { display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' } },
        React.createElement('input', {
          type: 'checkbox',
          checked: link.enabled,
          onChange: () => onToggle(link.id, link.enabled),
        }),
        t('enabled'),
      ),
      React.createElement(
        'button',
        { onClick: () => onSelfTest(link.id), style: { padding: '4px 8px' } },
        t('selfTest'),
      ),
      React.createElement(
        'button',
        { onClick: () => onRemove(link.id), style: { padding: '4px 8px', color: '#dc2626' } },
        t('remove'),
      ),
    ),
  )
}

function ChainGroup({ group, t, onToggle, onMoveUp, onMoveDown, onRemove, onSelfTest }) {
  return React.createElement(
    'div',
    { key: group.source, style: { marginBottom: 24 } },
    React.createElement(
      'h3',
      { style: { fontSize: 14, textTransform: 'uppercase', color: '#888', marginBottom: 8 } },
      group.source,
    ),
    React.createElement(ChainRow, {
      chain: group,
      t,
      onToggle,
      onMoveUp,
      onMoveDown,
      onRemove,
      onSelfTest,
    }),
  )
}

function SelfTestModal({ linkId, result, onClose }) {
  return React.createElement(
    'div',
    {
      style: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      },
      onClick: onClose,
    },
    React.createElement(
      'div',
      {
        style: {
          background: '#fff',
          padding: 20,
          borderRadius: 8,
          maxWidth: 500,
          width: '90%',
          maxHeight: '80vh',
          overflow: 'auto',
        },
        onClick: (e) => e.stopPropagation(),
      },
      React.createElement('h4', null, `Self-test: ${linkId}`),
      React.createElement(
        'pre',
        { style: { fontSize: 12, background: '#f3f4f6', padding: 12, borderRadius: 4, overflow: 'auto' } },
        JSON.stringify(result, null, 2),
      ),
      React.createElement(
        'button',
        { onClick: onClose, style: { marginTop: 12, padding: '6px 12px' } },
        'Close',
      ),
    ),
  )
}

function InlineEditor({ t, onAdd }) {
  const [id, setId] = React.useState('')
  const [name, setName] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [code, setCode] = React.useState(
    `// Return a plain object or a ChainLink subclass
return {
  id: 'my-link',
  name: 'My Link',
  description: 'A custom permission link.',
  decide(input) {
    // Return null to pass through
    // Or return { kind: 'deny', reason: '...' } or { kind: 'ask', reason: '...' }
    return null
  },
  async runSelfTest() {
    return [{ name: 'basic', passed: true, actual: 'pass', expected: 'pass' }]
  },
}
`,
  )
  const [error, setError] = React.useState(null)
  const [busy, setBusy] = React.useState(false)

  const submit = async () => {
    setBusy(true)
    setError(null)
    try {
      const res = await onAdd({ id, name, description, code })
      if (res?.error) throw new Error(res.error)
      setId('')
      setName('')
      setDescription('')
    } catch (err) {
      setError(err?.message ?? String(err))
    } finally {
      setBusy(false)
    }
  }

  return React.createElement(
    'div',
    { style: { marginTop: 24, borderTop: '1px solid #e5e7eb', paddingTop: 16 } },
    React.createElement('h3', null, t('addInlineLink')),
    error && React.createElement('div', { style: { color: '#dc2626', marginBottom: 12 } }, error),
    React.createElement(
      'div',
      { style: { display: 'grid', gap: 12 } },
      React.createElement('input', {
        placeholder: t('inlineId'),
        value: id,
        onChange: (e) => setId(e.target.value),
        style: { padding: 8, width: '100%', boxSizing: 'border-box' },
      }),
      React.createElement('input', {
        placeholder: t('inlineName'),
        value: name,
        onChange: (e) => setName(e.target.value),
        style: { padding: 8, width: '100%', boxSizing: 'border-box' },
      }),
      React.createElement('input', {
        placeholder: t('inlineDescription'),
        value: description,
        onChange: (e) => setDescription(e.target.value),
        style: { padding: 8, width: '100%', boxSizing: 'border-box' },
      }),
      React.createElement('textarea', {
        value: code,
        onChange: (e) => setCode(e.target.value),
        rows: 12,
        style: { padding: 8, fontFamily: 'monospace', fontSize: 13, width: '100%', boxSizing: 'border-box' },
      }),
      React.createElement(
        'button',
        {
          onClick: submit,
          disabled: busy || !id || !code,
          style: { padding: '8px 16px' },
        },
        busy ? t('adding') : t('add'),
      ),
    ),
  )
}

function PermissionEnginePage({ t }) {
  const [groups, setGroups] = React.useState([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState(null)
  const [selfTest, setSelfTest] = React.useState(null)

  const load = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await host.call('permissionEngine.listChains')
      setGroups(result?.groups ?? [])
    } catch (err) {
      setError(err?.message ?? String(err))
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    load()
  }, [load])

  const handleToggle = async (id, currentEnabled) => {
    await host.call('permissionEngine.updateChain', { id, enabled: !currentEnabled })
    await load()
  }

  const handleMoveUp = async (id) => {
    const flat = groups.flatMap((g) => g.links)
    const idx = flat.findIndex((l) => l.id === id)
    if (idx <= 0) return
    const next = [...flat]
    const [item] = next.splice(idx, 1)
    next.splice(idx - 1, 0, item)
    await host.call('permissionEngine.updateChain', { order: next.map((l) => l.id) })
    await load()
  }

  const handleMoveDown = async (id) => {
    const flat = groups.flatMap((g) => g.links)
    const idx = flat.findIndex((l) => l.id === id)
    if (idx < 0 || idx >= flat.length - 1) return
    const next = [...flat]
    const [item] = next.splice(idx, 1)
    next.splice(idx + 1, 0, item)
    await host.call('permissionEngine.updateChain', { order: next.map((l) => l.id) })
    await load()
  }

  const handleRemove = async (id) => {
    await host.call('permissionEngine.removeLink', { id })
    await load()
  }

  const handleSelfTest = async (id) => {
    const result = await host.call('permissionEngine.runSelfTest', { id })
    setSelfTest({ id, result })
  }

  const handleAddInline = async ({ id, name, description, code }) => {
    const res = await host.call('permissionEngine.addInlineLink', { id, name, description, code })
    if (res?.error) throw new Error(res.error)
    await load()
  }

  return React.createElement(
    'div',
    { style: { padding: 16, maxWidth: 800 } },
    React.createElement(
      'div',
      { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 } },
      React.createElement('h2', null, t('title')),
      React.createElement(
        'button',
        { onClick: load, disabled: loading, style: { padding: '6px 12px' } },
        loading ? t('loading') : t('reload'),
      ),
    ),
    error && React.createElement('div', { style: { color: '#dc2626', marginBottom: 12 } }, error),
    loading
      ? React.createElement('p', null, t('loading'))
      : groups.length === 0
        ? React.createElement('p', { style: { color: '#888' } }, t('empty'))
        : groups.map((g) =>
            React.createElement(ChainGroup, {
              key: g.source,
              group: g,
              t,
              onToggle: handleToggle,
              onMoveUp: handleMoveUp,
              onMoveDown: handleMoveDown,
              onRemove: handleRemove,
              onSelfTest: handleSelfTest,
            }),
          ),
    React.createElement(InlineEditor, { t, onAdd: handleAddInline }),
    selfTest &&
      React.createElement(SelfTestModal, {
        linkId: selfTest.id,
        result: selfTest.result,
        onClose: () => setSelfTest(null),
      }),
  )
}

export function apply(ctx) {
  ctx.locale.register(NS, 'en', {
    title: 'Permission Engine',
    loading: 'Loading…',
    empty: 'No permission links registered.',
    order: 'order',
    enabled: 'enabled',
    selfTest: 'Self-test',
    remove: 'Remove',
    reload: 'Reload',
    addInlineLink: 'Add inline link',
    inlineId: 'Link ID',
    inlineName: 'Display name',
    inlineDescription: 'Description',
    add: 'Add link',
    adding: 'Adding…',
  })
  ctx.locale.register(NS, 'zh', {
    title: '权限引擎',
    loading: '加载中…',
    empty: '没有已注册的权限链。',
    order: '顺序',
    enabled: '启用',
    selfTest: '自检',
    remove: '移除',
    reload: '刷新',
    addInlineLink: '添加内联链',
    inlineId: '链 ID',
    inlineName: '显示名称',
    inlineDescription: '描述',
    add: '添加链',
    adding: '添加中…',
  })

  const t = ctx.locale.bind(NS)

  ctx.slots.inject('settings.section', () =>
    ctx.slots.register(
      {
        name: 'settings.section',
        id: 'permission-engine',
        order: 100,
        label: () => t('title'),
        inject: () => ({ t }),
      },
      PermissionEnginePage,
    ),
  )
}
