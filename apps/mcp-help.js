import plugin from '../../../lib/plugins/plugin.js'
import Runtime from '../../../lib/plugins/runtime.js'
import { getRenderSettings } from '../lib/config.js'

const HELP_COMMANDS = [
  { command: '#mcp帮助', desc: '查看 MCP 插件帮助信息' },
  { command: '#mcp调试', desc: '切换 MCP 调试模式' },
  { command: '#mcp服务', desc: '列出配置的 MCP 服务' },
  { command: '#mcp连接 <名称>', desc: '连接指定的 MCP 服务' },
  { command: '#mcp断开', desc: '断开当前 MCP 服务连接' }
]

export default class MCPHelp extends plugin {
  constructor () {
    super({
      name: 'MCP帮助',
      dsc: 'Yunzai MCP 插件帮助',
      event: 'message',
      priority: 4000,
      rule: [
        {
          reg: /^#?(mcp|MCP)(帮助|help)$/,
          fnc: 'help'
        }
      ]
    })

    logger.info('[MCP Help] MCP 帮助插件已加载')
  }

  async help (e) {
    try {
      const runtime = e.runtime || await Runtime.init(e)

      if (!runtime?.render) {
        await e.reply('当前 Yunzai 版本暂不支持图片渲染功能。')
        return false
      }

      const data = {
        title: 'Yunzai MCP 插件',
        subtitle: '指令总览',
        intro: '以下是常用的 MCP 插件指令与说明。',
        commands: HELP_COMMANDS,
        generatedAt: new Date().toLocaleString('zh-CN', {
          hour12: false
        })
      }

      const renderSettings = getRenderSettings()

      const rendered = await runtime.render('Yunzai-MCP-plugin', 'render_source/mcp-help/index', data, {
        scale: renderSettings.scale.numeric,
        retType: 'msgId',
        imgType: renderSettings.image.format,
        quality: renderSettings.image.quality,
        omitBackground: renderSettings.image.omitBackground,
        pageGotoParams: renderSettings.pageGotoParams,
        setViewport: {
          width: renderSettings.viewport.width,
          height: renderSettings.viewport.height,
          deviceScaleFactor: renderSettings.viewport.deviceScaleFactor,
          isMobile: renderSettings.viewport.isMobile,
          hasTouch: renderSettings.viewport.hasTouch
        },
        beforeRender ({ data: tplData }) {
          return {
            ...tplData,
            sys: {
              ...(tplData.sys || {}),
              scale: renderSettings.scale.css,
              scaleValue: renderSettings.scale.numeric,
              deviceScale: renderSettings.scale.device,
              viewportScale: renderSettings.scale.viewport
            }
          }
        }
      })

      if (!rendered) {
        await e.reply('帮助图片渲染失败，请检查模板。')
        return false
      }
      return true
    } catch (err) {
      logger.error('[MCP帮助] 渲染异常', err)
      await e.reply(`MCP 帮助指令执行异常：${err?.message || err}`)
      return false
    }
  }
}
