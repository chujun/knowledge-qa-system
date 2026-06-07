import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "个人知识问答系统",
  description: "面向个人学习掌握画像的知识问答系统"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
