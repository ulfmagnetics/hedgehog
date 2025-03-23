import { DateAdapter } from './adapters/DateAdapter.js'
import { HTMLAdapter } from './adapters/HTMLAdapter.js'
import { ChainedAdapter } from './adapters/ChainedAdapter.js'
import type { AdapterConfig } from './adapters/types.js'

interface HTMLAdapterConfig extends AdapterConfig {
  url: string
  regex: string
  timeout?: number
}

interface DateAdapterConfig extends AdapterConfig {
  targetDate: string
  recurringYearly?: boolean
}

async function testDateAdapter() {
  console.log('\nTesting DateAdapter:')
  const adapter = new DateAdapter()
  await adapter.init({
    id: 'test-date',
    name: 'Test Date',
    targetDate: '2023-01-01T00:00:00.000Z', // should return false
    recurringYearly: false,
  })
  const result = await adapter.evaluate()
  console.log('Result:', result)
}

async function testHTMLAdapter() {
  console.log('\nTesting HTMLAdapter:')
  const adapter = new HTMLAdapter()
  await adapter.init({
    id: 'test-html',
    name: 'Test HTML',
    url: 'https://en.wikipedia.org/wiki/Greg_Davies',
    regex: '<span class="bday">(.*?)</span>',
    timeout: 5000,
  })
  const result = await adapter.evaluate()
  console.log('Result:', result)
}

async function testChainedAdapter() {
  console.log('\nTesting ChainedAdapter:')
  const htmlAdapter = new HTMLAdapter()
  const dateAdapter = new DateAdapter()

  const chainedAdapter = new ChainedAdapter<HTMLAdapterConfig, DateAdapterConfig>()
  await chainedAdapter.init({
    id: 'test-chained',
    name: 'Test Chained',
    sourceAdapter: htmlAdapter,
    targetAdapter: dateAdapter,
    sourceConfig: {
      id: 'source-html',
      name: 'Source HTML',
      url: 'https://en.wikipedia.org/wiki/Greg_Davies',
      regex: '<span class="bday">(.*?)</span>',
      timeout: 5000,
    },
    targetConfig: {
      id: 'target-date',
      name: 'Target Date',
      targetDate: new Date().toISOString(), // This will be overridden by transformResult
      recurringYearly: true, // Since we want to check against birthday every year
    },
    transformResult: (result) => {
      if (!result.answer || !result.metadata?.matchedValue) {
        throw new Error('No birthday found in HTML result')
      }

      // The birthday is in YYYY-MM-DD format from Wikipedia
      const birthday = result.metadata.matchedValue as string
      // Create a date object for this year's birthday
      const currentYear = new Date().getFullYear()
      const thisYearBirthday = new Date(birthday.replace(/^\d{4}/, currentYear.toString()))

      return {
        id: 'target-date',
        name: 'Target Date',
        targetDate: thisYearBirthday.toISOString(),
        recurringYearly: true,
      }
    },
  })
  const result = await chainedAdapter.evaluate()
  console.log('Result:', result)
}

async function main() {
  const args = process.argv.slice(2)
  const adapter = args[0]?.toLowerCase()

  try {
    switch (adapter) {
      case 'date':
        await testDateAdapter()
        break
      case 'html':
        await testHTMLAdapter()
        break
      case 'chain':
        await testChainedAdapter()
        break
      case undefined:
        console.log('Testing all adapters:')
        await testDateAdapter()
        await testHTMLAdapter()
        await testChainedAdapter()
        break
      default:
        console.error('Invalid adapter specified. Use: date, html, or chain')
        process.exit(1)
    }
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

main()
