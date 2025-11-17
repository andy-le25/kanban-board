"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AboutClient() {
  const handleClick = () => {
    console.log("clicked");
    console.log("API base:", process.env.NEXT_PUBLIC_API_BASE);
  };

  return (
    <Card className="w-full max-w-md bg-slate-900 border-slate-800 text-slate-50 shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl">Your Name</CardTitle>
        <CardDescription className="text-slate-400">
          Aspiring dev building a Kanban board in Next.js.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-slate-300">
          This is the About page. Shadcn Card and Button are working with the App Router.
        </p>
        <Button onClick={handleClick}>
          Click me
        </Button>
      </CardContent>
    </Card>
  );
}
