import fs from 'node:fs'
import path from 'node:path'
import yaml from 'js-yaml'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const CONFIG_DIR = path.resolve(__dirname, '../config')
const USER_CONFIG = path.join(CONFIG_DIR, 'config.yaml')
const DEFAULT_CONFIG = path.join(CONFIG_DIR, 'defSet.yaml')

export function loadMCPConfig () {
  const base = readYamlSafe(DEFAULT_CONFIG)
  const override = readYamlSafe(USER_CONFIG)

  return mergeDeep(base, override)
}

export function getRenderSettings () {
  const config = loadMCPConfig()
  const renderCfg = config?.mcp?.render || {}

  const scaleSection = isPlainObject(renderCfg.scale) ? renderCfg.scale : {}
  const legacyScale = !isPlainObject(renderCfg.scale) ? renderCfg.scale : undefined

  const baseScalePercent = toNumber(scaleSection.base ?? legacyScale, 160)
  const baseScale = clamp(baseScalePercent / 100, 0.5, 2.5)

  const deviceScaleCfg = isPlainObject(scaleSection.device) ? scaleSection.device : {}
  const viewportScaleCfg = isPlainObject(scaleSection.viewport) ? scaleSection.viewport : {}

  const deviceScaleMin = toNumber(deviceScaleCfg.min, 1.5)
  const deviceScaleMax = toNumber(deviceScaleCfg.max, 3)
  const deviceScaleFactor = toNumber(deviceScaleCfg.factor, 2)

  const viewportAdaptive = viewportScaleCfg.adaptive ?? true
  const viewportScaleMin = toNumber(viewportScaleCfg.min, 0.9)
  const viewportScaleMax = toNumber(viewportScaleCfg.max, 1.35)

  const numericScale = baseScale
  const deviceScale = clamp(numericScale * deviceScaleFactor, deviceScaleMin, deviceScaleMax)
  const viewportScale = viewportAdaptive ? clamp(numericScale, viewportScaleMin, viewportScaleMax) : 1

  const viewportSection = isPlainObject(renderCfg.viewport) ? renderCfg.viewport : {}
  const viewportBase = isPlainObject(viewportSection.base) ? viewportSection.base : viewportSection
  const viewportWidth = toNumber(viewportBase.width, 720)
  const viewportHeight = toNumber(viewportBase.height, 1440)
  const configuredDeviceScale = toNumber(viewportSection.deviceScaleFactor, deviceScale)

  const viewport = {
    width: Math.round(viewportWidth * viewportScale),
    height: Math.round(viewportHeight * viewportScale),
    deviceScaleFactor: Math.max(deviceScale, configuredDeviceScale),
    isMobile: toBoolean(viewportSection.mobile, true),
    hasTouch: toBoolean(viewportSection.touch, true)
  }

  const imageSection = isPlainObject(renderCfg.image) ? renderCfg.image : {}
  const image = {
    format: (imageSection.format || 'png').toLowerCase(),
    quality: clamp(toNumber(imageSection.quality, 96), 1, 100),
    omitBackground: imageSection.omitBackground ?? false
  }

  const pageSection = isPlainObject(renderCfg.page) ? renderCfg.page : {}
  const waitUntil = normalizeWaitUntil(pageSection.waitUntil, ['networkidle0', 'domcontentloaded'])
  const pageGotoParams = {
    waitUntil,
    timeout: toNumber(pageSection.timeout, 90000)
  }

  return {
    scale: {
      percent: baseScalePercent,
      numeric: numericScale,
      css: `style='transform:scale(${numericScale})'`,
      device: deviceScale,
      viewport: viewportScale
    },
    viewport,
    image,
    pageGotoParams
  }
}

function readYamlSafe (filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return {}
    }
    const content = fs.readFileSync(filePath, 'utf8')
    if (!content.trim()) {
      return {}
    }
    const parsed = yaml.load(content)
    return typeof parsed === 'object' && parsed ? parsed : {}
  } catch (error) {
    logger?.warn?.(`[MCP Config] 读取配置失败: ${filePath}`, error)
    return {}
  }
}

function mergeDeep (target = {}, source = {}) {
  const output = { ...target }
  if (!isPlainObject(target) || !isPlainObject(source)) {
    return isPlainObject(source) ? { ...source } : source
  }

  for (const key of Object.keys(source)) {
    const sourceValue = source[key]
    const targetValue = output[key]

    if (isPlainObject(sourceValue) && isPlainObject(targetValue)) {
      output[key] = mergeDeep(targetValue, sourceValue)
    } else {
      output[key] = sourceValue
    }
  }

  return output
}

function isPlainObject (value) {
  return Object.prototype.toString.call(value) === '[object Object]'
}

function toNumber (value, fallback) {
  const num = Number(value)
  return Number.isFinite(num) ? num : fallback
}

function toBoolean (value, fallback) {
  if (typeof value === 'boolean') {
    return value
  }
  if (typeof value === 'string') {
    if (['true', '1', 'yes'].includes(value.toLowerCase())) return true
    if (['false', '0', 'no'].includes(value.toLowerCase())) return false
  }
  if (typeof value === 'number') {
    return value !== 0
  }
  return fallback
}

function clamp (value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function normalizeWaitUntil (value, fallback) {
  if (!value) return fallback
  if (Array.isArray(value)) return value
  return [value]
}
