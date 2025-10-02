"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Home, FileText, Settings, User, Menu, X, Bell, Search } from "lucide-react"

interface HeaderProps {
  onNavigate?: (page: string) => void
  currentPage?: string
}

export default function HeaderModern({ onNavigate, currentPage = 'home' }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navItems = [
    { id: 'home', label: '홈', icon: Home },
    { id: 'form', label: '동의서 작성', icon: FileText },
    { id: 'mypage', label: '마이페이지', icon: User },
    { id: 'settings', label: '설정', icon: Settings }
  ]

  return (
    <header className="sticky top-0 z-50 glass border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <button 
              onClick={() => onNavigate?.('home')}
              className="group"
            >
              <span className="text-xl font-semibold">SurgiForm</span>
            </button>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Button
                  key={item.id}
                  variant="ghost"
                  size="sm"
                  onClick={() => onNavigate?.(item.id)}
                  className={`px-4 py-2 rounded-xl transition-all-smooth ${
                    currentPage === item.id 
                      ? 'bg-primary/10 text-primary' 
                      : 'hover:bg-secondary text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {item.label}
                </Button>
              ))}
            </nav>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            {/* Search */}
            <Button variant="ghost" size="icon" className="hidden sm:flex rounded-xl hover:bg-secondary">
              <Search className="h-4 w-4" />
            </Button>

            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative rounded-xl hover:bg-secondary">
              <Bell className="h-4 w-4" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full"></span>
            </Button>

            {/* User Profile */}
            <div className="hidden sm:flex items-center gap-3 pl-3 border-l">
              <div className="text-right">
                <p className="text-sm font-medium">장OO 교수님</p>
                <p className="text-xs text-muted-foreground">서울OO병원</p>
              </div>
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center text-white font-semibold">
                JY
              </div>
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden rounded-xl"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-white animate-slide-in">
          <div className="container mx-auto px-4 py-4">
            <nav className="space-y-1">
              {navItems.map((item) => (
                <Button
                  key={item.id}
                  variant="ghost"
                  className={`w-full justify-start px-4 py-3 rounded-xl ${
                    currentPage === item.id 
                      ? 'bg-primary/10 text-primary' 
                      : 'hover:bg-secondary'
                  }`}
                  onClick={() => {
                    onNavigate?.(item.id)
                    setMobileMenuOpen(false)
                  }}
                >
                  {item.label}
                </Button>
              ))}
            </nav>
            <div className="mt-4 pt-4 border-t flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center text-white font-semibold">
                JY
              </div>
              <div>
                <p className="text-sm font-medium">장OO 교수님</p>
                <p className="text-xs text-muted-foreground">서울OO병원</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}