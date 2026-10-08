"use client"

import { Eye, EyeOff } from "lucide-react"
import { useState } from "react"

type PasswordInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> & {
  wrapperClassName?: string
}

// Нүдний товчоор нууц үгийг харуулах / нуух боломжтой талбар.
// className нь input-д, wrapperClassName (margin г.м.) нь гаднах блокт хэрэглэгдэнэ.
export default function PasswordInput({ className = "", wrapperClassName = "", ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false)

  return (
    <div className={`relative ${wrapperClassName}`}>
      <input {...props} type={visible ? "text" : "password"} className={`${className} pr-12`} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Нууц үгийг нуух" : "Нууц үгийг харуулах"}
        aria-pressed={visible}
        title={visible ? "Нуух" : "Харуулах"}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-gray-400 hover:text-orange-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/50 transition"
      >
        {visible ? <EyeOff size={20} aria-hidden /> : <Eye size={20} aria-hidden />}
      </button>
    </div>
  )
}
