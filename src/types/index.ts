export interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'teacher' | 'student' | 'parent'
  avatar?: string
}

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
}

export interface Student {
  id: string
  name: string
  admissionNumber: string
  class: string
  section: string
  parentId: string
  avatar?: string
}
