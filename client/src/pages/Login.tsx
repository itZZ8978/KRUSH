// src/pages/Login.tsx
import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

type LocationState = { from?: string } | null;

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, authBusy } = useAuth();

  const [userId, setUserId] = useState("");
  const [pw, setPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const canSubmit = userId.trim().length > 0 && pw.length > 0 && !authBusy;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    try {
      setErr(null);
      await login(userId, pw); // 컨텍스트 갱신

      // 리다이렉트 대상이 있으면 거기로, 없으면 홈
      const state = location.state as LocationState;
      const from =
        state?.from && typeof state.from === "string" ? state.from : "/";
      navigate(from, { replace: true });
    } catch (e: any) {
      setErr(e.message || "로그인 실패");
    }
  };

  return (
    <div className="min-h-[calc(100vh-120px)] bg-white flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-4xl rounded-[28px] shadow-2xl shadow-black/20">
        <div className="rounded-[28px] bg-gradient-to-b from-neutral-900 to-neutral-700 text-white">
          <div className="grid md:grid-cols-2">
            {/* 왼쪽 카피 영역 */}
            <div className="relative flex items-center justify-center p-10 md:p-14">
              <div className="space-y-2 text-center md:text-left">
                <p className="text-zinc-300 leading-tight text-[18px] md:text-[20px]">
                  빠르고
                  <br />
                  간편한
                  <br />
                  중고거래
                </p>
                <div className="pt-2 text-4xl md:text-[44px] font-extrabold tracking-tight">
                  KRUSH
                </div>
              </div>
              <div className="absolute right-0 hidden w-px md:block top-8 bottom-8 bg-white/30" />
            </div>

            {/* 오른쪽 폼 영역 */}
            <div className="p-8 md:p-12">
              <form
                className="w-full max-w-sm mx-auto space-y-4"
                onSubmit={onSubmit}
              >
                {/* 아이디 */}
                <div>
                  <label className="sr-only">아이디</label>
                  <input
                    type="text"
                    placeholder="아이디"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    autoComplete="username"
                    className="w-full px-3 py-2 text-white border rounded-md border-white/25 bg-white/10 placeholder:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-white/40"
                  />
                </div>

                {/* 비밀번호 */}
                <div className="relative">
                  <label className="sr-only">비밀번호</label>
                  <input
                    type={showPw ? "text" : "password"}
                    placeholder="비밀번호"
                    value={pw}
                    onChange={(e) => setPw(e.target.value)}
                    autoComplete="current-password"
                    className="w-full px-3 py-2 pr-10 text-white border rounded-md border-white/25 bg-white/10 placeholder:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-white/40"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute -translate-y-1/2 right-2 top-1/2 text-zinc-300 hover:text-white"
                    title={showPw ? "숨기기" : "보기"}
                  >
                    {showPw ? "🙈" : "👁️"}
                  </button>
                </div>

                {/* 로그인 버튼 */}
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="w-full py-2 font-semibold bg-white rounded-md text-neutral-900 hover:opacity-90 disabled:opacity-50"
                >
                  {authBusy ? "로그인 중..." : "로그인"}
                </button>

                {/* 에러 메시지 */}
                {err && (
                  <p className="text-xs text-center text-rose-300">{err}</p>
                )}

                {/* 하단 링크 */}
                <div className="flex items-center justify-between text-xs text-zinc-300">
                  <div className="space-x-2">
                    <Link to="#" className="underline underline-offset-2">
                      비밀번호 찾기
                    </Link>
                    <span className="opacity-60">|</span>
                    <Link to="#" className="underline underline-offset-2">
                      아이디 찾기
                    </Link>
                  </div>
                  <Link to="/signup" className="underline underline-offset-2">
                    회원가입
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* 외곽 그림자 */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="rounded-[28px] mx-auto mt-[-10px] h-10 w-[min(56rem,90%)] blur-2xl bg-black/10" />
      </div>
    </div>
  );
}
