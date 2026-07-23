import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { useAppContext } from '../context/AppContext'

interface AuthFormValues {
  email: string
  password: string
  name?: string
  phone?: string
  course?: string
}

export function AuthPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const { login, signup, resetPassword } = useAppContext()
  const navigate = useNavigate()
  const { register, handleSubmit, reset } = useForm<AuthFormValues>()

  const onSubmit = async (values: AuthFormValues) => {
    setError('')
    setSuccess('')

    try {
      if (mode === 'login') {
        await login(values.email, values.password)
        setSuccess('Login realizado com sucesso!')
        navigate('/dashboard')
      } else {
        await signup({
          name: values.name ?? 'Novo Morador',
          email: values.email,
          password: values.password,
          phone: values.phone ?? '',
          course: values.course ?? 'Sem curso',
          role: 'Morador',
        })
        setSuccess('Cadastro realizado. Você já entrou no sistema.')
        navigate('/dashboard')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado')
    }
  }

  const handleReset = async () => {
    setError('')
    setSuccess('')
    try {
      await resetPassword('zecam@republicafacil.com')
      setSuccess('Link de recuperação enviado para o e-mail demo.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível recuperar')
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.16),_transparent_35%),linear-gradient(135deg,_#f8fcff,_#ffffff)] p-4 sm:p-6">
      <div className="mx-auto flex max-w-6xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl lg:flex-row">
        <div className="flex-1 bg-sky-700 p-8 text-white">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-sky-200">República Fácil</p>
          <h1 className="mt-6 text-4xl font-semibold">Organize sua república com clareza e tranquilidade.</h1>
          <p className="mt-4 max-w-md text-sky-100">Controle despesas, tarefas, avisos e pagamentos em um só lugar.</p>
          <div className="mt-8 rounded-2xl border border-white/20 bg-white/10 p-5">
            <p className="text-sm text-sky-100">Admin: zecam@republicafacil.com / 123456</p>
            <p className="mt-2 text-sm text-sky-100">Morador: bruno@republicafacil.com / 123456</p>
          </div>
        </div>

        <div className="flex-1 p-8">
          <div className="mb-6 flex items-center gap-2">
            <button className={`rounded-full px-4 py-2 text-sm font-semibold ${mode === 'login' ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-700'}`} onClick={() => { setMode('login'); reset(); setError(''); setSuccess('') }}>
              Entrar
            </button>
            <button className={`rounded-full px-4 py-2 text-sm font-semibold ${mode === 'signup' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'}`} onClick={() => { setMode('signup'); reset(); setError(''); setSuccess('') }}>
              Cadastrar
            </button>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            {mode === 'signup' && (
              <>
                <input className="w-full rounded-xl border px-4 py-3" placeholder="Nome completo" {...register('name')} />
                <input className="w-full rounded-xl border px-4 py-3" placeholder="Curso" {...register('course')} />
                <input className="w-full rounded-xl border px-4 py-3" placeholder="Telefone" {...register('phone')} />
              </>
            )}
            <input className="w-full rounded-xl border px-4 py-3" placeholder="E-mail" type="email" {...register('email', { required: true })} />
            <input className="w-full rounded-xl border px-4 py-3" placeholder="Senha" type="password" {...register('password', { required: true })} />
            <button className="w-full rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white" type="submit">{mode === 'login' ? 'Entrar' : 'Criar conta'}</button>
          </form>

          {error ? <p className="mt-4 text-sm text-rose-600">{error}</p> : null}
          {success ? <p className="mt-4 text-sm text-emerald-600">{success}</p> : null}

          <div className="mt-5 flex items-center justify-between text-sm text-slate-500">
            <button className="font-semibold text-sky-700" onClick={handleReset} type="button">Esqueci a senha</button>
            <Link className="font-semibold text-slate-700" to="/dashboard">Continuar sem login</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
