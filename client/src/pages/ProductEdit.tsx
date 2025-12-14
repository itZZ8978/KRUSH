import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const API_BASE = (import.meta.env.VITE_API_BASE as string) || "/api";

type SelFile = { file: File; preview: string; id: string };
type ExistingImage = { url: string; id: string };

const CATEGORIES = [
  "디지털/가전",
  "가구/인테리어",
  "생활/주방",
  "유아동",
  "패션/잡화",
  "도서/음반/문구",
  "스포츠/레저",
  "반려동물용품",
  "티켓/서비스",
  "기타",
];

export default function ProductEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priceRaw, setPriceRaw] = useState<string>("");
  const price = useMemo(
    () => Number(priceRaw.replace(/[^\d]/g, "") || 0),
    [priceRaw]
  );

  const [category, setCategory] = useState("기타");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState<"selling" | "reserved" | "sold">("selling");
  const [existingImages, setExistingImages] = useState<ExistingImage[]>([]);
  const [selFiles, setSelFiles] = useState<SelFile[]>([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [okMsg, setOkMsg] = useState<string | null>(null);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const [touched, setTouched] = useState<{ [k: string]: boolean }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  // 기존 상품 데이터 불러오기
  useEffect(() => {
    async function loadProduct() {
      if (!id) return;
      
      try {
        const res = await fetch(`${API_BASE}/products/${id}`, {
          credentials: "include",
        });
        const json = await res.json();
        
        if (!res.ok || json.ok === false) {
          throw new Error(json.error || "상품을 불러올 수 없습니다.");
        }
        
        const product = json.product;
        setTitle(product.title || "");
        setDescription(product.description || "");
        setPriceRaw(product.price ? String(product.price).replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "");
        setCategory(product.category || "기타");
        setLocation(product.location || "");
        setStatus(product.status || "selling");
        
        // 기존 이미지 설정
        if (product.images && product.images.length > 0) {
          setExistingImages(
            product.images.map((url: string, idx: number) => ({
              url,
              id: `existing-${idx}`,
            }))
          );
        }
      } catch (e: any) {
        setErrMsg(e.message || "상품을 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    }
    
    loadProduct();
  }, [id]);

  useEffect(
    () => () => selFiles.forEach((s) => URL.revokeObjectURL(s.preview)),
    [selFiles]
  );

  const onPriceChange = (val: string) => {
    const digits = val.replace(/[^\d]/g, "");
    if (!digits) return setPriceRaw("");
    setPriceRaw(digits.replace(/\B(?=(\d{3})+(?!\d))/g, ","));
  };

  const addFiles = (files: File[]) => {
    const totalImages = existingImages.length + selFiles.length;
    const remain = 5 - totalImages;
    if (remain <= 0) return;
    const valid = files
      .slice(0, remain)
      .filter((f) => /^image\/(png|jpe?g|gif|webp|bmp)$/i.test(f.type))
      .filter((f) => f.size <= 5 * 1024 * 1024);
    const mapped: SelFile[] = valid.map((f) => ({
      file: f,
      preview: URL.createObjectURL(f),
      id: `${f.name}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    }));
    setSelFiles((prev) => [...prev, ...mapped]);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    addFiles(Array.from(e.target.files || []));
    e.currentTarget.value = "";
  };

  // 드래그&드롭 시각 피드백
  useEffect(() => {
    const el = dropRef.current;
    if (!el) return;
    const onDragOver = (e: DragEvent) => {
      e.preventDefault();
      el.classList.add("ring-2", "ring-neutral-900");
    };
    const onDragLeave = () => el.classList.remove("ring-2", "ring-neutral-900");
    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      onDragLeave();
      addFiles(Array.from(e.dataTransfer?.files || []));
    };
    el.addEventListener("dragover", onDragOver);
    el.addEventListener("dragleave", onDragLeave);
    el.addEventListener("drop", onDrop);
    return () => {
      el.removeEventListener("dragover", onDragOver);
      el.removeEventListener("dragleave", onDragLeave);
      el.removeEventListener("drop", onDrop);
    };
  }, [existingImages.length, selFiles.length]);

  async function uploadImages(files: File[]): Promise<string[]> {
    if (!files.length) return [];
    const fd = new FormData();
    files.forEach((f) => fd.append("files", f));
    const res = await fetch(`${API_BASE}/uploads/images`, {
      method: "POST",
      credentials: "include",
      body: fd,
    });
    const data = await res.json();
    if (!res.ok || data.ok === false)
      throw new Error(data.error || "이미지 업로드 실패");
    return data.urls as string[];
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ title: true, price: true });
    setOkMsg(null);
    setErrMsg(null);
    if (!title.trim() || price <= 0) {
      setErrMsg("필수 항목을 확인해 주세요.");
      return;
    }

    setBusy(true);
    try {
      // 새로 추가된 이미지 업로드
      const newUrls = await uploadImages(selFiles.map((s) => s.file));
      
      // 기존 이미지 URL + 새 이미지 URL
      const allImageUrls = [
        ...existingImages.map(img => img.url),
        ...newUrls
      ];
      
      const res = await fetch(`${API_BASE}/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          price,
          category,
          location: location.trim() || "미정",
          images: allImageUrls,
          status,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.ok === false)
        throw new Error(data.error || "수정 실패");

      setOkMsg("✅ 상품이 수정되었습니다!");
      
      // 2초 후 상세 페이지로 이동
      setTimeout(() => {
        navigate(`/products/${id}`);
      }, 1500);
    } catch (e: any) {
      setErrMsg(e.message || "문제가 발생했습니다.");
    } finally {
      setBusy(false);
    }
  };

  const titleError = touched.title && !title.trim();
  const priceError = touched.price && price <= 0;
  const totalImages = existingImages.length + selFiles.length;

  if (loading) {
    return (
      <div className="container py-10 text-center text-gray-600">
        불러오는 중...
      </div>
    );
  }

  return (
    <div className="container py-10">
      <div className="max-w-3xl mx-auto">
        <h1 className="mb-8 text-3xl font-extrabold">상품 수정</h1>

        {okMsg && <div className="alert-ok">{okMsg}</div>}
        {errMsg && <div className="alert-err">{errMsg}</div>}

        <form onSubmit={onSubmit} className="grid gap-6 p-6 card">
          {/* 제목 */}
          <div>
            <label className="form-label form-required">제목</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => setTouched((s) => ({ ...s, title: true }))}
              className={titleError ? "input-error" : "input"}
              placeholder="예) 중고 책 · 상급 · 포장만 뜯은 상태"
              maxLength={60}
            />
            <p className="form-hint">
              최대 60자. 상품 핵심이 드러나게 적어 주세요.
            </p>
          </div>

          {/* 설명 */}
          <div>
            <label className="form-label">설명</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="textarea"
              rows={6}
              placeholder={`상세 상태(사용감/하자), 구성품, 교환/환불 안내 등\n예) 거의 새것, 책갈피 사은품 포함`}
            />
            <div className="form-counter">{description.length}/1000</div>
          </div>

          {/* 가격 + 카테고리 */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="form-label form-required">가격(원)</label>
              <input
                inputMode="numeric"
                value={priceRaw}
                onChange={(e) => onPriceChange(e.target.value)}
                onBlur={() => setTouched((s) => ({ ...s, price: true }))}
                className={priceError ? "input-error" : "input"}
                placeholder="예) 12,000"
              />
              <p className="form-hint">
                숫자만 입력하면 자동으로 3자리 콤마가 적용돼요.
              </p>
            </div>

            <div>
              <label className="form-label">카테고리</label>
              <select
                className="select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <p className="form-hint">
                적절한 분류를 선택하면 검색에 더 잘 노출돼요.
              </p>
            </div>
          </div>

          {/* 판매 상태 */}
          <div>
            <label className="form-label">판매 상태</label>
            <select
              className="select"
              value={status}
              onChange={(e) => setStatus(e.target.value as "selling" | "reserved" | "sold")}
            >
              <option value="selling">판매중</option>
              <option value="reserved">예약중</option>
              <option value="sold">판매됨</option>
            </select>
            <p className="form-hint">
              상품의 현재 판매 상태를 선택하세요.
            </p>
          </div>

          {/* 위치 */}
          <div>
            <label className="form-label">거래 지역</label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="input"
              placeholder="예) 대구 수성구"
            />
            <p className="form-hint">
              직거래를 원하시면 동/구 단위로 적어주세요. (선택)
            </p>
          </div>

          {/* 이미지 */}
          <div>
            <label className="form-label">
              이미지{" "}
              <span className="text-gray-400">(최대 5장, 파일당 5MB)</span>
            </label>

            <div
              ref={dropRef}
              className="dropzone"
              onClick={() => fileInputRef.current?.click()}
              title="클릭 또는 파일을 드래그해 업로드"
            >
              <div className="text-sm text-gray-700">
                이미지를 드래그하거나 클릭해서 선택하세요
              </div>
              <div className="mt-1 text-xs text-gray-500">
                JPG, PNG, GIF, WEBP, BMP 지원 • 현재 {totalImages}/5
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={onFileChange}
              />
            </div>

            {(existingImages.length > 0 || selFiles.length > 0) && (
              <div className="grid grid-cols-3 gap-3 mt-3 sm:grid-cols-4 md:grid-cols-5">
                {/* 기존 이미지 */}
                {existingImages.map((img) => (
                  <div key={img.id} className="thumb">
                    <img src={img.url} className="thumb-img" />
                    <button
                      type="button"
                      className="thumb-del"
                      onClick={() =>
                        setExistingImages((prev) => prev.filter((x) => x.id !== img.id))
                      }
                      aria-label="이미지 제거"
                    >
                      삭제
                    </button>
                  </div>
                ))}
                
                {/* 새로 추가한 이미지 */}
                {selFiles.map((s) => (
                  <div key={s.id} className="thumb">
                    <img src={s.preview} className="thumb-img" />
                    <button
                      type="button"
                      className="thumb-del"
                      onClick={() =>
                        setSelFiles((prev) => prev.filter((x) => x.id !== s.id))
                      }
                      aria-label="이미지 제거"
                    >
                      삭제
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 제출 */}
          <button
            className="btn-primary"
            disabled={busy || !title.trim() || price <= 0}
          >
            {busy ? "수정 중..." : "수정하기"}
          </button>
        </form>
      </div>
    </div>
  );
}