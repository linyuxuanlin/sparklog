import { NextRequest, NextResponse } from 'next/server'
import { getAdminPassword } from '@/lib/config'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { password } = body

    if (!password) {
      return NextResponse.json({ error: '密码不能为空' }, { status: 400 })
    }

    const adminPassword = getAdminPassword()
    if (!adminPassword) {
      return NextResponse.json({ error: '未配置管理员密码' }, { status: 500 })
    }

    const isValid = password === adminPassword
    
    return NextResponse.json({
      success: isValid,
      message: isValid ? '登录成功' : '密码错误'
    })

  } catch (error) {
    console.error('认证失败:', error)
    return NextResponse.json(
      { error: '认证过程中发生错误' },
      { status: 500 }
    )
  }
}