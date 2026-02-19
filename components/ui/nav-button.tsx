"use client"

import type { ReactNode } from "react"

interface NavButtonProps {
  icon: ReactNode
  label: string
  labelTh?: string
  active: boolean
  onClick: () => void
  badge?: number
}

export default function NavButton({ icon, label, labelTh, active, onClick, badge }: NavButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg relative transition-colors ${
        active ? "text-orange-500" : "text-neutral-400"
      }`}
    >
      <div className="relative">
        {icon}
        {badge !== undefined && badge > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-600 text-white text-[10px] font-medium rounded-full flex items-center justify-center">
            {badge > 9 ? "9+" : badge}
          </span>
        )}
      </div>
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  )
}
