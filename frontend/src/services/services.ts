export type Service = 'youtube' | 'instagram' | 'reddit' | 'discord' | 'twitter' | 'unknown' | 'discord_video'

type URLMetadata = {
  service: Service
  id: string
}

/**
 * Infers metadata for a given URL
 */
export function getServiceAndId(url: string): URLMetadata {
  let service: Service = 'unknown'
  let id: string = null

  url = url.replace(/\/+$/, '')

  if (url.includes('youtube.com')) {
    service = 'youtube'
    id = url.split('v=')[1].split('&')[0]
  } else if (url.includes('youtu.be')) {
    service = 'youtube'
    id = url.split('youtu.be/')[1].split('?')[0]
  } else if (url.includes('instagram.com')) {
    service = 'instagram'
    const segments = url.split('/')
    id = segments[segments.length - 1]
  } else if (url.includes('twitter.com')) {
    service = 'twitter'
    id = url.split('status/')[1].split('?')[0]
  } else if (url.includes('reddit.com')) {
    service = 'reddit'
  } else if (url.includes('cdn.discordapp.com')) {
    service = 'discord'
    if (url.endsWith('.mp4')) {
      service = 'discord_video'
    }
  }

  return { service, id }
}
