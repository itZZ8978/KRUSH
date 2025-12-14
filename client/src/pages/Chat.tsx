import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Send } from "lucide-react";

const API_BASE = (import.meta.env.VITE_API_BASE as string) || "/api";

type Message = {
  _id: string;
  sender: string;
  content: string;
  createdAt: string;
};

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
  messages: Message[];
};

export default function Chat() {
  const { productId, roomId } = useParams<{ productId?: string; roomId?: string }>();
  const navigate = useNavigate();
  const [chatRoom, setChatRoom] = useState<ChatRoom | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 현재 사용자 정보 가져오기
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

  // 채팅방 생성 또는 불러오기
  useEffect(() => {
    const loadOrCreateChat = async () => {
      console.log("Chat 페이지 파라미터:", { productId, roomId });
      
      if (!productId && !roomId) {
        console.error("productId와 roomId 둘 다 없음");
        return;
      }
      
      setLoading(true);
      
      try {
        let res, data;
        
        // roomId가 있으면 직접 채팅방 조회
        if (roomId) {
          console.log("roomId로 채팅방 조회:", roomId);
          res = await fetch(`${API_BASE}/chats/${roomId}`, {
            credentials: "include",
          });
          data = await res.json();
          console.log("채팅방 조회 응답:", data);
        } else if (productId) {
          // productId로 채팅방 생성/조회
          console.log("productId로 채팅방 생성/조회:", productId);
          res = await fetch(`${API_BASE}/chats/product/${productId}`, {
            method: "POST",
            credentials: "include",
          });
          data = await res.json();
          console.log("채팅방 생성/조회 응답:", data);
        }
        
        if (res && res.ok && data.ok !== false) {
          console.log("채팅방 로드 성공:", data.chatRoom);
          setChatRoom(data.chatRoom);
        } else {
          console.error("채팅방 로드 실패:", data);
          if (data?.error === "no_chat_room") {
            alert("아직 문의한 구매자가 없습니다.");
            navigate(-1);
          } else if (data?.error === "cannot_chat_with_self") {
            alert("자신의 상품에는 채팅할 수 없습니다. 채팅 목록에서 받은 채팅을 확인하세요.");
            navigate("/chats");
          } else {
            alert(data?.message || data?.error || "채팅방을 불러올 수 없습니다.");
          }
        }
      } catch (e) {
        console.error("채팅방 로드 실패:", e);
        alert("네트워크 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };
    
    loadOrCreateChat();
  }, [productId, roomId, navigate]);

  // 메시지가 추가될 때마다 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatRoom?.messages]);

  // 5초마다 메시지 새로고침 (실시간처럼 보이게)
  useEffect(() => {
    if (!chatRoom) return;
    
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/chats/${chatRoom._id}`, {
          credentials: "include",
        });
        const data = await res.json();
        
        if (res.ok && data.ok !== false) {
          setChatRoom(data.chatRoom);
        }
      } catch (e) {
        console.error("메시지 새로고침 실패:", e);
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [chatRoom]);

  const handleSend = async () => {
    if (!message.trim() || !chatRoom) return;
    
    try {
      const res = await fetch(`${API_BASE}/chats/${chatRoom._id}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content: message.trim() }),
      });
      const data = await res.json();
      
      if (res.ok && data.ok !== false) {
        setChatRoom(data.chatRoom);
        setMessage("");
      }
    } catch (e) {
      console.error("메시지 전송 실패:", e);
    }
  };

  if (loading) {
    return (
      <div className="container py-10 text-center text-gray-600">
        불러오는 중...
      </div>
    );
  }

  if (!chatRoom) {
    return (
      <div className="container py-10 text-center text-gray-600">
        채팅방을 불러올 수 없습니다.
      </div>
    );
  }

  const otherUser = chatRoom.seller === currentUserId ? "구매자" : "판매자";

  return (
    <div className="flex flex-col h-[calc(100vh-80px)]">
      {/* 헤더 */}
      <div className="bg-white border-b shadow-sm">
        <div className="container flex items-center gap-4 py-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 transition-colors rounded-full hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center flex-1 gap-3">
            <img
              src={chatRoom.product.images[0] || "/placeholder.png"}
              alt={chatRoom.product.title}
              className="object-cover w-12 h-12 rounded-lg"
            />
            <div>
              <div className="font-semibold">{otherUser}</div>
              <div className="text-sm text-gray-500">
                {chatRoom.product.title}
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="font-bold">
              {chatRoom.product.price.toLocaleString()}원
            </div>
          </div>
        </div>
      </div>

      {/* 메시지 영역 */}
      <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
        <div className="container max-w-4xl mx-auto space-y-3">
          {chatRoom.messages.map((msg) => {
            const isMe = msg.sender === currentUserId;
            return (
              <div
                key={msg._id}
                className={`flex ${isMe ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs px-4 py-2 rounded-2xl ${
                    isMe
                      ? "bg-black text-white"
                      : "bg-white text-gray-800 border"
                  }`}
                >
                  <div className="text-sm">{msg.content}</div>
                  <div
                    className={`text-xs mt-1 ${
                      isMe ? "text-gray-300" : "text-gray-400"
                    }`}
                  >
                    {new Date(msg.createdAt).toLocaleTimeString("ko-KR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 입력 영역 */}
      <div className="bg-white border-t">
        <div className="container max-w-4xl py-4 mx-auto">
          <div className="flex gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSend()}
              placeholder="메시지를 입력하세요..."
              className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-black"
            />
            <button
              onClick={handleSend}
              disabled={!message.trim()}
              className="flex items-center gap-2 px-6 py-2 text-white bg-black rounded-full hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
              전송
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}