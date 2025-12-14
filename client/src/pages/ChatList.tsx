import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle } from "lucide-react";

const API_BASE = (import.meta.env.VITE_API_BASE as string) || "/api";

type ChatRoom = {
  _id: string;
  product: {
    _id: string;
    title: string;
    price: number;
    images: string[];
  };
  buyer: string;
  seller: string;
  messages: Array<{
    sender: string;
    content: string;
    createdAt: string;
  }>;
  updatedAt: string;
};

export default function ChatList() {
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const navigate = useNavigate();

  // 현재 사용자 정보
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/me`, {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setCurrentUserId(data.user?._id || data.user?.id);
        }
      } catch (e) {
        console.error("사용자 정보 로드 실패:", e);
      }
    };
    fetchCurrentUser();
  }, []);

  // 채팅방 목록 로드
  useEffect(() => {
    const loadChatRooms = async () => {
      try {
        const res = await fetch(`${API_BASE}/chats`, {
          credentials: "include",
        });
        const data = await res.json();

        if (res.ok && data.ok !== false) {
          setChatRooms(data.chatRooms || []);
        }
      } catch (e) {
        console.error("채팅방 목록 로드 실패:", e);
      } finally {
        setLoading(false);
      }
    };

    loadChatRooms();
    
    // 5초마다 새로고침
    const interval = setInterval(loadChatRooms, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleChatRoomClick = (chatRoomId: string) => {
    navigate(`/chat/room/${chatRoomId}`);
  };

  const getOtherUserLabel = (chatRoom: ChatRoom) => {
    if (chatRoom.seller === currentUserId) {
      return "구매자";
    }
    return "판매자";
  };

  const getLastMessage = (chatRoom: ChatRoom) => {
    if (chatRoom.messages.length === 0) return "메시지가 없습니다.";
    const lastMsg = chatRoom.messages[chatRoom.messages.length - 1];
    return lastMsg.content;
  };

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
      <div className="container py-10 text-center text-gray-600">
        불러오는 중...
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-6 mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <MessageCircle className="w-6 h-6" />
        <h1 className="text-2xl font-bold">채팅</h1>
      </div>

      {chatRooms.length === 0 ? (
        <div className="py-20 text-center text-gray-500">
          채팅 내역이 없습니다.
        </div>
      ) : (
        <div className="space-y-2">
          {chatRooms.map((room) => (
            <button
              key={room._id}
              onClick={() => handleChatRoomClick(room._id)}
              className="w-full p-4 text-left transition-colors bg-white border rounded-lg hover:bg-gray-50"
            >
              <div className="flex gap-4">
                <img
                  src={room.product.images[0] || "/placeholder.png"}
                  alt={room.product.title}
                  className="flex-shrink-0 object-cover w-16 h-16 rounded-lg"
                />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-semibold truncate">
                      {getOtherUserLabel(room)}
                    </span>
                    <span className="flex-shrink-0 text-xs text-gray-500">
                      {getTimeAgo(room.updatedAt)}
                    </span>
                  </div>
                  
                  <div className="mt-1 text-sm text-gray-600 truncate">
                    {room.product.title}
                  </div>
                  
                  <div className="mt-1 text-sm text-gray-800 truncate">
                    {getLastMessage(room)}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}