import { DateAdapter } from './adapters/DateAdapter.js'
import { HTMLAdapter } from './adapters/HTMLAdapter.js'
import { ChainedAdapter } from './adapters/ChainedAdapter.js'
import { CheerioAdapter } from './adapters/CheerioAdapter.js'
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

interface CheerioAdapterConfig extends AdapterConfig {
  url: string
  selector: string
  expectedValue?: string
  timeout?: number
  useXPath?: boolean
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

async function testCheerioAdapter() {
  console.log('\nTesting CheerioAdapter:')
  const adapter = new CheerioAdapter()
  const date = new Date('2025-04-18T00:00:00.000Z')
  const expectedValue = date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
  await adapter.init({
    id: 'source-cheerio',
    name: 'Source Cheerio',
    url: 'https://www.timeanddate.com/holidays/us/2025',
    selector: '#tr149 > th.nw',
    expectedValue,
    timeout: 5000,
  })
  const result = await adapter.evaluate()
  console.log('Result:', result)
}

// Is it the Taskmaster's birthday?
async function testChainedAdapterHTML() {
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

// Is it Arbor Day?
async function testChainedAdapterCheerio() {
  console.log('\nTesting ChainedAdapter:')
  const cheerioAdapter = new CheerioAdapter()
  const dateAdapter = new DateAdapter()

  const chainedAdapter = new ChainedAdapter<CheerioAdapterConfig, DateAdapterConfig>()
  await chainedAdapter.init({
    id: 'test-chained',
    name: 'Test Chained',
    sourceAdapter: cheerioAdapter,
    targetAdapter: dateAdapter,
    sourceConfig: {
      id: 'source-cheerio',
      name: 'Source Cheerio',
      url: 'https://www.timeanddate.com/holidays/us/2025',
      selector: '#tr149 > th.nw',
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
        throw new Error('No holiday found in HTML result')
      }

      const holiday = result.metadata.matchedValue as string
      // Parse the date string (e.g. "Apr 18") and create a date object for this year
      const [month, day] = holiday.split(' ')
      const monthIndex = new Date(`${month} 1`).getMonth() // Get month index (0-11)
      const currentYear = new Date().getFullYear()
      const thisYearHoliday = new Date(currentYear, monthIndex, parseInt(day))
      console.log('This year holiday:', thisYearHoliday)

      return {
        id: 'target-date',
        name: 'Target Date',
        targetDate: thisYearHoliday.toISOString(),
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
      case 'chain-html':
        await testChainedAdapterHTML()
        break
      case 'cheerio':
        await testCheerioAdapter()
        break
      case 'chain-cheerio':
        await testChainedAdapterCheerio()
        break
      case undefined:
        console.log('Testing all adapters:')
        await testDateAdapter()
        await testHTMLAdapter()
        await testChainedAdapterHTML()
        await testCheerioAdapter()
        await testChainedAdapterCheerio()
        break
      default:
        console.error('Invalid adapter specified. Use: date, html, chain, or cheerio')
        process.exit(1)
    }
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

main()
