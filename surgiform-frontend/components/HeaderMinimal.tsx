"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Menu, X, Bell } from "lucide-react"

interface HeaderProps {
  onNavigate?: (page: string) => void
  currentPage?: string
}

export default function HeaderMinimal({ onNavigate, currentPage = 'home' }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navItems = [
    { id: 'home', label: '홈' },
    { id: 'form', label: '동의서 작성' },
    { id: 'mypage', label: '마이페이지' },
    { id: 'settings', label: '설정' }
  ]

  return (
    <header className="border-b border-light bg-white">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-12">
            <button 
              onClick={() => onNavigate?.('home')}
              className="text-xl font-semibold tracking-tight hover:opacity-70 transition-opacity"
            >
              SurgiForm
            </button>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onNavigate?.(item.id)}
                  className={`text-sm font-medium transition-colors ${
                    currentPage === item.id 
                      ? 'text-foreground' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-4">
            {/* Notification */}
            <button className="relative p-2 hover:bg-secondary rounded-lg transition-colors">
              <Bell className="h-4 w-4" strokeWidth={1.5} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* User Avatar */}
            <div className="hidden sm:flex items-center gap-3 pl-3 border-l border-light">
              <div className="text-right">
                <p className="text-sm font-medium">장재율</p>
                <p className="text-xs text-muted-foreground">서울대학교병원</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                JY
              </div>
            </div>

            {/* Mobile Menu */}
            <button
              className="md:hidden p-2 hover:bg-secondary rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" strokeWidth={1.5} /> : <Menu className="h-5 w-5" strokeWidth={1.5} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-light bg-white">
          <div className="container mx-auto px-6 py-4">
            <nav className="space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  className={`w-full text-left px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    currentPage === item.id 
                      ? 'bg-secondary text-foreground' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                  }`}
                  onClick={() => {
                    onNavigate?.(item.id)
                    setMobileMenuOpen(false)
                  }}
                >
                  {item.label}
                </button>
              ))}
            </nav>
            <div className="mt-4 pt-4 border-t border-light flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                JY
              </div>
              <div>
                <p className="text-sm font-medium">장재율</p>
                <p className="text-xs text-muted-foreground">서울대학교병원</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}