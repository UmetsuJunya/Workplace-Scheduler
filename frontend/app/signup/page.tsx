"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSetAtom } from "jotai";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff } from "lucide-react";
import { currentUserAtom } from "@/lib/atoms";
import { apiClient } from "@/lib/api-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [canRegister, setCanRegister] = useState<boolean | null>(null);
  const router = useRouter();
  const { toast } = useToast();
  const setCurrentUser = useSetAtom(currentUserAtom);

  // Check if registration is allowed
  useEffect(() => {
    const checkRegistration = async () => {
      try {
        const response = await fetch(`${API_URL}/auth/can-register`);
        if (response.ok) {
          const data = await response.json();
          setCanRegister(data.canRegister);

          if (!data.canRegister) {
            toast({
              title: "登録が閉鎖されています",
              description: "管理者に連絡してユーザーアカウントを作成してもらってください",
              variant: "destructive",
            });
            router.push("/login");
          }
        }
      } catch (error) {
        console.error("Failed to check registration status:", error);
      }
    };

    checkRegistration();
  }, [router, toast]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: "エラー",
        description: "パスワードが一致しません",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "アカウント作成に失敗しました");
      }

      const data = await response.json();

      // Store JWT token and user info
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("user_info", JSON.stringify(data.user));

      // Update apiClient token
      apiClient.setToken(data.access_token);

      // Update atom with user info
      setCurrentUser(data.user);

      toast({
        title: "アカウント作成成功",
        description: "スケジュール管理画面に移動します",
      });

      router.push("/");
    } catch (error: any) {
      toast({
        title: "登録エラー",
        description: error.message || "アカウント作成に失敗しました",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while checking registration status
  if (canRegister === null) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">読み込み中...</p>
        </div>
      </div>
    );
  }

  // Don't render the form if registration is not allowed
  if (!canRegister) {
    return null;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>初期アカウント作成</CardTitle>
          <CardDescription>
            管理者アカウントを作成してください
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">ユーザー名 *</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ユーザー名を入力"
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス *</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">パスワード *</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="パスワードを入力"
                  required
                  disabled={loading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">パスワード（確認） *</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="パスワードを再入力"
                  required
                  disabled={loading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  disabled={loading}
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "作成中..." : "アカウント作成"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
