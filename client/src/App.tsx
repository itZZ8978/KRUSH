// src/App.tsx
import { AuthProvider } from "./context/AuthContext";
import { Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Alarm from "./pages/Alarm";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ListingDetail from "./pages/ListingDetail";
import ProductNew from "./pages/ProductNew";
import ProductEdit from "./pages/ProductEdit";
import Chat from "./pages/Chat";
import ChatList from "./pages/ChatList";

export default function App() {
  return (
    <div className="flex flex-col min-h-screen">
      <AuthProvider>
        <Header />
        <main className="flex-1">
          <Routes>
            {/* 공개 페이지 */}
            <Route path="/" element={<Home />} />
            <Route path="/listing/:id" element={<ListingDetail />} />
            <Route path="/alarm" element={<Alarm />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/sell" element={<ProductNew />} />
            <Route path="/edit/:id" element={<ProductEdit />} />
            <Route path="/chat/:productId" element={<Chat />} />
            <Route path="/chat/room/:roomId" element={<Chat />} />
            <Route path="/chats" element={<ChatList />} />
            {/* 인증 필요한 페이지 묶음 (예시)
                보호할 페이지가 생기면 아래 주석을 해제하고 element를 연결하세요.
            */}
            {/*
            <Route element={<ProtectedRoute />}>
              <Route path="/mypage" element={<MyPage />} />
              <Route path="/sell" element={<Sell />} />
              // ...etc
            </Route>
            */}
          </Routes>
        </main>
        <Footer />
      </AuthProvider>
    </div>
  );
}
