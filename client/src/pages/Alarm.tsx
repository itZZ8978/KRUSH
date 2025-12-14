import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, MessageCircle, Tag, ShoppingBag } from "lucide-react";

const API_BASE = (import.meta.env.VITE_API_BASE as string) || "/api";

type TabType = "채팅" | "가격 변동" | "판매 상태 변동";

type AlarmType = {
  _id: string;
  type: "chat" | "price" | "status";
  title: string;
  message: string;
  productId: string;
  chatRoomId?: string;
  createdAt: string;
  read: boolean;
};

export default function Alarm() {
  const [selectedTab, setSelectedTab] = useState<TabType>("채팅");
  const [alarms, setAlarms] = useState<AlarmType[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadAlarms();
    
    // 5초마다 알림 새로고침 (실시간처럼 보이게)
    const interval = setInterval(loadAlarms, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadAlarms = async () => {
    try {
      const res = await fetch(`${API_BASE}/alarms`, {
        credentials: "include",
      });
      const data = await res.json();
      
      console.log("알림 로드:", data);
      
      if (res.ok && data.ok !== false) {
        setAlarms(data.alarms || []);
        console.log("알림 개수:", data.alarms?.length || 0);
      }
    } catch (e) {
      console.error("알림 로드 실패:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleAlarmClick = async (alarm: AlarmType) => {
    // 읽음 처리
    try {
      await fetch(`${API_BASE}/alarms/${alarm._id}/read`, {
        method: "POST",
        credentials: "include",
      });
      
      // 알림 상태 업데이트
      setAlarms(prev =>
        prev.map(a =>
          a._id === alarm._id ? { ...a, read: true } : a
        )
      );
    } catch (e) {
      console.error("알림 읽음 처리 실패:", e);
    }

    // 해당 페이지로 이동
    if (alarm.type === "chat" && alarm.chatRoomId) {
      // 채팅 알림은 채팅방 ID로 직접 이동
      navigate(`/chat/room/${alarm.chatRoomId}`);
    } else {
      // 가격/상태 변동 알림은 상품 상세 페이지로
      navigate(`/listing/${alarm.productId}`);
    }
  };

  // 탭별 필터링
  const filteredAlarms = alarms.filter((a) => {
    if (selectedTab === "채팅") return a.type === "chat";
    if (selectedTab === "가격 변동") return a.type === "price";
    if (selectedTab === "판매 상태 변동") return a.type === "status";
    return false;
  });

  console.log("전체 알림:", alarms);
  console.log("선택된 탭:", selectedTab);
  console.log("필터된 알림:", filteredAlarms);

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const createdAt = new Date(date);
    const diff = Math.floor((now.getTime() - createdAt.getTime()) / 1000);

    if (diff < 60) return "방금 전";
    if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
    return `${Math.floor(diff / 86400)}일 전`;
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-120px)] flex justify-center items-center bg-white">
        <div className="text-gray-600">불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-120px)] flex justify-center bg-white px-4 py-10">
      <div className="w-full max-w-5xl rounded-[28px] bg-neutral-800 text-white shadow-xl">
        {/* 헤더 */}
        <div className="flex items-center gap-2 px-6 py-5">
          <h2 className="text-2xl font-semibold">알림</h2>
          <Bell className="w-6 h-6" />
        </div>

        {/* 헤더 아래 구분선 */}
        <div className="px-6">
          <div className="h-px bg-white/30" />
        </div>

        {/* 탭 메뉴 */}
        <div className="flex gap-3 px-6 py-4">
          {(["채팅", "가격 변동", "판매 상태 변동"] as TabType[]).map(
            (tab) => {
              const count = alarms.filter((a) => {
                if (tab === "채팅") return a.type === "chat";
                if (tab === "가격 변동") return a.type === "price";
                if (tab === "판매 상태 변동") return a.type === "status";
                return false;
              }).filter(a => !a.read).length;

              return (
                <button
                  key={tab}
                  onClick={() => setSelectedTab(tab)}
                  className={`px-5 py-1.5 rounded-full text-sm font-medium border transition-all relative
                    ${
                      selectedTab === tab
                        ? "border-white text-white bg-neutral-900"
                        : "bg-neutral-900 border-neutral-900 text-white hover:border-white hover:text-white"
                    }`}
                >
                  {tab}
                  {count > 0 && (
                    <span className="absolute flex items-center justify-center w-5 h-5 text-xs bg-red-500 rounded-full -top-1 -right-1">
                      {count}
                    </span>
                  )}
                </button>
              );
            }
          )}
        </div>

        {/* 알림 리스트 */}
        <div className="px-6 pb-6 space-y-3">
          {filteredAlarms.length === 0 ? (
            <div className="py-10 text-center text-gray-400">
              알림이 없습니다.
            </div>
          ) : (
            filteredAlarms.map((a) => (
              <button
                key={a._id}
                onClick={() => handleAlarmClick(a)}
                className={`w-full flex items-start px-4 py-4 transition-colors rounded-2xl ${
                  a.read
                    ? "bg-neutral-700/40 hover:bg-neutral-700"
                    : "bg-neutral-500/60 hover:bg-neutral-700"
                }`}
              >
                {/* 프로필 이미지 (아이콘으로 변경) */}
                <div className="flex items-center justify-center flex-shrink-0 w-12 h-12 mr-4 bg-white rounded-xl">
                  {a.type === "chat" && <MessageCircle className="w-6 h-6 text-black" />}
                  {a.type === "price" && <Tag className="w-6 h-6 text-black" />}
                  {a.type === "status" && <ShoppingBag className="w-6 h-6 text-black" />}
                </div>

                {/* 텍스트 영역 */}
                <div className="flex-1 text-left">
                  {/* 이름 + 시간 한 줄 */}
                  <div className="flex items-baseline justify-between">
                    <span className={`font-semibold truncate ${a.read ? "text-gray-300" : "text-white"}`}>
                      {a.title}
                    </span>
                    <span className="flex-shrink-0 ml-2 text-sm text-zinc-400">
                      {getTimeAgo(a.createdAt)}
                    </span>
                  </div>
                  {/* 메시지 */}
                  <span className={`text-sm ${a.read ? "text-zinc-400" : "text-zinc-300"}`}>
                    {a.message}
                  </span>
                </div>

                {/* 읽지 않음 표시 */}
                {!a.read && (
                  <div className="flex-shrink-0 w-2 h-2 mt-2 ml-2 bg-blue-500 rounded-full" />
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}