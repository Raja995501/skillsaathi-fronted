import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import PropTypes from 'prop-types'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { useAuth } from './AuthContext.jsx'
import { tokenStorage } from '../api/axiosClient'

const WS_URL = import.meta.env.VITE_WS_URL || '/ws'

const WebSocketContext = createContext(null)

export function WebSocketProvider({ children }) {
  const { isAuthenticated } = useAuth()
  const clientRef = useRef(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      if (clientRef.current) {
        clientRef.current.deactivate()
        clientRef.current = null
      }
      setConnected(false)
      return
    }

    const token = tokenStorage.getAccessToken()
    if (!token) return

    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 4000,
      onConnect: () => setConnected(true),
      onDisconnect: () => setConnected(false),
      onStompError: (frame) => console.error('STOMP error:', frame.headers?.message),
    })

    client.activate()
    clientRef.current = client

    return () => {
      client.deactivate()
      clientRef.current = null
      setConnected(false)
    }
  }, [isAuthenticated])

  const subscribe = useCallback((destination, callback) => {
    if (!clientRef.current || !connected) return () => {}
    const sub = clientRef.current.subscribe(destination, (message) => {
      try {
        callback(JSON.parse(message.body))
      } catch {
        callback(message.body)
      }
    })
    return () => sub.unsubscribe()
  }, [connected])

  const publish = useCallback((destination, body) => {
    if (!clientRef.current || !connected) return
    clientRef.current.publish({ destination, body: JSON.stringify(body) })
  }, [connected])

  return (
    <WebSocketContext.Provider value={{ connected, subscribe, publish }}>
      {children}
    </WebSocketContext.Provider>
  )
}

WebSocketProvider.propTypes = {
  children: PropTypes.node.isRequired
}

export function useWebSocket() {
  const ctx = useContext(WebSocketContext)
  if (!ctx) throw new Error('useWebSocket must be used within a WebSocketProvider')
  return ctx
}