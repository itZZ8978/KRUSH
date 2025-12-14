// src/data/mockProducts.ts
// 더 이상 목업 데이터를 생성하지 않고, 서버와 동일한 구조의 Product 타입만 정의

export interface Product {
  _id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  location: string;
  images: string[];
  status: "selling" | "reserved" | "sold";
  createdAt: string;
  updatedAt: string;
  seller: string;
}

// 더 이상 mockProducts 배열은 사용하지 않음
// 실제 데이터는 API(/api/products)로부터 fetch하여 사용합니다.
