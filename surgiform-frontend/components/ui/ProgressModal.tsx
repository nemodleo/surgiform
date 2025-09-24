import React from 'react'
import { Button } from './button'
import { Card, CardContent, CardHeader, CardTitle } from './card'

interface ProgressModalProps {
  isOpen: boolean
  progress?: number
  message?: string
  onCancel?: () => void
}

export const ProgressModal: React.FC<ProgressModalProps> = ({
  isOpen,
  progress = 0,
  message = '처리 중...',
  onCancel
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>진행 중</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-gray-600">{message}</p>
          <p className="text-xs text-gray-500">{progress.toFixed(0)}%</p>
          {onCancel && (
            <Button onClick={onCancel} variant="outline" className="w-full">
              취소
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}