'use client'

import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react'

// ─── Skeleton Loading ───────────────────────────────────────

export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 animate-pulse" aria-hidden="true">
      <div className="h-4 bg-gray-200 rounded w-2/3 mb-3" />
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-3 bg-gray-200 rounded mb-2"
          style={{ width: `${80 - i * 15}%` }}
        />
      ))}
    </div>
  )
}

export function SkeletonStatGrid({ count = 3 }: { count?: number }) {
  return (
    <div className={`grid grid-cols-${count} gap-3`} aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl shadow-sm p-4 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/2 mx-auto mb-2" />
          <div className="h-3 bg-gray-200 rounded w-2/3 mx-auto" />
        </div>
      ))}
    </div>
  )
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4" role="status" aria-label="読み込み中">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} lines={2 + (i % 2)} />
      ))}
      <span className="sr-only">読み込み中</span>
    </div>
  )
}

export function HomeSkeleton() {
  return (
    <div className="space-y-4" role="status" aria-label="読み込み中">
      <SkeletonStatGrid count={3} />
      <SkeletonCard lines={2} />
      <SkeletonCard lines={4} />
      <span className="sr-only">読み込み中</span>
    </div>
  )
}

export function ScheduleSkeleton() {
  return (
    <div className="space-y-4" role="status" aria-label="読み込み中">
      <div className="flex items-center justify-between animate-pulse" aria-hidden="true">
        <div className="h-10 w-10 bg-gray-200 rounded-lg" />
        <div className="h-8 w-40 bg-gray-200 rounded" />
        <div className="h-10 w-10 bg-gray-200 rounded-lg" />
      </div>
      <SkeletonCard lines={3} />
      <SkeletonCard lines={4} />
      <span className="sr-only">読み込み中</span>
    </div>
  )
}

export function ReportSkeleton() {
  return (
    <div className="space-y-4" role="status" aria-label="読み込み中">
      <div className="flex gap-2 animate-pulse" aria-hidden="true">
        <div className="flex-1 h-10 bg-gray-200 rounded-lg" />
        <div className="flex-1 h-10 bg-gray-200 rounded-lg" />
      </div>
      <SkeletonStatGrid count={2} />
      <SkeletonStatGrid count={2} />
      <SkeletonCard lines={5} />
      <span className="sr-only">読み込み中</span>
    </div>
  )
}

// ─── Confirm Modal ──────────────────────────────────────────

interface ConfirmModalProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'default'
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmModal({
  open, title, message,
  confirmLabel = '確認', cancelLabel = 'キャンセル',
  variant = 'default',
  onConfirm, onCancel,
}: ConfirmModalProps) {
  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onCancel])

  if (!open) return null

  const confirmColor = variant === 'danger'
    ? 'bg-red-600 hover:bg-red-700 text-white'
    : 'bg-teal-600 hover:bg-teal-700 text-white'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      aria-describedby="confirm-message"
    >
      <div className="fixed inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4">
        <h3 id="confirm-title" className="font-bold text-gray-900 text-lg">{title}</h3>
        <p id="confirm-message" className="text-sm text-gray-600">{message}</p>
        <div className="flex gap-3 pt-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium transition-colors"
            aria-label={cancelLabel}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${confirmColor}`}
            aria-label={confirmLabel}
            autoFocus
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Toast ──────────────────────────────────────────────────

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: number
  message: string
  type: ToastType
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} })

export function useToast() {
  return useContext(ToastContext)
}

let toastId = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = ++toastId
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3000)
  }, [])

  const colors: Record<ToastType, string> = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    info: 'bg-blue-600',
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-4 right-4 z-[60] space-y-2 pointer-events-none" aria-live="polite">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`${colors[t.type]} text-white px-4 py-2.5 rounded-xl shadow-lg text-sm font-medium animate-slide-in pointer-events-auto`}
            role="alert"
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

// ─── useConfirm hook ────────────────────────────────────────

interface ConfirmState {
  open: boolean
  title: string
  message: string
  variant: 'danger' | 'default'
  resolve: ((value: boolean) => void) | null
}

export function useConfirm() {
  const [state, setState] = useState<ConfirmState>({
    open: false, title: '', message: '', variant: 'default', resolve: null,
  })

  const confirm = useCallback((title: string, message: string, variant: 'danger' | 'default' = 'danger'): Promise<boolean> => {
    return new Promise(resolve => {
      setState({ open: true, title, message, variant, resolve })
    })
  }, [])

  const handleConfirm = useCallback(() => {
    setState(prev => {
      prev.resolve?.(true)
      return { ...prev, open: false, resolve: null }
    })
  }, [])

  const handleCancel = useCallback(() => {
    setState(prev => {
      prev.resolve?.(false)
      return { ...prev, open: false, resolve: null }
    })
  }, [])

  const modal = (
    <ConfirmModal
      open={state.open}
      title={state.title}
      message={state.message}
      variant={state.variant}
      confirmLabel={state.variant === 'danger' ? '実行する' : '確認'}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  )

  return { confirm, modal }
}
