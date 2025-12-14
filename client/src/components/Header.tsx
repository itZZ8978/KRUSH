import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { NavLink } from "react-router-dom";
import { Bell } from "lucide-react";

export default function Header() {
  const navigate = useNavigate();
  const { user, loading, logout } = useAuth();

  const goSell = () => {
    if (user) {
      navigate("/sell");
    } else {
      // 로그인 후 다시 /sell 로 돌아오도록 리다이렉트 상태 전달
      navigate("/login", { state: { from: "/sell" } });
    }
  };

  return (
    <header className="sticky top-0 z-10 bg-white border-b border-gray-200">
      <div className="flex items-center max-w-6xl gap-3 px-4 py-3 mx-auto">
        {/* 로고 */}
        <button
          onClick={() => navigate("/")}
          className="text-xl font-extrabold text-neutral-900"
        >
          KRUSH
        </button>

        {/* 검색창 */}
        <div className="flex-1 max-w-xl ml-6">
          <input
            type="text"
            placeholder="검색어를 입력해 주세요."
            className="w-full px-4 py-2 text-sm border border-gray-300 rounded-full focus:ring-2 focus:ring-neutral-800 focus:outline-none"
          />
        </div>

        {/* 우측 메뉴 */}
        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={() => navigate("/alarm")}
            className="flex items-center gap-1.5 px-3 py-1 text-sm border-black rounded hover:bg-black hover:text-white transition-colors"
          >
            <Bell className="w-4 h-4" />
            알림
          </button>

          {/* 판매하기 버튼 — 로그인 여부에 따라 동작 */}
          <button
            onClick={goSell}
            className="px-4 py-2 text-sm font-semibold text-white rounded-lg bg-neutral-900 hover:opacity-90"
            title={user ? "상품 등록하기" : "로그인하고 상품 등록하기"}
          >
            등록하기
          </button>

          {loading ? (
            <span className="text-sm text-gray-500">확인 중...</span>
          ) : user ? (
            <>
              <span className="text-sm text-gray-700">{user.userId} 님</span>
              <button
                onClick={logout}
                className="px-3 py-1 text-sm text-white rounded bg-neutral-900 hover:opacity-90"
              >
                로그아웃
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => navigate("/login")}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100"
              >
                로그인
              </button>
              <button
                onClick={() => navigate("/signup")}
                className="px-3 py-1 text-sm text-white rounded bg-neutral-900 hover:opacity-90"
              >
                회원가입
              </button>
            </>
          )}
        </div>
      </div>

      {/* 하단 카테고리 메뉴 */}
      <div className="flex max-w-6xl gap-6 px-4 py-1 mx-auto text-sm text-gray-600">
        {[
          { to: "/feed/recommend", label: "추천" },
          { to: "/categories", label: "카테고리" },
          { to: "/feed/hot", label: "인기" },
          { to: "/feed/new", label: "최신" },
        ].map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `hover:text-neutral-900 ${
                isActive ? "text-neutral-900 font-medium" : ""
              }`
            }
          >
            {label}
          </NavLink>
        ))}
      </div>
    </header>
  );
}
