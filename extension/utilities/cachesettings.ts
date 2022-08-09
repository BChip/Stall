import { getBucket } from "@extend-chrome/storage"

/* 
{
    lastFetch: {
        "b64URL-google.com-ABC123": "2020-01-01T00:00:00.000Z",
        "b64URL-youtube.com-ABC456": "2020-01-01T00:00:00.000Z",
        "b64URL-reddit.com-ABC789": "2020-01-01T00:00:00.000Z",
        "userId-1234ABCDEFG894231": "2020-01-01T00:00:00.000Z",
    }
}
 */
interface CacheSettings {
  lastFetch: Record<string, string>
  userCreated: boolean
}

const cacheSettings = getBucket<CacheSettings>("local1")

// 30 seconds
const TTL = 30000

// Check if the cache is expired
export async function isPastFiveMinutes(site: string) {
  const settings = await cacheSettings.get()
  // if there is no settings, return true
  if (!settings.lastFetch) {
    return true
  }
  const diff = getDifference(settings, site)
  if (diff === 0) {
    return true
  }
  // if the difference is greater than 5 minutes, return true
  return diff > TTL
}

export async function setLastFetch(site: string) {
  // get cache settings from storage
  const settings = await cacheSettings.get()
  let obj
  // if there is no settings, create one
  if (!settings.lastFetch) {
    obj = {}
  } else {
    obj = settings.lastFetch
  }
  // store the current time in the lastFetch object as iso string
  obj[site] = new Date().toISOString()
  await cacheSettings.set({ lastFetch: obj })
}

function getDifference(settings: CacheSettings, key: string): number {
  const siteLastFetch = settings.lastFetch[key]
  // get the last fetch time and the current time in date format
  if (!siteLastFetch) {
    return 0
  }
  const lastFetch = new Date(siteLastFetch)
  const currentTime = new Date()
  // find the difference between the two times
  return currentTime.getTime() - lastFetch.getTime()
}
