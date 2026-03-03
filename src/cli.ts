import 'dotenv/config'
import { runPipeline } from './pipeline.js'
import type { WordPressConfig } from './types/index.js'

const keyword = process.argv[2]
if (!keyword) {
  console.error('Usage: npm run generate -- "<keyword>"')
  process.exit(1)
}

const REQUIRED_ENV = ['WP_SITE_URL', 'WP_USERNAME', 'WP_APP_PASSWORD', 'TAVILY_API_KEY'] as const
const missing = REQUIRED_ENV.filter((k) => !process.env[k])
if (missing.length > 0) {
  console.error(`Missing required environment variables: ${missing.join(', ')}`)
  process.exit(1)
}

const config: WordPressConfig = {
  siteUrl: process.env['WP_SITE_URL']!,
  username: process.env['WP_USERNAME']!,
  appPassword: process.env['WP_APP_PASSWORD']!,
}

console.log(`Generating article for keyword: "${keyword}"`)

runPipeline(keyword, config)
  .then((result) => {
    console.log(`Article published successfully!`)
    console.log(`ID: ${result.id}`)
    console.log(`URL: ${result.link}`)
    console.log(`Status: ${result.status}`)
  })
  .catch((err: unknown) => {
    console.error('Failed to generate article:', err)
    process.exit(1)
  })
