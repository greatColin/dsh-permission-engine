// AUTO-GENERATED from lib/client.js — run `pnpm build:client` to regenerate
window.__ModuleLoader__.load({
  id: '@yourname/dsh-permission-engine',
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;

    const name = 'permission-engine'
    
    const inject = ['slots', 'locale', 'host']
    
    function apply(ctx) {
      ctx.locale.register('en', {
        'permissionEngine.title': 'Permission Engine',
        'permissionEngine.shell': 'Settings UI shell — under construction.',
      })
      ctx.locale.register('zh', {
        'permissionEngine.title': '权限引擎',
        'permissionEngine.shell': '设置界面壳子 — 开发中。',
      })
    
      ctx.slots.inject('settings.section', () =>
        ctx.slots.register(
          {
            name: 'settings.section',
            id: 'permission-engine',
            order: 100,
            label: 'permissionEngine.title',
          },
          () =>
            React.createElement('div', { style: { padding: 16 } },
              React.createElement('h2', null, 'Permission Engine'),
              React.createElement('p', null, 'permissionEngine.shell'),
            ),
        ),
      )
    }
    

    return module.exports;
  },
});
