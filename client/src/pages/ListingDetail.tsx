// client/src/pages/ListingDetail.tsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ImageCarousel from "../components/ImageCarousel";
import DetailSidebar from "../components/DetailSidebar";
import ProductSection from "../components/ProductSection";
// mockProducts 대신 타입만 재사용
import type { Product } from "../data/mockProducts";

// 서버 응답에서 받는 Product 타입 (isLiked 포함)
type ProductWithLike = Product & { isLiked?: boolean };

const API_BASE = (import.meta.env.VITE_API_BASE as string) || "/api";

export default function ListingDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [product, setProduct] = useState<ProductWithLike | null>(null);
  const [similar, setSimilar] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  
  // 하트 토글 상태 (서버에서 받아옴)
  const [isLiked, setIsLiked] = useState(false);
  
  // 더보기 메뉴 표시 상태
  const [showMenu, setShowMenu] = useState(false);
  
  // 판매 상태 변경 메뉴 표시 상태
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  
  // 현재 로그인한 사용자 ID (임시로 localStorage에서 가져옴)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    // 로그인한 사용자 정보 가져오기
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

  useEffect(() => {
    let alive = true;

    async function run() {
      if (!id) return;
      setLoading(true);
      setErr(null);
      try {
        // 단건 조회
        const pRes = await fetch(`${API_BASE}/products/${id}`, {
          credentials: "include",
        });
        const pJson = await pRes.json();
        if (!pRes.ok || pJson.ok === false)
          throw new Error(pJson.error || "not_found");
        const item: ProductWithLike = pJson.product;

        // 비슷한 상품 (간단히: 전체 목록에서 현재 id 제외 후 상위 6개)
        const lRes = await fetch(`${API_BASE}/products`, {
          credentials: "include",
        });
        const lJson = await lRes.json();
        const list: Product[] =
          lRes.ok && lJson.ok !== false ? lJson.products : [];

        if (!alive) return;
        setProduct(item);
        setIsLiked(item.isLiked || false);
        setSimilar(list.filter((p) => p._id !== item._id).slice(0, 6));
      } catch (e: any) {
        if (!alive) return;
        setErr(e.message || "에러가 발생했습니다.");
      } finally {
        if (alive) setLoading(false);
      }
    }

    run();
    return () => {
      alive = false;
    };
  }, [id]);

  // 하트 토글 핸들러 (API 호출)
  const handleLikeToggle = async () => {
    if (!id) return;
    
    try {
      const url = `${API_BASE}/products/${id}/like`;
      
      const res = await fetch(url, {
        method: "POST",
        credentials: "include",
      });
      const json = await res.json();
      
      if (res.ok && json.ok !== false) {
        setIsLiked(json.isLiked);
      } else {
        alert(json.error || "좋아요를 누를 수 없습니다.");
      }
    } catch (e) {
      console.error("좋아요 토글 실패:", e);
      alert("네트워크 오류가 발생했습니다.");
    }
  };

  // 삭제 핸들러
  const handleDelete = async () => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    
    try {
      const res = await fetch(`${API_BASE}/products/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const json = await res.json();
      
      if (res.ok && json.ok !== false) {
        alert("삭제되었습니다.");
        navigate("/");
      } else {
        alert(json.error || "삭제에 실패했습니다.");
      }
    } catch (e) {
      console.error("삭제 실패:", e);
      alert("네트워크 오류가 발생했습니다.");
    }
  };

  // 수정 페이지로 이동
  const handleEdit = () => {
    navigate(`/edit/${id}`);
  };

  // 판매 상태 변경
  const handleStatusChange = async (newStatus: "selling" | "reserved" | "sold") => {
    if (!id || !product) return;
    
    try {
      const res = await fetch(`${API_BASE}/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: product.title,
          description: product.description,
          price: product.price,
          category: product.category,
          location: product.location,
          images: product.images,
          status: newStatus,
        }),
      });
      const json = await res.json();
      
      if (res.ok && json.ok !== false) {
        setProduct({ ...product, status: newStatus });
        setShowStatusMenu(false);
        alert("판매 상태가 변경되었습니다.");
      } else {
        alert(json.error || "상태 변경에 실패했습니다.");
      }
    } catch (e) {
      console.error("상태 변경 실패:", e);
      alert("네트워크 오류가 발생했습니다.");
    }
  };

  if (loading) {
    return (
      <div className="container py-10 text-center text-gray-600">
        불러오는 중...
      </div>
    );
  }

  if (err || !product) {
    return (
      <div className="container py-10 text-center text-gray-600">
        {err ? `오류: ${err}` : "존재하지 않는 상품입니다."}
      </div>
    );
  }

  const images = product.images?.length ? product.images : ["/placeholder.png"];
  
  // 현재 사용자가 게시자인지 확인
  const isOwner = currentUserId && product.seller === currentUserId;

  return (
    <div className="container py-6">
      <div
        className="grid gap-6 
      lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)_320px]"
      >
        {/* 이미지 */}
        <ImageCarousel images={images} />

        {/* 본문 */}
        <section className="space-y-4">
          {/* 판매자(간단 표기) */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gray-200 rounded-full size-10" />
              <div>
                <div className="text-sm font-semibold">
                  사용자 {product.seller?.slice?.(0, 6) ?? "알 수 없음"}
                </div>
                <div className="text-xs text-gray-500">
                  {product.location || "지역 정보 없음"}
                </div>
              </div>
            </div>
            
            {/* 더보기 메뉴 (게시자만 표시) */}
            {isOwner && (
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-2 transition-colors rounded-full hover:bg-gray-100"
                >
                  <svg
                    className="w-5 h-5 text-gray-600"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <circle cx="12" cy="5" r="2" />
                    <circle cx="12" cy="12" r="2" />
                    <circle cx="12" cy="19" r="2" />
                  </svg>
                </button>
                
                {/* 드롭다운 메뉴 */}
                {showMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowMenu(false)}
                    />
                    <div className="absolute right-0 z-20 w-32 mt-1 overflow-hidden bg-white border border-gray-200 rounded-lg shadow-lg top-full">
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          handleEdit();
                        }}
                        className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 transition-colors"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          handleDelete();
                        }}
                        className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        삭제
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* 제목/가격 */}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{product.title}</h1>
              {product.status === "sold" && (
                <span className="px-3 py-1 text-sm font-semibold text-white bg-gray-500 rounded-full">
                  판매됨
                </span>
              )}
              {product.status === "reserved" && (
                <span className="px-3 py-1 text-sm font-semibold text-white bg-orange-500 rounded-full">
                  예약중
                </span>
              )}
            </div>
            <div className="mt-1 text-xl font-extrabold">
              {Number(product.price).toLocaleString()}원
            </div>
            <div className="mt-1 text-sm text-gray-500">
              {product.location || "지역 정보 없음"} ·{" "}
              {product.createdAt
                ? new Date(product.createdAt).toLocaleDateString()
                : ""}
            </div>
          </div>

          {/* 설명 */}
          <div className="p-4 text-sm leading-6 text-gray-800 whitespace-pre-line card">
            {product.description?.trim()
              ? product.description
              : "판매자가 설명을 입력하지 않았습니다."}
          </div>

          {/* 액션 버튼 */}
          <div className="flex items-center gap-3">
            <button 
              onClick={handleLikeToggle}
              className={`px-3 py-2 text-sm border rounded-full transition-colors ${
                isLiked 
                  ? 'text-red-500 border-red-500 bg-red-50 hover:bg-red-100' 
                  : 'text-gray-600 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {isLiked ? '♥' : '♡'}
            </button>
            <button className="px-3 py-2 text-sm text-gray-600 border rounded-full hover:bg-gray-50">
              ↗ 공유
            </button>
            
            {/* 모든 사용자에게 채팅 버튼 표시 */}
            <button 
              onClick={() => {
                if (isOwner) {
                  // 판매자는 채팅 목록 페이지로
                  navigate('/chats');
                } else {
                  // 구매자는 채팅방으로
                  navigate(`/chat/${id}`);
                }
              }}
              className="h-10 px-6 ml-auto text-sm font-semibold text-white bg-black rounded-lg hover:opacity-90"
            >
              {isOwner ? '채팅 확인' : '채팅하기'}
            </button>
          </div>
          
          {/* 게시자만 판매 상태 변경 버튼 표시 */}
          {isOwner && (
            <div className="relative mt-3">
              <button
                onClick={() => setShowStatusMenu(!showStatusMenu)}
                className="w-full h-10 px-6 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:opacity-90"
              >
                판매 상태 변경
              </button>
              
              {showStatusMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowStatusMenu(false)}
                  />
                  <div className="absolute left-0 right-0 z-20 mt-2 overflow-hidden bg-white border border-gray-200 rounded-lg shadow-lg">
                    <button
                      onClick={() => handleStatusChange("selling")}
                      className={`w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 transition-colors ${
                        product.status === "selling" ? "bg-blue-50 text-blue-600 font-semibold" : ""
                      }`}
                    >
                      판매중
                    </button>
                    <button
                      onClick={() => handleStatusChange("reserved")}
                      className={`w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 transition-colors ${
                        product.status === "reserved" ? "bg-orange-50 text-orange-600 font-semibold" : ""
                      }`}
                    >
                      예약중
                    </button>
                    <button
                      onClick={() => handleStatusChange("sold")}
                      className={`w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 transition-colors ${
                        product.status === "sold" ? "bg-gray-100 text-gray-600 font-semibold" : ""
                      }`}
                    >
                      판매완료
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </section>

        {/* 사이드바 */}
        <DetailSidebar />
      </div>

      {/* 비슷한 상품 */}
      <div className="mt-10">
        <ProductSection title="비슷한 상품" products={similar} />
      </div>
    </div>
  );
}