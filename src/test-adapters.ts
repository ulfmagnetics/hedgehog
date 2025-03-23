import { DateAdapter, type DateAdapterConfig } from './adapters/DateAdapter.js'
import { HTMLAdapter, type HTMLAdapterConfig } from './adapters/HTMLAdapter.js'
import { ChainedAdapter } from './adapters/ChainedAdapter.js'
import { CheerioAdapter, type CheerioAdapterConfig } from './adapters/CheerioAdapter.js'
import {
  NumericRangeAdapter,
  type NumericRangeAdapterConfig,
} from './adapters/NumericRangeAdapter.js'

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
  await adapter.init({
    id: 'source-cheerio',
    name: 'Source Cheerio',
    url: 'https://en.wikipedia.org/wiki/Barkley_Marathons',
    selector:
      '#mw-content-text > div.mw-content-ltr.mw-parser-output > table.wikitable.sortable.plainrowheaders  > tbody > tr:nth-child(23) > td:nth-child(1)',
    extractAttribute: 'rowspan',
    expectedValue: '5', // there were 5 finishers in 2024
    timeout: 5000,
  })
  const result = await adapter.evaluate()
  console.log('Result:', result)
}

async function testNumericRangeAdapter() {
  console.log('\nTesting NumericRangeAdapter:')
  const adapter = new NumericRangeAdapter()

  // Test inclusive range
  await adapter.init({
    id: 'test-range-inclusive',
    name: 'Test Range Inclusive',
    value: 5,
    minValue: 1,
    maxValue: 10,
    inclusive: true,
  })
  const resultInclusive = await adapter.evaluate()
  console.log('Inclusive Range Result:', resultInclusive)

  // Test exclusive range
  await adapter.init({
    id: 'test-range-exclusive',
    name: 'Test Range Exclusive',
    value: 10,
    minValue: 1,
    maxValue: 10,
    inclusive: false,
  })
  const resultExclusive = await adapter.evaluate()
  console.log('Exclusive Range Result:', resultExclusive)
}

// -------------------------------------------------------------------
// Chained Adapters
// -------------------------------------------------------------------

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

async function testBarkleyFinishers() {
  console.log('\nTesting Barkley Finishers Count:')
  const cheerioAdapter = new CheerioAdapter()
  const rangeAdapter = new NumericRangeAdapter()

  const chainedAdapter = new ChainedAdapter<CheerioAdapterConfig, NumericRangeAdapterConfig>()
  await chainedAdapter.init({
    id: 'barkley-finishers',
    name: 'Barkley Finishers Count',
    sourceAdapter: cheerioAdapter,
    targetAdapter: rangeAdapter,
    sourceConfig: {
      id: 'source-cheerio',
      name: 'Source Cheerio',
      url: 'https://en.wikipedia.org/wiki/Barkley_Marathons#Finishers',
      selector:
        '#mw-content-text > div.mw-content-ltr.mw-parser-output > table.wikitable.sortable.plainrowheaders  > tbody > tr:nth-child(23) > td:nth-child(1)',
      extractAttribute: 'rowspan',
      timeout: 5000,
    },
    targetConfig: {
      id: 'target-range',
      name: 'Target Range',
      value: 0, // This will be overridden by transformResult
      minValue: 1,
      maxValue: 1000,
      inclusive: true,
    },
    transformResult: (result) => {
      if (!result.answer) {
        throw new Error('Failed to fetch Barkley Marathons data')
      }

      return {
        id: 'target-range',
        name: 'Target Range',
        value: parseInt(result.metadata?.matchedValue as string, 10),
        minValue: 5,
        maxValue: 5,
        inclusive: true,
      }
    },
  })
  const result = await chainedAdapter.evaluate()
  console.log('Result:', result)
}

// -------------------------------------------------------------------
// Main harness function
// -------------------------------------------------------------------

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
      case 'range':
        await testNumericRangeAdapter()
        break
      case 'barkley':
        await testBarkleyFinishers()
        break
      case undefined:
        console.log('Testing all adapters:')
        await testDateAdapter()
        await testHTMLAdapter()
        await testChainedAdapterHTML()
        await testCheerioAdapter()
        await testChainedAdapterCheerio()
        await testNumericRangeAdapter()
        await testBarkleyFinishers()
        break
      default:
        console.error(
          'Invalid adapter specified. Use: date, html, chain, cheerio, range, or barkley',
        )
        process.exit(1)
    }
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

main()
