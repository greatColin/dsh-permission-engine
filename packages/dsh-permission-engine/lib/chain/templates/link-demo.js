class MyLink extends ChainLink {
  id = 'my-inline-link'
  name = 'My Inline Link'
  description = 'Replace this with your own logic.'

  decide(ctx) {
    const command = ctx.input.args.command ?? ''
    if (command.startsWith('echo ')) {
      return this.allow()
    }
    return this.pass()
  }
}

module.exports = new MyLink()
