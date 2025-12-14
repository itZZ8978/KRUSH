import { Link } from "react-router-dom";
import type { Product } from "../data/mockProducts";

interface Props {
  item: Product;
}

export default function ProductCard({ item }: Props) {
  const imageSrc = item.images?.[0] || "/placeholder.png";
  const dateText = item.createdAt
    ? new Date(item.createdAt).toLocaleDateString()
    : "";

  return (
    <Link
      to={`/listing/${item._id}`}
      className="block transition card hover:shadow-md"
    >
      <div className="relative bg-gray-100 aspect-square">
        <img
          src={imageSrc}
          alt={item.title}
          className="object-cover w-full h-full"
          loading="lazy"
        />
        {/* 판매 상태 오버레이 */}
        {item.status === "sold" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <span className="px-4 py-2 text-lg font-bold text-white bg-gray-700 rounded-lg">
              판매완료
            </span>
          </div>
        )}
        {item.status === "reserved" && (
          <div className="absolute top-2 left-2">
            <span className="px-2 py-1 text-xs font-semibold text-white bg-orange-500 rounded">
              예약중
            </span>
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="text-sm line-clamp-1">{item.title}</h3>
        <p className="mt-1 font-semibold">
          {Number(item.price).toLocaleString()}원
        </p>
        <div className="flex items-center justify-between mt-1 text-xs text-gray-500">
          <span>{item.location || "지역 정보 없음"}</span>
          <span>{dateText}</span>
        </div>
      </div>
    </Link>
  );
}