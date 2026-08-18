// AUTO-GENERATED from lib/client.js — run `pnpm build:client` to regenerate
window.__ModuleLoader__.load({
  id: '@yourname/dsh-permission-engine',
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;

    const name = 'permission-engine'
    
    const inject = ['slots', 'locale', 'host']
    
    function useRpc(ctx, method, payload) {
      const [data, setData] = React.useState(null)
      const [loading, setLoading] = React.useState(false)
      const [error, setError] = React.useState(null)
    
      const call = React.useCallback(
        async (overridePayload) => {
          setLoading(true)
          setError(null)
          try {
            const result = await ctx.host.call(method, overridePayload ?? payload)
            setData(result)
            return result
          } catch (err) {
            setError(err?.message ?? String(err))
            throw err
          } finally {
            setLoading(false)
          }
        },
        [ctx, method, payload],
      )
    
      return { data, loading, error, call }
    }
    
    function ChainList({ ctx, chains, onChange }) {
      const flat = chains.flatMap((g) => g.links)
    
      const move = async (id, delta) => {
        const idx = flat.findIndex((l) => l.id === id)
        if (idx < 0) return
        const newIdx = idx + delta
        if (newIdx < 0 || newIdx >= flat.length) return
        const next = [...flat]
        const [item] = next.splice(idx, 1)
        next.splice(newIdx, 0, item)
        await ctx.host.call('permissionEngine.updateChain', { order: next.map((l) => l.id) })
        onChange()
      }
    
      const toggle = async (id, enabled) => {
        await ctx.host.call('permissionEngine.updateChain', { id, enabled: !enabled })
        onChange()
      }
    
      const runSelfTest = async (id) => {
        const result = await ctx.host.call('permissionEngine.runSelfTest', { id })
        return result
      }
    
      const remove = async (id) => {
        await ctx.host.call('permissionEngine.removeLink', { id })
        onChange()
      }
    
      return React.createElement(
        'div',
        null,
        chains.length === 0 &&
          React.createElement('p', { style: { color: '#888' } }, 'permissionEngine.empty'),
        chains.map((group) =>
          React.createElement(
            'div',
            { key: group.source, style: { marginBottom: 24 } },
            React.createElement(
              'h3',
              { style: { fontSize: 14, textTransform: 'uppercase', color: '#888', marginBottom: 8 } },
              `${group.source}`,
            ),
            group.links.map((link) =>
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
                    `ID: ${link.id} · ${'permissionEngine.order'} ${link.order}`,
                  ),
                ),
                React.createElement(
                  'button',
                  {
                    onClick: () => move(link.id, -1),
                    disabled: link.id === flat[0]?.id,
                    style: { padding: '4px 8px' },
                  },
                  '↑',
                ),
                React.createElement(
                  'button',
                  {
                    onClick: () => move(link.id, 1),
                    disabled: link.id === flat[flat.length - 1]?.id,
                    style: { padding: '4px 8px' },
                  },
                  '↓',
                ),
                React.createElement(
                  'label',
                  { style: { display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' } },
                  React.createElement('input', {
                    type: 'checkbox',
                    checked: link.enabled,
                    onChange: () => toggle(link.id, link.enabled),
                  }),
                  'permissionEngine.enabled',
                ),
                React.createElement(
                  SelfTestButton,
                  { onRun: () => runSelfTest(link.id) },
                ),
                React.createElement(
                  'button',
                  {
                    onClick: () => remove(link.id),
                    style: { padding: '4px 8px', color: '#dc2626' },
                  },
                  'permissionEngine.remove',
                ),
              ),
            ),
          ),
        ),
      )
    }
    
    function SelfTestButton({ onRun }) {
      const [result, setResult] = React.useState(null)
      const [open, setOpen] = React.useState(false)
    
      const handleClick = async () => {
        const res = await onRun()
        setResult(res)
        setOpen(true)
      }
    
      return React.createElement(
        React.Fragment,
        null,
        React.createElement(
          'button',
          { onClick: handleClick, style: { padding: '4px 8px' } },
          'permissionEngine.selfTest',
        ),
        open &&
          React.createElement(
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
              onClick: () => setOpen(false),
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
              React.createElement('h4', null, 'permissionEngine.selfTestResult'),
              React.createElement(
                'pre',
                { style: { fontSize: 12, background: '#f3f4f6', padding: 12, borderRadius: 4 } },
                JSON.stringify(result, null, 2),
              ),
              React.createElement(
                'button',
                { onClick: () => setOpen(false), style: { marginTop: 12 } },
                'permissionEngine.close',
              ),
            ),
          ),
      )
    }
    
    function InlineEditor({ ctx, onChange }) {
      const [id, setId] = React.useState('')
      const [name, setName] = React.useState('')
      const [description, setDescription] = React.useState('')
      const [code, setCode] = React.useState(`// Implement decide(input, context) and optionally selfTest()
    return {
      id: 'my-link',
      name: 'My Link',
      description: 'A custom permission link.',
      decide(input, context) {
        return { decision: 'pass' }
      },
      selfTest() {
        return [{ ok: true, message: 'basic' }]
      },
    }
    `)
      const [error, setError] = React.useState(null)
      const [busy, setBusy] = React.useState(false)
    
      const submit = async () => {
        setBusy(true)
        setError(null)
        try {
          const res = await ctx.host.call('permissionEngine.addInlineLink', { id, name, description, code })
          if (res?.error) throw new Error(res.error)
          setId('')
          setName('')
          setDescription('')
          onChange()
        } catch (err) {
          setError(err?.message ?? String(err))
        } finally {
          setBusy(false)
        }
      }
    
      return React.createElement(
        'div',
        { style: { marginTop: 24, borderTop: '1px solid #e5e7eb', paddingTop: 16 } },
        React.createElement('h3', null, 'permissionEngine.addInlineLink'),
        error && React.createElement('div', { style: { color: '#dc2626', marginBottom: 12 } }, error),
        React.createElement(
          'div',
          { style: { display: 'grid', gap: 12 } },
          React.createElement('input', {
            placeholder: 'permissionEngine.inlineId',
            value: id,
            onChange: (e) => setId(e.target.value),
            style: { padding: 8 },
          }),
          React.createElement('input', {
            placeholder: 'permissionEngine.inlineName',
            value: name,
            onChange: (e) => setName(e.target.value),
            style: { padding: 8 },
          }),
          React.createElement('input', {
            placeholder: 'permissionEngine.inlineDescription',
            value: description,
            onChange: (e) => setDescription(e.target.value),
            style: { padding: 8 },
          }),
          React.createElement('textarea', {
            value: code,
            onChange: (e) => setCode(e.target.value),
            rows: 12,
            style: { padding: 8, fontFamily: 'monospace', fontSize: 13 },
          }),
          React.createElement(
            'button',
            { onClick: submit, disabled: busy || !id || !code, style: { padding: '8px 16px' } },
            busy ? 'permissionEngine.adding' : 'permissionEngine.add',
          ),
        ),
      )
    }
    
    function PermissionEngineSettings(ctx) {
      return function SettingsComponent() {
        const [chains, setChains] = React.useState([])
        const [loading, setLoading] = React.useState(true)
        const [error, setError] = React.useState(null)
    
        const load = React.useCallback(async () => {
          setLoading(true)
          setError(null)
          try {
            const result = await ctx.host.call('permissionEngine.listChains')
            setChains(result?.groups ?? [])
          } catch (err) {
            setError(err?.message ?? String(err))
          } finally {
            setLoading(false)
          }
        }, [ctx])
    
        React.useEffect(() => {
          load()
        }, [load])
    
        return React.createElement(
          'div',
          { style: { padding: 16, maxWidth: 800 } },
          React.createElement(
            'div',
            { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 } },
            React.createElement('h2', null, 'permissionEngine.title'),
            React.createElement(
              'button',
              { onClick: load, disabled: loading, style: { padding: '6px 12px' } },
              loading ? 'permissionEngine.loading' : 'permissionEngine.reload',
            ),
          ),
          error && React.createElement('div', { style: { color: '#dc2626', marginBottom: 12 } }, error),
          loading
            ? React.createElement('p', null, 'permissionEngine.loading')
            : React.createElement(ChainList, { ctx, chains, onChange: load }),
          React.createElement(InlineEditor, { ctx, onChange: load }),
        )
      }
    }
    
    function apply(ctx) {
      ctx.locale.register('en', {
        'permissionEngine.title': 'Permission Engine',
        'permissionEngine.loading': 'Loading…',
        'permissionEngine.empty': 'No permission links registered.',
        'permissionEngine.order': 'order',
        'permissionEngine.enabled': 'enabled',
        'permissionEngine.selfTest': 'Self-test',
        'permissionEngine.selfTestResult': 'Self-test result',
        'permissionEngine.remove': 'Remove',
        'permissionEngine.close': 'Close',
        'permissionEngine.reload': 'Reload',
        'permissionEngine.addInlineLink': 'Add inline link',
        'permissionEngine.inlineId': 'Link ID',
        'permissionEngine.inlineName': 'Display name',
        'permissionEngine.inlineDescription': 'Description',
        'permissionEngine.add': 'Add link',
        'permissionEngine.adding': 'Adding…',
      })
      ctx.locale.register('zh', {
        'permissionEngine.title': '权限引擎',
        'permissionEngine.loading': '加载中…',
        'permissionEngine.empty': '没有已注册的权限链。',
        'permissionEngine.order': '顺序',
        'permissionEngine.enabled': '启用',
        'permissionEngine.selfTest': '自检',
        'permissionEngine.selfTestResult': '自检结果',
        'permissionEngine.remove': '移除',
        'permissionEngine.close': '关闭',
        'permissionEngine.reload': '刷新',
        'permissionEngine.addInlineLink': '添加内联链',
        'permissionEngine.inlineId': '链 ID',
        'permissionEngine.inlineName': '显示名称',
        'permissionEngine.inlineDescription': '描述',
        'permissionEngine.add': '添加链',
        'permissionEngine.adding': '添加中…',
      })
    
      ctx.slots.inject('settings.section', () =>
        ctx.slots.register(
          {
            name: 'settings.section',
            id: 'permission-engine',
            order: 100,
            label: 'permissionEngine.title',
          },
          PermissionEngineSettings(ctx),
        ),
      )
    }
    
    exports.name = name;
    exports.inject = inject;
    exports.apply = apply;

    return module.exports;
  },
});
