import { useState, useCallback } from 'react'

type CookieOptions = {
  path?: string
  maxAge?: number
}

export function useCookies(dependencies: string[] = []) {
  const [cookies, setCookiesState] = useState(() => {
    const allCookies: Record<string, string> = {}
    document.cookie.split(';').forEach(cookie => {
      const [key, value] = cookie.split('=').map(c => c.trim())
      if (dependencies.length === 0 || dependencies.includes(key)) {
        allCookies[key] = value
      }
    })
    return allCookies
  })

  const setCookie = useCallback((name: string, value: string, options: CookieOptions = {}) => {
    let cookieString = `${name}=${value}`
    
    if (options.path) {
      cookieString += `; path=${options.path}`
    }
    
    if (options.maxAge) {
      cookieString += `; max-age=${options.maxAge}`
    }
    
    document.cookie = cookieString
    setCookiesState(prev => ({ ...prev, [name]: value }))
  }, [])

  return [cookies, setCookie] as const
}
