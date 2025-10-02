"use client"

import { Button } from "@/components/ui/button"
import { Home, FileText, Settings, User } from "lucide-react"

interface HeaderProps {
  onNavigate?: (page: string) => void
  currentPage?: string
}

export default function Header({ onNavigate, currentPage = 'home' }: HeaderProps) {
  return (
    <header className="bg-green-dark border-b border-gray-300">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => onNavigate?.('home')}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <div className="p-2 bg-white rounded-lg">
                <svg className="h-6 w-6 text-green-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="text-left">
                <h1 className="text-2xl font-bold text-white">SurgiForm</h1>
              </div>
            </button>
          </div>
          
          <nav className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate?.('home')}
              className={`text-white hover:bg-white/20 ${currentPage === 'home' ? 'bg-white/20' : ''}`}
            >
              <Home className="h-4 w-4 mr-2" />
              홈
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate?.('form')}
              className={`text-white hover:bg-white/20 ${currentPage === 'form' ? 'bg-white/20' : ''}`}
            >
              <FileText className="h-4 w-4 mr-2" />
              수술 동의서 작성
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate?.('mypage')}
              className={`text-white hover:bg-white/20 ${currentPage === 'mypage' ? 'bg-white/20' : ''}`}
            >
              <User className="h-4 w-4 mr-2" />
              마이페이지
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate?.('settings')}
              className={`text-white hover:bg-white/20 ${currentPage === 'settings' ? 'bg-white/20' : ''}`}
            >
              <Settings className="h-4 w-4 mr-2" />
              설정
            </Button>
          </nav>

          <div className="flex items-center gap-4">
            <span className="text-sm text-white">
              장OO 교수님, 안녕하세요
            </span>
            <span className="px-3 py-1 text-xs font-medium bg-white text-green-dark rounded-full">
              ● 시스템 정상
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}