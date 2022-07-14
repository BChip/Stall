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
  lastFetch: object
  userCreated: boolean
}

const cacheSettings = getBucket<CacheSettings>("cacheSettingssssssssssssssss")

// 5 minutes
const fiveMinutes = 1000 * 60 * 5

// Check if the cache is expired
export async function isPastFiveMinutes(site) {
  const settings = await cacheSettings.get()
  // if there is no settings, return true
  if (!settings.lastFetch) {
    return true
  }
  const diff = getDifference(settings, site)

  // if the difference is greater than 5 minutes, return true
  return diff > fiveMinutes
}

export async function setLastFetch(site) {
  // get cache settings from storage
  const settings = await cacheSettings.get()
  let obj
  // if there is no settings, create one
  if (!settings.lastFetch) {
    obj = {}
  } else {
    obj = settings.lastFetch
    // prevent overwriting the last fetch time for the same site
    const diff = getDifference(settings, site)
    if (diff < fiveMinutes) {
      return
    }
  }
  // store the current time in the lastFetch object as iso string
  obj[site] = new Date().toISOString()
  await cacheSettings.set({ lastFetch: obj })
}

function getDifference(settings, key) {
  const siteLastFetch = settings.lastFetch[key]
  // get the last fetch time and the current time in date format
  const lastFetch = new Date(siteLastFetch)
  const currentTime = new Date()
  // find the difference between the two times
  return currentTime.getTime() - lastFetch.getTime()
}
